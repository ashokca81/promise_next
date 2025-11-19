// Use require for @napi-rs/canvas to ensure proper server-side loading
// Don't mix imports - use require for native modules
const canvasLib = require('@napi-rs/canvas');
const createCanvas = canvasLib.createCanvas;
const loadImage = canvasLib.loadImage;
// Newer versions use GlobalFonts instead of registerFont
const { GlobalFonts } = canvasLib;
import archiver from 'archiver';
import pLimit from 'p-limit';
import path from 'path';
import fs from 'fs';
import formidable from 'formidable';

// Import utilities
const { drawTextBox } = require('../../utils/drawTextBox');
import connectDB from '../../utils/db';
import User from '../../models/User';
import ImageGeneration from '../../models/ImageGeneration';
import { getTokenFromRequest, verifyToken } from '../../utils/auth';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Font registry to track loaded fonts
const loadedFonts = new Set();

// Load fonts - call this before generating images
function loadFonts() {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');

  // Only include fonts that actually exist in the directory
  const fonts = [
    { name: 'Poppins', file: 'Poppins-Regular.ttf' },
    { name: 'Sree Krushnadevaraya', file: 'Sree Krushnadevaraya Regular.otf' },
  ];

  fonts.forEach((font) => {
    // Skip if already loaded
    if (loadedFonts.has(font.name)) {
      return;
    }

    try {
      const fontPath = path.join(fontsDir, font.file);
      if (fs.existsSync(fontPath)) {
        // Register font using GlobalFonts.registerFromPath (newer API)
        if (GlobalFonts && typeof GlobalFonts.registerFromPath === 'function') {
          const success = GlobalFonts.registerFromPath(fontPath, font.name);
          if (success) {
            loadedFonts.add(font.name);
            console.log(`✅ Loaded font: ${font.name} from ${font.file}`);
          } else {
            console.warn(`⚠️ Failed to register font: ${font.name} (file exists but registration failed)`);
          }
        } else {
          console.error(`❌ GlobalFonts.registerFromPath is not available`);
        }
      } else {
        console.warn(`⚠️ Font file not found: ${fontPath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading font ${font.name}:`, error.message);
      console.error(`   Error stack:`, error.stack);
    }
  });
}

// Load fonts on module load - but check if we're in server environment
if (typeof window === 'undefined') {
  loadFonts();
}

// Parse form data
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({ fields, files });
    });
  });
}

// Generate single card image
async function generateCard(templateBuffer, row, fields, rowIndex) {
  try {
    // Load template image
    const template = await loadImage(templateBuffer);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    // Set canvas rendering settings to match frontend exactly
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textBaseline = 'top';

    // Draw template
    ctx.drawImage(template, 0, 0);

    // Draw each field
    for (const field of fields) {
      const { column, rect, fontFamily, fontSize, color, alignment, verticalAlignment, lineHeight, bold } = field;

      if (!rect || (!rect.x && rect.x !== 0) || !column) continue;

      const text = row[column] || '';
      if (!text) continue;

      const finalFontFamily = fontFamily || 'Arial';
      
      // Ensure verticalAlignment is properly set (handle undefined, null, empty string)
      const finalVerticalAlignment = (verticalAlignment && ['top', 'middle', 'bottom'].includes(verticalAlignment)) 
        ? verticalAlignment 
        : 'bottom';
      
      // Log font usage for debugging (only once per card)
      if (rowIndex === 0 && column === Object.keys(row)[0]) {
        console.log(`🔤 Using font: "${finalFontFamily}" for column "${column}"`);
        console.log(`   Vertical alignment: "${finalVerticalAlignment}" (original: "${verticalAlignment}")`);
        console.log(`   Loaded fonts available: ${Array.from(loadedFonts).join(', ')}`);
      }

      // Draw text with all settings
      drawTextBox(
        ctx,
        text,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        {
          fontFamily: finalFontFamily,
          fontSize: fontSize || 16,
          color: color || '#000000',
          alignment: alignment || 'center',
          verticalAlignment: finalVerticalAlignment,
          lineHeight: lineHeight || 1.2,
          bold: bold || false,
        }
      );
    }

    // Convert to buffer
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    return buffer;
  } catch (error) {
    console.error(`Error generating card ${rowIndex + 1}:`, error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is approved (superadmin can always generate)
    if (user.role === 'user' && user.status !== 'approved') {
      return res.status(403).json({
        error: 'Your account is pending approval. Please wait for admin approval.',
        status: user.status,
      });
    }

    // Parse form data
    const { fields, files } = await parseForm(req);

    const templateFile = Array.isArray(files.template) ? files.template[0] : files.template;
    const excelFile = Array.isArray(files.excel) ? files.excel[0] : files.excel;

    if (!templateFile || !excelFile) {
      return res.status(400).json({ error: 'Missing template or Excel file' });
    }

    const fieldsData = Array.isArray(fields.fields) ? fields.fields[0] : fields.fields;
    const excelDataStr = Array.isArray(fields.excelData) ? fields.excelData[0] : fields.excelData;
    const imageCountStr = Array.isArray(fields.imageCount) ? fields.imageCount[0] : fields.imageCount;

    if (!fieldsData || !excelDataStr) {
      return res.status(400).json({ error: 'Missing fields or excelData' });
    }

    const fieldConfigs = JSON.parse(fieldsData);
    const excelData = JSON.parse(excelDataStr);
    const requestedImageCount = imageCountStr ? parseInt(imageCountStr) : null;

    // Read template buffer
    const templateBuffer = fs.readFileSync(templateFile.filepath);
    const excelBuffer = fs.readFileSync(excelFile.filepath);

    // Parse Excel using xlsx library
    const XLSX = require('xlsx');
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const headers = jsonData[0].map((h, idx) => h || `Column ${idx + 1}`);
    const allRows = jsonData.slice(1).map((row) => {
      const rowObj = {};
      headers.forEach((header, colIdx) => {
        rowObj[header] = row[colIdx] || '';
      });
      return rowObj;
    });

    // Use requested image count if provided, otherwise use all rows
    let rowsToProcess = requestedImageCount && requestedImageCount > 0 && requestedImageCount <= allRows.length
      ? allRows.slice(0, requestedImageCount)
      : allRows;

    let imagesToGenerate = rowsToProcess.length;
    let limitWarning = null;

    // Check user limit (only for regular users, superadmin has no limit)
    if (user.role === 'user' && user.imageLimit > 0) {
      const remaining = user.imageLimit - user.imagesGenerated;
      if (remaining <= 0) {
        return res.status(403).json({
          error: `Image limit reached. You have used all ${user.imageLimit} images. Please contact admin to increase your limit.`,
          contactInfo: {
            website: 'http://lavishstar.in/',
            phone: '8801188884',
          },
          remaining: 0,
          requested: imagesToGenerate,
          limit: user.imageLimit,
          used: user.imagesGenerated,
        });
      }
      
      // If requested more than remaining, only generate up to remaining limit
      if (remaining < imagesToGenerate) {
        imagesToGenerate = remaining;
        rowsToProcess = rowsToProcess.slice(0, remaining);
        limitWarning = `You requested ${requestedImageCount || allRows.length} images, but your remaining limit is ${remaining}. Only ${remaining} images will be generated.`;
        console.log(`⚠️ Limit warning: ${limitWarning}`);
      }
    }

    console.log(`Generating ${imagesToGenerate} cards for user ${user.email}...`);

    // Set up ZIP archive
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="cards_${Date.now()}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create archive' });
      }
    });

    archive.pipe(res);

    // Generate cards with concurrency limit
    const limit = pLimit(5); // Process 5 cards at a time
    let completed = 0;
    const total = imagesToGenerate;

    const promises = rowsToProcess.map((row, index) =>
      limit(async () => {
        try {
          const cardBuffer = await generateCard(templateBuffer, row, fieldConfigs, index);
          archive.append(cardBuffer, { name: `card_${index + 1}.jpg` });
          completed++;
          console.log(`Generated card ${index + 1}/${total}`);
        } catch (error) {
          console.error(`Failed to generate card ${index + 1}:`, error);
        }
      })
    );

    // Wait for all cards to be processed
    await Promise.all(promises);

    console.log(`All ${total} cards generated. Finalizing archive...`);

    // Track image generation
    try {
      const imageGen = new ImageGeneration({
        userId: user._id,
        imagesCount: imagesToGenerate,
        templateName: templateFile.originalFilename || 'template.jpg',
        excelFileName: excelFile.originalFilename || 'data.xlsx',
        status: 'success',
      });
      await imageGen.save();

      // Update user's imagesGenerated count (only for regular users)
      if (user.role === 'user') {
        user.imagesGenerated += imagesToGenerate;
        await user.save();
      }
    } catch (trackError) {
      console.error('Error tracking image generation:', trackError);
      // Don't fail the request if tracking fails
    }

    // Add warning message to response headers if limit was applied
    if (limitWarning) {
      res.setHeader('X-Limit-Warning', encodeURIComponent(limitWarning));
    }

    // Finalize archive
    await archive.finalize();

    // Clean up temporary files
    try {
      fs.unlinkSync(templateFile.filepath);
      fs.unlinkSync(excelFile.filepath);
    } catch (error) {
      console.warn('Error cleaning up temp files:', error);
    }
  } catch (error) {
    console.error('Generation error:', error);
    
    // Track failed generation if we have user info
    try {
      const token = getTokenFromRequest(req);
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          await connectDB();
          const user = await User.findById(decoded.userId);
          if (user) {
            const imageGen = new ImageGeneration({
              userId: user._id,
              imagesCount: 0,
              status: 'failed',
              errorMessage: error.message || 'Unknown error',
            });
            await imageGen.save();
          }
        }
      }
    } catch (trackError) {
      console.error('Error tracking failed generation:', trackError);
    }

    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

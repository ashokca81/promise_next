/**
 * Draws text inside a rectangle with perfect alignment and auto-fitting
 * This is the backend version using CommonJS
 */
function drawTextBox(ctx, text, x, y, width, height, options = {}) {
  const {
    fontFamily = 'Arial',
    fontSize = 16,
    color = '#000000',
    alignment = 'center',
    verticalAlignment = 'bottom',
    lineHeight = 1.2,
    bold = false,
  } = options;

  if (!text || !width || !height) {
    return;
  }

  const padding = 5;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  // Auto-fit font size
  let finalFontSize = fontSize;
  const minFontSize = 8;
  let fits = false;
  let iterations = 0;
  const maxIterations = 50;
  let finalLines = [];

  while (!fits && finalFontSize >= minFontSize && iterations < maxIterations) {
    // Handle bold properly - boolean or string
    const isBold = bold === true || bold === 'bold';
    const fontWeight = isBold ? 'bold' : 'normal';
    // Quote font family name if it contains spaces (e.g., "Sree Krushnadevaraya")
    const quotedFontFamily = fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;
    ctx.font = `${fontWeight} ${finalFontSize}px ${quotedFontFamily}`;
    
    // Wrap text with current font size
    const lines = [];
    const words = text.toString().split(/\s+/);
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width <= availableWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Check if single word is too long
        if (ctx.measureText(word).width > availableWidth) {
          // Character-level wrapping for complex scripts (Telugu, etc.)
          let charLine = '';
          for (let char of word) {
            const testChar = charLine + char;
            if (ctx.measureText(testChar).width <= availableWidth) {
              charLine = testChar;
            } else {
              if (charLine) lines.push(charLine);
              charLine = char;
            }
          }
          currentLine = charLine;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Check if all lines fit
    const totalHeight = lines.length * finalFontSize * lineHeight;
    const allLinesFit = lines.every((line) => {
      if (!line) return true;
      const m = ctx.measureText(line);
      return m.width <= availableWidth;
    });
    
    if (totalHeight <= availableHeight && allLinesFit) {
      fits = true;
      finalLines = lines;
    } else {
      finalFontSize = Math.max(minFontSize, finalFontSize * 0.9); // Reduce by 10%
      iterations++;
    }
  }

  // If still doesn't fit, use minimum size
  if (!fits) {
    const isBold = bold === true || bold === 'bold';
    const fontWeight = isBold ? 'bold' : 'normal';
    const quotedFontFamily = fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;
    ctx.font = `${fontWeight} ${minFontSize}px ${quotedFontFamily}`;
    
    // Wrap with minimum size
    const lines = [];
    const words = text.toString().split(/\s+/);
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      if (ctx.measureText(testLine).width <= availableWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;

        // Handle long words
        if (ctx.measureText(word).width > availableWidth) {
          let charLine = '';
          for (let char of word) {
            const testChar = charLine + char;
            if (ctx.measureText(testChar).width <= availableWidth) {
              charLine = testChar;
            } else {
              if (charLine) lines.push(charLine);
              charLine = char;
            }
          }
          currentLine = charLine;
        }
      }
    }
    if (currentLine) lines.push(currentLine);
    finalLines = lines;
    finalFontSize = minFontSize;
  }

  // Set final font and color
  const isBold = bold === true || bold === 'bold';
  const fontWeight = isBold ? 'bold' : 'normal';
  
  // Use exact font name (handle Telugu fonts specially)
  const finalFontFamily = fontFamily || 'Arial';
  
  // Quote font name if it contains spaces
  const quotedFontFamily = finalFontFamily.includes(' ') ? `"${finalFontFamily}"` : finalFontFamily;
  
  // Try to set font - if it fails, use fallback
  try {
    ctx.font = `${fontWeight} ${finalFontSize}px ${quotedFontFamily}`;
    // Test if font is available by measuring a simple character
    const testMetrics = ctx.measureText('A');
    if (testMetrics.width === 0 && finalFontFamily !== 'Arial') {
      // Font might not be loaded, try fallback
      console.warn(`⚠️ Font "${finalFontFamily}" not available, using fallback`);
      ctx.font = `${fontWeight} ${finalFontSize}px Arial`;
    }
  } catch (error) {
    console.warn(`⚠️ Error setting font "${finalFontFamily}":`, error.message);
    ctx.font = `${fontWeight} ${finalFontSize}px Arial`;
  }
  
  ctx.fillStyle = color || '#000000';
  ctx.textBaseline = 'top';

  // Calculate vertical positioning based on vertical alignment
  // Total height = (n-1) lines with spacing + last line height
  // For n lines: (n-1) * fontSize * lineHeight + fontSize
  const totalTextHeight = finalLines.length > 0 
    ? (finalLines.length - 1) * finalFontSize * lineHeight + finalFontSize
    : 0;
  
  // Ensure verticalAlignment is valid
  const validVerticalAlignment = (verticalAlignment && ['top', 'middle', 'bottom'].includes(verticalAlignment))
    ? verticalAlignment
    : 'bottom';
  
  let startY;
  switch (validVerticalAlignment) {
    case 'top':
      startY = y + padding;
      break;
    case 'middle':
      startY = y + padding + Math.max(0, (availableHeight - totalTextHeight) / 2);
      break;
    case 'bottom':
    default:
      startY = y + padding + Math.max(0, availableHeight - totalTextHeight);
      break;
  }

  // Draw each line with proper alignment
  finalLines.forEach((line, index) => {
    if (!line) return;
    
    const lineY = startY + index * finalFontSize * lineHeight;
    const metrics = ctx.measureText(line);
    
    let textX;
    switch (alignment) {
      case 'left':
        textX = x + padding;
        break;
      case 'right':
        textX = x + width - padding - metrics.width;
        break;
      case 'center':
      default:
        textX = x + padding + (availableWidth - metrics.width) / 2;
        break;
    }

    ctx.fillText(line, textX, lineY);
  });
}

module.exports = { drawTextBox };


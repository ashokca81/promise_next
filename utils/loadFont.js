const { registerFont } = require('@napi-rs/canvas');
const path = require('path');

/**
 * Loads Telugu and other fonts from /public/fonts directory
 */
function loadFonts() {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');

  const fonts = [
    { name: 'NotoSansTelugu', file: 'NotoSansTelugu-Regular.ttf' },
    { name: 'NotoSerifTelugu', file: 'NotoSerifTelugu.ttf' },
    { name: 'Panchganga', file: 'Panchganga.ttf' },
    { name: 'Peddana', file: 'Peddana-Regular.ttf' },
    { name: 'Sree Krushnadevaraya', file: 'Sree Krushnadevaraya Regular.otf' },
  ];

  fonts.forEach((font) => {
    try {
      const fontPath = path.join(fontsDir, font.file);
      registerFont(fontPath, { family: font.name });
      console.log(`Loaded font: ${font.name}`);
    } catch (error) {
      console.warn(`Could not load font ${font.name}: ${error.message}`);
    }
  });

  return fonts.map((f) => f.name);
}

module.exports = { loadFonts };


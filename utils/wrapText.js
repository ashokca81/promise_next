/**
 * Wraps text to fit within a specified width
 * @param {string} text - The text to wrap
 * @param {number} maxWidth - Maximum width in pixels
 * @param {CanvasRenderingContext2D} ctx - Canvas context for measuring text
 * @returns {string[]} Array of wrapped lines
 */
function wrapText(text, maxWidth, ctx) {
  if (!text || !maxWidth || !ctx) {
    return [text || ''];
  }

  const words = text.toString().split(/\s+/);
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // Handle Telugu and other complex scripts by character-level wrapping if needed
  const finalLines = [];
  lines.forEach((line) => {
    if (ctx.measureText(line).width <= maxWidth) {
      finalLines.push(line);
    } else {
      // Character-level wrapping for complex scripts
      let charLine = '';
      for (let char of line) {
        const testCharLine = charLine + char;
        if (ctx.measureText(testCharLine).width <= maxWidth) {
          charLine = testCharLine;
        } else {
          if (charLine) {
            finalLines.push(charLine);
          }
          charLine = char;
        }
      }
      if (charLine) {
        finalLines.push(charLine);
      }
    }
  });

  return finalLines.length > 0 ? finalLines : [text];
}

module.exports = { wrapText };


/**
 * Automatically reduces font size until text fits within rectangle
 * @param {string} text - The text to fit
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {number} lineHeight - Line height multiplier
 * @param {string} fontFamily - Font family
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @returns {number} Optimal font size
 */
function autoFitText(text, width, height, lineHeight, fontFamily, ctx) {
  if (!text || !width || !height || !ctx) {
    return 16;
  }

  let fontSize = Math.min(width / 10, height / 3, 72); // Start with reasonable max
  const minFontSize = 8;
  const padding = 5; // Padding inside rectangle

  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  let fits = false;
  let iterations = 0;
  const maxIterations = 50;

  while (!fits && fontSize >= minFontSize && iterations < maxIterations) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    
    // Get wrapped lines
    const metrics = ctx.measureText(text);
    let lines;
    
    if (metrics.width <= availableWidth) {
      // Single line fits
      lines = [text];
    } else {
      // Need wrapping
      const words = text.toString().split(/\s+/);
      lines = [];
      let currentLine = words[0] || '';
      
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        if (ctx.measureText(testLine).width <= availableWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
          
          // Check if single word is too long (character-level wrap)
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
    }

    // Calculate total height
    const totalHeight = lines.length * fontSize * lineHeight;
    
    if (totalHeight <= availableHeight && lines.every(line => ctx.measureText(line).width <= availableWidth)) {
      fits = true;
    } else {
      fontSize = Math.max(minFontSize, fontSize * 0.9); // Reduce by 10%
      iterations++;
    }
  }

  return Math.max(minFontSize, Math.floor(fontSize));
}

module.exports = { autoFitText };


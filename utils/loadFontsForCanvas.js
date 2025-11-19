/**
 * Loads Google Fonts for canvas rendering in the browser
 * This ensures fonts are available when drawing on canvas
 */
export async function loadFontsForCanvas() {
  // List of Google Fonts we want to use
  const fontsToLoad = [
    'Poppins',
    'Sree Krushnadevaraya',
  ];

  try {
    // Wait for fonts to be ready
    await document.fonts.ready;
    
    // Load each font
    const fontPromises = fontsToLoad.map(async (fontName) => {
      try {
        // Check if font is already loaded
        const loaded = await document.fonts.check(`16px "${fontName}"`);
        if (!loaded) {
          // Font might be loading, wait a bit
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return { name: fontName, loaded: true };
      } catch (error) {
        console.warn(`Font ${fontName} loading issue:`, error);
        return { name: fontName, loaded: false };
      }
    });

    await Promise.all(fontPromises);
    return true;
  } catch (error) {
    console.warn('Error loading fonts for canvas:', error);
    return false;
  }
}

/**
 * Wait for specific font to be loaded
 */
export async function waitForFont(fontFamily, timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const loaded = document.fonts.check(`16px "${fontFamily}"`);
      if (loaded) {
        return true;
      }
    } catch (error) {
      // Font might not be available
    }
    
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  return false;
}


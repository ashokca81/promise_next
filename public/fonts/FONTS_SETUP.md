# Fonts Setup Guide

## ✅ Currently Installed Fonts

1. **Sree Krushnadevaraya Regular.otf** - ✅ Installed
   - Location: `/public/fonts/Sree Krushnadevaraya Regular.otf`
   - Frontend: Available via Google Fonts
   - Backend: Loaded from OTF file

2. **Poppins** - ⚠️ Partial Support
   - Frontend: ✅ Available via Google Fonts
   - Backend: ❌ Needs TTF/OTF file for image generation

## 🔧 How to Add Poppins for Backend

To use Poppins in generated images (backend), you need to download the font file:

1. Visit: https://fonts.google.com/specimen/Poppins
2. Click "Download family"
3. Extract the ZIP file
4. Find `Poppins-Regular.ttf` (or other weights you need)
5. Copy to `/public/fonts/` directory
6. Update `pages/api/generate.js` and `utils/loadFont.js`:

```javascript
{ name: 'Poppins', file: 'Poppins-Regular.ttf' },
```

## 📝 Font Files Needed

For full backend support, add these files to `/public/fonts/`:

- ✅ `Sree Krushnadevaraya Regular.otf` (Already installed)
- ❌ `Poppins-Regular.ttf` (Download from Google Fonts)
- ❌ `Poppins-Bold.ttf` (Optional, for bold text)

## 🎯 Frontend vs Backend

- **Frontend (Preview)**: Uses Google Fonts via `<link>` tags - works immediately
- **Backend (Image Generation)**: Needs local font files (TTF/OTF) - requires download

## ✅ Current Status

- ✅ Sree Krushnadevaraya: Full support (frontend + backend)
- ✅ Poppins: Frontend only (preview works, generated images use fallback)


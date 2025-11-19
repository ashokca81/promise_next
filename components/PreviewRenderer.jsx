import { useEffect, useRef } from 'react';
import { drawTextOnCanvas } from '../utils/drawTextOnCanvas';
import { loadFontsForCanvas } from '../utils/loadFontsForCanvas';

export default function PreviewRenderer({ templateImage, fields, excelData, previewRowIndex, onRowChange }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateImage || !excelData || previewRowIndex === null) return;

    const img = new Image();
    img.onload = async () => {
      // Load fonts before rendering
      await loadFontsForCanvas();
      
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Set canvas rendering settings to match backend exactly
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.textBaseline = 'top';
      
      ctx.drawImage(img, 0, 0);

      const row = excelData.rows[previewRowIndex];
      if (!row) return;

      // Draw each field using the same function as backend
      fields.forEach((field) => {
        const { column, rect, fontFamily, fontSize, color, alignment, verticalAlignment, lineHeight, bold } = field;

        if (!rect || (!rect.x && rect.x !== 0) || !column) return;

        const text = row[column] || '';
        if (!text) return;

        // Use the same drawing function as backend for consistency
        drawTextOnCanvas(ctx, text, rect.x, rect.y, rect.width, rect.height, {
          fontFamily: fontFamily || 'Arial',
          fontSize: fontSize || 16,
          color: color || '#000000',
          alignment: alignment || 'center',
          verticalAlignment: verticalAlignment || 'bottom',
          lineHeight: lineHeight || 1.2,
          bold: bold || false,
        });
      });
    };
    img.src = templateImage;
  }, [templateImage, fields, excelData, previewRowIndex]);

  if (!templateImage || !excelData || previewRowIndex === null) {
    return (
      <div className="p-6 text-center text-gray-500 border-2 border-gray-200 rounded-lg">
        <p>Preview will appear here after selecting a row</p>
      </div>
    );
  }

  return (
    <div className="w-full border-2 border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-100 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-sm font-medium text-gray-700">
            Live Preview
          </h3>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">
              Select Row:
            </label>
            <select
              value={previewRowIndex}
              onChange={(e) => onRowChange && onRowChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[100px]"
            >
              {excelData.rows.map((_, index) => (
                <option key={index} value={index}>
                  Row {index + 1}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const randomIndex = Math.floor(Math.random() * excelData.rows.length);
                onRowChange && onRowChange(randomIndex);
              }}
              className="px-3 py-2 text-xs font-medium text-primary-700 bg-primary-100 border border-primary-300 rounded-md hover:bg-primary-200 transition-colors whitespace-nowrap"
            >
              🎲 Random
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Showing Row {previewRowIndex + 1} of {excelData.rows.length}
        </p>
      </div>
      <div className="overflow-auto max-h-[600px] flex justify-center p-4 bg-gray-50">
        <canvas ref={canvasRef} className="border border-gray-300 max-w-full" />
      </div>
    </div>
  );
}


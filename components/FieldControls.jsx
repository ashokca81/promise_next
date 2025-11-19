export default function FieldControls({ fields, selectedFieldIndex, onFieldUpdate }) {
  const fonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Poppins',
    'Sree Krushnadevaraya',
    'NotoSansTelugu',
    'NotoSerifTelugu',
    'Panchganga',
    'Peddana',
  ];

  if (selectedFieldIndex === null || selectedFieldIndex >= fields.length) {
    return null;
  }

  const field = fields[selectedFieldIndex];

  const updateField = (updates) => {
    onFieldUpdate(selectedFieldIndex, updates);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Family
          </label>
          <select
            value={field.fontFamily || 'Arial'}
            onChange={(e) => updateField({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Size (Base)
          </label>
          <input
            type="number"
            min="8"
            max="144"
            value={field.fontSize || 16}
            onChange={(e) => updateField({ fontSize: parseInt(e.target.value) || 16 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={field.color || '#000000'}
              onChange={(e) => updateField({ color: e.target.value })}
              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={field.color || '#000000'}
              onChange={(e) => updateField({ color: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horizontal Alignment
          </label>
          <select
            value={field.alignment || 'center'}
            onChange={(e) => updateField({ alignment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vertical Alignment
          </label>
          <select
            value={field.verticalAlignment || 'bottom'}
            onChange={(e) => updateField({ verticalAlignment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Line Height
          </label>
          <input
            type="number"
            min="0.5"
            max="3"
            step="0.1"
            value={field.lineHeight || 1.2}
            onChange={(e) => updateField({ lineHeight: parseFloat(e.target.value) || 1.2 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Weight
          </label>
          <select
            value={field.bold ? 'bold' : 'normal'}
            onChange={(e) => updateField({ bold: e.target.value === 'bold' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
      </div>

      {field.rect && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Rectangle Position</p>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-600">X:</span>{' '}
              <span className="font-mono">{Math.round(field.rect.x)}</span>
            </div>
            <div>
              <span className="text-gray-600">Y:</span>{' '}
              <span className="font-mono">{Math.round(field.rect.y)}</span>
            </div>
            <div>
              <span className="text-gray-600">W:</span>{' '}
              <span className="font-mono">{Math.round(field.rect.width)}</span>
            </div>
            <div>
              <span className="text-gray-600">H:</span>{' '}
              <span className="font-mono">{Math.round(field.rect.height)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


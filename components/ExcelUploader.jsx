import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

export default function ExcelUploader({ onExcelUpload, excelData }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const parseExcelFile = useCallback(
    async (file) => {
      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          throw new Error('Excel file is empty');
        }

        const headers = jsonData[0].map((h, idx) => h || `Column ${idx + 1}`);
        const rows = jsonData.slice(1).map((row) => {
          const rowObj = {};
          headers.forEach((header, colIdx) => {
            rowObj[header] = row[colIdx] || '';
          });
          return rowObj;
        });

        onExcelUpload({ headers, rows, file });
      } catch (err) {
        setError(err.message || 'Failed to parse Excel file');
      } finally {
        setLoading(false);
      }
    },
    [onExcelUpload]
  );

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target.result;
            const lines = text.split('\n').filter((l) => l.trim());
            if (lines.length === 0) {
              setError('CSV file is empty');
              return;
            }

            const parseCSVLine = (line) => {
              const result = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  result.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              result.push(current.trim());
              return result;
            };

            const headers = parseCSVLine(lines[0]);
            const rows = lines.slice(1).map((line) => {
              const values = parseCSVLine(line);
              const rowObj = {};
              headers.forEach((header, idx) => {
                rowObj[header] = values[idx] || '';
              });
              return rowObj;
            });

            onExcelUpload({ headers, rows, file });
          } catch (err) {
            setError(err.message || 'Failed to parse CSV file');
          }
        };
        reader.readAsText(file);
      } else {
        parseExcelFile(file);
      }
    },
    [parseExcelFile, onExcelUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Excel/CSV File
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        } ${error ? 'border-red-500' : ''}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Parsing file...</p>
          </div>
        ) : excelData ? (
          <div className="space-y-2">
            <svg
              className="mx-auto h-8 w-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-900">
              {excelData.headers.length} columns, {excelData.rows.length} rows
            </p>
            <p className="text-xs text-gray-500">Click or drag to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop the file here' : 'Click or drag Excel/CSV to upload'}
            </p>
            <p className="text-xs text-gray-500">.xlsx or .csv files only</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {excelData && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">Columns detected:</p>
          <div className="flex flex-wrap gap-2">
            {excelData.headers.map((header, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded"
              >
                {header}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


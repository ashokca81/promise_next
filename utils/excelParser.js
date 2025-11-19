const XLSX = require('xlsx');

/**
 * Parses Excel file and returns data as array of objects
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Object} { headers: string[], rows: Object[] }
 */
function parseExcel(fileBuffer) {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      return { headers: [], rows: [] };
    }

    // First row is headers (or generate if empty)
    const headers = jsonData[0].map((h, idx) => h || `Column ${idx + 1}`);

    // Rest are rows
    const rows = jsonData.slice(1).map((row, rowIdx) => {
      const rowObj = {};
      headers.forEach((header, colIdx) => {
        rowObj[header] = row[colIdx] || '';
      });
      return rowObj;
    });

    return { headers, rows };
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Parses CSV file and returns data as array of objects
 * @param {string} csvText - CSV file content as string
 * @returns {Object} { headers: string[], rows: Object[] }
 */
function parseCSV(csvText) {
  try {
    const lines = csvText.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    // Simple CSV parser (handles quoted values)
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

    return { headers, rows };
  } catch (error) {
    throw new Error(`Failed to parse CSV file: ${error.message}`);
  }
}

module.exports = { parseExcel, parseCSV };


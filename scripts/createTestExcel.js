const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Create test data
const testData = [
  ['Name', 'Designation', 'Email', 'Phone', 'Address'],
  ['John Doe', 'Software Engineer', 'john.doe@example.com', '1234567890', '123 Main Street, New York'],
  ['Jane Smith', 'Product Manager', 'jane.smith@example.com', '9876543210', '456 Park Avenue, Los Angeles'],
  ['Bob Johnson', 'Designer', 'bob.johnson@example.com', '5551234567', '789 Oak Drive, Chicago'],
  ['Alice Williams', 'Developer', 'alice.williams@example.com', '3339876543', '321 Pine Road, Houston'],
  ['Mike Brown', 'Manager', 'mike.brown@example.com', '7775551234', '654 Elm Street, Phoenix'],
];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(testData);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write file
const outputPath = path.join(publicDir, 'test_data.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Test Excel file created successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log(`📊 Rows: ${testData.length - 1} (excluding header)`);
console.log(`📋 Columns: ${testData[0].length}`);


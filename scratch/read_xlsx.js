const ExcelJS = require('exceljs');
const path = require('path');

async function inspect(filePath) {
  console.log('--- Inspecting File:', filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  console.log('Worksheet Name:', worksheet.name);
  console.log('Row Count:', worksheet.rowCount);
  
  // Print first 5 rows
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= 5) {
      console.log(`Row ${rowNumber}:`, row.values);
    }
  });
}

async function run() {
  try {
    await inspect('D:\\Green Era Recyclers\\Green-Era-Recyclers\\data-input\\EWaste_Real_Models_200_Records.xlsx');
    await inspect('D:\\Green Era Recyclers\\assessments.xlsx');
  } catch (e) {
    console.error(e);
  }
}

run();

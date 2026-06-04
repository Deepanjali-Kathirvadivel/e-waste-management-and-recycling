const { jsPDF } = require('jspdf');
const ExcelJS = require('exceljs');

const generatePDF = (title, headers, rows) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  const colWidth = 180 / headers.length;
  let y = 36;

  doc.setFont('helvetica');
  doc.setFontStyle('bold');
  headers.forEach((h, i) => {
    doc.setFontSize(9);
    doc.text(h, 14 + i * colWidth, y);
  });

  doc.setFontStyle('normal');
  y += 6;

  rows.forEach((row) => {
    row.forEach((cell, i) => {
      doc.text(String(cell), 14 + i * colWidth, y);
    });
    y += 6;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  return Buffer.from(doc.output('arraybuffer'));
};

const generateExcel = async (title, headers, rows) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.substring(0, 31));

  sheet.columns = headers.map((h) => ({ header: h, key: h.toLowerCase().replace(/\s+/g, '_'), width: 20 }));

  rows.forEach((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.toLowerCase().replace(/\s+/g, '_')] = row[i];
    });
    sheet.addRow(obj);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

module.exports = { generatePDF, generateExcel };

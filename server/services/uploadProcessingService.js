const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const SalesDataRepository = require('../repositories/salesDataRepository');
const PopulationDataRepository = require('../repositories/populationDataRepository');
const ImportDataRepository = require('../repositories/importDataRepository');
const ForecastInputRepository = require('../repositories/forecastInputRepository');

const salesRepo = new SalesDataRepository();
const populationRepo = new PopulationDataRepository();
const importRepo = new ImportDataRepository();
const forecastInputRepo = new ForecastInputRepository();

class UploadProcessingService {
  async parseExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheets = {};

    workbook.worksheets.forEach(worksheet => {
      const rows = [];
      const headerRow = worksheet.getRow(1);
      const headers = [];
      headerRow.eachCell((cell) => {
        headers.push(cell.text ? cell.text.toLowerCase().replace(/['"]/g, '') : '');
      });

      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const record = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) record[header] = cell.text || null;
        });
        if (Object.values(record).some(v => v !== null)) {
          rows.push(record);
        }
      });

      sheets[worksheet.name] = rows;
    });

    return sheets;
  }

  parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || null;
      });
      records.push(record);
    }

    return records;
  }

  validateCollectionData(records) {
    const valid = [];
    const errors = [];
    const requiredFields = ['product_type', 'quantity', 'revenue', 'sale_date'];

    records.forEach((row, index) => {
      const missing = requiredFields.filter(f => !row[f] && row[f] !== 0);
      if (missing.length) {
        errors.push({ row: index + 1, missing, message: `Missing fields: ${missing.join(', ')}` });
        return;
      }
      valid.push({
        region_id: parseInt(row.region_id) || null,
        product_type: row.product_type,
        quantity: parseInt(row.quantity) || 0,
        revenue: parseFloat(row.revenue) || 0,
        sale_date: row.sale_date
      });
    });

    return { valid, errors, total: records.length, validCount: valid.length, errorCount: errors.length };
  }

  validatePopulationData(records) {
    const valid = [];
    const errors = [];
    const requiredFields = ['year', 'population'];

    records.forEach((row, index) => {
      const missing = requiredFields.filter(f => !row[f] && row[f] !== 0);
      if (missing.length) {
        errors.push({ row: index + 1, missing, message: `Missing fields: ${missing.join(', ')}` });
        return;
      }
      valid.push({
        region_id: parseInt(row.region_id) || null,
        year: parseInt(row.year),
        population: parseInt(row.population) || 0,
        growth_rate: parseFloat(row.growth_rate) || 0,
        e_waste_per_capita: parseFloat(row.e_waste_per_capita) || 0
      });
    });

    return { valid, errors, total: records.length, validCount: valid.length, errorCount: errors.length };
  }

  validateImportData(records) {
    const valid = [];
    const errors = [];
    const requiredFields = ['year', 'import_quantity', 'import_value'];

    records.forEach((row, index) => {
      const missing = requiredFields.filter(f => !row[f] && row[f] !== 0);
      if (missing.length) {
        errors.push({ row: index + 1, missing, message: `Missing fields: ${missing.join(', ')}` });
        return;
      }
      valid.push({
        region_id: parseInt(row.region_id) || null,
        year: parseInt(row.year),
        import_quantity: parseFloat(row.import_quantity) || 0,
        import_value: parseFloat(row.import_value) || 0,
        source_country: row.source_country || null
      });
    });

    return { valid, errors, total: records.length, validCount: valid.length, errorCount: errors.length };
  }

  async processAndStore(dataType, records, regionId) {
    let result;

    switch (dataType) {
      case 'collection':
      case 'sales':
        const salesRecords = records.map(r => ({
          region_id: regionId || r.region_id,
          product_type: r.product_type || 'Other',
          quantity: parseInt(r.quantity) || 0,
          revenue: parseFloat(r.revenue) || 0,
          sale_date: r.sale_date || new Date().toISOString().split('T')[0]
        }));
        result = await salesRepo.bulkInsert(salesRecords);
        break;

      case 'population':
        const popRecords = records.map(r => ({
          region_id: regionId || r.region_id,
          year: parseInt(r.year),
          population: parseInt(r.population) || 0,
          growth_rate: parseFloat(r.growth_rate) || 0,
          e_waste_per_capita: parseFloat(r.e_waste_per_capita) || 0
        }));
        result = await populationRepo.bulkInsert(popRecords);
        break;

      case 'import':
        const importRecords = records.map(r => ({
          region_id: regionId || r.region_id,
          year: parseInt(r.year),
          import_quantity: parseFloat(r.import_quantity) || 0,
          import_value: parseFloat(r.import_value) || 0,
          source_country: r.source_country || null
        }));
        result = await importRepo.bulkInsert(importRecords);
        break;

      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }

    return { imported: result };
  }

  async previewData(filePath, dataType) {
    const ext = path.extname(filePath).toLowerCase();
    let records;

    if (ext === '.csv') {
      records = this.parseCSV(filePath);
    } else {
      const sheets = await this.parseExcel(filePath);
      const firstSheet = Object.values(sheets)[0] || [];
      records = firstSheet;
    }

    const preview = records.slice(0, 10);

    let validation;
    switch (dataType) {
      case 'collection':
      case 'sales':
        validation = this.validateCollectionData(records);
        break;
      case 'population':
        validation = this.validatePopulationData(records);
        break;
      case 'import':
        validation = this.validateImportData(records);
        break;
      default:
        validation = { valid: records, errors: [], total: records.length, validCount: records.length, errorCount: 0 };
    }

    return {
      totalRecords: records.length,
      preview,
      columns: preview.length > 0 ? Object.keys(preview[0]) : [],
      validation
    };
  }
}

module.exports = new UploadProcessingService();

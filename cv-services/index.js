const ExcelJS = require('../backend/node_modules/exceljs');
const path = require('path');

class CVDetector {
  constructor() {
    this.excelPath = path.join(__dirname, '../data-input/EWaste_Real_Models_200_Records.xlsx');
    this.modelsData = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.excelPath);
      
      workbook.worksheets.forEach(sheet => {
        const sheetName = sheet.name.toLowerCase(); // mobile, laptop, tv, etc.
        const records = [];
        
        // Skip header row
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber > 1) {
            const values = row.values;
            // Column 1 is empty due to ExcelJS padding
            const company = values[1] || values[2];
            const model = values[2] || values[3];
            const retailPrice = parseFloat(values[3] || values[4]) || 0;
            const rebuyValue = parseFloat(values[4] || values[5]) || 0;
            const expectedLifetime = parseFloat(values[5] || values[6]) || 5;
            const scrapValue = parseFloat(values[6] || values[7]) || 0;
            
            if (company && model) {
              records.push({
                company: String(company).trim(),
                model: String(model).trim(),
                retailPrice,
                rebuyValue,
                expectedLifetime,
                scrapValue
              });
            }
          }
        });
        
        this.modelsData[sheetName] = records;
      });
      
      this.initialized = true;
      console.log('CV Detector initialized successfully. Loaded categories:', Object.keys(this.modelsData));
    } catch (err) {
      console.error('Failed to initialize CV Detector:', err.message);
    }
  }

  // Detect brand and model from category and filename/hint
  async detect(productCategory, filename = '') {
    await this.init();
    
    // Normalize category
    let sheetKey = String(productCategory).toLowerCase().trim();
    if (sheetKey === 'television') sheetKey = 'tv';
    if (sheetKey === 'refrigerator') sheetKey = 'fridge';
    
    const records = this.modelsData[sheetKey] || this.modelsData['mobile'] || [];
    if (records.length === 0) {
      return {
        brand: 'Generic',
        model: 'Unknown Model',
        retailPrice: 1000,
        rebuyValue: 300,
        expectedLifetime: 5,
        scrapValue: 50
      };
    }

    // Heuristics: search filename for brand names
    const searchHint = String(filename).toLowerCase();
    let matched = null;
    
    for (const record of records) {
      const brandWord = record.company.toLowerCase();
      const modelWord = record.model.toLowerCase();
      if (searchHint.includes(brandWord) || searchHint.includes(modelWord)) {
        matched = record;
        break;
      }
    }

    // Fallback: Return N/A if AI cannot detect specific brand/model keywords
    if (!matched) {
      return {
        brand: 'N/A',
        model: 'N/A',
        retailPrice: 0,
        rebuyValue: 0,
        expectedLifetime: 5,
        scrapValue: 0
      };
    }

    return {
      brand: matched.company,
      model: matched.model,
      retailPrice: matched.retailPrice,
      rebuyValue: matched.rebuyValue,
      expectedLifetime: matched.expectedLifetime,
      scrapValue: matched.scrapValue
    };
  }

  async getCatalog(productCategory) {
    await this.init();
    let sheetKey = String(productCategory).toLowerCase().trim();
    if (sheetKey === 'television') sheetKey = 'tv';
    if (sheetKey === 'refrigerator') sheetKey = 'fridge';
    return this.modelsData[sheetKey] || [];
  }
}

module.exports = new CVDetector();

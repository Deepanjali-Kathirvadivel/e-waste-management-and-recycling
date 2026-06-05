const ExcelJS = require('../backend/node_modules/exceljs');
const path = require('path');

class CVDetector {
  constructor() {
    this.excelPath = path.join(__dirname, '../data-input/EWaste_Real_Models_200_Records.xlsx');
    this.modelsData = {
      'tv': [],
      'ac': [],
      'fridge': [],
      'washing machine': [],
      'fan': [],
      'laptop': [],
      'mobile': [],
      'monitor': [],
      'keyboard': [],
      'mouse': []
    };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.excelPath);
      
      workbook.worksheets.forEach(sheet => {
        const sheetName = sheet.name.toLowerCase().trim();
        
        // Skip header row
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber > 1) {
            const values = row.values;
            // Column 1 is empty or index in new sheet layout
            const company = values[2];
            const model = values[3];
            const retailPrice = parseFloat(values[4]) || 0;
            const rebuyValue = parseFloat(values[5]) || 0;
            const expectedLifetime = parseFloat(values[6]) || 5;
            const scrapValue = parseFloat(values[7]) || 0;
            
            if (company && model && String(company).trim() !== 'Company') {
              const record = {
                company: String(company).trim(),
                model: String(model).trim(),
                retailPrice,
                rebuyValue,
                expectedLifetime,
                scrapValue
              };

              if (sheetName === 'all records') {
                const modelLower = record.model.toLowerCase();
                if (modelLower.includes('book') || modelLower.includes('laptop')) {
                  this.modelsData['laptop'].push(record);
                } else {
                  this.modelsData['mobile'].push(record);
                }
              } else if (this.modelsData[sheetName]) {
                this.modelsData[sheetName].push(record);
              }
            }
          }
        });
      });

      // Inject robust fallback mock data for categories not present in the new Excel sheet
      const mockData = {
        'tv': [
          { company: 'Samsung', model: 'Neo QLED 4K', retailPrice: 85000, rebuyValue: 25000, expectedLifetime: 7, scrapValue: 2000 },
          { company: 'LG', model: 'OLED C3 Series', retailPrice: 120000, rebuyValue: 35000, expectedLifetime: 7, scrapValue: 2500 },
          { company: 'Sony', model: 'Bravia XR', retailPrice: 95000, rebuyValue: 28000, expectedLifetime: 8, scrapValue: 2200 },
          { company: 'OnePlus', model: 'TV U1S', retailPrice: 45000, rebuyValue: 12000, expectedLifetime: 5, scrapValue: 1000 },
          { company: 'Xiaomi', model: 'Smart TV X Series', retailPrice: 35000, rebuyValue: 9000, expectedLifetime: 5, scrapValue: 800 }
        ],
        'ac': [
          { company: 'Daikin', model: 'FTKF Series 1.5 Ton', retailPrice: 45000, rebuyValue: 15000, expectedLifetime: 10, scrapValue: 1500 },
          { company: 'Voltas', model: 'Adjustable Inverter 1.5 Ton', retailPrice: 38000, rebuyValue: 12000, expectedLifetime: 8, scrapValue: 1200 },
          { company: 'LG', model: 'Dual Inverter 1.5 Ton', retailPrice: 42000, rebuyValue: 14000, expectedLifetime: 10, scrapValue: 1400 },
          { company: 'Blue Star', model: 'Venu 5 Star 1.5 Ton', retailPrice: 40000, rebuyValue: 13000, expectedLifetime: 9, scrapValue: 1300 }
        ],
        'fridge': [
          { company: 'Samsung', model: 'Double Door Convertible', retailPrice: 32000, rebuyValue: 10000, expectedLifetime: 10, scrapValue: 1500 },
          { company: 'LG', model: 'Smart Inverter Double Door', retailPrice: 35000, rebuyValue: 11000, expectedLifetime: 10, scrapValue: 1600 },
          { company: 'Whirlpool', model: 'Intellifresh 265L', retailPrice: 28000, rebuyValue: 8000, expectedLifetime: 10, scrapValue: 1200 },
          { company: 'Godrej', model: 'Eon Vibe 260L', retailPrice: 26000, rebuyValue: 7500, expectedLifetime: 9, scrapValue: 1100 }
        ],
        'washing machine': [
          { company: 'LG', model: 'Front Load 7kg', retailPrice: 34000, rebuyValue: 10500, expectedLifetime: 10, scrapValue: 1200 },
          { company: 'Samsung', model: 'Ecobubble Front Load 8kg', retailPrice: 38000, rebuyValue: 12000, expectedLifetime: 10, scrapValue: 1400 },
          { company: 'IFB', model: 'Senator MX 8kg', retailPrice: 40000, rebuyValue: 12500, expectedLifetime: 12, scrapValue: 1500 },
          { company: 'Bosch', model: 'Series 6 Front Load 7.5kg', retailPrice: 36000, rebuyValue: 11000, expectedLifetime: 10, scrapValue: 1300 }
        ],
        'fan': [
          { company: 'Havells', model: 'Ambrose 1200mm', retailPrice: 2500, rebuyValue: 600, expectedLifetime: 8, scrapValue: 100 },
          { company: 'Usha', model: 'Swift 1200mm', retailPrice: 1800, rebuyValue: 450, expectedLifetime: 10, scrapValue: 80 },
          { company: 'Orient', model: 'Apex FX 1200mm', retailPrice: 1900, rebuyValue: 480, expectedLifetime: 10, scrapValue: 90 },
          { company: 'Crompton', model: 'Hill Brio 1200mm', retailPrice: 2100, rebuyValue: 500, expectedLifetime: 9, scrapValue: 95 }
        ],
        'monitor': [
          { company: 'Dell', model: 'S2721HN 27 Inch', retailPrice: 15000, rebuyValue: 4500, expectedLifetime: 5, scrapValue: 500 },
          { company: 'LG', model: 'Ultragear 24GN650', retailPrice: 14000, rebuyValue: 4200, expectedLifetime: 5, scrapValue: 450 },
          { company: 'Samsung', model: 'Odyssey G3 24 Inch', retailPrice: 13500, rebuyValue: 4000, expectedLifetime: 5, scrapValue: 400 },
          { company: 'BenQ', model: 'GW2480 24 Inch', retailPrice: 9500, rebuyValue: 2800, expectedLifetime: 6, scrapValue: 300 }
        ],
        'keyboard': [
          { company: 'Logitech', model: 'K120 Wired', retailPrice: 600, rebuyValue: 150, expectedLifetime: 5, scrapValue: 20 },
          { company: 'Dell', model: 'KB216 Wired', retailPrice: 550, rebuyValue: 130, expectedLifetime: 5, scrapValue: 18 },
          { company: 'HP', model: '150 Wired Keyboard', retailPrice: 650, rebuyValue: 160, expectedLifetime: 5, scrapValue: 22 },
          { company: 'Corsair', model: 'K55 RGB PRO', retailPrice: 4500, rebuyValue: 1200, expectedLifetime: 4, scrapValue: 100 }
        ],
        'mouse': [
          { company: 'Logitech', model: 'B100 Optical', retailPrice: 350, rebuyValue: 80, expectedLifetime: 5, scrapValue: 10 },
          { company: 'HP', model: 'M100 Wired', retailPrice: 400, rebuyValue: 90, expectedLifetime: 5, scrapValue: 12 },
          { company: 'Dell', model: 'MS116 Optical', retailPrice: 380, rebuyValue: 85, expectedLifetime: 5, scrapValue: 11 },
          { company: 'Razer', model: 'DeathAdder Essential', retailPrice: 1600, rebuyValue: 400, expectedLifetime: 3, scrapValue: 50 }
        ]
      };

      for (const [cat, data] of Object.entries(mockData)) {
        if (!this.modelsData[cat] || this.modelsData[cat].length === 0) {
          this.modelsData[cat] = data;
        }
      }
      
      this.initialized = true;
      console.log('CV Detector initialized successfully with updated Excel sheet. Category sizes:', Object.keys(this.modelsData).map(k => `${k}: ${this.modelsData[k].length}`));
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

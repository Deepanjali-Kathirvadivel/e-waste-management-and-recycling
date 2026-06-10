const ExcelJS = require('../backend/node_modules/exceljs');
const path = require('path');

class CVDetector {
  constructor() {
    this.excelPath = path.join(__dirname, '../data-input/EWaste_Real_Models_200_Records.xlsx');
    this.modelsData = {
      'tv': [], 'ac': [], 'fridge': [], 'washing machine': [], 'fan': [],
      'laptop': [], 'mobile': [], 'monitor': [], 'keyboard': [], 'mouse': [],
      'desktop': [], 'server': [], 'tablet': [], 'printer': [], 'router': [],
      'microwave oven': [], 'music system': [], 'rice cooker': [], 'induction stove': [],
      'mixer grinder': [], 'vacuum cleaner': [], 'iron box': [], 'water purifier': [], 'geyser': [],
      'drilling machine': [], 'welding machine': [], 'power tools': [], 'testing equipment': [],
      'gaming console': [], 'drone': [], 'electronic toys': [], 'treadmill': [], 'exercise equipment': [],
      'led bulb': [], 'tube light': [], 'emergency light': [], 'street light': [], 'decorative lighting': [],
      'blood pressure monitor': [], 'thermometer': [], 'pulse oximeter': [], 'nebulizer': [], 'glucose meter': [], 'ecg device': [],
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
        ],
        'desktop': [
          { company: 'Dell', model: 'OptiPlex 3080', retailPrice: 35000, rebuyValue: 10000, expectedLifetime: 5, scrapValue: 500 },
          { company: 'HP', model: 'ProDesk 400 G7', retailPrice: 32000, rebuyValue: 9000, expectedLifetime: 5, scrapValue: 450 },
          { company: 'Lenovo', model: 'ThinkCentre M720', retailPrice: 30000, rebuyValue: 8500, expectedLifetime: 5, scrapValue: 400 },
          { company: 'Apple', model: 'Mac Mini M2', retailPrice: 60000, rebuyValue: 20000, expectedLifetime: 6, scrapValue: 800 }
        ],
        'server': [
          { company: 'Dell', model: 'PowerEdge R740', retailPrice: 150000, rebuyValue: 45000, expectedLifetime: 7, scrapValue: 3000 },
          { company: 'HP', model: 'ProLiant DL380 Gen10', retailPrice: 180000, rebuyValue: 50000, expectedLifetime: 7, scrapValue: 3500 },
          { company: 'IBM', model: 'Power System S922', retailPrice: 250000, rebuyValue: 70000, expectedLifetime: 8, scrapValue: 5000 },
          { company: 'Supermicro', model: 'SuperServer 6029P', retailPrice: 120000, rebuyValue: 35000, expectedLifetime: 6, scrapValue: 2500 }
        ],
        'tablet': [
          { company: 'Apple', model: 'iPad Air M2 11"', retailPrice: 55000, rebuyValue: 18000, expectedLifetime: 5, scrapValue: 600 },
          { company: 'Samsung', model: 'Galaxy Tab S9', retailPrice: 45000, rebuyValue: 14000, expectedLifetime: 4, scrapValue: 500 },
          { company: 'Lenovo', model: 'Tab P12 Pro', retailPrice: 35000, rebuyValue: 10000, expectedLifetime: 4, scrapValue: 400 },
          { company: 'Microsoft', model: 'Surface Pro 9', retailPrice: 75000, rebuyValue: 25000, expectedLifetime: 5, scrapValue: 800 }
        ],
        'printer': [
          { company: 'HP', model: 'LaserJet Pro M404dn', retailPrice: 18000, rebuyValue: 5000, expectedLifetime: 6, scrapValue: 300 },
          { company: 'Canon', model: 'PIXMA G3270', retailPrice: 12000, rebuyValue: 3500, expectedLifetime: 5, scrapValue: 200 },
          { company: 'Epson', model: 'L3150 EcoTank', retailPrice: 14000, rebuyValue: 4000, expectedLifetime: 5, scrapValue: 250 },
          { company: 'Brother', model: 'DCP-L2520D', retailPrice: 15000, rebuyValue: 4200, expectedLifetime: 6, scrapValue: 280 }
        ],
        'router': [
          { company: 'TP-Link', model: 'Archer AX73', retailPrice: 5000, rebuyValue: 1200, expectedLifetime: 4, scrapValue: 80 },
          { company: 'ASUS', model: 'RT-AX86U', retailPrice: 15000, rebuyValue: 4500, expectedLifetime: 4, scrapValue: 150 },
          { company: 'Netgear', model: 'Nighthawk RAX50', retailPrice: 12000, rebuyValue: 3500, expectedLifetime: 4, scrapValue: 120 },
          { company: 'Cisco', model: 'RV340 Dual WAN', retailPrice: 18000, rebuyValue: 5000, expectedLifetime: 5, scrapValue: 200 }
        ],
        'microwave oven': [
          { company: 'LG', model: 'MC25M8277HT', retailPrice: 12000, rebuyValue: 3500, expectedLifetime: 7, scrapValue: 300 },
          { company: 'Samsung', model: 'MG23K3515AK', retailPrice: 9000, rebuyValue: 2500, expectedLifetime: 6, scrapValue: 250 },
          { company: 'Panasonic', model: 'NN-ST66K', retailPrice: 8000, rebuyValue: 2200, expectedLifetime: 6, scrapValue: 200 },
          { company: 'IFB', model: '30PMT Convection', retailPrice: 15000, rebuyValue: 4500, expectedLifetime: 7, scrapValue: 350 }
        ],
        'music system': [
          { company: 'Sony', model: 'MHC-V73D', retailPrice: 25000, rebuyValue: 7000, expectedLifetime: 8, scrapValue: 500 },
          { company: 'JBL', model: 'PartyBox 310', retailPrice: 22000, rebuyValue: 6000, expectedLifetime: 5, scrapValue: 400 },
          { company: 'Philips', model: 'M4505', retailPrice: 8000, rebuyValue: 2000, expectedLifetime: 6, scrapValue: 200 },
          { company: 'Bose', model: 'SoundTouch 30', retailPrice: 35000, rebuyValue: 10000, expectedLifetime: 7, scrapValue: 600 }
        ],
        'rice cooker': [
          { company: 'Panasonic', model: 'SR-TMJ188', retailPrice: 5000, rebuyValue: 1200, expectedLifetime: 5, scrapValue: 80 },
          { company: 'Philips', model: 'HD3136', retailPrice: 6000, rebuyValue: 1500, expectedLifetime: 5, scrapValue: 100 },
          { company: 'Prestige', model: 'CR-Mini 0.6L', retailPrice: 2000, rebuyValue: 500, expectedLifetime: 4, scrapValue: 40 },
          { company: 'Butterfly', model: 'Smart Electric 1.8L', retailPrice: 3500, rebuyValue: 800, expectedLifetime: 5, scrapValue: 60 }
        ],
        'induction stove': [
          { company: 'Prestige', model: 'PIC 15.0', retailPrice: 3000, rebuyValue: 800, expectedLifetime: 5, scrapValue: 50 },
          { company: 'Philips', model: 'HD4928', retailPrice: 4000, rebuyValue: 1000, expectedLifetime: 5, scrapValue: 60 },
          { company: 'Bajaj', model: 'ICX 8', retailPrice: 2500, rebuyValue: 600, expectedLifetime: 4, scrapValue: 40 },
          { company: 'Morphy Richards', model: 'Prima Plus 2100W', retailPrice: 5000, rebuyValue: 1200, expectedLifetime: 5, scrapValue: 80 }
        ],
        'mixer grinder': [
          { company: 'Bajaj', model: 'Rex 500W', retailPrice: 3000, rebuyValue: 800, expectedLifetime: 8, scrapValue: 50 },
          { company: 'Philips', model: 'HL7756', retailPrice: 5000, rebuyValue: 1200, expectedLifetime: 8, scrapValue: 80 },
          { company: 'Prestige', model: 'IRIS 750W', retailPrice: 4000, rebuyValue: 1000, expectedLifetime: 7, scrapValue: 60 },
          { company: 'Butterfly', model: 'Grand Turbo 750W', retailPrice: 3500, rebuyValue: 800, expectedLifetime: 7, scrapValue: 50 }
        ],
        'vacuum cleaner': [
          { company: 'Dyson', model: 'V15 Detect', retailPrice: 55000, rebuyValue: 15000, expectedLifetime: 5, scrapValue: 500 },
          { company: 'Karcher', model: 'WD 3', retailPrice: 8000, rebuyValue: 2000, expectedLifetime: 8, scrapValue: 150 },
          { company: 'Philips', model: 'FC9350 PowerPro', retailPrice: 6000, rebuyValue: 1500, expectedLifetime: 6, scrapValue: 100 },
          { company: 'Eureka Forbes', model: 'Super Vac 2000W', retailPrice: 5000, rebuyValue: 1200, expectedLifetime: 6, scrapValue: 80 }
        ],
        'iron box': [
          { company: 'Philips', model: 'GC1905', retailPrice: 1200, rebuyValue: 300, expectedLifetime: 4, scrapValue: 30 },
          { company: 'Bajaj', model: 'DX 7', retailPrice: 1000, rebuyValue: 250, expectedLifetime: 4, scrapValue: 25 },
          { company: 'Morphy Richards', model: 'Super Express 2400W', retailPrice: 2500, rebuyValue: 600, expectedLifetime: 5, scrapValue: 50 },
          { company: 'Black & Decker', model: 'D1830', retailPrice: 1800, rebuyValue: 450, expectedLifetime: 4, scrapValue: 35 }
        ],
        'water purifier': [
          { company: 'Kent', model: 'Grand Plus', retailPrice: 14000, rebuyValue: 4000, expectedLifetime: 7, scrapValue: 300 },
          { company: 'Eureka Forbes', model: 'Aquaguard Aura', retailPrice: 16000, rebuyValue: 4500, expectedLifetime: 7, scrapValue: 350 },
          { company: 'Aquafresh', model: 'RO+UV 12L', retailPrice: 10000, rebuyValue: 2800, expectedLifetime: 6, scrapValue: 200 },
          { company: 'LG', model: 'Puricare WW160NP', retailPrice: 25000, rebuyValue: 7000, expectedLifetime: 8, scrapValue: 500 }
        ],
        'geyser': [
          { company: 'Bajaj', model: 'Flora Instant 3L', retailPrice: 4000, rebuyValue: 1000, expectedLifetime: 5, scrapValue: 100 },
          { company: 'Racold', model: 'Vibrio 10L', retailPrice: 8000, rebuyValue: 2000, expectedLifetime: 6, scrapValue: 150 },
          { company: 'Havells', model: 'Instanio 3L', retailPrice: 4500, rebuyValue: 1100, expectedLifetime: 5, scrapValue: 100 },
          { company: 'V-Guard', model: 'Primeo 10L', retailPrice: 7000, rebuyValue: 1800, expectedLifetime: 6, scrapValue: 130 }
        ],
        'drilling machine': [
          { company: 'Bosch', model: 'GBM 1000', retailPrice: 3000, rebuyValue: 800, expectedLifetime: 5, scrapValue: 80 },
          { company: 'DeWalt', model: 'DZ0110', retailPrice: 4500, rebuyValue: 1200, expectedLifetime: 5, scrapValue: 100 },
          { company: 'Makita', model: 'HP1630', retailPrice: 5000, rebuyValue: 1300, expectedLifetime: 6, scrapValue: 120 },
          { company: 'Hitachi', model: 'FDV16VB2', retailPrice: 4000, rebuyValue: 1000, expectedLifetime: 5, scrapValue: 90 }
        ],
        'welding machine': [
          { company: 'ESAB', model: 'Rebel EMP 215', retailPrice: 60000, rebuyValue: 18000, expectedLifetime: 7, scrapValue: 1000 },
          { company: 'Lincoln', model: 'Power MIG 210', retailPrice: 55000, rebuyValue: 16000, expectedLifetime: 7, scrapValue: 900 },
          { company: 'Miller', model: 'Millermatic 211', retailPrice: 70000, rebuyValue: 20000, expectedLifetime: 8, scrapValue: 1200 },
          { company: 'Induromatic', model: 'SVM 320A', retailPrice: 30000, rebuyValue: 8000, expectedLifetime: 6, scrapValue: 500 }
        ],
        'power tools': [
          { company: 'Bosch', model: 'GWS 600 Professional', retailPrice: 2500, rebuyValue: 600, expectedLifetime: 4, scrapValue: 50 },
          { company: 'DeWalt', model: 'DWE402K', retailPrice: 4000, rebuyValue: 1000, expectedLifetime: 4, scrapValue: 70 },
          { company: 'Makita', model: 'GA4530', retailPrice: 3500, rebuyValue: 800, expectedLifetime: 4, scrapValue: 60 },
          { company: 'Black & Decker', model: 'KG1000', retailPrice: 2000, rebuyValue: 500, expectedLifetime: 3, scrapValue: 40 }
        ],
        'testing equipment': [
          { company: 'Fluke', model: '115 True RMS', retailPrice: 12000, rebuyValue: 3500, expectedLifetime: 7, scrapValue: 200 },
          { company: 'Keysight', model: 'U1232A', retailPrice: 15000, rebuyValue: 4000, expectedLifetime: 7, scrapValue: 250 },
          { company: 'Meco', model: 'DT9205A', retailPrice: 1500, rebuyValue: 400, expectedLifetime: 5, scrapValue: 30 },
          { company: 'HTC', model: 'MS8217', retailPrice: 3000, rebuyValue: 800, expectedLifetime: 5, scrapValue: 50 }
        ],
        'gaming console': [
          { company: 'Sony', model: 'PlayStation 5', retailPrice: 45000, rebuyValue: 18000, expectedLifetime: 5, scrapValue: 500 },
          { company: 'Microsoft', model: 'Xbox Series X', retailPrice: 42000, rebuyValue: 16000, expectedLifetime: 5, scrapValue: 450 },
          { company: 'Nintendo', model: 'Switch OLED', retailPrice: 25000, rebuyValue: 10000, expectedLifetime: 4, scrapValue: 300 },
          { company: 'Sony', model: 'PlayStation 4 Pro', retailPrice: 25000, rebuyValue: 8000, expectedLifetime: 4, scrapValue: 250 }
        ],
        'drone': [
          { company: 'DJI', model: 'Mavic Air 3', retailPrice: 80000, rebuyValue: 25000, expectedLifetime: 3, scrapValue: 500 },
          { company: 'DJI', model: 'Mini 4 Pro', retailPrice: 55000, rebuyValue: 17000, expectedLifetime: 3, scrapValue: 400 },
          { company: 'Autel', model: 'EVO Lite+', retailPrice: 70000, rebuyValue: 21000, expectedLifetime: 3, scrapValue: 450 },
          { company: 'Parrot', model: 'Anafi USA', retailPrice: 100000, rebuyValue: 30000, expectedLifetime: 3, scrapValue: 600 }
        ],
        'electronic toys': [
          { company: 'LEGO', model: 'Mindstorms Robot Inventor', retailPrice: 35000, rebuyValue: 8000, expectedLifetime: 5, scrapValue: 200 },
          { company: 'Sphero', model: 'Bolt', retailPrice: 12000, rebuyValue: 3000, expectedLifetime: 3, scrapValue: 80 },
          { company: 'VTech', model: 'KidiZoom Smartwatch', retailPrice: 4000, rebuyValue: 1000, expectedLifetime: 3, scrapValue: 30 },
          { company: 'Wonder Workshop', model: 'Dash Robot', retailPrice: 15000, rebuyValue: 4000, expectedLifetime: 4, scrapValue: 100 }
        ],
        'treadmill': [
          { company: 'PowerMax', model: 'FitTrack 5.0', retailPrice: 40000, rebuyValue: 10000, expectedLifetime: 7, scrapValue: 800 },
          { company: 'Reebok', model: 'GT40S', retailPrice: 35000, rebuyValue: 9000, expectedLifetime: 6, scrapValue: 700 },
          { company: 'Protoner', model: 'PTM 6945', retailPrice: 25000, rebuyValue: 6000, expectedLifetime: 5, scrapValue: 500 },
          { company: 'Welcare', model: 'WC6045', retailPrice: 20000, rebuyValue: 5000, expectedLifetime: 5, scrapValue: 400 }
        ],
        'exercise equipment': [
          { company: 'PowerMax', model: 'Air Bike 2.0', retailPrice: 15000, rebuyValue: 4000, expectedLifetime: 6, scrapValue: 300 },
          { company: 'Reebok', model: 'RBBE 10220', retailPrice: 12000, rebuyValue: 3000, expectedLifetime: 5, scrapValue: 200 },
          { company: 'BodyFit', model: 'Multi Gym 3 Station', retailPrice: 25000, rebuyValue: 6000, expectedLifetime: 8, scrapValue: 500 },
          { company: 'Cockatoo', model: 'Air Walker', retailPrice: 8000, rebuyValue: 2000, expectedLifetime: 5, scrapValue: 150 }
        ],
        'led bulb': [
          { company: 'Philips', model: 'Essential 9W', retailPrice: 150, rebuyValue: 30, expectedLifetime: 3, scrapValue: 5 },
          { company: 'Havells', model: 'Luminos 12W', retailPrice: 200, rebuyValue: 40, expectedLifetime: 3, scrapValue: 5 },
          { company: 'Syska', model: 'SSK-LED 9W', retailPrice: 120, rebuyValue: 25, expectedLifetime: 3, scrapValue: 5 },
          { company: 'Bajaj', model: 'LED 12W 6500K', retailPrice: 180, rebuyValue: 35, expectedLifetime: 3, scrapValue: 5 }
        ],
        'tube light': [
          { company: 'Philips', model: 'TLED 20W 4ft', retailPrice: 400, rebuyValue: 80, expectedLifetime: 3, scrapValue: 10 },
          { company: 'Havells', model: 'Insta LED 20W', retailPrice: 450, rebuyValue: 90, expectedLifetime: 3, scrapValue: 10 },
          { company: 'Syska', model: 'LED Batten 20W', retailPrice: 350, rebuyValue: 70, expectedLifetime: 3, scrapValue: 10 },
          { company: 'Wipro', model: 'Garnet 20W', retailPrice: 380, rebuyValue: 75, expectedLifetime: 3, scrapValue: 10 }
        ],
        'emergency light': [
          { company: 'Philips', model: 'EZ Emergency 10W', retailPrice: 1500, rebuyValue: 350, expectedLifetime: 4, scrapValue: 50 },
          { company: 'Havells', model: 'Rolla 6W', retailPrice: 1200, rebuyValue: 300, expectedLifetime: 4, scrapValue: 40 },
          { company: 'Eveready', model: 'LED Emergency 9W', retailPrice: 1000, rebuyValue: 250, expectedLifetime: 3, scrapValue: 30 },
          { company: 'Syska', model: 'SSK-EHL 9W', retailPrice: 1300, rebuyValue: 300, expectedLifetime: 4, scrapValue: 40 }
        ],
        'street light': [
          { company: 'Philips', model: 'BDP481 30W', retailPrice: 4000, rebuyValue: 1000, expectedLifetime: 5, scrapValue: 100 },
          { company: 'Havells', model: 'Street Light 50W', retailPrice: 6000, rebuyValue: 1500, expectedLifetime: 5, scrapValue: 120 },
          { company: 'Syska', model: 'SSK-SL 30W', retailPrice: 3500, rebuyValue: 800, expectedLifetime: 5, scrapValue: 80 },
          { company: 'Wipro', model: 'WSL 40W', retailPrice: 4500, rebuyValue: 1000, expectedLifetime: 5, scrapValue: 100 }
        ],
        'decorative lighting': [
          { company: 'Philips', model: 'Fairy Light 20m', retailPrice: 1200, rebuyValue: 250, expectedLifetime: 3, scrapValue: 30 },
          { company: 'Havells', model: 'Chip LED Strip 5m', retailPrice: 800, rebuyValue: 150, expectedLifetime: 3, scrapValue: 20 },
          { company: 'Syska', model: 'LED Strip RGB 5m', retailPrice: 1000, rebuyValue: 200, expectedLifetime: 3, scrapValue: 25 },
          { company: 'Wipro', model: 'RGB Strip 10m', retailPrice: 1500, rebuyValue: 300, expectedLifetime: 3, scrapValue: 30 }
        ],
        'blood pressure monitor': [
          { company: 'Omron', model: 'HEM-7121', retailPrice: 2500, rebuyValue: 600, expectedLifetime: 5, scrapValue: 50 },
          { company: 'Dr Trust', model: 'BP Check', retailPrice: 2000, rebuyValue: 500, expectedLifetime: 4, scrapValue: 40 },
          { company: 'Beurer', model: 'BM 35', retailPrice: 3000, rebuyValue: 700, expectedLifetime: 5, scrapValue: 50 },
          { company: 'AccuSure', model: '11', retailPrice: 1800, rebuyValue: 400, expectedLifetime: 4, scrapValue: 30 }
        ],
        'thermometer': [
          { company: 'Omron', model: 'MC-246', retailPrice: 600, rebuyValue: 120, expectedLifetime: 4, scrapValue: 10 },
          { company: 'Dr Trust', model: 'Digital Thermometer', retailPrice: 500, rebuyValue: 100, expectedLifetime: 4, scrapValue: 10 },
          { company: 'Beurer', model: 'FT 85', retailPrice: 2500, rebuyValue: 500, expectedLifetime: 5, scrapValue: 30 },
          { company: 'Braun', model: 'ThermoScan 7', retailPrice: 4000, rebuyValue: 800, expectedLifetime: 5, scrapValue: 40 }
        ],
        'pulse oximeter': [
          { company: 'Dr Trust', model: 'Professional 550', retailPrice: 2500, rebuyValue: 500, expectedLifetime: 3, scrapValue: 20 },
          { company: 'Beurer', model: 'PO 30', retailPrice: 3000, rebuyValue: 600, expectedLifetime: 3, scrapValue: 25 },
          { company: 'AccuSure', model: 'Pulse Oximeter', retailPrice: 1500, rebuyValue: 300, expectedLifetime: 3, scrapValue: 15 },
          { company: 'Omron', model: 'OX-03', retailPrice: 2800, rebuyValue: 550, expectedLifetime: 3, scrapValue: 20 }
        ],
        'nebulizer': [
          { company: 'Omron', model: 'NE-C801', retailPrice: 5000, rebuyValue: 1200, expectedLifetime: 5, scrapValue: 80 },
          { company: 'Dr Trust', model: 'Nebulizer 100', retailPrice: 2500, rebuyValue: 600, expectedLifetime: 4, scrapValue: 40 },
          { company: 'Beurer', model: 'IH 60', retailPrice: 4500, rebuyValue: 1000, expectedLifetime: 5, scrapValue: 70 },
          { company: 'Philips', model: 'Respironics InnoSpire', retailPrice: 6000, rebuyValue: 1500, expectedLifetime: 5, scrapValue: 100 }
        ],
        'glucose meter': [
          { company: 'Accu-Chek', model: 'Active', retailPrice: 1500, rebuyValue: 300, expectedLifetime: 4, scrapValue: 20 },
          { company: 'Dr Trust', model: 'Blood Glucose', retailPrice: 1200, rebuyValue: 250, expectedLifetime: 4, scrapValue: 15 },
          { company: 'OneTouch', model: 'Select Plus', retailPrice: 1800, rebuyValue: 350, expectedLifetime: 4, scrapValue: 25 },
          { company: 'Contour', model: 'TS Meter', retailPrice: 1600, rebuyValue: 320, expectedLifetime: 4, scrapValue: 20 }
        ],
        'ecg device': [
          { company: 'BPL', model: 'Cardiart 3 Channel', retailPrice: 45000, rebuyValue: 12000, expectedLifetime: 7, scrapValue: 500 },
          { company: 'Schiller', model: 'AT-10 Plus', retailPrice: 60000, rebuyValue: 16000, expectedLifetime: 8, scrapValue: 600 },
          { company: 'GE', model: 'MAC 600', retailPrice: 55000, rebuyValue: 15000, expectedLifetime: 7, scrapValue: 550 },
          { company: 'Philips', model: 'PageWriter TC10', retailPrice: 50000, rebuyValue: 13000, expectedLifetime: 7, scrapValue: 500 }
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
    const normalizeMap = {
      'television': 'tv', 'refrigerator': 'fridge', 'air conditioner': 'ac',
      'mobile phone': 'mobile', 'washing machine': 'washing machine',
      'microwave oven': 'microwave oven', 'music system': 'music system',
      'rice cooker': 'rice cooker', 'induction stove': 'induction stove',
      'mixer grinder': 'mixer grinder', 'vacuum cleaner': 'vacuum cleaner',
      'iron box': 'iron box', 'water purifier': 'water purifier', 'geyser': 'geyser',
      'drilling machine': 'drilling machine', 'welding machine': 'welding machine',
      'power tools': 'power tools', 'testing equipment': 'testing equipment',
      'gaming console': 'gaming console', 'electronic toys': 'electronic toys',
      'exercise equipment': 'exercise equipment',
      'led bulb': 'led bulb', 'tube light': 'tube light',
      'emergency light': 'emergency light', 'street light': 'street light',
      'decorative lighting': 'decorative lighting',
      'blood pressure monitor': 'blood pressure monitor',
      'pulse oximeter': 'pulse oximeter', 'glucose meter': 'glucose meter',
      'ecg device': 'ecg device',
    };
    let sheetKey = String(productCategory).toLowerCase().trim();
    if (normalizeMap[sheetKey]) sheetKey = normalizeMap[sheetKey];
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
    const normalizeMap = {
      'television': 'tv', 'refrigerator': 'fridge', 'air conditioner': 'ac',
      'mobile phone': 'mobile', 'washing machine': 'washing machine',
      'microwave oven': 'microwave oven', 'music system': 'music system',
      'rice cooker': 'rice cooker', 'induction stove': 'induction stove',
      'mixer grinder': 'mixer grinder', 'vacuum cleaner': 'vacuum cleaner',
      'iron box': 'iron box', 'water purifier': 'water purifier', 'geyser': 'geyser',
      'drilling machine': 'drilling machine', 'welding machine': 'welding machine',
      'power tools': 'power tools', 'testing equipment': 'testing equipment',
      'gaming console': 'gaming console', 'electronic toys': 'electronic toys',
      'exercise equipment': 'exercise equipment',
      'led bulb': 'led bulb', 'tube light': 'tube light',
      'emergency light': 'emergency light', 'street light': 'street light',
      'decorative lighting': 'decorative lighting',
      'blood pressure monitor': 'blood pressure monitor',
      'pulse oximeter': 'pulse oximeter', 'glucose meter': 'glucose meter',
      'ecg device': 'ecg device',
    };
    let sheetKey = String(productCategory).toLowerCase().trim();
    if (normalizeMap[sheetKey]) sheetKey = normalizeMap[sheetKey];
    return this.modelsData[sheetKey] || [];
  }
}

module.exports = new CVDetector();

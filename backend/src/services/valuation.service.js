const basePrices = {
  // IT – Information Technology
  'Laptop': 12000, 'Desktop': 8000, 'Server': 25000, 'Mobile Phone': 5000,
  'Tablet': 8000, 'Monitor': 3000, 'Printer': 4000, 'Router': 1500,
  'Keyboard': 500, 'Mouse': 300,
  // CE – Consumer Electronics
  'Television': 5000, 'Air Conditioner': 8000, 'Refrigerator': 7000,
  'Washing Machine': 4500, 'Fan': 800, 'Microwave Oven': 3000, 'Music System': 2500,
  // LS – Large/Small Household Appliances
  'Rice Cooker': 1500, 'Induction Stove': 2000, 'Mixer Grinder': 2000,
  'Vacuum Cleaner': 3000, 'Iron Box': 600, 'Water Purifier': 4000, 'Geyser': 3500,
  // EE – Electrical & Electronic Tools
  'Drilling Machine': 2500, 'Welding Machine': 8000, 'Power Tools': 3500,
  'Testing Equipment': 5000,
  // TLS – Toys, Leisure & Sports Equipment
  'Gaming Console': 8000, 'Drone': 12000, 'Electronic Toys': 1000,
  'Treadmill': 15000, 'Exercise Equipment': 5000,
  // LI – Lighting Instruments
  'LED Bulb': 200, 'Tube Light': 300, 'Emergency Light': 500,
  'Street Light': 2000, 'Decorative Lighting': 800,
  // MD – Medical Devices
  'Blood Pressure Monitor': 1500, 'Thermometer': 300, 'Pulse Oximeter': 1000,
  'Nebulizer': 2000, 'Glucose Meter': 1200, 'ECG Device': 5000,
};

const conditionMultipliers = {
  excellent: 1.0, good: 0.8, fair: 0.6, poor: 0.4, damaged: 0.2,
};

const calculate = (productType, condition, weightKg) => {
  const base = basePrices[productType] || 3000;
  const conditionMultiplier = conditionMultipliers[condition] || 0.5;
  const weightFactor = weightKg ? Math.min(weightKg / 10, 2) : 1;
  const marketFactor = 0.9 + Math.random() * 0.2;
  const estimated = base * conditionMultiplier * weightFactor * marketFactor;
  return {
    base_price: base,
    condition_multiplier: conditionMultiplier,
    weight_adjustment: parseFloat(weightFactor.toFixed(2)),
    market_factor: parseFloat(marketFactor.toFixed(2)),
    estimated_value: Math.round(estimated),
  };
};

module.exports = { calculate, basePrices, conditionMultipliers };

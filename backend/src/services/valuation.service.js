const basePrices = {
  'Television': 5000, 'Air Conditioner': 8000, 'Refrigerator': 7000,
  'Washing Machine': 4500, 'Fan': 800, 'Laptop': 12000, 'Mobile': 5000,
  'Monitor': 3000,
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

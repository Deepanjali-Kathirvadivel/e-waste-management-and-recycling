const analyzeImage = () => {
  const brands = ['Samsung', 'LG', 'Sony', 'Panasonic', 'Whirlpool', 'Dell', 'HP', 'Apple', 'OnePlus', 'Xiaomi'];
  const models = ['UE43TU7100', 'OLED55C1', 'XBR65X90J', 'TH-50GX700', 'WM3400CW', 'Inspiron 15', 'Pavilion 14', 'iPhone 14', 'Nord CE3', 'Redmi Note 12'];
  const productTypes = ['Television', 'Air Conditioner', 'Refrigerator', 'Washing Machine', 'Fan', 'Laptop', 'Mobile'];
  const conditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];

  return {
    brand: brands[Math.floor(Math.random() * brands.length)],
    model: models[Math.floor(Math.random() * models.length)],
    product_type: productTypes[Math.floor(Math.random() * productTypes.length)],
    condition_score: Math.floor(Math.random() * 40) + 60,
    category: 'Home Appliance',
    recyclability: Math.floor(Math.random() * 30) + 50,
    data_risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    detection_details: [
      { component: 'Screen', confidence: Math.floor(Math.random() * 20) + 80 },
      { component: 'Casing', confidence: Math.floor(Math.random() * 20) + 75 },
      { component: 'Cables', confidence: Math.floor(Math.random() * 25) + 65 },
      { component: 'Ports', confidence: Math.floor(Math.random() * 25) + 60 },
    ],
    suggested_condition: conditions[Math.floor(Math.random() * conditions.length)],
  };
};

const generateForecast = () => {
  const regions = ['Coimbatore', 'Pollachi', 'Mettupalayam', 'Sulur', 'Annur', 'Kinathukadavu', 'Valparai'];
  return {
    forecasted_waste: Math.floor(Math.random() * 20000) + 15000,
    growth_rate: parseFloat((Math.random() * 15 + 5).toFixed(1)),
    opportunity_score: Math.floor(Math.random() * 30) + 60,
    predicted_revenue: Math.floor(Math.random() * 200000000) + 200000000,
    product_demand: [
      { product: 'Laptop', demand: 'high' },
      { product: 'Mobile', demand: 'high' },
      { product: 'Television', demand: 'medium' },
      { product: 'Refrigerator', demand: 'medium' },
      { product: 'Washing Machine', demand: 'low' },
    ],
    regional_insights: regions.map((r) => ({
      region: r,
      y1: Math.floor(Math.random() * 5000) + 2000,
      y3: Math.floor(Math.random() * 10000) + 5000,
      y5: Math.floor(Math.random() * 15000) + 10000,
    })),
  };
};

const generateSustainabilityScore = () => ({
  score: Math.floor(Math.random() * 20) + 65,
  collection_efficiency: parseFloat((Math.random() * 20 + 70).toFixed(1)),
  recovery_rate: parseFloat((Math.random() * 20 + 60).toFixed(1)),
  transportation_efficiency: parseFloat((Math.random() * 15 + 70).toFixed(1)),
  facility_utilization: parseFloat((Math.random() * 20 + 65).toFixed(1)),
});

module.exports = { analyzeImage, generateForecast, generateSustainabilityScore };

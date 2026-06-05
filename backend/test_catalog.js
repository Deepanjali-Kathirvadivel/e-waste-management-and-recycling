const cvDetector = require('../cv-services');

async function test() {
  await cvDetector.init();
  console.log('Available keys in modelsData:', Object.keys(cvDetector.modelsData));
  
  const tvCatalog = await cvDetector.getCatalog('TV');
  console.log('TV catalog length:', tvCatalog.length);
  if (tvCatalog.length > 0) {
    console.log('TV Sample:', tvCatalog[0]);
  }
  
  const laptopCatalog = await cvDetector.getCatalog('Laptop');
  console.log('Laptop catalog length:', laptopCatalog.length);
  if (laptopCatalog.length > 0) {
    console.log('Laptop Sample:', laptopCatalog[0]);
  }
}

test().catch(console.error);

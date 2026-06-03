const ProductRepository = require('../repositories/productRepository');

const productRepo = new ProductRepository();

class ProductService {
  async getAll() {
    return await productRepo.findAll({ orderBy: 'name' });
  }

  async getById(id) {
    const product = await productRepo.findById(id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async getCatalog() {
    return await productRepo.getCatalog();
  }

  async getByType(type) {
    return await productRepo.getByType(type);
  }

  async create(data) {
    return await productRepo.create(data);
  }

  async update(id, data) {
    const product = await productRepo.findById(id);
    if (!product) throw new Error('Product not found');
    await productRepo.update(id, data);
    return await productRepo.findById(id);
  }

  async delete(id) {
    await productRepo.delete(id);
    return { message: 'Product deleted successfully' };
  }

  async search(query) {
    return await productRepo.search(query);
  }
}

module.exports = new ProductService();

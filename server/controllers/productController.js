const productService = require('../services/productService');

class ProductController {
  async getAll(req, res, next) {
    try { res.json(await productService.getAll()); } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getById(req.params.id);
      res.json(product);
    } catch (err) {
      if (err.message === 'Product not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async getCatalog(req, res, next) {
    try { res.json(await productService.getCatalog()); } catch (err) { next(err); }
  }

  async getByType(req, res, next) {
    try { res.json(await productService.getByType(req.params.type)); } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try { res.status(201).json(await productService.create(req.body)); } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try { res.json(await productService.update(req.params.id, req.body)); } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try { res.json(await productService.delete(req.params.id)); } catch (err) { next(err); }
  }

  async search(req, res, next) {
    try { res.json(await productService.search(req.query.q)); } catch (err) { next(err); }
  }
}

module.exports = new ProductController();

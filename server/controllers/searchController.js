const SearchRepository = require('../repositories/searchRepository');

const searchRepo = new SearchRepository();

class SearchController {
  async globalSearch(req, res, next) {
    try {
      const { q, type } = req.query;
      if (!q || q.length < 2) return res.json({ results: {}, counts: {} });
      const results = await searchRepo.globalSearch(q, type || null);
      const counts = results._counts || {};
      delete results._counts;
      res.json({ results, counts });
    } catch (err) { next(err); }
  }
}

module.exports = new SearchController();

const BaseRepository = require('./baseRepository');

class CollectionCenterRepository extends BaseRepository {
  constructor() {
    super('collection_centers');
  }
}

class PreprocessingCenterRepository extends BaseRepository {
  constructor() {
    super('preprocessing_centers');
  }
}

module.exports = { CollectionCenterRepository, PreprocessingCenterRepository };

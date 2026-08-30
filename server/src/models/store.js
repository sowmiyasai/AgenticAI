const { v4: uuidv4 } = require('uuid');

/**
 * Lightweight in-memory document collection supporting Mongoose-like chaining & queries
 */
class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.documents = new Map();
  }

  _clone(doc) {
    return JSON.parse(JSON.stringify(doc));
  }

  _matchesQuery(doc, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const key of Object.keys(query)) {
      const val = query[key];
      if (key === '_id' || key === 'id') {
        const docId = String(doc._id || doc.id);
        const targetId = String(val && val.$in ? '' : (val || ''));
        if (val && val.$in) {
          const list = val.$in.map(function(v) { return String(v); });
          if (!list.includes(docId)) return false;
        } else if (docId !== targetId) {
          return false;
        }
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (val.$regex) {
          const regex = new RegExp(val.$regex, val.$options || '');
          if (!regex.test(String(doc[key] || ''))) return false;
        } else if (val.$in) {
          if (!val.$in.includes(doc[key])) return false;
        } else if (val.$ne !== undefined) {
          if (doc[key] === val.$ne) return false;
        } else if (val.$gt !== undefined) {
          if (!(doc[key] > val.$gt)) return false;
        } else if (val.$gte !== undefined) {
          if (!(doc[key] >= val.$gte)) return false;
        } else if (val.$lt !== undefined) {
          if (!(doc[key] < val.$lt)) return false;
        } else if (val.$lte !== undefined) {
          if (!(doc[key] <= val.$lte)) return false;
        }
      } else if (doc[key] !== val) {
        return false;
      }
    }
    return true;
  }

  async create(data) {
    const doc = this._clone(data);
    if (!doc._id) {
      doc._id = uuidv4();
    }
    doc.id = doc._id;
    if (!doc.createdAt) doc.createdAt = new Date().toISOString();
    doc.updatedAt = new Date().toISOString();
    this.documents.set(doc._id, doc);
    return this._wrapDoc(doc);
  }

  _wrapDoc(doc) {
    if (!doc) return null;
    const cloned = this._clone(doc);
    const self = this;
    cloned.save = async function() {
      cloned.updatedAt = new Date().toISOString();
      self.documents.set(cloned._id, self._clone(cloned));
      return self._wrapDoc(cloned);
    };
    cloned.toObject = function() {
      return self._clone(cloned);
    };
    return cloned;
  }

  find(query = {}) {
    const self = this;
    let results = [];
    for (const doc of this.documents.values()) {
      if (this._matchesQuery(doc, query)) {
        results.push(this._clone(doc));
      }
    }

    let sortFn = null;
    let skipCount = 0;
    let limitCount = null;
    let selectedFields = null;

    const queryPromise = {
      sort(sortObj) {
        if (sortObj) {
          const keys = Object.keys(sortObj);
          sortFn = (a, b) => {
            for (const k of keys) {
              const dir = sortObj[k];
              const aVal = a[k];
              const bVal = b[k];
              if (aVal < bVal) return dir === -1 || dir === 'desc' ? 1 : -1;
              if (aVal > bVal) return dir === -1 || dir === 'desc' ? -1 : 1;
            }
            return 0;
          };
        }
        return queryPromise;
      },
      skip(n) {
        skipCount = n;
        return queryPromise;
      },
      limit(n) {
        limitCount = n;
        return queryPromise;
      },
      select(fields) {
        selectedFields = fields;
        return queryPromise;
      },
      lean() {
        return queryPromise;
      },
      async exec() {
        let res = results;
        if (sortFn) res.sort(sortFn);
        if (skipCount > 0) res = res.slice(skipCount);
        if (limitCount !== null) res = res.slice(0, limitCount);
        return res.map(function(d) { return self._wrapDoc(d); });
      },
      then(resolve, reject) {
        return this.exec().then(resolve, reject);
      },
      catch(reject) {
        return this.exec().catch(reject);
      }
    };

    return queryPromise;
  }

  async findOne(query = {}) {
    for (const doc of this.documents.values()) {
      if (this._matchesQuery(doc, query)) {
        return this._wrapDoc(doc);
      }
    }
    return null;
  }

  async findById(id) {
    if (!id) return null;
    const doc = this.documents.get(String(id));
    return doc ? this._wrapDoc(doc) : null;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const doc = this.documents.get(String(id));
    if (!doc) return null;

    const updateObj = update.$set ? Object.assign({}, update.$set) : Object.assign({}, update);
    delete updateObj._id;
    delete updateObj.id;

    if (update.$inc) {
      for (const k of Object.keys(update.$inc)) {
        updateObj[k] = (doc[k] || 0) + update.$inc[k];
      }
    }

    const updated = Object.assign({}, doc, updateObj, { updatedAt: new Date().toISOString() });
    this.documents.set(String(id), updated);
    return this._wrapDoc(updated);
  }

  async updateOne(query, update) {
    const doc = await this.findOne(query);
    if (!doc) return { modifiedCount: 0 };
    await this.findByIdAndUpdate(doc._id, update);
    return { modifiedCount: 1 };
  }

  async deleteOne(query) {
    const doc = await this.findOne(query);
    if (!doc) return { deletedCount: 0 };
    this.documents.delete(doc._id);
    return { deletedCount: 1 };
  }

  async deleteMany(query = {}) {
    let count = 0;
    for (const doc of Array.from(this.documents.values())) {
      if (this._matchesQuery(doc, query)) {
        this.documents.delete(doc._id);
        count++;
      }
    }
    return { deletedCount: count };
  }

  async countDocuments(query = {}) {
    let count = 0;
    for (const doc of this.documents.values()) {
      if (this._matchesQuery(doc, query)) count++;
    }
    return count;
  }
}

const memoryCollections = new Map();

function getMemoryCollection(name) {
  if (!memoryCollections.has(name)) {
    memoryCollections.set(name, new MemoryCollection(name));
  }
  return memoryCollections.get(name);
}

module.exports = {
  MemoryCollection,
  getMemoryCollection,
};

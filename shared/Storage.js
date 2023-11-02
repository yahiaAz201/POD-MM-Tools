class Store {
  constructor() {
    this.items = [];
  }

  add(object) {
    this.items.push(object);
  }

  get(query, options) {
    if (!query) return this.items;
    const items = this.items.filter((item) => {
      for (const key in query) {
        if (item[key] !== query[key]) {
          return false;
        }
        return true;
      }
    });

    if (options?.multi) return items;
    return items[0];
  }

  update(query, update, options) {
    const index = this.items.findIndex((item) => {
      for (const key in query) {
        if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    if (index == -1) return null;
    this.items[index] = { ...this.items[index], ...update };
    return this.items;
  }

  remove(query, options) {
    const index = this.items.findIndex((item) => {
      for (const key in query) {
        if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    if (index == -1) return null;
    this.items.splice(index, 1);
    return this.items;
  }
}

module.exports = Store;

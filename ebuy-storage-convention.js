

const EBUY_STORAGE = {
  keys: {
    users: 'ebuy_users',
    products: 'ebuy_products',
    categories: 'ebuy_categories',
    orders: 'ebuy_orders',
    banners: 'ebuy_banners',
    featured: 'ebuy_featured',
    adminSession: 'ebuy_admin_session',
    cart: 'ebuy_cart' 
  },

  /**
   * Récupère un tableau depuis le LocalStorage.
   * @param {string} key 
   * @returns {Array}
   */
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Enregistre un tableau dans le LocalStorage.
   * @param {string} key
   * @param {Array} data
   */
  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
};


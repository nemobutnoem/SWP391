const KEY = "swp_access_token";

export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      if (!token) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, token);
    } catch {
      // ignore
    }
  },
  clear() {
    this.set(null);
  },
};
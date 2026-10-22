const TOKEN_KEY = 'dfm.token';

const safely = (operation, fallback) => {
  try {
    return operation();
  } catch {
    return fallback;
  }
};

export const tokenStorage = {
  get: () => safely(() => window.localStorage.getItem(TOKEN_KEY), null),
  set: (token) => safely(() => window.localStorage.setItem(TOKEN_KEY, token)),
  clear: () => safely(() => window.localStorage.removeItem(TOKEN_KEY))
};

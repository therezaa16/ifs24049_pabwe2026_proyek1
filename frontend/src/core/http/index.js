import { API_BASE_URL } from '../config/env.js';
import { tokenStorage } from '../storage/token-storage.js';
import { createHttpClient } from './http-client.js';

let unauthorizedHandler = () => {};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const httpClient = createHttpClient({
  baseUrl: API_BASE_URL,
  getToken: () => tokenStorage.get(),
  onUnauthorized: () => unauthorizedHandler()
});

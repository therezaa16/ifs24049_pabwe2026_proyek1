import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { tokenStorage } from '@/core/storage/token-storage.js';
import { authApi } from '../infrastructure/auth.api.js';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(tokenStorage.get());
  const user = ref(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  const startSession = (data) => {
    token.value = data.token;
    user.value = data.user;
    tokenStorage.set(data.token);
  };

  const clearSession = () => {
    token.value = null;
    user.value = null;
    tokenStorage.clear();
  };

  const login = async (credentials) => startSession(await authApi.login(credentials));
  const register = async (payload) => startSession(await authApi.register(payload));

  const restoreSession = async () => {
    if (!token.value || user.value) return;
    try {
      user.value = (await authApi.me()).user;
    } catch {
      clearSession();
    }
  };

  const updateBudget = async (monthlyBudget) => {
    user.value = (await authApi.updateBudget(monthlyBudget)).user;
  };

  return { token, user, isAuthenticated, login, register, restoreSession, updateBudget, clearSession };
});

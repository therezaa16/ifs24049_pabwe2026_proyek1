import { httpClient } from '@/core/http/index.js';

export const authApi = {
  login: ({ email, password }) => httpClient.post('/auth/login', { email: email.trim(), password }),
  register: ({ name, email, password, monthlyBudget }) =>
    httpClient.post('/auth/register', {
      name: name.trim(),
      email: email.trim(),
      password,
      monthly_budget: monthlyBudget === '' ? 0 : Number(monthlyBudget)
    }),
  me: () => httpClient.get('/auth/me'),
  updateBudget: (monthlyBudget) => httpClient.patch('/auth/budget', { monthly_budget: Number(monthlyBudget) })
};

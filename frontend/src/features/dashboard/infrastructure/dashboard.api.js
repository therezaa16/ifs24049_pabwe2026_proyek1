import { httpClient } from '@/core/http/index.js';

export const dashboardApi = {
  summary: () => httpClient.get('/dashboard/summary')
};

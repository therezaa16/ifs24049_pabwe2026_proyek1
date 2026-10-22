import { httpClient } from '@/core/http/index.js';

export const transactionsApi = {
  list: () => httpClient.get('/transactions'),
  create: ({ type, title, amount, category, note, missionType }) =>
    httpClient.post('/transactions', {
      type,
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
      note: note.trim(),
      mission_type: type === 'keinginan' ? missionType : null
    }),
  cancel: (id) => httpClient.post(`/transactions/${id}/cancel`),
  remove: (id) => httpClient.delete(`/transactions/${id}`)
};

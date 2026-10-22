export const normalizeEmail = (email) => email.trim().toLowerCase();

export const toPublicUser = ({ id, name, email, monthly_budget, created_at }) => ({
  id,
  name,
  email,
  monthly_budget,
  created_at
});

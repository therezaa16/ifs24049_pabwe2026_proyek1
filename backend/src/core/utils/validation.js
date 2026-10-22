export const isNonBlankString = (value) => typeof value === 'string' && value.trim().length > 0;

export const toNumberOrNaN = (value) => {
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
  return isNumeric ? Number(value) : Number.NaN;
};

export const isPositiveInteger = (value) => {
  const number = toNumberOrNaN(value);
  return Number.isInteger(number) && number > 0;
};

export const isNonNegativeNumber = (value) => {
  const number = toNumberOrNaN(value);
  return Number.isFinite(number) && number >= 0;
};

export const hasErrors = (errors) => Object.keys(errors).length > 0;

export class ApiError extends Error {
  constructor(message, status = 0, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export const fieldErrorsOf = (error) =>
  error instanceof ApiError && error.errors && typeof error.errors === 'object' ? error.errors : {};

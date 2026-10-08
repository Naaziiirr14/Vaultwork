export const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

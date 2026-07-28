export function apiResponse<T>(statusCode: number, message: string, data: T | null = null, errorCode: string | null = null) {
  return {
    success: statusCode < 400,
    statusCode,
    message,
    data,
    error: errorCode ? {code: errorCode} : null,
  }
}

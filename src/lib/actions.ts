/**
 * Định nghĩa cấu trúc phản hồi chuẩn cho các Server Actions
 */

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  validationErrors?: Record<string, string[]>;
};

/**
 * Helper để tạo phản hồi thành công
 */
export function successResponse<T>(data: T, message?: string): ActionResult<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Helper để tạo phản hồi lỗi
 */
export function errorResponse(error: string, validationErrors?: Record<string, string[]>): ActionResult {
  return {
    success: false,
    error,
    validationErrors,
  };
}

export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Chưa đăng nhập") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Không có quyền thực hiện hành động này") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy dữ liệu") {
    super(message, 404);
  }
}

/** Dùng cho race-condition: 2 booster cùng claim 1 kèo, người sau sẽ nhận lỗi này */
export class ConflictError extends AppError {
  constructor(message = "Dữ liệu đã bị thay đổi, vui lòng thử lại") {
    super(message, 409);
  }
}

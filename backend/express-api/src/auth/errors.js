// Error class hierarchy (OOP: inheritance). Services throw these; the Express error
// handler turns them into HTTP responses, so business logic never touches `res`.

export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.expose = status < 500; // only client errors are safe to show
  }

  toJSON() {
    return { error: this.message, code: this.code };
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Not allowed') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

export class AccountLockedError extends AppError {
  constructor(lockedUntil) {
    const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60_000));
    super(`Too many failed attempts. Account locked for ${minutes} more minute(s).`, 423, 'LOCKED');
    this.lockedUntil = lockedUntil;
  }

  toJSON() {
    return { ...super.toJSON(), lockedUntil: this.lockedUntil };
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message, retryAfterSeconds) {
    super(message, 429, 'RATE_LIMITED');
    this.retryAfterSeconds = retryAfterSeconds;
  }

  toJSON() {
    return { ...super.toJSON(), retryAfterSeconds: this.retryAfterSeconds };
  }
}

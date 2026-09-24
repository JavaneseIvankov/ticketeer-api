import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class DomainException extends HttpException {
  public readonly isDomainError = true;

  constructor(
    public readonly code: string,
    public readonly detail: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, detail, status }, status);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
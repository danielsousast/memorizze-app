export class AppError<C extends string> extends Error {
  readonly code: C;

  constructor(code: C) {
    super(code);
    this.name = "AppError";
    this.code = code;
  }
}

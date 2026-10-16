export class UserFacingError extends Error {
  constructor(userMessage: string) {
    super(userMessage);
    this.name = 'UserFacingError';
  }
}

export const CONSUMED_REFRESH_TOKEN_REPOSITORY = Symbol(
  'CONSUMED_REFRESH_TOKEN_REPOSITORY',
);

export interface ConsumedRefreshTokenRepository {
  consume(data: {
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<boolean>;
}

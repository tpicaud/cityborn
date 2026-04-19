import type { ConfigService } from '@nestjs/config';

export const getJwtConstants = (configService: ConfigService) => ({
  jwt_access_secret: configService.get<string>('JWT_ACCESS_SECRET'),
  jwt_refresh_secret: configService.get<string>('JWT_REFRESH_SECRET'),
});

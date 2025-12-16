import { Request } from 'express';
import * as cookie from 'cookie';
import { Socket } from 'socket.io';

export function extractTokenFromHTTPHeader(
  request: Request,
): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}

export function extractAccessTokenFromWsClient(
  client: Socket,
): string | undefined {
  const cookies = client.handshake.headers.cookie;
  const auth = client.handshake.auth;

  if (cookies) {
    const parsedCookies = cookie.parse(cookies);
    return parsedCookies['access_token'];
  }

  if (auth) {
    return auth.access_token;
  }

  return undefined;
}

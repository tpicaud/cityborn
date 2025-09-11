import { Request } from 'express';
import * as cookie from 'cookie';

export function extractTokenFromHTTPHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
}

export function extractAccessTokenFromWsClient(client?: any): string | undefined {

    const cookies = client.handshake.headers.cookie;
    console.log(cookies);
    if (!cookies) return undefined;

    const parsedCookies = cookie.parse(cookies);
    console.log(parsedCookies)

    return parsedCookies['access_token'];
}

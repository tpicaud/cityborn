import { Request } from 'express';

export function extractTokenFromHTTPHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
}

export function extractTokenFromWsClient(client?: any): string | undefined {
    return client.handshake?.query?.authorization ?? undefined;
}
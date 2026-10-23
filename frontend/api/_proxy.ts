import type { IncomingMessage, ServerResponse } from 'node:http';

const MAX_BODY_SIZE = 16 * 1024;

type ProxyOptions = {
    methods: Array<'GET' | 'POST' | 'DELETE'>;
    backendPath: string;
};

const sendJson = (response: ServerResponse, status: number, body: { error: string }) => {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(body));
};

const readJsonBody = async (request: IncomingMessage): Promise<string | undefined> => {
    const contentLength = Number(request.headers['content-length'] ?? 0);
    if (contentLength > MAX_BODY_SIZE) {
        throw new Error('request body too large');
    }

    const chunks: Buffer[] = [];
    let received = 0;

    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        received += buffer.length;
        if (received > MAX_BODY_SIZE) {
            throw new Error('request body too large');
        }
        chunks.push(buffer);
    }

    return chunks.length === 0 ? undefined : Buffer.concat(chunks).toString('utf8');
};

export const forwardClinicRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    { methods, backendPath }: ProxyOptions
) => {
    const method = request.method as 'GET' | 'POST' | 'DELETE';
    if (!methods.includes(method)) {
        response.setHeader('Allow', methods.join(', '));
        return sendJson(response, 405, { error: 'method not allowed' });
    }

    const backendUrl = process.env.BACKEND_API_URL;
    const apiKey = process.env.BACKEND_API_KEY;

    if (!backendUrl || !apiKey) {
        return sendJson(response, 500, { error: 'booking service is not configured' });
    }

    try {
        const incomingUrl = new URL(request.url ?? '/', 'http://localhost');
        const targetUrl = new URL(backendPath, backendUrl);
        targetUrl.search = incomingUrl.search;

        const body = method === 'POST' ? await readJsonBody(request) : undefined;
        const idempotencyKey = request.headers['idempotency-key'];
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'X-API-Key': apiKey
        };

        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }
        if (method === 'POST' && typeof idempotencyKey === 'string') {
            headers['Idempotency-Key'] = idempotencyKey;
        }

        const backendResponse = await fetch(targetUrl, { method, headers, body });
        const retryAfter = backendResponse.headers.get('retry-after');
        const contentType = backendResponse.headers.get('content-type');

        response.statusCode = backendResponse.status;
        response.setHeader('Content-Type', contentType ?? 'application/json; charset=utf-8');
        if (retryAfter) {
            response.setHeader('Retry-After', retryAfter);
        }
        response.end(await backendResponse.text());
    } catch (error) {
        if (error instanceof Error && error.message === 'request body too large') {
            return sendJson(response, 413, { error: 'request body too large' });
        }
        return sendJson(response, 502, { error: 'booking service is unavailable' });
    }
};

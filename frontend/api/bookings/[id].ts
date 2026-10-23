import type { IncomingMessage, ServerResponse } from 'node:http';
import { forwardClinicRequest } from '../_proxy.js';

export default function handler(request: IncomingMessage, response: ServerResponse) {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const parts = pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];

    if (!id) {
        response.statusCode = 400;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({ error: 'booking ID is required' }));
        return;
    }

    return forwardClinicRequest(request, response, {
        methods: ['GET', 'DELETE'],
        backendPath: `/bookings/${encodeURIComponent(id)}`
    });
}

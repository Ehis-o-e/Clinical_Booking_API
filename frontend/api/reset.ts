import type { IncomingMessage, ServerResponse } from 'node:http';
import { forwardClinicRequest } from './_proxy.js';

export default function handler(request: IncomingMessage, response: ServerResponse) {
    return forwardClinicRequest(request, response, { methods: ['POST'], backendPath: '/reset' });
}

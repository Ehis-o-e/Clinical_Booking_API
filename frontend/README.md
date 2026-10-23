# Clinical Booking App frontend

A React, TypeScript, Vite, and Tailwind CSS v4 booking interface for the Koya Clinic API.

## Local setup

1. Copy `.env.example` to `.env` and set the backend URL and API key:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Start the backend, then run the frontend:

   ```powershell
   npm install
   npm run dev
   ```

The Vite development server proxies only `GET /api/slots` and `POST /api/bookings`. It reads `BACKEND_API_URL` and `BACKEND_API_KEY` from the frontend's server-only `.env`; neither is sent to browser code. Do not use a `VITE_` prefix for either variable.

The **Manage test slots** form adds one or more slots together. Submitting it replaces all backend slots and bookings.

## Production proxy

The `api` files are Vercel-compatible server functions. They forward clinic requests, attach `X-API-Key` from `BACKEND_API_KEY`, forward `Idempotency-Key` for bookings, and preserve backend status codes and `Retry-After`.

Deploy the Vite application to Vercel (framework: Vite) and configure these server-side environment variables in the deployment settings:

```text
BACKEND_API_URL=https://your-clinic-api.example
BACKEND_API_KEY=your-backend-secret
```

The browser uses same-origin `/api` routes, including `POST /api/reset` for assessment setup.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Design notes

- One page keeps booking fast and avoids an unnecessary router.
- A generated idempotency key is retained for a retry of unchanged booking details, but regenerated when the selected slot, name, or email changes.
- The backend remains authoritative for availability, validation, rate limits, and final booking confirmation.

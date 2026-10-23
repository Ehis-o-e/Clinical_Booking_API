import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const mockFetch = vi.fn<typeof fetch>();

beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockFetch.mockReset();
});

describe('Clinical Booking API tester', () => {
    it('sends an exact provider filter and displays slots in a table', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ slots: [{ id: 's1', provider: 'Dr Ade', start: '2030-01-01T09:00:00Z', end: '2030-01-01T09:30:00Z', available: true }] }));
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Slots' }));
        fireEvent.change(screen.getByLabelText('Provider (optional)'), { target: { value: 'Dr Ade' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send GET /slots' }));
        await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/slots?provider=Dr+Ade', undefined));
        expect(await screen.findByText('s1')).toBeInTheDocument();
    });

    it('replaces all-slots results when an exact provider search has no matches', async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({ slots: [{ id: 's1', provider: 'Dr Ade', start: '2030-01-01T09:00:00Z', end: '2030-01-01T09:30:00Z', available: true }] }))
            .mockResolvedValueOnce(jsonResponse({ slots: [] }));
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Slots' }));
        fireEvent.click(screen.getByRole('button', { name: 'Send GET /slots' }));
        await screen.findByText('s1');
        fireEvent.change(screen.getByLabelText('Provider (optional)'), { target: { value: 'Dr Nobody' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send GET /slots' }));
        expect(await screen.findByText('No slots found for that provider.')).toBeInTheDocument();
        expect(screen.queryByText('s1')).not.toBeInTheDocument();
    });

    it('adds and reuses an automatic Idempotency-Key for an unchanged booking', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'b1', slot_id: 's1', name: 'Ada', email: 'ada@example.com', status: 'confirmed', created_at: '2030-01-01T09:00:00Z' }, 201));
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Create booking' }));
        fireEvent.change(screen.getByLabelText('slot_id'), { target: { value: 's1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send POST /bookings' }));
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByRole('button', { name: 'Send POST /bookings' }));
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
        const firstHeaders = (mockFetch.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>;
        const secondHeaders = (mockFetch.mock.calls[1]?.[1] as RequestInit).headers as Record<string, string>;
        expect(firstHeaders['Idempotency-Key']).toBeTruthy();
        expect(secondHeaders['Idempotency-Key']).toBe(firstHeaders['Idempotency-Key']);
    });

    it('cancels selected booking table rows', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockFetch.mockImplementation((input, options) => {
            if (String(input).startsWith('/api/bookings?')) {
                return Promise.resolve(jsonResponse({ bookings: [{ id: 'b1', slot_id: 's1', name: 'Ada', email: 'ada@example.com', status: 'confirmed', created_at: '2030-01-01T09:00:00Z' }], next_cursor: null }));
            }
            if (options?.method === 'DELETE') {
                return Promise.resolve(jsonResponse({ id: 'b1', slot_id: 's1', name: 'Ada', email: 'ada@example.com', status: 'cancelled', created_at: '2030-01-01T10:00:00Z' }));
            }
            return Promise.resolve(jsonResponse({ error: 'unexpected request' }, 500));
        });
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Bookings' }));
        fireEvent.change(screen.getByLabelText('email'), { target: { value: 'ada@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send GET /bookings' }));
        await screen.findByText('b1');
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select b1' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel selected (1)' }));
        await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/bookings/b1', { method: 'DELETE' }));
        expect(await screen.findByText('cancelled')).toBeInTheDocument();
    });

    it('cancels one booking from the Cancel booking screen', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'b1', slot_id: 's1', name: 'Ada', email: 'ada@example.com', status: 'cancelled', created_at: '2030-01-01T10:00:00Z' }));
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));
        fireEvent.change(screen.getByLabelText('Booking ID'), { target: { value: 'b1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send DELETE /bookings/:id' }));
        await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/bookings/b1', { method: 'DELETE' }));
        expect(await screen.findByLabelText('API response')).toHaveTextContent('"status": "cancelled"');
    });

    it('starts from the first page whenever Send GET /bookings is used again', async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({ bookings: [{ id: 'b1', slot_id: 's1', name: 'Ada', email: 'ada@example.com', status: 'confirmed', created_at: '2030-01-01T09:00:00Z' }], next_cursor: 'page-two' }))
            .mockResolvedValueOnce(jsonResponse({ bookings: [{ id: 'b2', slot_id: 's2', name: 'Ada', email: 'ada@example.com', status: 'confirmed', created_at: '2030-01-01T10:00:00Z' }], next_cursor: null }))
            .mockResolvedValueOnce(jsonResponse({ bookings: [{ id: 'b1', slot_id: 's1', name: 'Ada', email: 'ada@example.com', status: 'confirmed', created_at: '2030-01-01T09:00:00Z' }], next_cursor: 'page-two' }));
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Bookings' }));
        fireEvent.change(screen.getByLabelText('email'), { target: { value: 'ada@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send GET /bookings' }));
        await screen.findByText('b1');
        fireEvent.click(screen.getByRole('button', { name: 'Use next_cursor' }));
        await screen.findByText('b2');
        fireEvent.click(screen.getByRole('button', { name: 'Send GET /bookings' }));
        await screen.findByText('b1');
        expect(mockFetch.mock.calls[2]?.[0]).toBe('/api/bookings?email=ada%40example.com&limit=10');
    });
});

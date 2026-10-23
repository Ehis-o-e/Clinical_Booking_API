type ApiResultProps = {
    status: number | undefined;
    body: unknown;
    retryAfter?: number;
};

export function ApiResult({ status, body, retryAfter }: ApiResultProps) {
    if (!status) {
        return null;
    }

    return <section className="mt-6 rounded-xl border border-slate-200 bg-slate-950 p-4 text-sm text-slate-100" aria-label="API response"><p className="font-bold">HTTP {status}{retryAfter ? ` · Retry-After: ${retryAfter}s` : ''}</p><pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-emerald-200">{JSON.stringify(body, null, 2)}</pre></section>;
}

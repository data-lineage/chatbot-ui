const getBase = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const authHeaders = () => {
  const token = (process.env.NEXT_PUBLIC_ACCESS_TOKEN || '').trim();
  
  if (process.env.NODE_ENV !== 'production') {
    if (!token) {
      console.warn('[AyurAgent] NEXT_PUBLIC_ACCESS_TOKEN is empty. Set it in .env.local');
    } else if (token.includes('your_jwt_here')) {
      console.error('[AyurAgent] NEXT_PUBLIC_ACCESS_TOKEN is still using the placeholder value! Please restart `pnpm dev` after updating .env.local.');
    }
  }

  return { Authorization: `Bearer ${token}` };
};

export async function startQuery(payload: {
  query?: string;
  catalog_name?: string;
  choice?: string;
}) {
  const form = new FormData();
  if (payload.query)        form.append('query', payload.query);
  if (payload.catalog_name) form.append('catalog_name', payload.catalog_name);
  if (payload.choice)       form.append('choice', payload.choice);

  const res = await fetch(`${getBase()}/query`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed?.detail?.description) {
        throw new Error(parsed.detail.description);
      }
      if (typeof parsed?.detail === 'string') {
        throw new Error(parsed.detail);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== text) {
        throw err;
      }
    }
    throw new Error(text);
  }

  return res.json();
}

export async function pollStatus() {
  const res = await fetch(`${getBase()}/query`, { headers: authHeaders() });

  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed?.detail?.description) {
        throw new Error(parsed.detail.description);
      }
      if (typeof parsed?.detail === 'string') {
        throw new Error(parsed.detail);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== text) {
        throw err;
      }
    }
    throw new Error(text);
  }

  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    return (await fetch(`${getBase()}/health`)).ok;
  } catch {
    return false;
  }
}

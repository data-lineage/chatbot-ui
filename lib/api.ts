import type { SchemaData } from './types';

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

export async function transcribeAudio(
  audioBlob: Blob,
  languageCode = 'unknown'
): Promise<{ transcript: string; language_code?: string; request_id?: string }> {
  const cleanType = audioBlob.type.split(';')[0].trim() || 'audio/webm';
  const cleanBlob = new Blob([audioBlob], { type: cleanType });

  const form = new FormData();
  form.append('file', cleanBlob, 'recording.webm');
  form.append('language_code', languageCode);
  form.append('model', 'saaras:v4');
  form.append('mode', 'transcribe');

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    body: form,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to transcribe audio.');
  }

  return data;
}

export async function fetchSchema(
  catalogName?: string,
  forceRefresh = false
): Promise<SchemaData> {
  const params = new URLSearchParams();
  if (catalogName) params.set('catalog_name', catalogName);
  if (forceRefresh) params.set('force_refresh', 'true');

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${getBase()}/schema${query}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed?.detail) {
        throw new Error(
          typeof parsed.detail === 'string'
            ? parsed.detail
            : JSON.stringify(parsed.detail)
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== text) {
        throw err;
      }
    }
    throw new Error(`Schema fetch failed: ${res.status} ${text}`);
  }

  return res.json();
}

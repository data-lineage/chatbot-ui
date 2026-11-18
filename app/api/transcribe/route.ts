import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mpeg3',
  'audio/x-mpeg-3',
  'audio/x-mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/pcm_s16le',
  'audio/l16',
  'audio/raw',
  'application/octet-stream',
  'audio/aac',
  'audio/x-aac',
  'audio/aiff',
  'audio/x-aiff',
  'audio/ogg',
  'audio/opus',
  'audio/flac',
  'audio/x-flac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/amr',
  'audio/x-ms-wma',
  'audio/webm',
  'video/webm',
]);

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SARVAM_API_KEY || process.env.NEXT_PUBLIC_SARVAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'SARVAM_API_KEY is not configured. Please set SARVAM_API_KEY in your .env.local file.',
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('file');
    const languageCode = (formData.get('language_code') as string) || 'unknown';
    const model = (formData.get('model') as string) || 'saaras:v4';
    const mode = (formData.get('mode') as string) || 'transcribe';

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'No audio file provided in request.' },
        { status: 400 }
      );
    }

    // Strip codec parameters (e.g. "audio/webm;codecs=opus" -> "audio/webm")
    let rawMime = audioFile.type.split(';')[0].trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(rawMime)) {
      rawMime = 'audio/webm';
    }

    // Reconstruct File with sanitized MIME type
    const arrayBuffer = await audioFile.arrayBuffer();
    const cleanFile = new File([arrayBuffer], 'recording.webm', { type: rawMime });

    // Prepare multipart payload for Sarvam AI
    const sarvamFormData = new FormData();
    sarvamFormData.append('file', cleanFile, 'recording.webm');
    sarvamFormData.append('model', model);
    sarvamFormData.append('language_code', languageCode);
    sarvamFormData.append('mode', mode);

    const sarvamRes = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey.trim(),
      },
      body: sarvamFormData,
    });

    if (!sarvamRes.ok) {
      const errorText = await sarvamRes.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.error?.message ||
          errorJson.message ||
          errorJson.detail ||
          errorText;
      } catch {}

      return NextResponse.json(
        { error: `Sarvam AI STT error: ${errorMessage}` },
        { status: sarvamRes.status }
      );
    }

    const data = await sarvamRes.json();
    return NextResponse.json({
      transcript: data.transcript || '',
      language_code: data.language_code || languageCode,
      request_id: data.request_id || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { ZodError } from 'zod';
import { MAX_BODY_BYTES } from './post-validation';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json'
  ) {
    throw new HttpError(415, 'Send your post as JSON.');
  }
  if (!request.body) throw new HttpError(400, 'Your post is missing.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new HttpError(413, 'Your post is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'The request contains invalid JSON.');
  }
}

export async function handleRequest(action: () => Response | Promise<Response>) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? 'Check the information you entered.' },
        { status: 400 }
      );
    }
    console.error('Post request failed:', error);
    return Response.json(
      { error: 'Could not complete your request. Please try again.' },
      { status: 500 }
    );
  }
}

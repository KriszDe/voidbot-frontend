// src/lib/api.ts
export const API_URL = import.meta.env.VITE_API_URL as string;

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Discord hibák általában err.error / err.error_description alatt jönnek
    const msg =
      (payload && (payload.error_description || payload.error || payload.details?.error_description || payload.details?.error)) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return payload as T;
}

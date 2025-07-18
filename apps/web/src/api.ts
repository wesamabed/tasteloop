export const API_BASE = import.meta.env.VITE_API_BASE as string;

/**
 * POST /seed  – returns the “chosen” seeds from the server
 */
export async function seed(seedsText: string) {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seedsText }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<{ chosen: unknown[] }>;
}

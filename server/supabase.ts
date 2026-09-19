import { ENV } from "./_core/env";

const SUPABASE_URL = ENV.supabaseUrl.replace(/\/$/, "");

function assertConfigured() {
  if (!SUPABASE_URL || !ENV.supabaseServiceRoleKey) {
    throw new Error("Supabase server configuration is missing");
  }
}

export async function supabaseRequest<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  assertConfigured();
  const headers = new Headers(init.headers);
  headers.set("apikey", ENV.supabaseServiceRoleKey);
  headers.set("Authorization", `Bearer ${ENV.supabaseServiceRoleKey}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${body}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function supabaseRpcUrl(name: string) {
  assertConfigured();
  return `${SUPABASE_URL}/rest/v1/rpc/${name}`;
}

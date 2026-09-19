import { describe, expect, it } from "vitest";

describe("Supabase secret boundaries", () => {
  it("can reach the Supabase Auth settings endpoint with the publishable key", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    expect(url).toBeTruthy();
    expect(key).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      },
    });

    expect(response.ok).toBe(true);
  });

  it("keeps the service-role key server-only", () => {
    expect(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
  });
});

/**
 * Client-side submission rate-limiter using localStorage timestamps
 * to guard form submissions against accidental double-submits and spam.
 */
export function checkRateLimit(actionKey: string, cooldownMs = 15000): { allowed: boolean; waitSeconds: number } {
  try {
    const storageKey = `artworn_rl_${actionKey}`;
    const lastStr = localStorage.getItem(storageKey);
    const now = Date.now();
    if (lastStr) {
      const last = Number(lastStr);
      if (!Number.isNaN(last) && now - last < cooldownMs) {
        return {
          allowed: false,
          waitSeconds: Math.ceil((cooldownMs - (now - last)) / 1000),
        };
      }
    }
    localStorage.setItem(storageKey, String(now));
    return { allowed: true, waitSeconds: 0 };
  } catch {
    return { allowed: true, waitSeconds: 0 };
  }
}

// Resolves the STOMP WebSocket URL. In production VITE_API_BASE_URL points at
// the service; in dev it's unset and Vite proxies "/ws" to :8180.
export function resolveWsUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (base) {
    const url = new URL(base);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    return url.toString();
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

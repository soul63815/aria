// Register Aria's offline service worker — only on real installs / standalone,
// never inside the Lovable preview iframe (which would cache stale builds).

export function registerAriaSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const host = window.location.hostname;
  const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com") || host === "localhost";

  if (inIframe || isPreview) {
    // Defensive cleanup so previews never get pinned to an old SW.
    navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister())).catch(() => undefined);
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
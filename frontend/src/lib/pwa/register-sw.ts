/**
 * Service Worker registration and PWA update handler
 */

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for updates
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New update available
              dispatchUpdateNotification();
            }
          });
        });
      })
      .catch((err) => {
        console.warn("ORCA Service Worker registration failed:", err);
      });
  });
}

export function clearServiceWorkerCaches() {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CLEAR_API_CACHE",
    });
  }
}

function dispatchUpdateNotification() {
  const event = new CustomEvent("orca:sw-update-available");
  window.dispatchEvent(event);
}

/**
 * Reconnection listener that pings /api/v1/health/live before declaring online
 */
export function setupReconnectionDetector(onOnline?: () => void) {
  if (typeof window === "undefined") return;

  window.addEventListener("online", async () => {
    try {
      const res = await fetch("/api/v1/health/live/", {
        method: "GET",
        cache: "no-store",
      });
      if (res.ok) {
        if (onOnline) onOnline();
      }
    } catch {
      // Still unreachable despite browser network event
    }
  });
}

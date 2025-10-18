// Simple GA4 loader and event tracker
// Set VITE_GA_ID in your .env (e.g., VITE_GA_ID=G-XXXXXXX)

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function initAnalytics() {
  const id = import.meta.env.VITE_GA_ID as string | undefined;
  if (!id) return;
  if (window.gtag) return;

  // Inject GA4 script
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(){ window.dataLayer.push(arguments as any); } as any;
  window.gtag('js', new Date());
  window.gtag('config', id);
}

export function trackEvent(name: string, params?: Record<string, any>) {
  const id = import.meta.env.VITE_GA_ID as string | undefined;
  if (!id || !window.gtag) return;
  window.gtag('event', name, params || {});
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          console.log('[SW] ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('[SW] ServiceWorker registration failed: ', err);
        });
    });
  }
}
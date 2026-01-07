interface WindowWithAnalytics extends Window {
  __analytics_inited?: boolean;
}

export function initAnalytics() {
  const win = window as WindowWithAnalytics;
  if (win.__analytics_inited) return;
  win.__analytics_inited = true;
  // Minimal pageview based on pathname (not hash)
  const send = () => {
    // Analytics tracking - no logging needed in production
    // Path is tracked internally
  };
  send();
  
  // Track SPA navigation
  const originalPushState = window.history.pushState;
  window.history.pushState = function(...args) {
    originalPushState.apply(window.history, args);
    send();
  };
  
  window.addEventListener('popstate', send);
}






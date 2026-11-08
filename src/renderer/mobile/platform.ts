/**
 * Platform helpers for the shared renderer.
 *
 * `isMobileApp()` is synchronous on purpose: `installMobileApi()` sets the flag
 * before React renders, so components can use it during the first paint without
 * waiting on an async IPC round trip.
 */
export function isMobileApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__backlyMobile;
}

export function isDesktopApp(): boolean {
  return !isMobileApp();
}

declare module 'body-scroll-lock' {
  export function disableBodyScroll(targetElement: HTMLElement, options?: object): void
  export function enableBodyScroll(targetElement: HTMLElement): void
  export function clearAllBodyScrollLocks(): void
}

export function isDevMode(): boolean {
  return !!(import.meta as unknown as { env?: { DEV?: boolean } })?.env?.DEV;
}

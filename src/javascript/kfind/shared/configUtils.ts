/**
 * Accessors for kFind's runtime configuration.
 * Values are populated server-side by kFind.jsp into window.contextJsParameters.kfind
 * and fall back to sensible defaults when absent.
 */

type KFindConfig = NonNullable<typeof window.contextJsParameters.kfind>;
type KFindKey = keyof KFindConfig;

const cfg = () => window.contextJsParameters.kfind;

export function getMinSearchChars(): number {
  return cfg()?.minSearchChars ?? 3;
}

export function getDebounceDelay(): number {
  return cfg()?.jcrFindDelayInTypingToLaunchSearch ?? 300;
}

export function getDefaultDisplayedResults(): number {
  return cfg()?.defaultDisplayedResults ?? 5;
}

export function isDriverEnabled(key: KFindKey): boolean {
  return cfg()?.[key] !== false;
}

export function getDriverMaxResults(key: KFindKey, fallback: number): number {
  return (cfg()?.[key] as number | undefined) ?? fallback;
}

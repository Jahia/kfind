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

// TODO: Likely overkill to have such a useless utlity method
export function isProviderEnabled(key: KFindKey): boolean {
  return cfg()?.[key] !== false;
}

// TODO: Likely overkill to have such a useless utility method
export function getProviderMaxResults(key: KFindKey, fallback: number): number {
  return (cfg()?.[key] as number | undefined) ?? fallback;
}

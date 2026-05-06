import { AsyncLocalStorage } from "node:async_hooks"

export const REQUIRED_STRAVA_SCOPES = [
  "activity:read_all",
  "profile:read_all",
  "activity:write",
] as const

const callbackScopeStorage = new AsyncLocalStorage<string | null>()

export function getScopesFromString(scope: string | null | undefined): string[] {
  if (!scope) return []

  return Array.from(
    new Set(
      scope
        .split(/[,\s]+/)
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  )
}

export function normalizeScopeString(
  scope: string | null | undefined
): string | null {
  const scopes = getScopesFromString(scope)
  return scopes.length > 0 ? scopes.join(",") : null
}

export function validateStravaScope(scope: string | null | undefined) {
  const grantedScopes = getScopesFromString(scope)
  const missingScopes = REQUIRED_STRAVA_SCOPES.filter(
    (requiredScope) => !grantedScopes.includes(requiredScope)
  )

  return { grantedScopes, missingScopes }
}

export function withCallbackScope<T>(
  scope: string | null | undefined,
  callback: () => T
): T {
  return callbackScopeStorage.run(normalizeScopeString(scope), callback)
}

export function getStoredCallbackScope(): string | null {
  return callbackScopeStorage.getStore() ?? null
}

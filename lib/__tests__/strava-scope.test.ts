import { describe, expect, it } from "vitest"

import {
  getStoredCallbackScope,
  normalizeScopeString,
  validateStravaScope,
  withCallbackScope,
} from "@/lib/strava-scope"

describe("strava scope helpers", () => {
  it("normalizes comma and space separated scopes", () => {
    expect(
      normalizeScopeString(
        "read activity:read_all, profile:read_all activity:write"
      )
    ).toBe("read,activity:read_all,profile:read_all,activity:write")
  })

  it("detects missing required scopes", () => {
    expect(validateStravaScope("read,activity:read_all,profile:read_all")).toEqual({
        grantedScopes: ["read", "activity:read_all", "profile:read_all"],
        missingScopes: ["activity:write"],
      })
  })

  it("keeps callback scope isolated per request context", async () => {
    const [firstScope, secondScope] = await Promise.all([
      withCallbackScope("read,activity:read_all", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return getStoredCallbackScope()
      }),
      withCallbackScope("read,profile:read_all", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return getStoredCallbackScope()
      }),
    ])

    expect(firstScope).toBe("read,activity:read_all")
    expect(secondScope).toBe("read,profile:read_all")
    expect(getStoredCallbackScope()).toBeNull()
  })
})

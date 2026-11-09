import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  config: { callbacks: {} as Record<string, (...args: never[]) => unknown> },
}));

vi.mock("next-auth", () => ({
  default: (config: typeof mocks.config) => {
    mocks.config = config;
    return { auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() };
  },
}));
vi.mock("@/lib/db", () => ({ db: { account: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/custom-prisma-adapter", () => ({ CustomPrismaAdapter: vi.fn() }));
vi.mock("@/lib/slack-notifications", () => ({ notifyNewUser: vi.fn(), notifyStravaAuthSuccess: vi.fn() }));

describe("paused authentication", () => {
  beforeEach(async () => {
    vi.resetModules();
    mocks.findUnique.mockReset();
    process.env.DATABASE_URL = "postgresql://localhost/test";
    await import("@/auth");
  });

  it("allows an existing linked Google account to sign in", async () => {
    mocks.findUnique.mockResolvedValue({ userId: "existing" });
    const result = await mocks.config.callbacks.signIn({ account: { provider: "google", providerAccountId: "123" }, user: {} } as never);
    expect(result).toBe(true);
  });

  it("rejects new Google accounts before user creation", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const result = await mocks.config.callbacks.signIn({ account: { provider: "google", providerAccountId: "new" }, user: {} } as never);
    expect(result).toBe("/auth/error?reason=signup-paused");
  });

  it("rejects an in-flight Strava authorization", async () => {
    const result = await mocks.config.callbacks.signIn({ account: { provider: "strava" }, user: {} } as never);
    expect(result).toBe("/auth/error?reason=strava-paused");
  });
});

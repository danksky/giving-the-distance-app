import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const {
  mockAuth,
  mockUserFindUnique,
  mockActivityFindMany,
  mockActivityCount,
  mockRedirect,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockActivityFindMany: vi.fn(),
  mockActivityCount: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockUserFindUnique,
    },
    activity: {
      findMany: mockActivityFindMany,
      count: mockActivityCount,
    },
  },
}));

vi.mock("@/components/Navbar", () => ({
  default: function Navbar() {
    return <div>Navbar</div>;
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/link", () => ({
  default: function Link({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

import ActivitiesPage from "./page";

function createActivity(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `activity-${index}`,
    shortcode: `A${String(index).padStart(4, "0")}`,
    name: `Activity ${index}`,
    type: "Run",
    distanceMeters: 5000,
    movingTimeSeconds: 1800,
    totalElevationGain: 50,
    startDateLocal: new Date(`2026-03-${String((index % 28) + 1).padStart(2, "0")}T12:00:00Z`),
    deletedAt: null,
    ...overrides,
  };
}

describe("ActivitiesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        email: "test@example.com",
      },
    });

    mockUserFindUnique.mockResolvedValue({
      id: "user-1",
      accounts: [{ provider: "strava" }],
    });
  });

  it("hides pagination controls when there is only one page", async () => {
    mockActivityFindMany
      .mockResolvedValueOnce([{ type: "Run" }])
      .mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, index) => createActivity(index))
      );
    mockActivityCount.mockResolvedValue(10);

    render(
      await ActivitiesPage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("renders next and previous links when multiple pages exist", async () => {
    mockActivityFindMany
      .mockResolvedValueOnce([{ type: "Run" }])
      .mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, index) => createActivity(index))
      );
    mockActivityCount.mockResolvedValue(25);

    render(
      await ActivitiesPage({
        searchParams: Promise.resolve({ page: "2", sort: "date", dir: "desc" }),
      })
    );

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Previous" })
        .every(
          (link) =>
            link.getAttribute("href") === "/activities?page=1&sort=date&dir=desc"
        )
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: "Next" })
        .every(
          (link) =>
            link.getAttribute("href") === "/activities?page=3&sort=date&dir=desc"
        )
    ).toBe(true);
  });

  it("preserves the selected type filter in sort links", async () => {
    mockActivityFindMany
      .mockResolvedValueOnce([{ type: "Run" }, { type: "Workout" }])
      .mockResolvedValueOnce(Array.from({ length: 5 }, (_, index) => createActivity(index)));
    mockActivityCount.mockResolvedValue(5);

    render(
      await ActivitiesPage({
        searchParams: Promise.resolve({ type: "Run", sort: "date", dir: "desc" }),
      })
    );

    expect(screen.getByRole("link", { name: /date/i })).toHaveAttribute(
      "href",
      "/activities?page=1&sort=date&dir=asc&type=Run"
    );
  });

  it("uses the activity shortcode for detail links", async () => {
    mockActivityFindMany
      .mockResolvedValueOnce([{ type: "Run" }])
      .mockResolvedValueOnce([createActivity(1)]);
    mockActivityCount.mockResolvedValue(1);

    render(
      await ActivitiesPage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByRole("link", { name: "Activity 1" })).toHaveAttribute(
      "href",
      "/activities/A0001"
    );
  });
});

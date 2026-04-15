import { describe, expect, it } from "vitest";
import { searchCharities } from "@/lib/charity-search";

const charities = [
  {
    id: "unicef",
    name: "UNICEF",
    fullName: "United Nations Children's Fund",
    description:
      "Supporting children's rights, survival, development, and protection worldwide.",
    category: "International Peace, Security, and Affairs",
    charityNavigatorScore: 93,
    isDefault: true,
  },
  {
    id: "khan-academy",
    name: "Khan Academy",
    fullName: "Khan Academy",
    description:
      "Providing free, world-class educational resources for learners, teachers, and families everywhere.",
    category: "Educational Services and Schools",
    charityNavigatorScore: 0,
    isDefault: false,
  },
  {
    id: "charity-water",
    name: "charity: water",
    fullName: "charity: water",
    description:
      "Funding clean and safe water projects for communities around the world through local partners.",
    category: "Development and Relief Services",
    charityNavigatorScore: 0,
    isDefault: false,
  },
  {
    id: "world-central-kitchen",
    name: "World Central Kitchen",
    fullName: "World Central Kitchen",
    description:
      "Providing fresh meals to communities impacted by disasters, conflict, and humanitarian crises.",
    category: "Food Banks, Food, and Nutrition Programs",
    charityNavigatorScore: 0,
    isDefault: false,
  },
  {
    id: "world-wildlife-fund",
    name: "World Wildlife Fund",
    fullName: "World Wildlife Fund (WWF)",
    description:
      "Conserving nature and reducing the most pressing threats to the diversity of life on Earth.",
    category: "Wildlife Conservation",
    charityNavigatorScore: 99,
    isDefault: false,
  },
];

describe("searchCharities", () => {
  it("prioritizes name matches ahead of description-only matches", () => {
    expect(searchCharities(charities, "world").map((charity) => charity.id)).toEqual([
      "world-wildlife-fund",
      "world-central-kitchen",
      "unicef",
      "charity-water",
      "khan-academy",
    ]);
  });

  it("keeps strong multi-word matches at the top", () => {
    expect(
      searchCharities(charities, "world wildlife").map((charity) => charity.id)
    ).toEqual(["world-wildlife-fund"]);
  });

  it("returns the original list when the query is empty", () => {
    expect(searchCharities(charities, "   ")).toEqual(charities);
  });
});

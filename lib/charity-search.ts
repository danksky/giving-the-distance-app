export interface SearchableCharity {
  id: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  charityNavigatorScore: number;
  isDefault: boolean;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesWordStart(haystack: string, needle: string) {
  return new RegExp(`\\b${escapeRegExp(needle)}`).test(haystack);
}

function scoreField(value: string, query: string, tokens: string[]) {
  const normalizedValue = normalize(value);

  if (!normalizedValue) {
    return 0;
  }

  let score = 0;

  if (normalizedValue === query) {
    score += 1000;
  }

  if (normalizedValue.startsWith(query)) {
    score += 700;
  }

  if (includesWordStart(normalizedValue, query)) {
    score += 500;
  }

  if (normalizedValue.includes(query)) {
    score += 250;
  }

  if (
    tokens.length > 1 &&
    tokens.every((token) => normalizedValue.includes(token))
  ) {
    score += 300;
  }

  return score;
}

function getCharitySearchScore(charity: SearchableCharity, rawQuery: string) {
  const query = normalize(rawQuery);

  if (!query) {
    return 0;
  }

  const tokens = query.split(/\s+/).filter(Boolean);

  return (
    scoreField(charity.name, query, tokens) * 5 +
    scoreField(charity.fullName, query, tokens) * 4 +
    scoreField(charity.category, query, tokens) * 2 +
    scoreField(charity.description, query, tokens)
  );
}

export function searchCharities<T extends SearchableCharity>(
  charities: T[],
  rawQuery: string
) {
  const query = normalize(rawQuery);

  if (!query) {
    return charities;
  }

  return charities
    .map((charity) => ({
      charity,
      score: getCharitySearchScore(charity, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.charity.isDefault !== b.charity.isDefault) {
        return a.charity.isDefault ? -1 : 1;
      }

      if (
        a.charity.charityNavigatorScore !== b.charity.charityNavigatorScore
      ) {
        return b.charity.charityNavigatorScore - a.charity.charityNavigatorScore;
      }

      return a.charity.name.localeCompare(b.charity.name);
    })
    .map((entry) => entry.charity);
}

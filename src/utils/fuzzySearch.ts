/**
 * Fuzzy Search Utility
 * Provides fuzzy matching and scoring for command palette search
 */

export interface FuzzyMatch {
  score: number;
  matches: number[];
  isMatch: boolean;
}

/**
 * Calculate fuzzy match score between query and target string
 * Higher score = better match
 * 
 * @param query - Search query
 * @param target - Target string to match against
 * @returns Match result with score and character positions
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatch {
  if (!query) {
    return { score: 1, matches: [], isMatch: true };
  }

  query = query.toLowerCase();
  target = target.toLowerCase();

  let score = 0;
  let queryIndex = 0;
  let targetIndex = 0;
  const matches: number[] = [];
  let consecutiveMatches = 0;
  let lastMatchIndex = -1;

  while (queryIndex < query.length && targetIndex < target.length) {
    const queryChar = query[queryIndex];
    const targetChar = target[targetIndex];

    if (queryChar === targetChar) {
      matches.push(targetIndex);
      
      // Bonus for consecutive matches
      if (targetIndex === lastMatchIndex + 1) {
        consecutiveMatches++;
        score += 5 + consecutiveMatches; // Increasing bonus for longer runs
      } else {
        consecutiveMatches = 0;
        score += 1;
      }

      // Bonus for matching at word boundaries
      if (targetIndex === 0 || target[targetIndex - 1] === ' ') {
        score += 8;
      }

      // Bonus for matching uppercase in camelCase
      if (target[targetIndex] !== target[targetIndex].toLowerCase()) {
        score += 3;
      }

      lastMatchIndex = targetIndex;
      queryIndex++;
    }

    targetIndex++;
  }

  // Did we match all query characters?
  const isMatch = queryIndex === query.length;

  if (!isMatch) {
    return { score: 0, matches: [], isMatch: false };
  }

  // Penalty for long distance between matches
  if (matches.length > 1) {
    const spread = matches[matches.length - 1] - matches[0];
    score -= spread * 0.1;
  }

  // Bonus for shorter target (more exact match)
  score += (100 - target.length) * 0.1;

  return { score, matches, isMatch };
}

/**
 * Fuzzy search through array of items
 * 
 * @param query - Search query
 * @param items - Items to search
 * @param getText - Function to extract searchable text from item
 * @param threshold - Minimum score to include (default: 0)
 * @returns Sorted array of matching items with scores
 */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  getText: (item: T) => string,
  threshold: number = 0
): Array<{ item: T; score: number; matches: number[] }> {
  const results = items
    .map((item) => {
      const text = getText(item);
      const match = fuzzyMatch(query, text);
      return { item, score: match.score, matches: match.matches, isMatch: match.isMatch };
    })
    .filter((result) => result.isMatch && result.score > threshold)
    .sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Multi-field fuzzy search (searches across multiple fields with weights)
 * 
 * @param query - Search query
 * @param items - Items to search
 * @param fields - Array of field extractors with weights
 * @param threshold - Minimum score to include
 * @returns Sorted array of matching items
 */
export function fuzzySearchMultiField<T>(
  query: string,
  items: T[],
  fields: Array<{ getText: (item: T) => string; weight: number }>,
  threshold: number = 0
): Array<{ item: T; score: number }> {
  const results = items
    .map((item) => {
      let totalScore = 0;
      let hasMatch = false;

      fields.forEach(({ getText, weight }) => {
        const text = getText(item);
        const match = fuzzyMatch(query, text);
        if (match.isMatch) {
          hasMatch = true;
          totalScore += match.score * weight;
        }
      });

      return { item, score: totalScore, isMatch: hasMatch };
    })
    .filter((result) => result.isMatch && result.score > threshold)
    .sort((a, b) => b.score - a.score);

  return results;
}


const stopWords = new Set([
  "a", "an", "the", "is", "are", "was", "were",
  "in", "on", "at", "to", "of", "for", "and",
  "or", "it", "this", "that", "we", "our",
]);

function tokenize(text) {
  return new Set(
    String(text || "")
      .normalize("NFKC")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((word) => !stopWords.has(word)) || []
  );
}

function textSimilarity(first, second) {
  const a = tokenize(first);
  const b = tokenize(second);

  if (!a.size || !b.size) return 0;

  const shared = [...a].filter((word) => b.has(word)).length;
  const union = a.size + b.size - shared;

  return shared / union;
}

function validCoordinates(report) {
  return (
    Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude) &&
    Math.abs(report.latitude) <= 90 &&
    Math.abs(report.longitude) <= 180
  );
}

function distanceMeters(first, second) {
  if (!validCoordinates(first) || !validCoordinates(second)) {
    return null;
  }

  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDifference = radians(
    second.latitude - first.latitude
  );
  const longitudeDifference = radians(
    second.longitude - first.longitude
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(first.latitude)) *
      Math.cos(radians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export function findPossibleDuplicates(target, candidates) {
  return candidates
    .filter((candidate) => candidate.id !== target.id)
    .map((candidate) => {
      const similarity = textSimilarity(
        `${target.title} ${target.description}`,
        `${candidate.title} ${candidate.description}`
      );

      const distance = distanceMeters(target, candidate);
      const nearby = distance !== null && distance <= 500;

      // Nearby reports can qualify with lower text overlap.
      // Without GPS, require stronger text similarity.
      const qualifies =
        distance === null
          ? similarity >= 0.6
          : nearby && similarity >= 0.3;

      if (!qualifies) return null;

      return {
        id: candidate.id,
        trackingId: candidate.trackingId,
        title: candidate.title,
        location: candidate.location,
        status: candidate.status,
        textSimilarity: Math.round(similarity * 100),
        distanceMeters:
          distance === null ? null : Math.round(distance),
        reason: nearby
          ? "Similar wording within 500 metres."
          : "Strong wording overlap; location needs manual verification.",
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.textSimilarity - a.textSimilarity)
    .slice(0, 5);
}
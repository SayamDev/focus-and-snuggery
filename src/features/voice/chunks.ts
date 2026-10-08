/** Prefer sentence boundaries, preserving all words without very long model inputs. */
export function speechChunks(text: string, limit = 450): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const result: string[] = [];
  let chunk = "";
  for (const word of words) {
    if (chunk && chunk.length + word.length + 1 > limit) {
      result.push(chunk);
      chunk = "";
    }
    // A single long token must also be bounded (e.g. a pasted URL).
    if (word.length > limit) {
      if (chunk) {
        result.push(chunk);
        chunk = "";
      }
      for (let index = 0; index < word.length; index += limit)
        result.push(word.slice(index, index + limit));
    } else {
      chunk += (chunk ? " " : "") + word;
      if (chunk.length > limit * 0.65 && /[.!?]$/.test(word)) {
        result.push(chunk);
        chunk = "";
      }
    }
  }
  if (chunk) result.push(chunk);
  return result;
}

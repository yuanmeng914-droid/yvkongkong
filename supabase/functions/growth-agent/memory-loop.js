const CATEGORY_ORDER = ["goal", "habit", "observation", "experience", "preference"];
const CATEGORY_RANK = new Map(CATEGORY_ORDER.map((value, index) => [value, index]));

export function selectRelevantMemories(records, limit = 8) {
  return (Array.isArray(records) ? records : [])
    .filter((item) => item && !item.deleted_at && CATEGORY_RANK.has(item.category) && cleanText(item.content, 500))
    .sort((a, b) => CATEGORY_RANK.get(a.category) - CATEGORY_RANK.get(b.category) || Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0))
    .slice(0, Math.max(0, Number(limit) || 0))
    .map((item) => ({ id: String(item.id), type: item.category, content: cleanText(item.content, 500) }));
}

export function resolveReferencedMemories(ids, selected) {
  const byId = new Map((Array.isArray(selected) ? selected : []).map((item) => [item.id, item]));
  const seen = new Set();
  return (Array.isArray(ids) ? ids : []).flatMap((id) => {
    if (typeof id !== "string" || seen.has(id) || !byId.has(id)) return [];
    seen.add(id);
    return [byId.get(id)];
  });
}

export function validateMemoryCandidate(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !CATEGORY_RANK.has(value.type)) return null;
  const content = cleanText(value.content, 500);
  const reason = cleanText(value.reason, 300);
  return content && reason ? { type: value.type, content, reason } : null;
}

export function isDuplicateMemory(candidate, existing) {
  const candidateText = normalizeText(candidate?.content);
  if (!candidateText) return false;
  return (Array.isArray(existing) ? existing : []).some((item) => {
    const current = normalizeText(item?.content);
    if (!current) return false;
    if (current === candidateText) return true;
    const shorter = current.length <= candidateText.length ? current : candidateText;
    const longer = current.length > candidateText.length ? current : candidateText;
    return shorter.length >= 8 && longer.includes(shorter);
  });
}

export function finalizeMemoryAwareInsight(insight, selected, allExisting = selected) {
  const referencedMemories = resolveReferencedMemories(insight?.referenced_memory_ids, selected);
  const candidate = validateMemoryCandidate(insight?.memory_candidate);
  return {
    summary: insight.summary,
    observation: insight.observation,
    tomorrow_suggestion: insight.tomorrow_suggestion,
    referenced_memories: referencedMemories,
    memory_candidate: candidate && !isDuplicateMemory(candidate, allExisting) ? candidate : null,
  };
}

export function readInsightMemoryMeta(sourceSnapshot) {
  const meta = sourceSnapshot?.ai_result_meta;
  const referenced = Array.isArray(meta?.referenced_memories)
    ? meta.referenced_memories.filter((item) => item && typeof item.id === "string" && CATEGORY_RANK.has(item.type) && cleanText(item.content, 500))
      .slice(0, 8).map((item) => ({ id: item.id, type: item.type, content: cleanText(item.content, 500) }))
    : [];
  return {
    referenced_memories: referenced,
    memory_candidate: validateMemoryCandidate(meta?.memory_candidate),
  };
}

function normalizeText(value) {
  return typeof value === "string" ? value.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "") : "";
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

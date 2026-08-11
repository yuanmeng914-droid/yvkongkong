const INSIGHT_FIELDS = ["summary", "observation", "tomorrow_suggestion"];
const MAX_INSIGHT_LENGTH = 300;

export function validateInsightDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}

export function buildDailyInsightRequest(snapshot) {
  const context = {
    day: snapshot.day,
    tasks: {
      total: Number(snapshot.tasks?.total || 0),
      completed: Number(snapshot.tasks?.completed || 0),
      unfinished: Number(snapshot.tasks?.unfinished || 0),
      carried: Number(snapshot.tasks?.carried || 0),
    },
    mood: {
      mood: cleanText(snapshot.mood?.mood, 80),
      note: cleanText(snapshot.mood?.note, 120),
    },
    review: {
      highlight: cleanText(snapshot.review?.highlight, 500),
      unfinished: cleanText(snapshot.review?.unfinished, 500),
      next: cleanText(snapshot.review?.next, 500),
    },
  };

  return {
    input: [
      "请为用户写一份温和的每日成长分析。",
      "只能根据提供的数据表达，不要编造事实，不要评价用户是否努力或懒惰。",
      "不要做心理、医疗或诊断性质的判断，不要命令用户完成任务。",
      "只返回 JSON：summary、observation、tomorrow_suggestion 三个字段；每个字段 1 至 300 个字符。",
      "summary 是今天的小结；observation 是温和观察；tomorrow_suggestion 只提供一条可选择的小建议。",
    ].join("\n"),
    context,
  };
}

export function validateDailyInsight(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const result = {};
  for (const field of INSIGHT_FIELDS) {
    const value = data[field];
    if (typeof value !== "string") return null;
    const text = value.trim();
    if (!text || text.length > MAX_INSIGHT_LENGTH) return null;
    result[field] = text;
  }
  return result;
}

export function hasDailySource(snapshot) {
  return Boolean(
    snapshot.tasks.total || snapshot.mood.mood || snapshot.mood.note ||
    snapshot.review.highlight || snapshot.review.unfinished || snapshot.review.next,
  );
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

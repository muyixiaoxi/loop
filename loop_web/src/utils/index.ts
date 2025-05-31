/**
 * 格式化时间显示
 * @param timestamp 时间戳(毫秒)
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(timestamp: number | string): string {
  const now = new Date();
  const date = new Date(timestamp);

  // 今天的时间显示 时:分
  if (isSameDay(now, date)) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // 一周内显示星期几
  if (isWithinWeek(now, date)) {
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    return `星期${weekdays[date.getDay()]}`;
  }

  // 超过一周显示 月/日
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 判断是否是同一天
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// 判断是否在一周内
function isWithinWeek(now: Date, date: Date): boolean {
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  return now.getTime() - date.getTime() < oneWeekMs;
}

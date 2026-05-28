export const FAST_PATTERNS = [
  {
    tool: "list_my_surveys",
    priority: 100,
    match: (t) =>
      /(danh sách|liệt kê|list|show list)\s*(khảo sát|survey)?\s*(của tôi|my|mine)?/.test(t),
    extract: () => ({})
  },
  {
    tool: "search_surveys",
    priority: 95,
    match: (t) =>
      /(tìm|search|kiếm)\s*(khảo sát|survey)/.test(t),
    extract: (t) => {
      const m = t.match(/(?:tìm|search|kiếm)\s*(.+)/);
      return {
        keyword: m?.[1]?.trim() || ""
      };
    }
  },
  {
    tool: "get_survey_detail",
    priority: 110,
    match: (t) =>
      /(chi tiết|detail)\s*(khảo sát|survey)/.test(t),
    extract: (t) => {
      const m = t.match(/(?:chi tiết|detail)\s*(?:khảo sát|survey)\s*(.+)/);
      return {
        keyword: m?.[1]?.trim() || ""
      };
    }
  },
  {
    tool: "get_survey_analytics",
    priority: 90,
    match: (t) =>
      /(thống kê|phân tích|analytics|stats)/.test(t) &&
      /(khảo sát|survey)/.test(t),
    extract: (t) => {
      const m = t.match(/(?:thống kê|phân tích|analytics|stats)\s*(.+)/);
      return {
        keyword: m?.[1]?.trim()
      };
    }
  },
  {
    tool: "get_notifications",
    priority: 100,
    match: (t) =>
      /(thông báo|notification|bell)/.test(t),
    extract: () => ({})
  },
  {
    tool: "get_system_overview",
    priority: 80,
    match: (t) =>
      /(tổng quan|system overview|overview)/.test(t) &&
      !/(khảo sát|survey)/.test(t),
    extract: () => ({})
  },
  {
    tool: "create_survey",
    priority: 90,
    match: (t) =>
      /^(tạo|mới|làm|mở)\s*(khảo sát|survey)/.test(t),
    extract: (t) => {
      const m = t.match(/(?:tạo|mới|làm|mở)\s*(?:khảo sát|survey)\s*(.+)?/);
      return {
        title: m?.[1]?.trim() || "Khảo sát mới"
      };
    }
  },
  {
    tool: "get_my_responses",
    priority: 70,
    match: (t) =>
      /(phản hồi.*tôi|lịch sử|my responses)/.test(t),
    extract: () => ({})
  }
];
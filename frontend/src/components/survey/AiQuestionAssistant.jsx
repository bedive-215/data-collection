import React, { useState, useCallback, useEffect } from "react";
import { Sparkles, Loader2, X, ClipboardPaste, Wand2, Check, AlertCircle } from "lucide-react";
import questionService from "@/services/questionService";
import { toast } from "react-toastify";

const stripHtml = (html) => {
  if (!html) return "";
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || d.innerText || "";
};

const TYPE_LABEL = {
  TEXT: "Ngắn",
  PARAGRAPH: "Đoạn",
  SINGLE_CHOICE: "Một lựa chọn",
  MULTIPLE_CHOICE: "Nhiều lựa chọn",
  DROPDOWN: "Dropdown",
  RATING: "Đánh giá",
  DATE: "Ngày",
  NUMBER: "Số",
  EMAIL: "Email",
};

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.surveyId
 * @param {string} props.surveyTitle
 * @param {string} props.surveyDescription
 * @param {number} props.existingCount — số câu đã có (để order_index)
 * @param {(rows: object[]) => Promise<void>} props.onApplied — gọi bulkCreate với payload đã gán order_index
 * @param {object} props.C — design tokens từ trang cha
 */
export default function AiQuestionAssistant({
  open,
  onClose,
  surveyId,
  surveyTitle = "",
  surveyDescription = "",
  existingCount = 0,
  onApplied,
  C,
}) {
  const [tab, setTab] = useState("parse");
  const [rawText, setRawText] = useState("");
  const [genTitle, setGenTitle] = useState(surveyTitle);
  const [genDesc, setGenDesc] = useState(surveyDescription);
  const [genCount, setGenCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const resetPreview = useCallback(() => {
    setSuggestions([]);
    setErr("");
  }, []);

  useEffect(() => {
    if (open) {
      setGenTitle(stripHtml(surveyTitle || ""));
      setGenDesc(stripHtml(surveyDescription || ""));
      setSuggestions([]);
      setErr("");
    }
  }, [open, surveyTitle, surveyDescription]);

  const runAi = async () => {
    setErr("");
    setSuggestions([]);
    setLoading(true);
    try {
      const body =
        tab === "parse"
          ? { mode: "parse", rawText: rawText.trim() }
          : {
              mode: "generate",
              surveyTitle: stripHtml(genTitle.trim()),
              surveyDescription: stripHtml(genDesc.trim()) || undefined,
              count: genCount,
            };
      const res = await questionService.aiSuggestQuestions(surveyId, body);
      const list = res?.data?.questions ?? [];
      if (!Array.isArray(list) || list.length === 0) {
        setErr("AI không trả về câu hỏi nào.");
        return;
      }
      setSuggestions(list);
      toast.success(`AI đề xuất ${list.length} câu hỏi`);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Gọi AI thất bại";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const applyAll = async () => {
    if (suggestions.length === 0) return;
    const base = existingCount;
    const payload = suggestions.map((q, i) => ({
      content: q.content,
      type: q.type,
      required: q.required !== false,
      order_index: base + i,
      settings: q.settings ?? undefined,
      options: q.options,
    }));
    try {
      await onApplied(payload);
      toast.success(`Đã thêm ${payload.length} câu hỏi`);
      onClose();
      setSuggestions([]);
      setRawText("");
    } catch {
      /* toast trong provider */
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(8px)",
        fontFamily: C.font,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "min(92vh, 720px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: C.surface,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid rgba(255,255,255,0.55)`,
          borderRadius: 20,
          borderTop: `5px solid ${C.primary}`,

        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-title"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 18px",
            borderBottom: `1px solid rgba(0,0,0,0.06)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.primaryGrad,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 id="ai-assistant-title" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>
                Trợ lý AI
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: C.textSub, fontWeight: 500 }}>
                Dán danh sách câu hỏi hoặc mô tả chủ đề — AI gợi ý dạng câu hợp lệ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: `1px solid rgba(0,0,0,0.08)`,
              background: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              color: C.textSub,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "10px 14px", display: "flex", gap: 8, borderBottom: `1px solid rgba(0,0,0,0.05)` }}>
          {[
            { id: "parse", label: "Dán nội dung", Icon: ClipboardPaste },
            { id: "generate", label: "Từ tên khảo sát", Icon: Wand2 },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                resetPreview();
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 12,
                border: tab === id ? `1px solid rgba(99,102,241,0.35)` : `1px solid transparent`,
                background: tab === id ? "rgba(99,102,241,0.1)" : "transparent",
                color: tab === id ? C.primary : C.textSub,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: C.font,
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
          {tab === "parse" ? (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>
                Dán văn bản có đánh số (1. 2. / Câu 1, Câu 2) hoặc từng dòng là một câu. AI tách và gán loại câu hợp lý.
              </p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Ví dụ:&#10;1. Bạn có hài lòng với dịch vụ không?&#10;2. Điểm cần cải thiện?&#10;3. Khu vực bạn sinh sống:&#10;A) TP.HCM  B) Hà Nội  C) Khác"
                style={{
                  width: "100%",
                  minHeight: 160,
                  boxSizing: "border-box",
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid rgba(0,0,0,0.1)`,
                  fontSize: 14,
                  fontFamily: C.font,
                  resize: "vertical",
                  background: "rgba(255,255,255,0.65)",
                  color: C.text,
                }}
              />
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>
                Chưa có sẵn câu hỏi? Nhập chủ đề khảo sát — AI sinh bộ câu gợi ý (có thể chỉnh sau khi thêm).
              </p>
              <label style={{ display: "block", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textDim }}>Tên / chủ đề khảo sát *</span>
                <input
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "11px 12px",
                    borderRadius: 12,
                    border: `1px solid rgba(0,0,0,0.1)`,
                    fontSize: 14,
                    fontFamily: C.font,
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.65)",
                    color: C.text,
                  }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textDim }}>Mô tả thêm (tuỳ chọn)</span>
                <textarea
                  value={genDesc}
                  onChange={(e) => setGenDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 10,
                    borderRadius: 12,
                    border: `1px solid rgba(0,0,0,0.1)`,
                    fontSize: 13,
                    fontFamily: C.font,
                    resize: "vertical",
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.65)",
                    color: C.text,
                  }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textDim }}>Số câu gợi ý: {genCount}</span>
                <input
                  type="range"
                  min={5}
                  max={15}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  style={{ width: "100%", marginTop: 8 }}
                />
              </label>
            </>
          )}

          {err && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(254,226,226,0.85)",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{err}</span>
            </div>
          )}

          {suggestions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.textDim, marginBottom: 8, letterSpacing: "0.06em" }}>
                XEM TRƯỚC ({suggestions.length})
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, maxHeight: 220, overflowY: "auto" }}>
                {suggestions.map((q, i) => (
                  <li key={i} style={{ marginBottom: 10, fontSize: 13, color: C.text, lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 700 }}>{q.content?.slice(0, 200)}{q.content?.length > 200 ? "…" : ""}</span>
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "rgba(99,102,241,0.12)",
                        color: C.primary,
                      }}
                    >
                      {TYPE_LABEL[q.type] || q.type}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderTop: `1px solid rgba(0,0,0,0.06)`,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: `1px solid rgba(0,0,0,0.1)`,
              background: "rgba(255,255,255,0.7)",
              fontWeight: 700,
              fontSize: 13,
              color: C.textSub,
              cursor: "pointer",
              fontFamily: C.font,
            }}
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={runAi}
            disabled={loading || (tab === "parse" && !rawText.trim()) || (tab === "generate" && !genTitle.trim())}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              border: "none",
              background: (C.primaryGrad || "linear-gradient(135deg,#3B82F6,#2563EB)"),
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: C.font,
              cursor: (loading || (tab === "parse" && !rawText.trim()) || (tab === "generate" && !genTitle.trim())) ? "not-allowed" : "pointer",
              opacity: (loading || (tab === "parse" && !rawText.trim()) || (tab === "generate" && !genTitle.trim())) ? 0.4 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: "spin 0.9s linear infinite" }} /> : <Sparkles size={16} />}
            {loading ? "Đang xử lý…" : "Chạy AI"}
          </button>
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={applyAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: C.font,

              }}
            >
              <Check size={16} strokeWidth={2.5} />
              Thêm {suggestions.length} câu vào khảo sát
            </button>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

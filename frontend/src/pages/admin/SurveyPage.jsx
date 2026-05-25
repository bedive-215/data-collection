// ─── SurveyPage.jsx ─── Admin, dark theme ──
import React, { useEffect, useState, useRef, useCallback } from "react";
import surveyService from "@/services/surveyService";
import { useSurvey } from "@/providers/SurveyProvider";
import { useAdminStats } from "@/providers/AdminStatsProvider";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, FileText, ClipboardList,
  Loader2, AlertCircle, X, Pencil, Check,
  Users, MoreVertical, Copy, Search, Calendar,
  Image as ImageIcon, Share2, Mail, Lock, Globe,
  Power, PowerOff, ExternalLink, Link as LinkIcon,
  Send, UserPlus, UserMinus, RefreshCw, ChevronDown,
  BarChart3, Settings,
} from "lucide-react";
import { SurveyCardHome, ShareModal } from "@/components/survey/SurveyCardHome";

/* ─── Token — aligned with Admin Design System v2 ─────────────────────── */
const C = {
  bg:            "#0F1117",
  bgSecondary:   "#141620",
  surface:       "#1A1D2E",
  surfaceHover:  "#222638",
  surfaceHigh:   "#222638",
  border:        "#2A2D3E",
  borderHover:   "#3A3D50",
  primary:       "#F59E0B",
  primaryHover:  "#D97706",
  primaryGrad:   "linear-gradient(135deg,#F59E0B,#D97706)",
  primaryDim:    "rgba(245,158,11,0.10)",
  primaryBorder: "rgba(245,158,11,0.30)",
  secondary:     "#6366F1",
  secondaryDim:  "rgba(99,102,241,0.10)",
  accent:        "#8B5CF6",
  text:          "#F9FAFB",
  textSub:       "#9CA3AF",
  textDim:       "#4B5563",
  error:         "#EF4444",
  errorBg:       "rgba(239,68,68,0.10)",
  errorBorder:   "rgba(239,68,68,0.25)",
  success:       "#10B981",
  successBg:     "rgba(16,185,129,0.10)",
  successBorder: "rgba(16,185,129,0.25)",
  warning:       "#F59E0B",
  warningBg:     "rgba(245,158,11,0.10)",
  warningBorder: "rgba(245,158,11,0.25)",
  font:          "'Plus Jakarta Sans','DM Sans',sans-serif",
  thumbColors: [
    "conic-gradient(from 0deg at 50% 50%, #F59E0B, #D97706, #F59E0B)",
    "conic-gradient(from 0deg at 50% 50%, #6366F1, #8B5CF6, #6366F1)",
    "conic-gradient(from 0deg at 50% 50%, #10B981, #3B82F6, #10B981)",
    "conic-gradient(from 0deg at 50% 50%, #EC4899, #F59E0B, #EC4899)",
    "conic-gradient(from 0deg at 50% 50%, #8B5CF6, #6366F1, #8B5CF6)",
    "conic-gradient(from 0deg at 50% 50%, #3B82F6, #10B981, #3B82F6)",
  ],
};

/* ─── Shared button styles ───────────────────────────────────────── */
const cancelBtn = {
  padding:"8px 14px", borderRadius:10,
  border:`1px solid ${C.border}`, background:"transparent",
  cursor:"pointer", fontSize:13, fontWeight:600, color:C.textSub,
  fontFamily:C.font,
};

const saveBtn = {
  padding:"8px 14px", borderRadius:10,
  border:"none", background:C.primary,
  color:"#fff", cursor:"pointer",
  display:"flex", alignItems:"center", gap:6,
  fontSize:13, fontWeight:600, fontFamily:C.font,
};

const quickBtn = {
  width:28, height:28, borderRadius:8,
  border:"none", background:"rgba(255,255,255,0.08)",
  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
  color:C.textSub, transition:"all .15s",
};

const chipBtn = {
  width:24, height:24, borderRadius:6,
  border:`1px solid ${C.border}`, background:"transparent",
  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
  color:C.textDim, transition:"all .15s",
};

const inputStyle = {
  width:"100%", border:`1px solid ${C.border}`,
  borderRadius:10, padding:"9px 12px",
  outline:"none", fontSize:13, color:C.text,
  fontFamily:C.font, background:C.bg,
  boxSizing:"border-box", colorScheme:"dark",
};

const textareaStyle = { ...inputStyle, resize:"none" };

/* ─── Toggle switch ─────────────────────────────────────────────── */
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 38, height: 22,
        borderRadius: 11,
         background: checked ? C.primary : C.surfaceHigh,
  border: `1.5px solid ${checked ? C.primaryBorder : C.border}`,
        cursor: "pointer",
        position: "relative",
        transition: "all .2s",
        flexShrink: 0,
        padding: 0,
        outline: "none",
      }}
    >
      <div style={{
        width: 14, height: 14,
        borderRadius: "50%",
        background: checked ? "#fff" : C.textDim,
        position: "absolute",
        top: "50%",
        transform: `translateY(-50%) translateX(${checked ? "20px" : "2px"})`,
        transition: "all .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

/* ─── Status badge ───────────────────────────────────────────────── */
const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",   color: C.success,  bg: "rgba(34,197,94,0.12)" },
  DRAFT:     { label: "Nháp",      color: C.textSub,  bg: "rgba(100,116,139,0.12)" },
  SCHEDULED: { label: "Lên lịch",  color: C.warning,  bg: "rgba(245,158,11,0.12)" },
  EXPIRED:   { label: "Hết hạn",   color: C.error,    bg: "rgba(239,68,68,0.12)" },
  CLOSED:    { label: "Đã đóng",   color: "#6b7280",  bg: "rgba(107,114,128,0.12)" },
};

function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] ?? STATUS_MAP.DRAFT;
  return (
    <span style={{
      fontSize:10, fontWeight:700, padding:"3px 8px",
      borderRadius:999, color:s.color, background:s.bg,
    }}>
      {s.label}
    </span>
  );
}

/* ─── Modal base ─────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:999,
        background:"rgba(0,0,0,0.6)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:C.surface, borderRadius:20,
          border:`1px solid ${C.border}`,
          boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
          width:"100%", maxWidth:width,
          overflow:"hidden",
        }}
      >
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px", borderBottom:`1px solid ${C.border}`,
        }}>
          <h3 style={{margin:0, fontSize:16, fontWeight:700, color:C.text}}>{title}</h3>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8,
            border:`1px solid ${C.border}`, background:"transparent",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            color:C.textSub,
          }}>
            <X size={15}/>
          </button>
        </div>
        <div style={{padding:"20px"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── ShareLinkModal ─────────────────────────────────────────────── */
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const [loading,    setLoading]    = useState(false);
  const [shareUrl,   setShareUrl]   = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [activeTab,  setActiveTab]  = useState("link"); // "link" | "qr"

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const url = await onShare(survey.id);
      if (url) setShareUrl(url);
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!shareUrl) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `survey-qr-${survey?.id ?? "code"}.png`;
    a.click();
  };

  const getSocialShareUrl = (platform) => {
    if (!shareUrl || !survey) return "#";
    const title = encodeURIComponent(survey.title || "Khảo sát");
    const url = encodeURIComponent(shareUrl);
    switch (platform) {
      case "facebook":  return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case "twitter":  return `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
      case "zalo":     return `https://zalo.me/share?url=${url}`;
      default: return "#";
    }
  };

  useEffect(() => {
    if (!open) { setShareUrl(null); setCopied(false); setActiveTab("link"); }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Chia sẻ khảo sát">
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"14px 16px",
          background:C.surfaceHigh, borderRadius:12,
          border:`1px solid ${C.border}`,
        }}>
          <div style={{
            width:40, height:40, borderRadius:10,
            background:C.primaryDim,
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            <Share2 size={18} color={C.primary}/>
          </div>
          <div>
            <div style={{fontSize:14, fontWeight:600, color:C.text}}>{survey?.title}</div>
            <div style={{fontSize:12, color:C.textSub, marginTop:2}}>
              Chia sẻ khảo sát đến mọi người
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{display:"flex", gap:8, background:C.surfaceHigh, borderRadius:10, padding:4}}>
          {["link","qr"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer",
                fontSize:13, fontWeight:600, fontFamily:C.font,
                background: activeTab === tab ? C.primary : "transparent",
                color: activeTab === tab ? "#fff" : C.textSub,
                transition:"all .15s",
              }}>
              {tab === "link" ? "🔗 Link" : "⬡ QR Code"}
            </button>
          ))}
        </div>

        {activeTab === "link" ? (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {shareUrl ? (
              <>
                <label style={{fontSize:12, fontWeight:600, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.04em"}}>
                  Link chia sẻ
                </label>
                <div style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"10px 14px",
                  background:C.surfaceHigh, borderRadius:10,
                  border:`1px solid ${C.border}`,
                }}>
                  <LinkIcon size={14} color={C.textSub} style={{flexShrink:0}}/>
                  <span style={{flex:1, fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                    {shareUrl}
                  </span>
                  <button onClick={handleCopy} style={{
                    display:"flex", alignItems:"center", gap:5,
                    padding:"5px 10px", borderRadius:7,
                    border:`1px solid ${copied ? C.successBorder : C.border}`,
                    background: copied ? C.successBg : "transparent",
                    color: copied ? C.success : C.textSub,
                    fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0,
                    transition:"all .2s",
                  }}>
                    {copied ? <Check size={12}/> : <Copy size={12}/>}
                    {copied ? "Đã sao chép" : "Sao chép"}
                  </button>
                </div>

                {/* Social share buttons */}
                <div style={{display:"flex", gap:8}}>
                  <a href={getSocialShareUrl("facebook")} target="_blank" rel="noreferrer"
                    style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", borderRadius:8, border:"none", background:"#1877f2", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", textDecoration:"none", fontFamily:C.font}}>
                    f Facebook
                  </a>
                  <a href={getSocialShareUrl("twitter")} target="_blank" rel="noreferrer"
                    style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", borderRadius:8, border:"none", background:"#1da1f2", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", textDecoration:"none", fontFamily:C.font}}>
                    𝕏 Twitter
                  </a>
                  <a href={getSocialShareUrl("zalo")} target="_blank" rel="noreferrer"
                    style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", borderRadius:8, border:"none", background:"#0068ff", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", textDecoration:"none", fontFamily:C.font}}>
                    Zalo
                  </a>
                </div>

                <button onClick={() => window.open(shareUrl, "_blank")} style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  padding:"8px 0", borderRadius:10,
                  border:`1px solid ${C.primaryBorder}`,
                  background:C.primaryDim, color:C.primary,
                  fontSize:13, fontWeight:600, cursor:"pointer",
                }}>
                  <ExternalLink size={13}/> Mở link
                </button>
              </>
            ) : (
              <button onClick={handleGenerate} disabled={loading} style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                padding:"12px 0", borderRadius:12, border:"none",
                background: loading ? C.surfaceHigh : C.primaryGrad,
                color: loading ? C.textSub : "#fff",
                fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 2px 12px rgba(79,110,247,0.3)",
              }}>
                {loading
                  ? <><Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/> Đang tạo link...</>
                  : <><LinkIcon size={16}/> Tạo link chia sẻ</>
                }
              </button>
            )}
          </div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:14}}>
            {shareUrl ? (
              <>
                <div style={{padding:16, background:"#fff", borderRadius:16, border:`1px solid ${C.border}`, boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                    alt="QR Code"
                    style={{width:200, height:200, display:"block"}}
                  />
                </div>
                <p style={{fontSize:12, color:C.textSub, margin:0, textAlign:"center"}}>
                  Quét mã QR để mở khảo sát trên điện thoại
                </p>
                <button onClick={handleDownloadQR} style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  padding:"9px 20px", borderRadius:10, border:"none",
                  background:C.primaryGrad, color:"#fff",
                  fontSize:13, fontWeight:700, cursor:"pointer",
                  boxShadow:"0 2px 12px rgba(79,110,247,0.3)",
                }}>
                  ⬇ Tải mã QR
                </button>
                {!shareUrl && (
                  <button onClick={handleGenerate} disabled={loading}
                    style={{display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 20px", borderRadius:10, border:`1px solid ${C.border}`, background:"transparent", color:C.textSub, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:C.font}}>
                    <Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Tạo link trước
                  </button>
                )}
              </>
            ) : (
              <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"2rem 0"}}>
                <div style={{width:120, height:120, background:C.surfaceHigh, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <span style={{fontSize:48}}>⬡</span>
                </div>
                <p style={{fontSize:13, color:C.textSub, margin:0, textAlign:"center"}}>
                  Tạo link trước để tạo mã QR
                </p>
                <button onClick={handleGenerate} disabled={loading} style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  padding:"10px 20px", borderRadius:10, border:"none",
                  background: loading ? C.surfaceHigh : C.primaryGrad, color: loading ? C.textSub : "#fff",
                  fontSize:13, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
                }}>
                  {loading ? <><Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> Đang tạo...</> : <><LinkIcon size={14}/> Tạo link</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─── InviteModal ────────────────────────────────────────────────── */
function InviteModal({ open, onClose, survey, onInvite }) {
  const [emails,  setEmails]  = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(false); setError(""); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (list.length === 0) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      await Promise.all(list.map(email => onInvite(survey.id, { email, role:"viewer" })));
      setSuccess(true); setEmails("");
    } catch { setError("Mời không thành công, vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mời người tham gia">
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 14px", background:C.surfaceHigh,
          borderRadius:10, border:`1px solid ${C.border}`,
        }}>
          <Users size={16} color={C.primary}/>
          <span style={{fontSize:13, color:C.textSub}}>
            Mời người dùng tham gia <strong style={{color:C.text}}>{survey?.title}</strong>
          </span>
        </div>

        {success && (
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"10px 14px", borderRadius:10,
            background:C.successBg, border:`1px solid ${C.successBorder}`,
            fontSize:13, color:C.success, fontWeight:600,
          }}>
            <Check size={14}/> Đã gửi lời mời thành công!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div>
              <label style={{
                display:"block", fontSize:12, fontWeight:600,
                color:C.textSub, textTransform:"uppercase",
                letterSpacing:"0.04em", marginBottom:6,
              }}>
                Địa chỉ email
              </label>
              <textarea
                rows={4} value={emails}
                onChange={e => { setEmails(e.target.value); setError(""); }}
                placeholder={"example@email.com\nuser2@email.com\n(mỗi dòng hoặc dấu phẩy)"}
                style={{
                  ...textareaStyle,
                  border:`1.5px solid ${error ? C.error : C.border}`,
                }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = "0 0 0 3px rgba(108,126,247,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = error ? C.error : C.border; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {error && (
              <div style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 12px", borderRadius:8,
                background:C.errorBg, border:`1px solid ${C.errorBorder}`,
                fontSize:13, color:C.error,
              }}>
                <X size={13}/> {error}
              </div>
            )}

            <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
              <button type="button" onClick={onClose} style={cancelBtn}>Đóng</button>
              <button type="submit" disabled={loading} style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"9px 18px", borderRadius:10, border:"none",
                background: loading ? C.surfaceHigh : C.primaryGrad,
                color: loading ? C.textSub : "#fff",
                fontSize:13, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 2px 10px rgba(79,110,247,0.3)",
              }}>
                {loading
                  ? <><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang gửi...</>
                  : <><Send size={13}/> Gửi lời mời</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ─── BulkInviteModal ────────────────────────────────────────────── */
function BulkInviteModal({ open, onClose, survey, onBulkInvite }) {
  const [emails,  setEmails]  = useState("");
  const [role,    setRole]    = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(null); setError(""); setRole("viewer"); }
  }, [open]);

  const parseEmails = () =>
    emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const list = parseEmails();
    if (list.length === 0) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      const res = await onBulkInvite(survey.id, { emails: list, role });
      setSuccess({ sent: res?.sent ?? list.length, failed: res?.failed ?? 0 });
      setEmails("");
    } catch { setError("Bulk invite thất bại, vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  const emailCount = parseEmails().length;

  return (
    <Modal open={open} onClose={onClose} title="Mời hàng loạt" width={520}>
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 14px",
          background:"linear-gradient(135deg,rgba(108,126,247,0.08),rgba(79,110,247,0.08))",
          borderRadius:10, border:`1px solid ${C.primaryBorder}`,
        }}>
          <div style={{
            width:38, height:38, borderRadius:10,
            background:C.primaryDim,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <UserPlus size={18} color={C.primary}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13, fontWeight:600, color:C.text}}>{survey?.title}</div>
            <div style={{fontSize:12, color:C.textSub, marginTop:2}}>Nhập nhiều email cùng lúc</div>
          </div>
          {emailCount > 0 && (
            <div style={{
              padding:"4px 10px", borderRadius:999,
              background:C.primaryDim, color:C.primary,
              fontSize:12, fontWeight:700, flexShrink:0,
            }}>
              {emailCount} email
            </div>
          )}
        </div>

        {success && (
          <div style={{
            padding:"12px 14px", borderRadius:10,
            background:C.successBg, border:`1px solid ${C.successBorder}`,
          }}>
            <div style={{display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600, color:C.success}}>
              <Check size={14}/> Đã gửi lời mời hàng loạt!
            </div>
            <div style={{display:"flex", gap:16, marginTop:8}}>
              <div style={{fontSize:12, color:C.textSub}}>
                ✅ Thành công: <strong style={{color:C.success}}>{success.sent}</strong>
              </div>
              {success.failed > 0 && (
                <div style={{fontSize:12, color:C.textSub}}>
                  ❌ Thất bại: <strong style={{color:C.error}}>{success.failed}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div>
              <label style={{
                display:"block", fontSize:12, fontWeight:600,
                color:C.textSub, textTransform:"uppercase",
                letterSpacing:"0.04em", marginBottom:6,
              }}>
                Vai trò
              </label>
              <div style={{display:"flex", gap:8}}>
                {[
                  { value:"viewer",     label:"👁️ Viewer",     desc:"Chỉ xem" },
                  { value:"respondent", label:"✏️ Respondent", desc:"Trả lời" },
                  { value:"editor",     label:"🛠️ Editor",     desc:"Chỉnh sửa" },
                ].map(r => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setRole(r.value)}
                    style={{
                      flex:1, padding:"8px 10px", borderRadius:10,
                      border:`1.5px solid ${role === r.value ? C.primary : C.border}`,
                      background: role === r.value ? C.primaryDim : "transparent",
                      cursor:"pointer", textAlign:"center", transition:"all .15s",
                    }}
                  >
                    <div style={{fontSize:12, fontWeight:700, color: role === r.value ? C.primary : C.text}}>
                      {r.label}
                    </div>
                    <div style={{fontSize:11, color:C.textSub, marginTop:2}}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{
                display:"block", fontSize:12, fontWeight:600,
                color:C.textSub, textTransform:"uppercase",
                letterSpacing:"0.04em", marginBottom:6,
              }}>
                Danh sách email
              </label>
              <textarea
                rows={6} value={emails}
                onChange={e => { setEmails(e.target.value); setError(""); }}
                placeholder={"user1@email.com\nuser2@email.com, user3@email.com\n(phân cách bằng dấu phẩy, chấm phẩy hoặc xuống dòng)"}
                style={{
                  ...textareaStyle,
                  border:`1.5px solid ${error ? C.error : C.border}`,
                  lineHeight:1.7,
                }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = "0 0 0 3px rgba(108,126,247,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = error ? C.error : C.border; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {error && (
              <div style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 12px", borderRadius:8,
                background:C.errorBg, border:`1px solid ${C.errorBorder}`,
                fontSize:13, color:C.error,
              }}>
                <X size={13}/> {error}
              </div>
            )}

            <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
              <button type="button" onClick={onClose} style={cancelBtn}>Đóng</button>
              <button type="submit" disabled={loading || emailCount === 0} style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"9px 18px", borderRadius:10, border:"none",
                background: (loading || emailCount === 0) ? C.surfaceHigh : C.primaryGrad,
                color: (loading || emailCount === 0) ? C.textSub : "#fff",
                fontSize:13, fontWeight:700,
                cursor: (loading || emailCount === 0) ? "not-allowed" : "pointer",
                boxShadow: (loading || emailCount === 0) ? "none" : "0 2px 10px rgba(79,110,247,0.3)",
              }}>
                {loading
                  ? <><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang gửi...</>
                  : <><UserPlus size={13}/> Mời {emailCount > 0 ? `${emailCount} người` : "hàng loạt"}</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ─── ParticipantsModal ──────────────────────────────────────────── */
function ParticipantsModal({ open, onClose, survey, onGetParticipants, onDeleteParticipant }) {
  const [participants, setParticipants] = useState([]);
  const [count,        setCount]        = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [deleting,     setDeleting]     = useState(null);
  const [search,       setSearch]       = useState("");
  const [confirmPid,   setConfirmPid]   = useState(null);
  const [error,        setError]        = useState("");

  const load = useCallback(async () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    try {
      const res = await onGetParticipants(survey.id, {});
      setParticipants(res?.participants ?? []);
      setCount(res?.count ?? 0);
    } catch { setError("Không thể tải danh sách người tham gia."); }
    finally { setLoading(false); }
  }, [survey?.id, onGetParticipants]);

  useEffect(() => {
    if (open) { load(); setSearch(""); setConfirmPid(null); setError(""); }
    else { setParticipants([]); setCount(0); }
  }, [open, load]);

  const handleDelete = async (participantId) => {
    setDeleting(participantId);
    try {
      await onDeleteParticipant(survey.id, participantId);
      setParticipants(prev => prev.filter(p => p.participant_id !== participantId));
      setCount(prev => Math.max(0, prev - 1));
      setConfirmPid(null);
    } finally { setDeleting(null); }
  };

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    return (
      p.email?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q)
    );
  });

  const getInitials = (name, email) => {
    if (name) return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    return (email || "?")[0].toUpperCase();
  };

  const AVATAR_COLORS = [
    { bg:"rgba(59,130,246,0.15)", color:"#60a5fa" },
    { bg:"rgba(34,197,94,0.15)",  color:"#4ade80" },
    { bg:"rgba(236,72,153,0.15)", color:"#f472b6" },
    { bg:"rgba(245,158,11,0.15)", color:"#fbbf24" },
    { bg:"rgba(139,92,246,0.15)", color:"#a78bfa" },
  ];

  const ROLE_STYLE = {
    viewer:     { color:"#60a5fa", bg:"rgba(59,130,246,0.12)",  border:"rgba(59,130,246,0.25)" },
    respondent: { color:"#4ade80", bg:"rgba(34,197,94,0.12)",   border:"rgba(34,197,94,0.25)" },
    editor:     { color:"#a78bfa", bg:"rgba(139,92,246,0.12)",  border:"rgba(139,92,246,0.25)" },
  };

  const getRoleStyle = (role) =>
    ROLE_STYLE[role?.toLowerCase()] ?? { color:C.primary, bg:C.primaryDim, border:C.primaryBorder };

  return (
    <Modal open={open} onClose={onClose} title="Quản lý người tham gia" width={560}>
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        <div style={{display:"flex", gap:10}}>
          <div style={{
            flex:1, padding:"12px 14px", borderRadius:12,
            background:C.surfaceHigh, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", gap:10,
          }}>
            <div style={{
              width:36, height:36, borderRadius:9,
              background:C.primaryDim,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Users size={16} color={C.primary}/>
            </div>
            <div>
              <div style={{fontSize:22, fontWeight:800, color:C.text, lineHeight:1}}>{count}</div>
              <div style={{fontSize:12, color:C.textSub, marginTop:2}}>Tổng participants</div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{
            padding:"0 14px", borderRadius:12,
            border:`1px solid ${C.border}`, background:"transparent",
            cursor: loading ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", gap:6,
            fontSize:12, fontWeight:600, color:C.textSub, flexShrink:0,
          }}>
            <RefreshCw size={14} style={loading ? {animation:"spin 1s linear infinite"} : {}}/>
            Tải lại
          </button>
        </div>

        {error && !loading && (
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", borderRadius:10,
            background:C.errorBg, border:`1px solid ${C.errorBorder}`,
          }}>
            <span style={{fontSize:13, color:C.error}}>{error}</span>
            <button onClick={load} style={{
              padding:"4px 10px", borderRadius:6, fontSize:12, fontWeight:700,
              border:`1px solid ${C.errorBorder}`, background:"transparent",
              color:C.error, cursor:"pointer",
            }}>Thử lại</button>
          </div>
        )}

        <div style={{
          display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
          background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:10,
        }}>
          <Search size={14} color={C.textDim}/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email hoặc vai trò..."
            style={{flex:1, border:"none", outline:"none", fontSize:13, fontFamily:C.font, color:C.text, background:"transparent"}}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", padding:0}}>
              <X size={13}/>
            </button>
          )}
        </div>

        <div style={{
          border:`1px solid ${C.border}`, borderRadius:12,
          overflow:"hidden", maxHeight:360, overflowY:"auto",
        }}>
          {loading ? (
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 20px", gap:12}}>
              <Loader2 size={28} style={{animation:"spin 1s linear infinite"}} color={C.primary}/>
              <span style={{fontSize:13, color:C.textSub, fontFamily:C.font}}>Đang tải...</span>
            </div>
          ) : filtered.length === 0 && !error ? (
            <div style={{textAlign:"center", padding:"40px 20px", color:C.textSub}}>
              <Users size={32} color={C.textDim} style={{marginBottom:10}}/>
              <div style={{fontSize:13, fontWeight:600, color:C.text}}>
                {search ? `Không tìm thấy "${search}"` : "Chưa có người tham gia"}
              </div>
              {!search && (
                <div style={{fontSize:12, color:C.textDim, marginTop:4}}>
                  Dùng "Mời hàng loạt" để thêm người tham gia
                </div>
              )}
            </div>
          ) : (
            filtered.map((p, i) => {
              const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const deleteKey    = p.participant_id ?? p.id;
              const isConfirming = confirmPid === deleteKey;
              const isDeleting   = deleting === deleteKey;
              const roleStyle    = getRoleStyle(p.role);

              return (
                <div
                  key={p.participant_id ?? p.id ?? i}
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"11px 14px",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                    background: isConfirming ? C.errorBg : "transparent",
                    transition:"background .15s",
                  }}
                >
                  <div style={{
                    width:36, height:36, borderRadius:"50%",
                    background:av.bg, color:av.color,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:700, flexShrink:0,
                  }}>
                    {getInitials(p.name, p.email)}
                  </div>

                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                      {p.name || p.email}
                    </div>
                    {p.name && (
                      <div style={{fontSize:12, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                        {p.email}
                      </div>
                    )}
                    {!p.name && (
                      <div style={{fontSize:11, color:C.textDim}}>
                        ID: {p.id ? p.id.slice(0,8) + "…" : "—"}
                      </div>
                    )}
                  </div>

                  {p.role && (
                    <span style={{
                      fontSize:11, fontWeight:700, padding:"3px 9px",
                      borderRadius:999, flexShrink:0,
                      color:roleStyle.color,
                      background:roleStyle.bg,
                      border:`1px solid ${roleStyle.border}`,
                    }}>
                      {p.role}
                    </span>
                  )}

                  {isConfirming ? (
                    <div style={{display:"flex", gap:6, flexShrink:0}}>
                      <button onClick={() => setConfirmPid(null)} style={{
                        padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600,
                        border:`1px solid ${C.border}`, background:"transparent",
                        color:C.textSub, cursor:"pointer",
                      }}>Huỷ</button>
                      <button onClick={() => handleDelete(deleteKey)} disabled={isDeleting} style={{
                        display:"flex", alignItems:"center", gap:5,
                        padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:700,
                        border:"none",
                        background: isDeleting ? C.surfaceHigh : C.error,
                        color: isDeleting ? C.textSub : "#fff",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                      }}>
                        {isDeleting ? <Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/> : <Trash2 size={11}/>}
                        Xoá
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPid(deleteKey)}
                      style={{
                        width:30, height:30, borderRadius:8, flexShrink:0,
                        border:`1px solid ${C.border}`, background:"transparent",
                        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                        color:C.textDim, transition:"all .15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.errorBorder; e.currentTarget.style.color = C.error; e.currentTarget.style.background = C.errorBg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = "transparent"; }}
                    >
                      <UserMinus size={13}/>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {!loading && !error && filtered.length > 0 && search && (
          <div style={{fontSize:12, color:C.textSub, textAlign:"center"}}>
            Hiển thị {filtered.length} / {participants.length} người
          </div>
        )}

        <div style={{display:"flex", justifyContent:"flex-end"}}>
          <button onClick={onClose} style={cancelBtn}>Đóng</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── PublishModal ───────────────────────────────────────────────── */
function PublishModal({ open, onClose, survey, onPublish }) {
  const [loading, setLoading] = useState(false);
  const isPublished = survey?.is_published;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onPublish(survey.id, { is_published: !isPublished });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isPublished ? "Ẩn khảo sát" : "Publish khảo sát"} width={400}>
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{
          padding:"16px", borderRadius:12,
          background: isPublished ? C.warningBg : C.primaryDim,
          border:`1px solid ${isPublished ? C.warningBorder : C.primaryBorder}`,
          textAlign:"center",
        }}>
          <div style={{fontSize:32, marginBottom:8}}>{isPublished ? "🔒" : "🌐"}</div>
          <div style={{fontSize:14, fontWeight:600, color:C.text}}>
            {isPublished
              ? "Khảo sát sẽ bị ẩn và không còn nhận câu trả lời mới."
              : "Khảo sát sẽ được công khai và có thể nhận câu trả lời."}
          </div>
        </div>
        <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
          <button onClick={onClose} style={cancelBtn}>Huỷ</button>
          <button onClick={handleConfirm} disabled={loading} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"9px 18px", borderRadius:10, border:"none",
            background: loading ? C.surfaceHigh : isPublished ? C.warning : C.primaryGrad,
            color: loading ? C.textSub : "#fff",
            fontSize:13, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading
              ? <><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang xử lý...</>
              : isPublished ? <><PowerOff size={13}/> Ẩn survey</> : <><Globe size={13}/> Publish</>
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── CloseModal ─────────────────────────────────────────────────── */
function CloseModal({ open, onClose, survey, onCloseSurvey }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try { await onCloseSurvey(survey.id); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Đóng khảo sát" width={400}>
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{
          padding:"16px", borderRadius:12,
          background:C.errorBg, border:`1px solid ${C.errorBorder}`,
          textAlign:"center",
        }}>
          <div style={{fontSize:32, marginBottom:8}}>⛔</div>
          <div style={{fontSize:14, fontWeight:600, color:C.text}}>
            Sau khi đóng, survey sẽ không nhận thêm câu trả lời.
          </div>
          <div style={{fontSize:12, color:C.textSub, marginTop:6}}>
            Hành động này không thể hoàn tác.
          </div>
        </div>
        <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
          <button onClick={onClose} style={cancelBtn}>Huỷ</button>
          <button onClick={handleConfirm} disabled={loading} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"9px 18px", borderRadius:10, border:"none",
            background: loading ? C.surfaceHigh : C.error,
            color: loading ? C.textSub : "#fff",
            fontSize:13, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading
              ? <><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang đóng...</>
              : <><PowerOff size={13}/> Đóng survey</>
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── ParticipantBadge ───────────────────────────────────────────── */
function ParticipantBadge({ surveyId }) {
  const { answeredBySurvey, fetchUsersAnsweredBySurvey } = useAdminStats();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (answeredBySurvey[surveyId] !== undefined) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try { await fetchUsersAnsweredBySurvey(surveyId); }
      catch {}
      finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [surveyId]);

  const count = answeredBySurvey[surveyId]?.count;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      fontSize:11, fontWeight:700, color:C.primary,
    }}>
      <Users size={11}/>
      {loading ? "..." : count !== undefined ? count : "—"}
    </span>
  );
}

/* ─── RichEditor ─────────────────────────────────────────────────── */
function RichEditor({ onChange, placeholder = "Nhập tiêu đề biểu mẫu...", hasError = false }) {
  const editorRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    updateActive();
  };

  const updateActive = () => {
    setActiveFormats({
      bold:                document.queryCommandState("bold"),
      italic:              document.queryCommandState("italic"),
      underline:           document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList:   document.queryCommandState("insertOrderedList"),
    });
  };

  const handleInput = () => {
    onChange?.(editorRef.current?.innerHTML || "");
    updateActive();
  };

  const tbBtn = (cmd, val, label, title) => {
    const active = activeFormats[cmd];
    return (
      <button
        key={`${cmd}-${val}`} type="button" title={title}
        onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
        style={{
          width:28, height:28, border:"none", borderRadius:6,
          background: active ? "rgba(108,126,247,0.18)" : "transparent",
          cursor:"pointer", color: active ? C.primary : C.textSub,
          fontFamily:C.font, fontSize:12, fontWeight:700,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"background .12s, color .12s", flexShrink:0,
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(108,126,247,0.10)"; e.currentTarget.style.color = C.primary; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; } }}
      >
        {label}
      </button>
    );
  };

  const sep = () => (
    <div style={{width:1, height:18, background:C.border, margin:"0 3px", flexShrink:0}}/>
  );

  return (
    <div style={{
      border:`1.5px solid ${hasError ? C.error : focused ? C.primary : C.border}`,
      borderRadius:10, overflow:"hidden", background:C.bg,
      transition:"border-color .15s",
    }}>
      <div style={{
        display:"flex", alignItems:"center", gap:1,
        padding:"5px 8px", background:C.surface,
        borderBottom:`1px solid ${C.border}`, flexWrap:"wrap",
      }}>
        {tbBtn("bold",               null, <b style={{fontSize:13}}>B</b>,  "Bold")}
        {tbBtn("italic",             null, <i style={{fontSize:13}}>I</i>,  "Italic")}
        {tbBtn("underline",          null, <u style={{fontSize:13}}>U</u>,  "Underline")}
        {sep()}
        {tbBtn("formatBlock", "h1",  <span style={{fontSize:11}}>H1</span>, "Heading 1")}
        {tbBtn("formatBlock", "h2",  <span style={{fontSize:11}}>H2</span>, "Heading 2")}
        {tbBtn("formatBlock", "p",   <span style={{fontSize:13}}>¶</span>,  "Paragraph")}
        {sep()}
        {tbBtn("insertUnorderedList", null, <span style={{fontSize:13,letterSpacing:-1}}>•≡</span>, "Bullet list")}
        {tbBtn("insertOrderedList",   null, <span style={{fontSize:11,letterSpacing:-1}}>1≡</span>, "Numbered list")}
        {sep()}
        {tbBtn("removeFormat", null, <X size={12}/>, "Clear formatting")}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyUp={updateActive}
        onMouseUp={updateActive}
        style={{
          minHeight:64, padding:"10px 14px",
          outline:"none", fontSize:14, color:C.text,
          lineHeight:1.6, fontFamily:C.font,
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty::before{content:attr(data-placeholder);color:${C.textDim};pointer-events:none;}
        [contenteditable] b,[contenteditable] strong{font-weight:700;}
        [contenteditable] i,[contenteditable] em{font-style:italic;}
        [contenteditable] u{text-decoration:underline;}
        [contenteditable] h1{font-size:20px;font-weight:700;margin:4px 0 2px;}
        [contenteditable] h2{font-size:16px;font-weight:700;margin:4px 0 2px;}
        [contenteditable] ul,[contenteditable] ol{padding-left:20px;}
        [contenteditable] li{margin:2px 0;}
      `}</style>
    </div>
  );
}

/* ─── ImagePicker ────────────────────────────────────────────────── */
function ImagePicker({ images, onChange }) {
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    Array.from(e.target.files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      onChange(prev => [...prev, { id: crypto.randomUUID(), url, file }]);
    });
    e.target.value = "";
  };

  const remove = (id) => {
    onChange(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:6, minWidth:80}}>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles}/>

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            width:80, height:80, borderRadius:10,
            border:`1.5px dashed ${C.border}`,
            background:"transparent", cursor:"pointer",
            color:C.textDim, display:"flex",
            flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:5,
            fontSize:10, fontFamily:C.font,
            transition:"border-color .15s, color .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}
        >
          <ImageIcon size={18}/>
          Ảnh
        </button>
      ) : (
        <div style={{display:"flex", flexDirection:"column", gap:4}}>
          <div style={{position:"relative", width:80, height:80, borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}`}}>
            <img src={images[0].url} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}}/>
            <button type="button" onClick={() => remove(images[0].id)} style={{
              position:"absolute", top:3, right:3, width:18, height:18,
              background:"rgba(0,0,0,0.75)", borderRadius:"50%",
              border:"none", cursor:"pointer", color:"#fff", fontSize:10,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <X size={10}/>
            </button>
            {images.length > 1 && (
              <div style={{
                position:"absolute", bottom:3, right:3,
                background:"rgba(0,0,0,0.65)", borderRadius:5,
                fontSize:10, color:"#fff", padding:"1px 5px", fontWeight:700,
              }}>
                +{images.length - 1}
              </div>
            )}
          </div>
          {images.slice(1).map(img => (
            <div key={img.id} style={{position:"relative", width:80, height:52, borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}`}}>
              <img src={img.url} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}}/>
              <button type="button" onClick={() => remove(img.id)} style={{
                position:"absolute", top:3, right:3, width:16, height:16,
                background:"rgba(0,0,0,0.75)", borderRadius:"50%",
                border:"none", cursor:"pointer", color:"#fff", fontSize:9,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <X size={9}/>
              </button>
            </div>
          ))}
          <button type="button" onClick={() => fileRef.current?.click()} style={{
            width:80, height:28, borderRadius:7,
            border:`1px dashed ${C.border}`, background:"transparent",
            cursor:"pointer", color:C.textDim, display:"flex",
            alignItems:"center", justifyContent:"center", gap:4,
            fontSize:10, fontFamily:C.font, transition:"border-color .15s, color .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}
          >
            <Plus size={10}/> Thêm
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── SurveyCard ─────────────────────────────────────────────────── */
function SurveyCard({
  s, index,
  onDelete, onUpdate, onOpen,
  onShare, onInvite, onBulkInvite,
  onPublish, onCloseSurvey,
  onGetParticipants, onDeleteParticipant,
  deletingId, updatingId, navigate,
}) {
  const thumb    = C.thumbColors[index % C.thumbColors.length];
  const menuRef  = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [editing,        setEditing]        = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);
  const [title,          setTitle]           = useState(s.title);
  const [description,    setDescription]     = useState(s.description || "");
  const [startAt,        setStartAt]        = useState(s.start_at ? s.start_at.slice(0,16) : "");
  const [endAt,          setEndAt]          = useState(s.end_at   ? s.end_at.slice(0,16)   : "");
  const [dateError,      setDateError]      = useState("");
  const [hovered,        setHovered]        = useState(false);

  // ── NEW: Advanced settings ──────────────────────────────────────
  const [isAnonymous,        setIsAnonymous]        = useState(s.is_anonymous ?? false);
  const [maxResponses,        setMaxResponses]        = useState(s.max_responses ?? "");
  const [randomizeQuestions,  setRandomizeQuestions]  = useState(s.randomize_questions ?? false);
  const [randomizeOptions,   setRandomizeOptions]   = useState(s.randomize_options ?? false);
  const [timeLimit,            setTimeLimit]            = useState(s.time_limit_seconds ?? "");
  const [allowBack,           setAllowBack]           = useState(s.allow_back ?? true);
  const [oneQuestionPerPage, setOneQuestionPerPage] = useState(s.one_question_per_page ?? true);
  const [thankYouMessage,      setThankYouMessage]      = useState(s.thank_you_message ?? "");
  const [thankYouRedirectUrl,  setThankYouRedirectUrl]  = useState(s.thank_you_redirect_url ?? "");
  const [logoUrl,             setLogoUrl]             = useState(s.logo_url ?? "");
  const [backgroundUrl,       setBackgroundUrl]       = useState(s.background_url ?? "");
  const [accentColor,          setAccentColor]          = useState(s.accent_color ?? "#6366f1");

  const [shareOpen,        setShareOpen]        = useState(false);
  const [inviteOpen,       setInviteOpen]       = useState(false);
  const [bulkInviteOpen,   setBulkInviteOpen]   = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [publishOpen,      setPublishOpen]      = useState(false);
  const [closeOpen,        setCloseOpen]        = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRotateX((e.clientY - rect.top - rect.height / 2) / 15);
    setRotateY((e.clientX - rect.left - rect.width / 2) / 15);
  };

  const startEdit = (e) => {
    e?.stopPropagation();
    setMenuOpen(false);
    setEditing(true);
    setDateError("");
  };

  const cancel = () => {
    setEditing(false);
    setTitle(s.title);
    setDescription(s.description || "");
    setStartAt(s.start_at ? s.start_at.slice(0,16) : "");
    setEndAt(s.end_at   ? s.end_at.slice(0,16)   : "");
    setDateError("");
    setIsAnonymous(s.is_anonymous ?? false);
    setMaxResponses(s.max_responses ?? "");
    setRandomizeQuestions(s.randomize_questions ?? false);
    setRandomizeOptions(s.randomize_options ?? false);
    setTimeLimit(s.time_limit_seconds ?? "");
    setAllowBack(s.allow_back ?? true);
    setOneQuestionPerPage(s.one_question_per_page ?? true);
    setThankYouMessage(s.thank_you_message ?? "");
    setThankYouRedirectUrl(s.thank_you_redirect_url ?? "");
    setLogoUrl(s.logo_url ?? "");
    setBackgroundUrl(s.background_url ?? "");
    setAccentColor(s.accent_color ?? "#6366f1");
    setShowSettings(false);
  };

  const save = async () => {
    if (!title.trim()) return;
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      setDateError("end_at phải sau start_at"); return;
    }
    setDateError("");
    await onUpdate(s.id, {
      title:       title.trim(),
      description: description.trim() || null,
      start_at:    startAt ? new Date(startAt).toISOString() : null,
      end_at:      endAt   ? new Date(endAt).toISOString()   : null,
      is_anonymous: isAnonymous,
      max_responses: maxResponses ? Number(maxResponses) : null,
      randomize_questions: randomizeQuestions,
      randomize_options: randomizeOptions,
      time_limit_seconds: timeLimit ? Number(timeLimit) : null,
      show_progress_bar: true,
      allow_back: allowBack,
      one_question_per_page: oneQuestionPerPage,
      thank_you_message: thankYouMessage.trim() || null,
      thank_you_redirect_url: thankYouRedirectUrl.trim() || null,
      logo_url: logoUrl.trim() || null,
      background_url: backgroundUrl.trim() || null,
      accent_color: accentColor || "#6366f1",
    });
    setEditing(false);
    setShowSettings(false);
  };

  const isDeleting  = deletingId === s.id;
  const isSaving    = updatingId === s.id;
  const isClosed    = s.status === "CLOSED";
  const isPublished = s.is_published;
  const isOwner     = s.isOwner;

  const ownerBorderColor = "#6c7ef7";

  const menuItems = [
    { icon:<Pencil size={13}/>,    label:"Thiết kế",         action:() => { navigate(`/admin/surveys/${s.id}/studio`); setMenuOpen(false); } },
    { icon:<Settings size={13}/>,   label:"Cài đặt nâng cao", action:() => { startEdit(); setMenuOpen(false); } },
    { icon:<BarChart3 size={13}/>,  label:"Phân tích",        action:() => { navigate(`/admin/surveys/${s.id}/studio?tab=analyze`); setMenuOpen(false); } },
    { icon:<Share2 size={13}/>,    label:"Tạo link chia sẻ", action:() => { setShareOpen(true); setMenuOpen(false); } },
    { icon:<Mail size={13}/>,      label:"Mời người dùng",   action:() => { setInviteOpen(true); setMenuOpen(false); } },
    { icon:<UserPlus size={13}/>,  label:"Mời hàng loạt",    action:() => { setBulkInviteOpen(true); setMenuOpen(false); }, color:C.primary },
    { icon:<Users size={13}/>,     label:"Xem participants",  action:() => { setParticipantsOpen(true); setMenuOpen(false); } },
    {
      icon: isPublished ? <Lock size={13}/> : <Globe size={13}/>,
      label: isPublished ? "Ẩn survey" : "Publish",
      action: () => { setPublishOpen(true); setMenuOpen(false); },
      color: isPublished ? C.warning : C.primary,
    },
    !isClosed && {
      icon:<PowerOff size={13}/>, label:"Đóng survey",
      action:() => { setCloseOpen(true); setMenuOpen(false); },
      color:"#6b7280",
    },
    { icon:<Trash2 size={13}/>, label:"Xóa", action:() => onDelete(s.id), color:C.error },
  ].filter(Boolean);

  const cardTheme = (() => {
    const MAP = {
      ACTIVE:    { mesh:"linear-gradient(135deg, #f0f2ff 0%, #e8ebff 50%, #dde2ff 100%)", accent:"#6366f1" },
      DRAFT:     { mesh:"linear-gradient(135deg, #f8f9fa 0%, #f1f5f9 50%, #e8ecf2 100%)", accent:"#94a3b8" },
      EXPIRED:   { mesh:"linear-gradient(135deg, #fff5f5 0%, #ffe8e8 50%, #ffd9d9 100%)", accent:"#ef4444" },
      CLOSED:    { mesh:"linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #eceef1 100%)", accent:"#9ca3af" },
      SCHEDULED: { mesh:"linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #cce9fb 100%)", accent:"#0284c7" },
      COMPLETED: { mesh:"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #c4e4ce 100%)", accent:"#059669" },
    };
    return MAP[s.status] || MAP.DRAFT;
  })();

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setRotateX(0); setRotateY(0); }}
        onMouseMove={handleMouseMove}
        style={{
          background:      C.surface,
          borderColor:    hovered ? "#d0d7e8" : "#e8ecf2",
          borderWidth:    "1px",
          borderStyle:    "solid",
          borderRadius:   12,
          overflow:      "hidden",
          cursor:        "pointer",
          transition:    "border-color .2s, box-shadow .25s, transform .5s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow:     hovered
            ? "0 12px 32px rgba(0,0,0,0.09), 0 3px 8px rgba(0,0,0,0.04)"
            : "0 1px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
          transform:     `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          display:       "flex",
          flexDirection: "column",
          perspective:   "1200px",
          transformStyle:"preserve-3d",
          animation:     `slideInUp 0.8s ease-out ${0.1 + index * 0.1}s both`,
        }}
        onClick={() => !editing && onOpen(s.id)}
      >
        {/* Header — pastel mesh gradient + icon */}
        <div style={{
          height:110,
          background: isClosed
            ? "linear-gradient(135deg,#f3f4f6,#e5e7eb)"
            : cardTheme.mesh,
          position:"relative",
          overflow:"hidden", flexShrink:0,
        }}>
          {/* Radial highlight */}
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 65%)", pointerEvents:"none" }} />
          {/* Bottom fade */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:28, background:"linear-gradient(to top, #fff 20%, transparent)", pointerEvents:"none" }} />

          {/* Floating icon */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:56, height:56,
            borderRadius:14,
            background:"rgba(255,255,255,0.55)",
            backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
            border:"1.5px solid rgba(255,255,255,0.7)",
            boxShadow:"0 6px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              width:30, height:30, borderRadius:8,
              background:"rgba(255,255,255,0.55)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <FileText size={18} color={cardTheme.accent} strokeWidth={1.5} />
            </div>
          </div>

          {/* Top-left badges */}
          <div style={{position:"absolute", top:10, left:10, display:"flex", flexDirection:"column", gap:4, zIndex:10}}>
            {isOwner && (
              <span style={{
                fontSize:9.5, fontWeight:700, padding:"3px 8px",
                borderRadius:6, color:"#fff",
                background:"linear-gradient(90deg, #6c7ef7, #4f6ef7)",
                boxShadow:"0 2px 8px rgba(108,126,247,0.4)",
                display:"flex", alignItems:"center", gap:3,
              }}>
                ★ Biểu mẫu của bạn
              </span>
            )}
            {s.status && <StatusBadge status={s.status}/>}
            {isPublished && (
              <span style={{
                fontSize:9.5, fontWeight:700, padding:"3px 8px",
                borderRadius:6, color:"#059669",
                background:"rgba(5,150,105,0.10)",
                border:"1px solid rgba(5,150,105,0.20)",
                display:"flex", alignItems:"center", gap:3,
              }}>
                <Globe size={9}/> Published
              </span>
            )}
          </div>

          {/* Quick action buttons — top-right */}
          {!editing && (
            <div style={{position:"absolute", top:10, right:10, display:"flex", gap:5, zIndex:10}} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShareOpen(true)} title="Chia sẻ" style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#6366f1"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.55)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"; }}>
                <Share2 size={12}/>
              </button>
              <button onClick={() => setInviteOpen(true)} title="Mời người dùng" style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#6366f1"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.55)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"; }}>
                <Mail size={12}/>
              </button>
              <button onClick={() => setBulkInviteOpen(true)} title="Mời hàng loạt" style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#6366f1"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.55)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"; }}>
                <UserPlus size={12}/>
              </button>
              <button onClick={() => setParticipantsOpen(true)} title="Xem participants" style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#6366f1"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.55)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"; }}>
                <Users size={12}/>
              </button>
              <button
                onClick={() => setPublishOpen(true)} title={isPublished ? "Ẩn survey" : "Publish"}
                style={{
                  ...quickBtn,
                  background: isPublished ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.55)",
                  borderColor: isPublished ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.7)",
                  color: isPublished ? "#d97706" : "#64748b",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#d97706"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#d97706"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isPublished ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.55)"; e.currentTarget.style.color = isPublished ? "#d97706" : "#64748b"; e.currentTarget.style.borderColor = isPublished ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.7)"; }}>
                {isPublished ? <Lock size={12}/> : <Globe size={12}/>}
              </button>
              {!isClosed && (
                <button onClick={() => setCloseOpen(true)} title="Đóng survey" style={quickBtn}
                  onMouseEnter={e => { e.currentTarget.style.background = "#6b7280"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#6b7280"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.55)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"; }}>
                  <PowerOff size={12}/>
                </button>
              )}
            </div>
          )}

          {/* 3-dot menu */}
          <div ref={menuRef} style={{position:"absolute", top:10, right: isEditing ? 10 : "auto", left: isEditing ? 10 : "auto", display: isEditing ? "block" : "none", zIndex:20}} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                width:26, height:26, borderRadius:8,
                background: menuOpen ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.55)",
                backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,0.7)",
                cursor:"pointer", color:"#64748b",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"background .15s",
              }}
            >
              <MoreVertical size={14}/>
            </button>
            {menuOpen && (
              <div style={{
                position:"absolute", top:30, right:0, zIndex:20, width:190,
                background:C.surfaceHigh, border:`1px solid #e8ecf2`,
                borderRadius:10, overflow:"hidden",
                boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
                animation:"slideInUp 0.15s ease-out",
              }}>
                {menuItems.map((item, i) => (
                  <button key={i} onClick={item.action} style={{
                    display:"flex", alignItems:"center", gap:10,
                    width:"100%", padding:"9px 14px",
                    background:"transparent", border:"none",
                    fontSize:13, fontWeight:500,
                    color: item.color || C.text,
                    cursor:"pointer", fontFamily:C.font,
                    borderBottom: i < menuItems.length - 1 ? `1px solid #f4f6f8` : "none",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f4f6f8"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {isDeleting && item.label === "Xóa"
                      ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>
                      : item.icon
                    }
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div
          style={{padding:"12px 14px 14px", flex:1, display:"flex", flexDirection:"column", gap:4}}
          onClick={e => editing && e.stopPropagation()}
        >
          {editing ? (
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Tiêu đề *"
                style={{...inputStyle, fontSize:13, padding:"7px 10px"}}
                onKeyDown={e => { if (e.key === "Escape") cancel(); }}
              />
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả" rows={2}
                style={{...textareaStyle, fontSize:13, padding:"7px 10px"}}
              />
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
                <div>
                  <label style={{fontSize:11, color:C.textSub, display:"block", marginBottom:3}}>Bắt đầu</label>
                  <input type="datetime-local" value={startAt}
                    onChange={e => { setStartAt(e.target.value); setDateError(""); }}
                    style={{...inputStyle, fontSize:12, padding:"6px 10px"}}/>
                </div>
                <div>
                  <label style={{fontSize:11, color:C.textSub, display:"block", marginBottom:3}}>Kết thúc</label>
                  <input type="datetime-local" value={endAt}
                    onChange={e => { setEndAt(e.target.value); setDateError(""); }}
                    style={{...inputStyle, fontSize:12, padding:"6px 10px"}}/>
                </div>
              </div>
              {dateError && (
                <div style={{fontSize:11, color:C.error, display:"flex", alignItems:"center", gap:4}}>
                  <AlertCircle size={11}/> {dateError}
                </div>
              )}

              {/* ── Advanced settings toggle ─────────────────────────────── */}
              <div>
                <button
                  onClick={() => setShowSettings(v => !v)}
                  style={{
                    display:"flex", alignItems:"center", gap:6,
                   border:`1px solid ${showSettings ? C.primaryBorder : C.border}`,
                    borderRadius:8, padding:"6px 12px",
                    color: showSettings ? C.primary : C.textSub,
                    fontSize:12, fontWeight:600, cursor:"pointer",
                    fontFamily:C.font, transition:"all .15s",
                    background: showSettings ? C.primaryDim : "transparent",
                  }}
                >
                  <Settings size={13}/> {showSettings ? "Ẩn cài đặt nâng cao" : "Cài đặt nâng cao"}
                </button>

                {showSettings && (
                  <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10, padding:"12px", background:C.bg, borderRadius:10, border:`1px solid ${C.border}` }}>
                    {/* Row 1 */}
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                      <div style={{display:"flex", flexDirection:"column", gap:4}}>
                        <label style={{fontSize:11, color:C.textSub, fontWeight:600}}>Ẩn danh</label>
                        <ToggleSwitch checked={isAnonymous} onChange={setIsAnonymous} />
                      </div>
                      <div style={{display:"flex", flexDirection:"column", gap:4}}>
                        <label style={{fontSize:11, color:C.textSub, fontWeight:600}}>Giới hạn phản hồi</label>
                        <input type="number" value={maxResponses} onChange={e => setMaxResponses(e.target.value)}
                          placeholder="Không giới hạn"
                          style={{...inputStyle, fontSize:12, padding:"6px 10px"}}/>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:6}}>
                        <label style={{fontSize:11, color:C.textSub, fontWeight:600}}>Xáo trộn câu hỏi</label>
                        <ToggleSwitch checked={randomizeQuestions} onChange={setRandomizeQuestions} />
                      </div>
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:6}}>
                        <label style={{fontSize:11, color:C.textSub, fontWeight:600}}>Xáo trộn lựa chọn</label>
                        <ToggleSwitch checked={randomizeOptions} onChange={setRandomizeOptions} />
                      </div>
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:6}}>
                        <label style={{fontSize:11, color:C.textSub, fontWeight:600}}>Cho phép quay lại</label>
                        <ToggleSwitch checked={allowBack} onChange={setAllowBack} />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
                      <div style={{display:"flex", flexDirection:"column", gap:4}}>
                        <label style={{fontSize:11, color:C.textSub, fontWeight:600}}>Giới hạn thời gian (giây)</label>
                        <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
                          placeholder="0 = không giới hạn" min={30}
                          style={{...inputStyle, fontSize:12, padding:"6px 10px"}}/>
                      </div>
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:6}}>
                        <label style={{fontSize:11, color:C.textSub, fontWeight:600}}>1 câu/trang</label>
                        <ToggleSwitch checked={oneQuestionPerPage} onChange={setOneQuestionPerPage} />
                      </div>
                      <div style={{display:"flex", flexDirection:"column", gap:4}}>
                        <label style={{fontSize:11, color:C.textSub, fontWeight:600}}>Màu chủ đạo</label>
                        <div style={{display:"flex", alignItems:"center", gap:8}}>
                          <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                            style={{width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, cursor:"pointer", padding:0, background:"transparent"}}/>
                          <span style={{fontSize:11, color:C.textSub, fontFamily:"monospace"}}>{accentColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Logo URL */}
                    <div>
                      <label style={{fontSize:11, color:C.textSub, fontWeight:600, display:"block", marginBottom:4}}>Logo URL</label>
                      <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        style={{...inputStyle, fontSize:12, padding:"6px 10px"}}/>
                    </div>

                    {/* Background URL */}
                    <div>
                      <label style={{fontSize:11, color:C.textSub, fontWeight:600, display:"block", marginBottom:4}}>Ảnh nền URL</label>
                      <input type="url" value={backgroundUrl} onChange={e => setBackgroundUrl(e.target.value)}
                        placeholder="https://example.com/bg.jpg"
                        style={{...inputStyle, fontSize:12, padding:"6px 10px"}}/>
                    </div>

                    {/* Thank you message */}
                    <div>
                      <label style={{fontSize:11, color:C.textSub, fontWeight:600, display:"block", marginBottom:4}}>Tin nhắn cảm ơn</label>
                      <textarea value={thankYouMessage} onChange={e => setThankYouMessage(e.target.value)}
                        placeholder="Cảm ơn bạn đã tham gia khảo sát!"
                        rows={2}
                        style={{...textareaStyle, fontSize:12, padding:"6px 10px"}}/>
                    </div>

                    {/* Thank you redirect URL */}
                    <div>
                      <label style={{fontSize:11, color:C.textSub, fontWeight:600, display:"block", marginBottom:4}}>URL chuyển hướng sau khi hoàn thành</label>
                      <input type="url" value={thankYouRedirectUrl} onChange={e => setThankYouRedirectUrl(e.target.value)}
                        placeholder="https://example.com/thank-you"
                        style={{...inputStyle, fontSize:12, padding:"6px 10px"}}/>
                      <p style={{fontSize:11, color:C.textDim, margin:"3px 0 0"}}>Người trả lời sẽ được chuyển đến URL này sau khi gửi khảo sát.</p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{display:"flex", gap:6, justifyContent:"flex-end"}}>
                <button onClick={cancel} style={cancelBtn}>Huỷ</button>
                <button onClick={save} disabled={isSaving} style={{
                  ...saveBtn,
                  background: isSaving ? C.surfaceHigh : C.primaryGrad,
                  color: isSaving ? C.textSub : "#fff",
                }}>
                  {isSaving
                    ? <Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>
                    : <Check size={11}/>
                  }
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{
                fontSize:14, fontWeight:700, color:C.text, lineHeight:1.4,
                display:"-webkit-box", WebkitLineClamp:2,
                WebkitBoxOrient:"vertical", overflow:"hidden",
              }}>
                {s.title}
              </div>

              {(s.start_at || s.end_at) && (
                <div style={{display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.textSub, marginTop:2}}>
                  <Calendar size={10}/>
                  {s.start_at && (
                    <span>{new Date(s.start_at).toLocaleDateString("vi-VN", {day:"2-digit", month:"2-digit"})}</span>
                  )}
                  {s.start_at && s.end_at && <span>→</span>}
                  {s.end_at && (
                    <span>{new Date(s.end_at).toLocaleDateString("vi-VN", {day:"2-digit", month:"2-digit", year:"numeric"})}</span>
                  )}
                </div>
              )}

              <div style={{fontSize:12, color:C.textDim, marginTop:1}}>
                {s.created_at ? new Date(s.created_at).toLocaleDateString("vi-VN", {day:"2-digit", month:"2-digit", year:"numeric"}) : ""}
              </div>

              {s.creator && !isOwner && (
                <div style={{display:"flex", alignItems:"center", gap:5, marginTop:4}}>
                  <div style={{
                    width:18, height:18, borderRadius:"50%",
                    background:"rgba(100,116,139,0.15)", color:"#64748b",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:9, fontWeight:700, flexShrink:0,
                  }}>
                    {(s.creator.full_name || s.creator.email || "?")[0].toUpperCase()}
                  </div>
                  <span style={{fontSize:11, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                    {s.creator.full_name || s.creator.email}
                  </span>
                </div>
              )}

              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:6}}>
                <ParticipantBadge surveyId={s.id}/>

                {/* Chip action buttons */}
                <div style={{display:"flex", gap:5}} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShareOpen(true)} style={chipBtn} title="Link chia sẻ"
                    onMouseEnter={e => { e.currentTarget.style.background = C.primaryDim; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}>
                    <LinkIcon size={11}/>
                  </button>
                  <button onClick={() => setInviteOpen(true)} style={chipBtn} title="Mời email"
                    onMouseEnter={e => { e.currentTarget.style.background = C.primaryDim; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}>
                    <Mail size={11}/>
                  </button>
                  <button onClick={() => setBulkInviteOpen(true)} style={chipBtn} title="Mời hàng loạt"
                    onMouseEnter={e => { e.currentTarget.style.background = C.primaryDim; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}>
                    <UserPlus size={11}/>
                  </button>
                  <button onClick={() => setParticipantsOpen(true)} style={chipBtn} title="Participants"
                    onMouseEnter={e => { e.currentTarget.style.background = C.primaryDim; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}>
                    <Users size={11}/>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals — outside the card div, inside the Fragment */}
      <ShareLinkModal open={shareOpen} onClose={() => setShareOpen(false)} survey={s} onShare={onShare}/>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} survey={s} onInvite={onInvite}/>
      <BulkInviteModal open={bulkInviteOpen} onClose={() => setBulkInviteOpen(false)} survey={s} onBulkInvite={onBulkInvite}/>
      <ParticipantsModal
        open={participantsOpen} onClose={() => setParticipantsOpen(false)}
        survey={s} onGetParticipants={onGetParticipants} onDeleteParticipant={onDeleteParticipant}
      />
      <PublishModal open={publishOpen} onClose={() => setPublishOpen(false)} survey={s} onPublish={onPublish}/>
      <CloseModal open={closeOpen} onClose={() => setCloseOpen(false)} survey={s} onCloseSurvey={onCloseSurvey}/>
    </>
  );
}

/* ─── SurveyPage (Admin) ─────────────────────────────────────────── */
export default function SurveyPage() {
  const {
    createSurvey, deleteSurvey, updateSurvey,
    publishSurvey, closeSurvey,
    shareLink, inviteSurvey, bulkInviteSurvey,
    getParticipants, deleteParticipant,
  } = useSurvey();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [surveys,     setSurveys]     = useState([]);
  const [fetchError,  setFetchError]  = useState(null);
  const [fetching,    setFetching]    = useState(false);

  const [titleHtml,   setTitleHtml]   = useState("");
  const [description, setDescription] = useState("");
  const [startAt,     setStartAt]     = useState("");
  const [endAt,       setEndAt]       = useState("");
  const [images,      setImages]      = useState([]);

  const [formError,   setFormError]   = useState("");
  const [dateError,   setDateError]   = useState("");
  const [showForm,    setShowForm]    = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [updatingId,  setUpdatingId]  = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search,          setSearch]          = useState("");
  const [creatorFilter,   setCreatorFilter]   = useState(""); // filter by creator name
  const [selectedCreator, setSelectedCreator]  = useState(""); // filter by creator id

  const currentUserId = currentUser?.user_id || currentUser?.id || null;

  const htmlToText = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.innerText || div.textContent || "";
  };

  const normalize = (s) => ({
    id:           s.id,
    title:        s.title,
    description:  s.description ?? null,
    is_published: s.is_published,
    start_at:     s.start_at   ?? null,
    end_at:       s.end_at     ?? null,
    status:       s.status     ?? null,
    created_at:   s.created_at ?? null,
    created_by:   s.created_by ?? null,
    creator:      s.creator ?? null,
    isOwner:      (s.created_by === currentUserId) || (s.creator?.id === currentUserId),
  });

  const fetchAll = async () => {
    setFetchError(null); setFetching(true);
    try {
      const res  = await surveyService.getAllSurveys();
      const data = res.data ?? res;
      setSurveys((data.surveys || []).map(normalize));
    } catch { setFetchError("Không thể tải danh sách khảo sát."); }
    finally   { setFetching(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setTitleHtml(""); setDescription(""); setStartAt(""); setEndAt("");
    setFormError(""); setDateError("");
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const plainTitle = htmlToText(titleHtml).trim();
    if (!plainTitle) { setFormError("Tiêu đề không được để trống."); return; }
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      setDateError("end_at phải sau start_at"); return;
    }

    const payload = {
      title:       plainTitle,
      description: description.trim() || null,
      start_at:    startAt ? new Date(startAt).toISOString() : null,
      end_at:      endAt   ? new Date(endAt).toISOString()   : null,
    };

    const snap = { ...payload };
    setShowForm(false); resetForm(); setFormLoading(true);

    try {
      await createSurvey(snap);
      await fetchAll();
    } catch {
      setShowForm(true);
      setTitleHtml(snap.title);
      setDescription(snap.description || "");
    } finally { setFormLoading(false); }
  };

  const handleUpdate = async (id, payload) => {
    setUpdatingId(id);
    try {
      const updated = await updateSurvey(id, payload);
      if (!updated?.id) { await fetchAll(); return; }
      setSurveys(prev => prev.map(s => s.id === id ? normalize(updated) : s));
    } catch {}
    finally { setUpdatingId(null); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteSurvey(id);
      setSurveys(prev => prev.filter(s => s.id !== id));
    } catch {}
    finally { setDeletingId(null); }
  };

  const filtered = surveys.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) &&
    (!selectedCreator || s.created_by === selectedCreator)
  );

  // Derived: unique creators from all surveys (for dropdown)
  const creatorMap2 = new Map();
  surveys.forEach(s => {
    if (s.creator && !creatorMap2.has(s.creator.id)) {
      creatorMap2.set(s.creator.id, s.creator);
    }
  });
  const allCreators = Array.from(creatorMap2.values()).sort((a, b) =>
    (a.full_name || "").localeCompare(b.full_name || "")
  );

  // Sort: admin's surveys first (isOwner), then by creator name, then by created_at desc
  const sortedSurveys = [...filtered].sort((a, b) => {
    if (a.isOwner && !b.isOwner) return -1;
    if (!a.isOwner && b.isOwner) return 1;
    const nameA = a.creator?.full_name || a.creator?.email || "";
    const nameB = b.creator?.full_name || b.creator?.email || "";
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const [shareModal, setShareModal] = useState({ open: false, surveyId: null, surveyTitle: "", shareUrl: "", loading: false, error: "" });

  const handleShare = useCallback((surveyId) => {
    const s = surveys.find(x => x.id === surveyId);
    setShareModal({ open: true, surveyId, surveyTitle: s?.title || "", shareUrl: "", loading: false, error: "" });
  }, [surveys]);

  const handleGenerateLink = async () => {
    setShareModal(p => ({ ...p, loading: true, error: "" }));
    try {
      const result = await shareLink(shareModal.surveyId);
      const url = typeof result === "string" ? result : result?.url ?? result?.data?.url ?? "";
      setShareModal(p => ({ ...p, shareUrl: url, loading: false }));
    } catch {
      setShareModal(p => ({ ...p, loading: false, error: "Tạo link thất bại. Vui lòng thử lại." }));
    }
  };

  const handleClose = useCallback(async (surveyId) => {
    try { await closeSurvey(surveyId); await fetchAll(); }
    catch (err) { console.error(err); }
  }, [closeSurvey, fetchAll]);

  const handleOpen = useCallback((surveyId) => {
    navigate(`/admin/surveys/${surveyId}/studio`);
  }, [navigate]);

  const handlePublish = useCallback(async (surveyId) => {
    setUpdatingId(surveyId);
    try {
      await publishSurvey(surveyId, {});
      await fetchAll();
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  }, [publishSurvey, fetchAll]);

  const dateInp = {
    width:"100%", boxSizing:"border-box", padding:"9px 12px",
    background:C.bg, border:`1.5px solid ${C.border}`,
    borderRadius:10, color:C.text, fontSize:13,
    fontFamily:C.font, outline:"none", colorScheme:"dark",
  };

  return (
    <div style={{minHeight:"100vh", background:C.bg, fontFamily:C.font}}>

      {/* ── Top bar ── */}
      <div style={{
        background:C.surface, borderBottom:`1px solid ${C.border}`,
        padding:"0 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        height:64, gap:16,
      }}>
        <div style={{display:"flex", alignItems:"center", gap:10, flexShrink:0}}>
          <div style={{
            width:36, height:36, borderRadius:8,
            background:C.primaryGrad,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <ClipboardList size={20} color="#fff"/>
          </div>
          <span style={{fontSize:18, fontWeight:700, color:C.text, letterSpacing:"-0.02em"}}>
            Biểu mẫu
          </span>
        </div>

        {/* Search + Creator filter */}
        <div style={{display:"flex", alignItems:"center", gap:10, flex:1, maxWidth:600}}>
          <div style={{
            flex:1, maxWidth:360,
            display:"flex", alignItems:"center", gap:10,
            background:C.surfaceHigh, border:`1px solid ${C.border}`,
            borderRadius:24, padding:"0 16px", height:40,
          }}>
            <Search size={15} color={C.textSub}/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm"
              style={{
                flex:1, background:"transparent", border:"none",
                outline:"none", fontSize:14, color:C.text, fontFamily:C.font,
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", padding:0}}>
                <X size={14}/>
              </button>
            )}
          </div>

          {/* Creator filter dropdown */}
          {allCreators.length > 0 && (
            <select
              value={selectedCreator}
              onChange={e => setSelectedCreator(e.target.value)}
              style={{
                height:40, padding:"0 12px",
                background:C.surfaceHigh, border:`1px solid ${C.border}`,
                borderRadius:10, color:C.text, fontSize:13,
                fontFamily:C.font, outline:"none", cursor:"pointer",
              }}
            >
              <option value="">Tất cả người tạo</option>
              {allCreators.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id === currentUserId ? "Biểu mẫu của bạn" : (c.full_name || c.email)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Btn */}
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          {formLoading && <Loader2 size={14} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>}
          <button
            onClick={() => { setShowForm(v => !v); resetForm(); }}
            style={{
              display:"flex", alignItems:"center", gap:7,
              padding:"8px 18px",
              background: showForm ? C.surfaceHigh : C.primaryGrad,
              color:      showForm ? C.textSub     : "#fff",
              border:     showForm ? `1px solid ${C.border}` : "none",
              borderRadius:10, fontSize:13, fontWeight:700,
              cursor:"pointer", flexShrink:0,
              boxShadow: showForm ? "none" : "0 2px 12px rgba(79,110,247,0.35)",
              fontFamily:C.font,
            }}
          >
            {showForm ? <X size={15}/> : <Plus size={15}/>}
            {showForm ? "Huỷ" : "Biểu mẫu mới"}
          </button>
        </div>
      </div>

      <div style={{maxWidth:1080, margin:"0 auto", padding:"32px 24px"}}>

        {/* ── Create form ── */}
        {showForm && (
          <div style={{
            background:C.surface, border:`1px solid ${C.borderHover}`,
            borderRadius:16, padding:"1.5rem", marginBottom:"2rem",
            boxShadow:"0 4px 32px rgba(0,0,0,0.5)",
            borderLeft:`4px solid ${C.primary}`,
          }}>
            <h2 style={{fontSize:15, fontWeight:700, color:C.text, margin:"0 0 16px"}}>
              Biểu mẫu mới
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{display:"flex", flexDirection:"column", gap:12}}>

                <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
                  <div style={{flex:1, minWidth:0}}>
                    <RichEditor
                      onChange={(html) => { setTitleHtml(html); setFormError(""); }}
                      placeholder="Tiêu đề biểu mẫu *"
                      hasError={!!formError}
                    />
                    {formError && (
                      <div style={{display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.error, marginTop:5}}>
                        <AlertCircle size={12}/> {formError}
                      </div>
                    )}
                  </div>
                  <ImagePicker images={images} onChange={setImages}/>
                </div>

                <textarea
                  placeholder="Mô tả (tuỳ chọn)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  style={{
                    width:"100%", boxSizing:"border-box", padding:"10px 14px",
                    border:`1.5px solid ${C.border}`, borderRadius:10,
                    fontSize:14, color:C.text, background:C.bg,
                    outline:"none", resize:"vertical", fontFamily:C.font,
                  }}
                />

                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                  <div>
                    <label style={{fontSize:12, color:C.textSub, display:"block", marginBottom:5}}>
                      Ngày bắt đầu <span style={{color:C.textDim}}>(tuỳ chọn)</span>
                    </label>
                    <input type="datetime-local" value={startAt}
                      onChange={e => { setStartAt(e.target.value); setDateError(""); }}
                      style={dateInp}/>
                  </div>
                  <div>
                    <label style={{fontSize:12, color:C.textSub, display:"block", marginBottom:5}}>
                      Ngày kết thúc <span style={{color:C.textDim}}>(tuỳ chọn)</span>
                    </label>
                    <input type="datetime-local" value={endAt}
                      onChange={e => { setEndAt(e.target.value); setDateError(""); }}
                      style={dateInp}/>
                  </div>
                </div>

                {dateError && (
                  <div style={{display:"flex", alignItems:"center", gap:6, fontSize:13, color:C.error}}>
                    <AlertCircle size={14}/> {dateError}
                  </div>
                )}

                <div style={{display:"flex", justifyContent:"flex-end", gap:10}}>
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={cancelBtn}>
                    Huỷ
                  </button>
                  <button type="submit" disabled={formLoading} style={{
                    display:"flex", alignItems:"center", gap:7,
                    padding:"9px 18px",
                    background: formLoading ? C.surfaceHigh : C.primaryGrad,
                    color:      formLoading ? C.textSub     : "#fff",
                    border:     formLoading ? `1px solid ${C.border}` : "none",
                    borderRadius:11, fontSize:13, fontWeight:700,
                    cursor: formLoading ? "not-allowed" : "pointer",
                    fontFamily:C.font,
                    boxShadow: formLoading ? "none" : "0 2px 12px rgba(79,110,247,0.35)",
                  }}>
                    {formLoading
                      ? <><Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> Đang tạo...</>
                      : <><Plus size={14}/> Tạo biểu mẫu</>
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Section title */}
        {!search && surveys.length > 0 && (
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
            <h2 style={{
              fontSize:13, fontWeight:700, color:C.textSub,
              textTransform:"uppercase", letterSpacing:"0.06em", margin:0,
            }}>
              Biểu mẫu gần đây
            </h2>
            <span style={{fontSize:12, color:C.textDim}}>{surveys.length} biểu mẫu</span>
          </div>
        )}

        {/* Grid */}
        {surveys.length > 0 && !fetching && sortedSurveys.length > 0 && (
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",
            gap:16,
            marginBottom:32,
          }}>
            {sortedSurveys.map((s, i) => (
              <SurveyCard
                key={s.id}
                s={s}
                index={i}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onOpen={handleOpen}
                onShare={handleShare}
                onInvite={inviteSurvey}
                onBulkInvite={bulkInviteSurvey}
                onPublish={handlePublish}
                onCloseSurvey={handleClose}
                onGetParticipants={getParticipants}
                onDeleteParticipant={deleteParticipant}
                deletingId={deletingId}
                updatingId={updatingId}
                navigate={navigate}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {fetchError && (
          <div style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"14px 18px", background:"rgba(239,68,68,0.08)",
            border:"1px solid rgba(239,68,68,0.2)", borderRadius:12,
            marginBottom:"1.5rem", fontSize:14, color:"#fca5a5",
          }}>
            <AlertCircle size={16} color={C.error}/>
            {fetchError}
            <button onClick={fetchAll} style={{
              marginLeft:"auto", fontSize:13, fontWeight:600,
              color:C.primary, background:"none", border:"none", cursor:"pointer",
            }}>
              Thử lại
            </button>
          </div>
        )}

        {/* Loading */}
        {fetching && surveys.length === 0 && (
          <div style={{display:"flex", justifyContent:"center", padding:"5rem 0", color:C.textDim}}>
            <Loader2 size={32} style={{animation:"spin 1s linear infinite"}}/>
          </div>
        )}

        {/* Empty */}
        {!fetching && surveys.length === 0 && !fetchError && (
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"6rem 0", gap:14}}>
            <div style={{
              width:72, height:72, borderRadius:18,
              background:"linear-gradient(135deg,#1b2244,#222d5a)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <ClipboardList size={32} color={C.primary}/>
            </div>
            <p style={{fontSize:16, fontWeight:600, color:C.textSub, margin:0}}>Chưa có biểu mẫu nào</p>
            <p style={{fontSize:13, color:C.textDim, margin:0}}>Tạo biểu mẫu đầu tiên để bắt đầu thu thập câu trả lời</p>
            <button onClick={() => setShowForm(true)} style={{
              display:"flex", alignItems:"center", gap:7,
              padding:"10px 20px", background:C.primaryGrad,
              color:"#fff", border:"none", borderRadius:11,
              fontSize:13, fontWeight:700, cursor:"pointer",
              fontFamily:C.font, boxShadow:"0 2px 12px rgba(79,110,247,0.35)",
            }}>
              <Plus size={15}/> Tạo biểu mẫu mới
            </button>
          </div>
        )}

        {/* No search/filter results */}
        {surveys.length > 0 && !fetching && sortedSurveys.length === 0 && (
          <div style={{textAlign:"center", padding:"4rem 0", color:C.textSub}}>
            <Search size={32} style={{opacity:0.3, marginBottom:12}}/>
            <p style={{margin:0}}>
              Không tìm thấy biểu mẫu nào cho "<strong>{search || selectedCreator ? "bộ lọc hiện tại" : ""}</strong>"
            </p>
          </div>
        )}
      </div>

      <ShareModal
        open={shareModal.open}
        onClose={() => setShareModal(p => ({ ...p, open: false }))}
        surveyTitle={shareModal.surveyTitle}
        shareUrl={shareModal.shareUrl}
        loading={shareModal.loading}
        error={shareModal.error}
        onGenerate={handleGenerateLink}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
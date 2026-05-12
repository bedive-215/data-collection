// ─── SurveyPage.jsx ─── Admin, dark theme ──
import React, { useEffect, useState, useRef, useCallback } from "react";
import surveyService from "@/services/surveyService";
import { useSurvey } from "@/providers/SurveyProvider";
import { useAdminStats } from "@/providers/AdminStatsProvider";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, FileText, ClipboardList,
  Loader2, AlertCircle, X, Pencil, Check,
  Users, MoreVertical, Copy, Search, Calendar,
  Image as ImageIcon, Share2, Mail, Lock, Globe,
  Power, PowerOff, ExternalLink, Link as LinkIcon,
  Send, UserPlus, UserMinus, RefreshCw, ChevronDown,
} from "lucide-react";

/* ─── Token ──────────────────────────────────────────────────────── */
const C = {
  bg:            "#080b14",
  surface:       "#0d1120",
  surfaceHigh:   "#111827",
  border:        "#1a2035",
  borderHover:   "#2e3d70",
  primary:       "#6c7ef7",
  primaryGrad:   "linear-gradient(135deg,#4f6ef7,#6c7ef7)",
  primaryDim:    "rgba(108,126,247,0.10)",
  primaryBorder: "#2a3464",
  text:          "#f1f5f9",
  textSub:       "#64748b",
  textDim:       "#334155",
  error:         "#ef4444",
  errorBg:       "rgba(239,68,68,0.10)",
  errorBorder:   "rgba(239,68,68,0.25)",
  success:       "#22c55e",
  successBg:     "rgba(34,197,94,0.10)",
  successBorder: "rgba(34,197,94,0.25)",
  warning:       "#f59e0b",
  warningBg:     "rgba(245,158,11,0.10)",
  warningBorder: "rgba(245,158,11,0.25)",
  font:          "'DM Sans','Plus Jakarta Sans',sans-serif",
  thumbColors: [
    "conic-gradient(from 0deg at 50% 50%, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #ff6b6b)",
    "conic-gradient(from 0deg at 50% 50%, #a8edea, #fed6e3, #ff9999, #a8edea)",
    "conic-gradient(from 0deg at 50% 50%, #667eea, #764ba2, #f093fb, #667eea)",
    "conic-gradient(from 0deg at 50% 50%, #f5af19, #f12711, #fa709a, #f5af19)",
    "conic-gradient(from 0deg at 50% 50%, #4facfe, #00f2fe, #43e97b, #4facfe)",
    "conic-gradient(from 0deg at 50% 50%, #30cfd0, #330867, #a8edea, #30cfd0)",
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
  const [loading,  setLoading]  = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied,   setCopied]   = useState(false);

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

  useEffect(() => {
    if (!open) { setShareUrl(null); setCopied(false); }
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
              Tạo link để chia sẻ survey với mọi người
            </div>
          </div>
        </div>

        {shareUrl ? (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
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
              <span style={{
                flex:1, fontSize:13, color:C.text,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
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
            <button
              onClick={() => window.open(shareUrl, "_blank")}
              style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"8px 0", borderRadius:10,
                border:`1px solid ${C.primaryBorder}`,
                background:C.primaryDim, color:C.primary,
                fontSize:13, fontWeight:600, cursor:"pointer",
              }}
            >
              <ExternalLink size={13}/> Mở link
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              padding:"12px 0", borderRadius:12, border:"none",
              background: loading ? C.surfaceHigh : C.primaryGrad,
              color: loading ? C.textSub : "#fff",
              fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 2px 12px rgba(79,110,247,0.3)",
            }}
          >
            {loading
              ? <><Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/> Đang tạo link...</>
              : <><LinkIcon size={16}/> Tạo link chia sẻ</>
            }
          </button>
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
  deletingId, updatingId,
}) {
  const thumb    = C.thumbColors[index % C.thumbColors.length];
  const menuRef  = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [title,       setTitle]       = useState(s.title);
  const [description, setDescription] = useState(s.description || "");
  const [startAt,     setStartAt]     = useState(s.start_at ? s.start_at.slice(0,16) : "");
  const [endAt,       setEndAt]       = useState(s.end_at   ? s.end_at.slice(0,16)   : "");
  const [dateError,   setDateError]   = useState("");
  const [hovered,     setHovered]     = useState(false);

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
    });
    setEditing(false);
  };

  const isDeleting  = deletingId === s.id;
  const isSaving    = updatingId === s.id;
  const isClosed    = s.status === "CLOSED";
  const isPublished = s.is_published;

  const menuItems = [
    { icon:<Pencil size={13}/>,    label:"Chỉnh sửa",       action:startEdit },
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

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setRotateX(0); setRotateY(0); }}
        onMouseMove={handleMouseMove}
        style={{
          background:    C.surface,
          border:        `1px solid ${hovered ? C.borderHover : C.border}`,
          borderRadius:  12,
          overflow:      "hidden",
          cursor:        "pointer",
          transition:    "border-color .15s, box-shadow .15s, transform .6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow:     hovered ? "0 8px 32px rgba(108, 126, 247, 0.25)" : "0 4px 12px rgba(0,0,0,0.3)",
          transform:     `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          display:       "flex",
          flexDirection: "column",
          perspective:   "1200px",
          transformStyle:"preserve-3d",
          animation:     `slideInUp 0.8s ease-out ${0.1 + index * 0.1}s both`,
        }}
        onClick={() => !editing && onOpen(s.id)}
      >
        {/* Thumbnail */}
        <div style={{
          height:140, background: isClosed ? "linear-gradient(135deg,#0d1120,#111827)" : thumb,
          position:"relative", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          opacity: isClosed ? 0.6 : 1,
          overflow: "hidden", flexShrink: 0,
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(45deg, rgba(255,255,255,0.05), transparent 50%, rgba(0,0,0,0.1))" }} />
          <div style={{width:110, display:"flex", flexDirection:"column", gap:7}}>
            <div style={{height:6,  borderRadius:3, background:"rgba(108,126,247,0.5)", width:"80%"}}/>
            <div style={{height:4,  borderRadius:3, background:"rgba(255,255,255,0.10)", width:"100%"}}/>
            <div style={{height:4,  borderRadius:3, background:"rgba(255,255,255,0.07)", width:"65%"}}/>
            <div style={{height:1,  background:"rgba(255,255,255,0.10)", marginTop:4}}/>
            <div style={{height:4,  borderRadius:3, background:"rgba(255,255,255,0.08)", width:"90%"}}/>
            <div style={{height:4,  borderRadius:3, background:"rgba(255,255,255,0.06)", width:"75%"}}/>
          </div>

          {/* Badges */}
          <div style={{position:"absolute", top:8, left:8, display:"flex", flexDirection:"column", gap:4}}>
            {s.status && <StatusBadge status={s.status}/>}
            {isPublished && (
              <span style={{
                fontSize:10, fontWeight:700, padding:"3px 8px",
                borderRadius:999, color:C.primary, background:"rgba(108,126,247,0.15)",
                display:"flex", alignItems:"center", gap:4,
              }}>
                <Globe size={9}/> Published
              </span>
            )}
          </div>

          {/* Quick action buttons */}
          {!editing && (
            <div
              style={{position:"absolute", bottom:10, left:10, display:"flex", gap:5}}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShareOpen(true)} title="Chia sẻ" style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(108,126,247,0.8)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = C.textSub; }}>
                <Share2 size={12}/>
              </button>
              <button onClick={() => setInviteOpen(true)} title="Mời người dùng" style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(108,126,247,0.8)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = C.textSub; }}>
                <Mail size={12}/>
              </button>
              <button onClick={() => setBulkInviteOpen(true)} title="Mời hàng loạt" style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(108,126,247,0.8)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = C.textSub; }}>
                <UserPlus size={12}/>
              </button>
              <button onClick={() => setParticipantsOpen(true)} title="Xem participants" style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(108,126,247,0.8)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = C.textSub; }}>
                <Users size={12}/>
              </button>
              <button
                onClick={() => setPublishOpen(true)} title={isPublished ? "Ẩn survey" : "Publish"}
                style={{
                  ...quickBtn,
                  background: isPublished ? "rgba(245,158,11,0.7)" : "rgba(255,255,255,0.08)",
                  color: isPublished ? "#fff" : C.textSub,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.9)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isPublished ? "rgba(245,158,11,0.7)" : "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = isPublished ? "#fff" : C.textSub;
                }}>
                {isPublished ? <Lock size={12}/> : <Globe size={12}/>}
              </button>
              {!isClosed && (
                <button onClick={() => setCloseOpen(true)} title="Đóng survey" style={quickBtn}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(107,114,128,0.8)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = C.textSub; }}>
                  <PowerOff size={12}/>
                </button>
              )}
            </div>
          )}

          {/* 3-dot menu */}
          <div ref={menuRef} style={{position:"absolute", top:8, right:8}} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                width:30, height:30, borderRadius:"50%",
                background: menuOpen ? "rgba(108,126,247,0.2)" : "rgba(0,0,0,0.3)",
                border:"none", cursor:"pointer", color:"#fff",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"background .15s",
              }}
            >
              <MoreVertical size={15}/>
            </button>
            {menuOpen && (
              <div style={{
                position:"absolute", top:34, right:0, zIndex:20, width:196,
                background:C.surfaceHigh, border:`1px solid ${C.border}`,
                borderRadius:12, overflow:"hidden",
                boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
                animation:"slideInUp 0.2s ease-out",
              }}>
                {menuItems.map((item, i) => (
                  <button key={i} onClick={item.action} style={{
                    display:"flex", alignItems:"center", gap:10,
                    width:"100%", padding:"9px 14px",
                    background:"transparent", border:"none",
                    fontSize:13, fontWeight:500,
                    color: item.color || C.text,
                    cursor:"pointer", fontFamily:C.font,
                    borderBottom: i < menuItems.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
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
  const [search,      setSearch]      = useState("");

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
    s.title.toLowerCase().includes(search.toLowerCase())
  );

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

        {/* Search */}
        <div style={{
          flex:1, maxWidth:520,
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

        {/* Grid */}
        {filtered.length > 0 && (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16}}>
            {filtered.map((s, i) => (
              <SurveyCard
                key={s.id} s={s} index={i}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onOpen={(id) => navigate(`/admin/surveys/${id}`)}
                onShare={shareLink}
                onInvite={inviteSurvey}
                onBulkInvite={bulkInviteSurvey}
                onPublish={publishSurvey}
                onCloseSurvey={closeSurvey}
                onGetParticipants={getParticipants}
                onDeleteParticipant={deleteParticipant}
                deletingId={deletingId}
                updatingId={updatingId}
              />
            ))}
          </div>
        )}

        {/* No search results */}
        {search && filtered.length === 0 && (
          <div style={{textAlign:"center", padding:"4rem 0", color:C.textSub}}>
            <Search size={32} style={{opacity:0.3, marginBottom:12}}/>
            <p style={{margin:0}}>
              Không tìm thấy biểu mẫu nào cho "<strong>{search}</strong>"
            </p>
          </div>
        )}
      </div>

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
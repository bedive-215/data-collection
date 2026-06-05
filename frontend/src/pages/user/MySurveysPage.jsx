// ─── MySurveysPage.jsx ─────────────────────────────────────────────
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Plus, X, FileText, Calendar, Loader2, Inbox, Search,
  Trash2, Check, Share2, Mail,
  Lock, Globe, Copy, ExternalLink, Power, PowerOff,
  Users, ChevronRight, Link as LinkIcon, Send,
  UserPlus, UserMinus, ChevronDown, RefreshCw, Edit2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/providers/SurveyProvider";
import { SurveyCardHome, ShareModal } from "@/components/survey/SurveyCardHome";

/* ────────────────────────────────────────────────────────────────
   COLORS
──────────────────────────────────────────────────────────────── */
const C = {
  bg:           "#f5f7fb",
  surface:      "#ffffff",
  surfaceHigh:  "#f8fafc",
  border:       "#dbe2ea",
  borderHover:  "#c7d2fe",
  primary:      "#4f6ef7",
  primaryGrad:  "linear-gradient(135deg,#4f6ef7,#6c7ef7)",
  primaryDim:   "rgba(79,110,247,0.08)",
  primaryBorder:"#c7d2fe",
  text:         "#111827",
  textSub:      "#64748b",
  textDim:      "#94a3b8",
  error:        "#ef4444",
  errorBg:      "#fef2f2",
  errorBorder:  "#fecaca",
  success:      "#22c55e",
  successBg:    "#f0fdf4",
  successBorder:"#bbf7d0",
  warning:      "#f59e0b",
  warningBg:    "#fffbeb",
  warningBorder:"#fde68a",
  font:         "'DM Sans', 'Inter', sans-serif",
  thumbColors:  [
    "conic-gradient(from 0deg at 50% 50%, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #ff6b6b)",
    "conic-gradient(from 0deg at 50% 50%, #a8edea, #fed6e3, #ff9999, #a8edea)",
    "conic-gradient(from 0deg at 50% 50%, #667eea, #764ba2, #f093fb, #667eea)",
    "conic-gradient(from 0deg at 50% 50%, #f5af19, #f12711, #fa709a, #f5af19)",
    "conic-gradient(from 0deg at 50% 50%, #4facfe, #00f2fe, #43e97b, #4facfe)",
  ],
};

/* ────────────────────────────────────────────────────────────────
   STATUS
──────────────────────────────────────────────────────────────── */
const STATUS_MAP = {
  ACTIVE:    { label:"Đang mở",  color:C.success, bg:"rgba(34,197,94,.12)" },
  DRAFT:     { label:"Nháp",     color:C.textSub, bg:"rgba(100,116,139,.12)" },
  EXPIRED:   { label:"Hết hạn",  color:C.error,   bg:"rgba(239,68,68,.12)" },
  SCHEDULED: { label:"Lên lịch", color:C.warning, bg:"rgba(245,158,11,.12)" },
  CLOSED:    { label:"Đã đóng",  color:"#6b7280",  bg:"rgba(107,114,128,.12)" },
};

function RotatingGradient() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: -1,
        opacity: 0.12,
        animation: "rotateGradient 15s linear infinite",
        background: "conic-gradient(from 0deg at 50% 50%, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #ff6b6b)",
      }}
    />
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <span style={{
      fontSize:10, fontWeight:700, padding:"3px 8px",
      borderRadius:999, color:s.color, background:s.bg,
    }}>
      {s.label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────
   MODAL BASE
──────────────────────────────────────────────────────────────── */
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
        background:"rgba(0,0,0,0.35)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:20,
          border:`1px solid ${C.border}`,
          boxShadow:"0 20px 60px rgba(0,0,0,0.15)",
          width:"100%", maxWidth:width,
          overflow:"hidden",
        }}
      >
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px",
          borderBottom:`1px solid ${C.border}`,
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

/* shared button styles */
const cancelBtn = {
  padding:"9px 16px", borderRadius:10,
  border:`1px solid #dbe2ea`, background:"transparent",
  color:"#64748b", fontSize:13, fontWeight:600, cursor:"pointer",
};
const saveBtn = {
  display:"flex", alignItems:"center", gap:6,
  padding:"9px 18px", borderRadius:10, border:"none",
  fontSize:13, fontWeight:700, cursor:"pointer",
};
const inputStyle = {
  width:"100%", boxSizing:"border-box",
  border:`1px solid #dbe2ea`, borderRadius:10,
  background:"#fff", color:"#111827",
  fontFamily:"'DM Sans','Inter',sans-serif", outline:"none",
};
const textareaStyle = {
  ...inputStyle, resize:"vertical", lineHeight:1.6,
};

/* ────────────────────────────────────────────────────────────────
   SHARE LINK MODAL
──────────────────────────────────────────────────────────────── */
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
              <LinkIcon size={14} color={C.textDim} style={{flexShrink:0}}/>
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
                background: copied ? C.successBg : "#fff",
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
              padding:"12px 0", borderRadius:12,
              border:"none",
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

/* ────────────────────────────────────────────────────────────────
   INVITE MODAL (single)
──────────────────────────────────────────────────────────────── */
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
      await Promise.all(list.map(email => onInvite(survey.id, { email, role: "viewer" })));
      setSuccess(true); setEmails("");
    } catch { setError("Mời không thành công, vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mời người tham gia">
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 14px",
          background:C.surfaceHigh, borderRadius:10,
          border:`1px solid ${C.border}`,
        }}>
          <Users size={16} color={C.primary}/>
          <span style={{fontSize:13, color:C.textSub}}>
            Mời người dùng tham gia survey <strong style={{color:C.text}}>{survey?.title}</strong>
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
                rows={4}
                value={emails}
                onChange={e => { setEmails(e.target.value); setError(""); }}
                placeholder={"example@email.com\nuser2@email.com\n(mỗi dòng hoặc dấu phẩy)"}
                style={{
                  width:"100%", boxSizing:"border-box",
                  padding:"10px 14px",
                  background:"#fff", border:`1.5px solid ${error ? C.error : C.border}`,
                  borderRadius:10, color:C.text, fontSize:13,
                  fontFamily:C.font, outline:"none", resize:"vertical",
                  lineHeight:1.6,
                }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.1)"; }}
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
                padding:"9px 18px", borderRadius:10,
                border:"none",
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

/* ────────────────────────────────────────────────────────────────
   BULK INVITE MODAL
──────────────────────────────────────────────────────────────── */
function BulkInviteModal({ open, onClose, survey, onBulkInvite }) {
  const [emails,   setEmails]   = useState("");
  const [role,     setRole]     = useState("viewer");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(null);
  const [error,    setError]    = useState("");

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
      setSuccess({
        sent:   res?.sent   ?? list.length,
        failed: res?.failed ?? 0,
      });
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
          background:"linear-gradient(135deg,rgba(79,110,247,0.06),rgba(108,126,247,0.06))",
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
            <div style={{fontSize:12, color:C.textSub, marginTop:2}}>
              Nhập nhiều email cùng lúc để mời hàng loạt
            </div>
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
                  { value:"viewer",      label:"👁️ Viewer",      desc:"Chỉ xem" },
                  { value:"respondent",  label:"✏️ Respondent",  desc:"Trả lời survey" },
                  { value:"editor",      label:"🛠️ Editor",      desc:"Chỉnh sửa" },
                ].map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    style={{
                      flex:1, padding:"8px 10px", borderRadius:10,
                      border:`1.5px solid ${role === r.value ? C.primary : C.border}`,
                      background: role === r.value ? C.primaryDim : "#fff",
                      cursor:"pointer", textAlign:"center",
                      transition:"all .15s",
                    }}
                  >
                    <div style={{fontSize:12, fontWeight:700, color: role === r.value ? C.primary : C.text}}>
                      {r.label}
                    </div>
                    <div style={{fontSize:11, color:C.textDim, marginTop:2}}>{r.desc}</div>
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
                rows={6}
                value={emails}
                onChange={e => { setEmails(e.target.value); setError(""); }}
                placeholder={"user1@email.com\nuser2@email.com, user3@email.com\nuser4@email.com;user5@email.com\n\n(phân cách bằng dấu phẩy, chấm phẩy hoặc xuống dòng)"}
                style={{
                  width:"100%", boxSizing:"border-box",
                  padding:"10px 14px",
                  background:"#fff", border:`1.5px solid ${error ? C.error : C.border}`,
                  borderRadius:10, color:C.text, fontSize:13,
                  fontFamily:C.font, outline:"none", resize:"vertical",
                  lineHeight:1.7,
                }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.1)"; }}
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
                padding:"9px 18px", borderRadius:10,
                border:"none",
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

/* ────────────────────────────────────────────────────────────────
   PARTICIPANTS MODAL
──────────────────────────────────────────────────────────────── */
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
    setLoading(true);
    setError("");
    try {
      const res = await onGetParticipants(survey.id, {});
      const list = res?.participants ?? [];
      const total = res?.count ?? list.length;
      setParticipants(list);
      setCount(total);
    } catch {
      setError("Không thể tải danh sách người tham gia.");
    } finally {
      setLoading(false);
    }
  }, [survey?.id, onGetParticipants]);

  useEffect(() => {
    if (open) {
      load();
      setSearch("");
      setConfirmPid(null);
      setError("");
    } else {
      setParticipants([]);
      setCount(0);
    }
  }, [open, load]);

  const handleDelete = async (participantId) => {
    setDeleting(participantId);
    try {
      await onDeleteParticipant(survey.id, participantId);
      setParticipants(prev => prev.filter(p => p.participant_id !== participantId));
      setCount(prev => Math.max(0, prev - 1));
      setConfirmPid(null);
    } catch {
      // keep as is on error
    } finally {
      setDeleting(null);
    }
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
    if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (email || "?")[0].toUpperCase();
  };

  const AVATAR_COLORS = [
    { bg:"#dbeafe", color:"#1d4ed8" },
    { bg:"#dcfce7", color:"#15803d" },
    { bg:"#fce7f3", color:"#be185d" },
    { bg:"#fef3c7", color:"#92400e" },
    { bg:"#ede9fe", color:"#6d28d9" },
  ];

  const ROLE_STYLE = {
    viewer:     { color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe" },
    respondent: { color:"#059669", bg:"#ecfdf5", border:"#a7f3d0" },
    editor:     { color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
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
              <div style={{fontSize:12, color:C.textSub, marginTop:2}}>Tổng người tham gia</div>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding:"0 14px", borderRadius:12,
              border:`1px solid ${C.border}`, background:"#fff",
              cursor: loading ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", gap:6,
              fontSize:12, fontWeight:600, color:C.textSub,
              flexShrink:0,
            }}
          >
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
              border:`1px solid ${C.errorBorder}`, background:"#fff",
              color:C.error, cursor:"pointer",
            }}>Thử lại</button>
          </div>
        )}

        <div style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"8px 12px",
          background:"#fff", border:`1px solid ${C.border}`,
          borderRadius:10,
        }}>
          <Search size={14} color={C.textDim}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
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
              <span style={{fontSize:13, color:C.textSub, fontFamily:C.font}}>Đang tải danh sách...</span>
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
                    background: isConfirming ? C.errorBg : "#fff",
                    transition:"background .15s",
                  }}
                >
                  <div style={{
                    width:36, height:36, borderRadius:"50%",
                    background:av.bg, color:av.color,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:700, flexShrink:0,
                    letterSpacing:"0.02em",
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
                        ID: {p.id ? p.id.slice(0, 8) + "…" : "—"}
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
                      {p.role === "ADMIN" ? "Quản trị" : p.role === "owner" ? "Chủ sở hữu" : p.role === "editor" ? "Biên tập" : p.role === "viewer" ? "Người xem" : p.role === "respondent" ? "Người trả lời" : p.role}
                    </span>
                  )}
                  {isConfirming ? (
                    <div style={{display:"flex", gap:6, flexShrink:0}}>
                      <button
                        onClick={() => setConfirmPid(null)}
                        style={{
                          padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600,
                          border:`1px solid ${C.border}`, background:"#fff",
                          color:C.textSub, cursor:"pointer",
                        }}
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={() => handleDelete(deleteKey)}
                        disabled={isDeleting}
                        style={{
                          display:"flex", alignItems:"center", gap:5,
                          padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:700,
                          border:"none",
                          background: isDeleting ? C.surfaceHigh : C.error,
                          color: isDeleting ? C.textSub : "#fff",
                          cursor: isDeleting ? "not-allowed" : "pointer",
                        }}
                      >
                        {isDeleting
                          ? <Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>
                          : <Trash2 size={11}/>
                        }
                        Xoá
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPid(deleteKey)}
                      title="Xoá khỏi danh sách"
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

/* ────────────────────────────────────────────────────────────────
   PUBLISH CONFIRM MODAL
──────────────────────────────────────────────────────────────── */
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
    <Modal open={open} onClose={onClose} title={isPublished ? "Ẩn khảo sát" : "Công khai khảo sát"} width={400}>
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
              ? "Khảo sát sẽ bị ẩn và không còn nhận được câu trả lời mới."
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
              : isPublished ? <><PowerOff size={13}/> Ẩn survey</> : <><Globe size={13}/> Công khai</>
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────
   CLOSE CONFIRM MODAL
──────────────────────────────────────────────────────────────── */
function CloseModal({ open, onClose, survey, onCloseSurvey }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onCloseSurvey(survey.id);
      onClose();
    } finally { setLoading(false); }
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

/* ────────────────────────────────────────────────────────────────
   EXTEND MODAL
──────────────────────────────────────────────────────────────── */
function ExtendModal({ open, onClose, survey, onExtend }) {
  const [submitting, setSubmitting] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && survey?.end_at) {
      const d = new Date(survey.end_at);
      d.setDate(d.getDate() + 7);
      setNewDate(d.toISOString().slice(0, 16));
    }
    setError("");
  }, [open, survey]);

  const handleExtend = async () => {
    if (!newDate) { setError("Vui lòng chọn ngày"); return; }
    const selected = new Date(newDate);
    if (selected <= new Date()) { setError("Ngày phải lớn hơn hiện tại"); return; }
    setSubmitting(true);
    try {
      await onExtend(survey.id, newDate);
      onClose();
    } catch {
      setError("Gia hạn thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#f59e0b,#fbbf24)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 4px 14px rgba(245,158,11,0.3)" }}>
          <RefreshCw size={20} color="#fff"/>
        </div>
        <div>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:C.text }}>Khảo sát đã hết hạn</h3>
          <p style={{ margin:"4px 0 0", fontSize:12, color:C.textSub, maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{survey?.title}</p>
        </div>
      </div>

      <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", marginBottom:20 }}>
        <p style={{ margin:0, fontSize:13, color:"#dc2626", fontWeight:600 }}>
          Khảo sát này đã hết hạn và không thể nhận phản hồi mới.
        </p>
        {survey?.end_at && (
          <p style={{ margin:"6px 0 0", fontSize:12, color:"#ef4444" }}>
            Ngày kết thúc: {new Date(survey.end_at).toLocaleDateString("vi-VN", { day:"2-digit", month:"long", year:"numeric" })}
          </p>
        )}
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:6 }}>Ngày kết thúc mới</label>
        <input
          type="datetime-local"
          value={newDate}
          onChange={e => { setNewDate(e.target.value); setError(""); }}
          min={new Date().toISOString().slice(0, 16)}
          style={{
            width:"100%", padding:"10px 14px", borderRadius:10,
            border:`1.5px solid ${error ? C.errorBorder : C.border}`,
            background:C.surface, fontSize:14, fontFamily:C.font, color:C.text,
            outline:"none",
          }}
        />
        {error && <p style={{ margin:"6px 0 0", fontSize:12, color:C.error }}>{error}</p>}
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ ...cancelBtn, flex:1 }}>
          Đóng
        </button>
        <button
          onClick={handleExtend}
          disabled={submitting}
          style={{
            flex:1, padding:"10px 16px", borderRadius:10,
            background: submitting ? C.textDim : "linear-gradient(135deg,#f59e0b,#fbbf24)",
            border:"none", color:"#fff", fontSize:14, fontWeight:700,
            cursor: submitting ? "not-allowed" : "pointer", fontFamily:C.font,
            boxShadow: submitting ? "none" : "0 4px 14px rgba(245,158,11,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}
        >
          {submitting
            ? <><Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> Đang xử lý...</>
            : <><RefreshCw size={15}/> Gia hạn</>
          }
        </button>
      </div>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────────── */
export default function MySurveysPage() {
  const navigate = useNavigate();
  const {
    surveys, loading,
    createSurvey, fetchMySurveys,
    updateSurvey, deleteSurvey,
    closeSurvey, publishSurvey, extendSurvey,
    shareLink, inviteSurvey,
    bulkInviteSurvey,
    getParticipants,
    deleteParticipant,
  } = useSurvey();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [search,         setSearch]         = useState("");
  const [formData, setFormData] = useState({
    title:"", description:"", start_at:"", end_at:"",
  });
  const [extendModal, setExtendModal] = useState({ open: false, survey: null });

  useEffect(() => { fetchMySurveys(1, 20); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createSurvey({
        title:       formData.title,
        description: formData.description || null,
        start_at:    formData.start_at    || null,
        end_at:      formData.end_at      || null,
      });
      setFormData({ title:"", description:"", start_at:"", end_at:"" });
      setShowCreateForm(false);
      await fetchMySurveys(1, 20);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const filtered = surveys.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

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
    try { await closeSurvey(surveyId); await fetchMySurveys(1, 20); }
    catch (err) { console.error(err); }
  }, [closeSurvey, fetchMySurveys]);

  const handleExtend = useCallback(async (surveyId, new_end_at) => {
    try { await extendSurvey(surveyId, new_end_at); await fetchMySurveys(1, 20); }
    catch (err) { console.error(err); }
  }, [extendSurvey, fetchMySurveys]);

  return (
    <main style={{
      minHeight:"100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily:C.font,
      overflow:"visible",
      position:"relative",
      zIndex:1,
    }}>
      <RotatingGradient />

      {/* ── HEADER ── */}
      <div style={{
        background:"rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom:`1px solid rgba(255, 255, 255, 0.25)`,
        padding:"0 24px", height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:20,
        position: "relative", zIndex: 10,
      }}>
        {/* Title */}
        <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <h1 style={{
            fontSize:20, fontWeight:800, color:C.text, margin:0,
            background: "linear-gradient(135deg, #4f6ef7, #764ba2)",
            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Khảo sát của tôi
          </h1>
          {!loading && (
            <span style={{
              fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:999,
              background:"rgba(79,110,247,0.1)", color:C.primary,
              border:"1px solid rgba(79,110,247,0.2)",
            }}>
              {filtered.length}
            </span>
          )}
        </div>

        {/* SEARCH */}
        <div style={{
          flex:1, maxWidth:480, height:40, borderRadius:999,
          background:"rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(10px)",
          border:`1px solid rgba(255, 255, 255, 0.5)`,
          display:"flex", alignItems:"center", gap:10, padding:"0 16px",
          transition: "all 0.3s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)"; e.currentTarget.style.borderColor = "rgba(79, 110, 247, 0.3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.7)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)"; }}
        >
          <Search size={14} color={C.textSub}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm survey..."
            style={{flex:1, border:"none", outline:"none", background:"transparent", fontSize:13, fontFamily:C.font, color:C.text}}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", padding:0}}>
              <X size={14}/>
            </button>
          )}
        </div>

        {/* CREATE BTN */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"9px 16px", borderRadius:12,
            border: showCreateForm ? `1px solid ${C.border}` : "none",
            background: showCreateForm ? "rgba(255, 255, 255, 0.9)" : C.primaryGrad,
            color: showCreateForm ? C.textSub : "#fff",
            cursor:"pointer", fontWeight:700, fontFamily:C.font, fontSize:13,
            boxShadow: showCreateForm ? "none" : "0 6px 18px rgba(79, 110, 247, 0.3)",
            transition:"all .15s", flexShrink:0,
          }}
          onMouseEnter={(e) => { if (!showCreateForm) e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {showCreateForm ? <X size={15}/> : <Plus size={15}/>}
          {showCreateForm ? "Huỷ" : "Survey mới"}
        </button>
      </div>

      <div style={{maxWidth:1260, margin:"0 auto", padding:"20px 24px 52px", position: "relative", zIndex: 1, overflow:"visible"}}>

        {/* ── CREATE FORM ── */}
        {showCreateForm && (
          <div style={{
            background:"rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius:20,
            border:`1px solid rgba(255, 255, 255, 0.35)`,
            padding:24, marginBottom:24,
            boxShadow:"0 8px 32px rgba(31, 38, 135, 0.12)",
            animation: "slideInUp 0.5s ease-out",
          }}>
            <h2 style={{fontSize:16, fontWeight:700, marginBottom:18, color:C.text, marginTop:0}}>
              Tạo Survey Mới
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{display:"flex", flexDirection:"column", gap:14}}>
                <input
                  type="text" name="title" value={formData.title}
                  onChange={handleChange} placeholder="Tiêu đề survey" required
                  style={{...inputStyle, fontSize:14, padding:"10px 14px"}}
                />
                <textarea
                  rows={3} name="description" value={formData.description}
                  onChange={handleChange} placeholder="Mô tả survey"
                  style={{...textareaStyle, fontSize:14, padding:"10px 14px"}}
                />
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
                  <div>
                    <label style={{fontSize:12, color:C.textSub, display:"block", marginBottom:5}}>Bắt đầu</label>
                    <input type="datetime-local" name="start_at" value={formData.start_at} onChange={handleChange}
                      style={{...inputStyle, fontSize:13, padding:"9px 12px"}}/>
                  </div>
                  <div>
                    <label style={{fontSize:12, color:C.textSub, display:"block", marginBottom:5}}>Kết thúc</label>
                    <input type="datetime-local" name="end_at" value={formData.end_at} onChange={handleChange}
                      style={{...inputStyle, fontSize:13, padding:"9px 12px"}}/>
                  </div>
                </div>
                <div style={{display:"flex", justifyContent:"flex-end", gap:10}}>
                  <button type="button" onClick={() => setShowCreateForm(false)} style={cancelBtn}>Huỷ</button>
                  <button type="submit" disabled={submitting} style={{
                    ...saveBtn,
                    padding:"10px 20px",
                    background: submitting ? C.surfaceHigh : C.primaryGrad,
                    color: submitting ? C.textSub : "#fff",
                    boxShadow: submitting ? "none" : "0 2px 10px rgba(79,110,247,0.3)",
                  }}>
                    {submitting
                      ? <><Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> Đang tạo...</>
                      : <><Plus size={15}/> Tạo Survey</>
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{display:"flex", justifyContent:"center", padding:"80px 0", color:C.textDim}}>
            <Loader2 size={34} style={{animation:"spin 1s linear infinite"}} color={C.primary}/>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && filtered.length === 0 && (
          <div style={{
            background:"rgba(255, 255, 255, 0.7)",
            backdropFilter:"blur(20px)",
            WebkitBackdropFilter:"blur(20px)",
            border:"1px solid rgba(255, 255, 255, 0.25)",
            borderRadius:20,
            padding:"80px 20px",
            textAlign:"center",
            boxShadow:"0 8px 32px rgba(31, 38, 135, 0.1)",
          }}>
            <Inbox size={54} color={C.textDim}/>
            <h3 style={{marginTop:16, color:C.text, fontWeight:700, marginBottom:8}}>
              {search ? `Không tìm thấy "${search}"` : "Chưa có survey nào"}
            </h3>
            <p style={{color:C.textSub, margin:"8px 0 0"}}>
              {search ? "Thử tìm với từ khóa khác" : "Hãy tạo survey đầu tiên"}
            </p>
          </div>
        )}

        {/* ── GRID ── */}
        {!loading && filtered.length > 0 && (
          <>
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:14,
            }}>
              <span style={{fontSize:12, color:C.textSub}}>
                {filtered.length} survey{search ? ` · kết quả cho "${search}"` : ""}
              </span>
            </div>
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(5, 1fr)",
              gap:20,
              overflow:"visible",
              position:"relative",
            }}>
              {filtered.map((survey, index) => (
                <SurveyCardHome
                  key={survey.id}
                  survey={survey}
                  index={index}
                  onClick={() => navigate(`/user/my-surveys/${survey.id}/studio`)}
                  type="my"
                  onShare={handleShare}
                  onLock={handleClose}
                  onViewAnalytics={() => navigate(`/user/my-surveys/${survey.id}/studio?tab=analyze`)}
                  onExpiredClick={(s) => setExtendModal({ open: true, survey: s })}
                  onEdit={() => navigate(`/user/my-surveys/${survey.id}/studio`)}
                />
              ))}
            </div>
          </>
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

      <ExtendModal
        open={extendModal.open}
        onClose={() => setExtendModal({ open: false, survey: null })}
        survey={extendModal.survey}
        onExtend={handleExtend}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideInUp { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
        @keyframes rotateGradient { 0% { transform:rotate(0deg) } 100% { transform:rotate(360deg) } }
        * { box-sizing:border-box }
        button { font-family:'DM Sans',sans-serif }
      `}</style>
    </main>
  );
}
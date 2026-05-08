// ─── MySurveysPage.jsx ─────────────────────────────────────────────
import React, { useEffect, useState, useRef } from "react";
import {
  Plus, X, FileText, Calendar, Loader2, Inbox, Search,
  MoreVertical, Trash2, Pencil, Check, Share2, Mail,
  Lock, Globe, Copy, ExternalLink, Power, PowerOff,
  Users, ChevronRight, Link as LinkIcon, Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/providers/SurveyProvider";

/* ────────────────────────────────────────────────────────────────
   COLORS
──────────────────────────────────────────────────────────────── */
const C = {
  bg:          "#f5f7fb",
  surface:     "#ffffff",
  surfaceHigh: "#f8fafc",
  border:      "#dbe2ea",
  borderHover: "#c7d2fe",
  primary:     "#4f6ef7",
  primaryGrad: "linear-gradient(135deg,#4f6ef7,#6c7ef7)",
  primaryDim:  "rgba(79,110,247,0.08)",
  primaryBorder:"#c7d2fe",
  text:        "#111827",
  textSub:     "#64748b",
  textDim:     "#94a3b8",
  error:       "#ef4444",
  errorBg:     "#fef2f2",
  errorBorder: "#fecaca",
  success:     "#22c55e",
  successBg:   "#f0fdf4",
  successBorder:"#bbf7d0",
  warning:     "#f59e0b",
  warningBg:   "#fffbeb",
  warningBorder:"#fde68a",
  font:        "'Inter', sans-serif",
  thumbColors: [
    "linear-gradient(135deg,#dbeafe,#c7d2fe)",
    "linear-gradient(135deg,#dcfce7,#bbf7d0)",
    "linear-gradient(135deg,#fee2e2,#fecaca)",
    "linear-gradient(135deg,#e0f2fe,#bae6fd)",
    "linear-gradient(135deg,#f3e8ff,#e9d5ff)",
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
        {/* Header */}
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
        {/* Body */}
        <div style={{padding:"20px"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SHARE LINK MODAL
──────────────────────────────────────────────────────────────── */
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const [loading,   setLoading]   = useState(false);
  const [shareUrl,  setShareUrl]  = useState(null);
  const [copied,    setCopied]    = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const url = await onShare(survey.id);
      if (url) setShareUrl(url);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset on close
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
   INVITE MODAL
──────────────────────────────────────────────────────────────── */
function InviteModal({ open, onClose, survey, onInvite }) {
  const [emails, setEmails]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(false); setError(""); }
  }, [open]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  const list = emails
    .split(/[\n,;]+/)
    .map(e => e.trim())
    .filter(Boolean);

  if (list.length === 0) {
    setError("Vui lòng nhập ít nhất 1 email.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    // gửi từng email
    await Promise.all(
      list.map(email =>
        onInvite(survey.id, { email, role: "viewer" })
      )
    );

    setSuccess(true);
    setEmails("");
  } catch (err) {
    setError("Mời không thành công, vui lòng thử lại.");
  } finally {
    setLoading(false);
  }
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
              <button type="button" onClick={onClose} style={{
                padding:"9px 16px", borderRadius:10,
                border:`1px solid ${C.border}`, background:"transparent",
                color:C.textSub, fontSize:13, fontWeight:600, cursor:"pointer",
              }}>
                Đóng
              </button>
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
    } finally {
      setLoading(false);
    }
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
          <div style={{fontSize:32, marginBottom:8}}>
            {isPublished ? "🔒" : "🌐"}
          </div>
          <div style={{fontSize:14, fontWeight:600, color:C.text}}>
            {isPublished
              ? "Khảo sát sẽ bị ẩn và không còn nhận được câu trả lời mới."
              : "Khảo sát sẽ được công khai và có thể nhận câu trả lời."}
          </div>
        </div>

        <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
          <button onClick={onClose} style={{
            padding:"9px 16px", borderRadius:10,
            border:`1px solid ${C.border}`, background:"transparent",
            color:C.textSub, fontSize:13, fontWeight:600, cursor:"pointer",
          }}>
            Huỷ
          </button>
          <button onClick={handleConfirm} disabled={loading} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"9px 18px", borderRadius:10,
            border:"none",
            background: loading ? C.surfaceHigh
              : isPublished ? C.warning : C.primaryGrad,
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
    } finally {
      setLoading(false);
    }
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
          <button onClick={onClose} style={{
            padding:"9px 16px", borderRadius:10,
            border:`1px solid ${C.border}`, background:"transparent",
            color:C.textSub, fontSize:13, fontWeight:600, cursor:"pointer",
          }}>
            Huỷ
          </button>
          <button onClick={handleConfirm} disabled={loading} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"9px 18px", borderRadius:10,
            border:"none",
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
   CARD
──────────────────────────────────────────────────────────────── */
function SurveyCard({ survey, index, onDelete, onUpdate, onShare, onInvite, onPublish, onCloseSurvey }) {
  const navigate   = useNavigate();
  const thumb      = C.thumbColors[index % C.thumbColors.length];
  const menuRef    = useRef(null);

  const [menuOpen,        setMenuOpen]        = useState(false);
  const [editing,         setEditing]         = useState(false);
  const [title,           setTitle]           = useState(survey.title);
  const [description,     setDescription]     = useState(survey.description || "");
  const [startAt,         setStartAt]         = useState(survey.start_at ? survey.start_at.slice(0,16) : "");
  const [endAt,           setEndAt]           = useState(survey.end_at   ? survey.end_at.slice(0,16)   : "");
  const [saving,          setSaving]          = useState(false);
  const [deleting,        setDeleting]        = useState(false);

  // Modal states
  const [shareOpen,   setShareOpen]   = useState(false);
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [closeOpen,   setCloseOpen]   = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(survey.id, { title, description, start_at: startAt || null, end_at: endAt || null });
      setEditing(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { setDeleting(true); await onDelete(survey.id); }
    finally { setDeleting(false); }
  };

  const isClosed    = survey.status === "CLOSED";
  const isPublished = survey.is_published;

  const menuItems = [
    {
      icon: <Pencil size={14}/>,
      label: "Chỉnh sửa",
      action: () => { setEditing(true); setMenuOpen(false); },
    },
    {
      icon: <Share2 size={14}/>,
      label: "Tạo link chia sẻ",
      action: () => { setShareOpen(true); setMenuOpen(false); },
    },
    {
      icon: <Users size={14}/>,
      label: "Mời người dùng",
      action: () => { setInviteOpen(true); setMenuOpen(false); },
    },
    {
      icon: isPublished ? <Lock size={14}/> : <Globe size={14}/>,
      label: isPublished ? "Ẩn survey" : "Publish",
      action: () => { setPublishOpen(true); setMenuOpen(false); },
      color: isPublished ? C.warning : C.primary,
    },
    !isClosed && {
      icon: <PowerOff size={14}/>,
      label: "Đóng survey",
      action: () => { setCloseOpen(true); setMenuOpen(false); },
      color: "#6b7280",
    },
    {
      icon: <Trash2 size={14}/>,
      label: "Xóa",
      action: handleDelete,
      color: C.error,
    },
  ].filter(Boolean);

  return (
    <>
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          overflow: "hidden",
          transition: ".2s",
          cursor: "pointer",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(79,110,247,.12)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        onClick={() => !editing && navigate(`/user/my-surveys/${survey.id}`)}
      >
        {/* THUMB */}
        <div style={{
          height:140, background: isClosed ? "linear-gradient(135deg,#f1f5f9,#e2e8f0)" : thumb,
          position:"relative", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          opacity: isClosed ? 0.7 : 1,
        }}>
          <FileText size={44} color="rgba(79,110,247,.35)"/>

          {/* Badges top-left */}
          <div style={{position:"absolute", top:10, left:10, display:"flex", flexDirection:"column", gap:4}}>
            <StatusBadge status={survey.status}/>
            {isPublished && (
              <span style={{
                fontSize:10, fontWeight:700, padding:"3px 8px",
                borderRadius:999, color:C.primary, background:"rgba(79,110,247,0.12)",
                display:"flex", alignItems:"center", gap:4,
              }}>
                <Globe size={9}/> Published
              </span>
            )}
          </div>

          {/* Quick action buttons */}
          {!editing && (
            <div
              style={{position:"absolute", bottom:10, left:10, display:"flex", gap:6}}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShareOpen(true)}
                title="Chia sẻ"
                style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,110,247,0.9)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.color = C.textSub; }}
              >
                <Share2 size={13}/>
              </button>
              <button
                onClick={() => setInviteOpen(true)}
                title="Mời người dùng"
                style={quickBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,110,247,0.9)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.color = C.textSub; }}
              >
                <Mail size={13}/>
              </button>
              <button
                onClick={() => setPublishOpen(true)}
                title={isPublished ? "Ẩn survey" : "Publish"}
                style={{
                  ...quickBtn,
                  background: isPublished ? "rgba(245,158,11,0.85)" : "rgba(255,255,255,0.85)",
                  color: isPublished ? "#fff" : C.textSub,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.9)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isPublished ? "rgba(245,158,11,0.85)" : "rgba(255,255,255,0.85)";
                  e.currentTarget.style.color = isPublished ? "#fff" : C.textSub;
                }}
              >
                {isPublished ? <Lock size={13}/> : <Globe size={13}/>}
              </button>
              {!isClosed && (
                <button
                  onClick={() => setCloseOpen(true)}
                  title="Đóng survey"
                  style={quickBtn}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(107,114,128,0.9)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.color = C.textSub; }}
                >
                  <PowerOff size={13}/>
                </button>
              )}
            </div>
          )}

          {/* MENU */}
          <div
            ref={menuRef}
            style={{position:"absolute", top:10, right:10}}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width:34, height:34, borderRadius:"50%",
                border:"none", background:"rgba(255,255,255,.85)",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >
              <MoreVertical size={16}/>
            </button>

            {menuOpen && (
              <div style={{
                position:"absolute", top:40, right:0, width:188,
                background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:14, overflow:"hidden",
                boxShadow:"0 10px 30px rgba(0,0,0,.1)", zIndex:20,
              }}>
                {menuItems.map((item, i) => (
                  <button key={i} onClick={item.action} style={{
                    width:"100%", border:"none", background:"transparent",
                    padding:"10px 14px", display:"flex", alignItems:"center", gap:10,
                    cursor:"pointer", fontSize:13, color: item.color || C.text,
                    fontFamily:C.font,
                    borderBottom: i < menuItems.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {item.icon}
                    {item.label}
                    {deleting && item.label === "Xóa" && <Loader2 size={12} style={{marginLeft:"auto", animation:"spin 1s linear infinite"}}/>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{padding:16}} onClick={e => editing && e.stopPropagation()}>
          {editing ? (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Tiêu đề"/>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} style={textareaStyle} placeholder="Mô tả"/>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} style={inputStyle}/>
                <input type="datetime-local" value={endAt}   onChange={e => setEndAt(e.target.value)}   style={inputStyle}/>
              </div>
              <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
                <button onClick={() => setEditing(false)} style={cancelBtn}>Huỷ</button>
                <button onClick={handleSave} style={saveBtn}>
                  {saving ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> : <Check size={14}/>}
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 style={{fontSize:16, fontWeight:700, color:C.text, marginBottom:8, lineHeight:1.4}}>
                {survey.title}
              </h3>
              <p style={{fontSize:13, color:C.textSub, lineHeight:1.6, minHeight:60}}>
                {survey.description || "Không có mô tả"}
              </p>

              {/* Footer */}
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12}}>
                <div style={{display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.textDim}}>
                  <Calendar size={14}/>
                  {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
                </div>

                {/* Quick chip actions */}
                <div style={{display:"flex", gap:5}} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setShareOpen(true)}
                    style={chipBtn}
                    onMouseEnter={e => { e.currentTarget.style.background = C.primaryDim; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}
                  >
                    <LinkIcon size={11}/>
                  </button>
                  <button
                    onClick={() => setInviteOpen(true)}
                    style={chipBtn}
                    onMouseEnter={e => { e.currentTarget.style.background = C.primaryDim; e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border; }}
                  >
                    <Mail size={11}/>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ShareLinkModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        survey={survey}
        onShare={onShare}
      />
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        survey={survey}
        onInvite={onInvite}
      />
      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        survey={survey}
        onPublish={onPublish}
      />
      <CloseModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        survey={survey}
        onCloseSurvey={onCloseSurvey}
      />
    </>
  );
}

/* ── Shared button styles ─────────────────────────────────────── */
const quickBtn = {
  width:28, height:28, borderRadius:8,
  border:"none", background:"rgba(255,255,255,0.85)",
  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
  color:C.textSub, transition:"all .15s", backdropFilter:"blur(4px)",
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
  fontFamily:C.font, background:"#fff", boxSizing:"border-box",
};

const textareaStyle = { ...inputStyle, resize:"none" };

const cancelBtn = {
  padding:"8px 14px", borderRadius:10,
  border:`1px solid ${C.border}`, background:"#fff",
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

/* ────────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────────── */
export default function MySurveysPage() {
  const {
    surveys, loading,
    createSurvey, fetchMySurveys,
    updateSurvey, deleteSurvey,
    closeSurvey, publishSurvey,
    shareLink, inviteSurvey,
  } = useSurvey();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [search,         setSearch]         = useState("");
  const [formData, setFormData] = useState({
    title:"", description:"", start_at:"", end_at:"",
  });

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

  return (
    <main style={{ minHeight:"100vh", background:C.bg, fontFamily:C.font }}>

      {/* HEADER */}
      <div style={{
        background:"#fff", borderBottom:`1px solid ${C.border}`,
        padding:"0 24px", height:70,
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:20,
      }}>
        <div>
          <h1 style={{fontSize:24, fontWeight:800, color:C.text, margin:0}}>My Surveys</h1>
          <p style={{margin:"4px 0 0", fontSize:13, color:C.textSub}}>Tạo và quản lý survey của bạn</p>
        </div>

        {/* SEARCH */}
        <div style={{
          flex:1, maxWidth:520, height:42, borderRadius:999,
          background:"#fff", border:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", gap:10, padding:"0 16px",
        }}>
          <Search size={15} color={C.textSub}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm survey..."
            style={{flex:1, border:"none", outline:"none", background:"transparent", fontSize:14, fontFamily:C.font, color:C.text}}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background:"none", border:"none", cursor:"pointer",
              color:C.textDim, display:"flex", padding:0,
            }}>
              <X size={14}/>
            </button>
          )}
        </div>

        {/* CREATE BTN */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"10px 18px", borderRadius:14,
            border: showCreateForm ? `1px solid ${C.border}` : "none",
            background: showCreateForm ? "#fff" : C.primaryGrad,
            color: showCreateForm ? C.textSub : "#fff",
            cursor:"pointer", fontWeight:700, fontFamily:C.font, fontSize:13,
            boxShadow: showCreateForm ? "none" : "0 2px 12px rgba(79,110,247,0.3)",
            transition:"all .15s",
          }}
        >
          {showCreateForm ? <X size={16}/> : <Plus size={16}/>}
          {showCreateForm ? "Huỷ" : "Survey mới"}
        </button>
      </div>

      <div style={{maxWidth:1200, margin:"0 auto", padding:24}}>

        {/* FORM */}
        {showCreateForm && (
          <div style={{
            background:"#fff", borderRadius:20,
            border:`1px solid ${C.border}`,
            padding:24, marginBottom:28,
            boxShadow:"0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <h2 style={{fontSize:18, fontWeight:700, marginBottom:20, color:C.text}}>
              Tạo Survey Mới
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{display:"flex", flexDirection:"column", gap:16}}>
                <input
                  type="text" name="title" value={formData.title}
                  onChange={handleChange} placeholder="Tiêu đề survey" required
                  style={{...inputStyle, fontSize:14, padding:"10px 14px"}}
                />
                <textarea
                  rows={4} name="description" value={formData.description}
                  onChange={handleChange} placeholder="Mô tả survey"
                  style={{...textareaStyle, fontSize:14, padding:"10px 14px"}}
                />
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                  <div>
                    <label style={{fontSize:12, color:C.textSub, display:"block", marginBottom:6}}>Bắt đầu</label>
                    <input type="datetime-local" name="start_at" value={formData.start_at} onChange={handleChange}
                      style={{...inputStyle, fontSize:13, padding:"9px 12px"}}/>
                  </div>
                  <div>
                    <label style={{fontSize:12, color:C.textSub, display:"block", marginBottom:6}}>Kết thúc</label>
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

        {/* LOADING */}
        {loading && (
          <div style={{display:"flex", justifyContent:"center", padding:"80px 0"}}>
            <Loader2 size={34} style={{animation:"spin 1s linear infinite"}} color={C.primary}/>
          </div>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <div style={{
            background:"#fff", borderRadius:28, border:`1px solid ${C.border}`,
            padding:"80px 20px", textAlign:"center",
          }}>
            <Inbox size={54} color={C.textDim}/>
            <h3 style={{marginTop:16, color:C.text, fontWeight:700}}>
              {search ? `Không tìm thấy "${search}"` : "Chưa có survey nào"}
            </h3>
            <p style={{color:C.textSub, margin:"8px 0 0"}}>
              {search ? "Thử tìm với từ khóa khác" : "Hãy tạo survey đầu tiên"}
            </p>
          </div>
        )}

        {/* GRID */}
        {!loading && filtered.length > 0 && (
          <>
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:16,
            }}>
              <span style={{fontSize:13, color:C.textSub}}>
                {filtered.length} survey{search ? ` · kết quả cho "${search}"` : ""}
              </span>
            </div>
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
              gap:20,
            }}>
              {filtered.map((survey, index) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  index={index}
                  onDelete={deleteSurvey}
                  onUpdate={updateSurvey}
                  onShare={shareLink}
                  onInvite={inviteSurvey}
                  onPublish={publishSurvey}
                  onCloseSurvey={closeSurvey}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </main>
  );
}
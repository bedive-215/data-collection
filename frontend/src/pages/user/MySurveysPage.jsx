// ─── MySurveysPage.jsx — "Của tôi" ───────────────────────────────────
// Thiết kế: warm off-white, sidebar-style header, card grid đều.
// Đã bỏ: RotatingGradient, stats "4 của tôi / 1 công khai".
// Card: grid auto-fill minmax(240px,1fr), gridAutoRows 260px → đều nhau.
// ─────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, X, Loader2, Inbox, Search,
  Check, Share2, Lock, Globe, Copy,
  ExternalLink, PowerOff, Users,
  Link as LinkIcon, Send, UserPlus, UserMinus,
  ChevronDown, RefreshCw, Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/providers/SurveyProvider";
import { SurveyCardHome, ShareModal } from "@/components/survey/SurveyCardHome";

/* ── Palette (warm neutral, kontras jelas) ─────────────────────────── */
const C = {
  bg:           "#f5f4f0",
  surface:      "#ffffff",
  surfaceHigh:  "#fafaf8",
  border:       "#e4e2da",
  borderHover:  "#c7c2b5",
  primary:      "#1a1a2e",
  primaryAccent:"#5046e5",
  primaryGrad:  "linear-gradient(135deg,#5046e5,#7c6ff5)",
  primaryDim:   "rgba(80,70,229,0.07)",
  primaryBorder:"rgba(80,70,229,0.2)",
  text:         "#1a1a2e",
  textSub:      "#5c5b70",
  textDim:      "#9896aa",
  error:        "#dc2626",
  errorBg:      "#fef2f2",
  errorBorder:  "#fecaca",
  success:      "#16a34a",
  successBg:    "#f0fdf4",
  successBorder:"#bbf7d0",
  warning:      "#d97706",
  warningBg:    "#fffbeb",
  warningBorder:"#fde68a",
  font:         "'Plus Jakarta Sans', 'DM Sans', sans-serif",
};

/* ── STATUS ────────────────────────────────────────────────────────── */
const STATUS_MAP = {
  ACTIVE:    { label:"Đang mở",  color:C.success,  bg:"rgba(22,163,74,.1)"    },
  DRAFT:     { label:"Nháp",     color:C.textSub,  bg:"rgba(92,91,112,.1)"    },
  EXPIRED:   { label:"Hết hạn",  color:C.error,    bg:"rgba(220,38,38,.1)"    },
  SCHEDULED: { label:"Lên lịch", color:C.warning,  bg:"rgba(217,119,6,.1)"    },
  CLOSED:    { label:"Đã đóng",  color:"#6b7280",  bg:"rgba(107,114,128,.1)"  },
};

/* ── Modal Base ──────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:16, border:`1px solid ${C.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.12)", width:"100%", maxWidth:width, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:C.text, fontFamily:C.font }}>{title}</h3>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textSub }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ padding:"20px", fontFamily:C.font }}>{children}</div>
      </div>
    </div>
  );
}

const cancelBtn = {
  padding:"9px 16px", borderRadius:9, border:`1px solid ${C.border}`,
  background:"transparent", color:C.textSub,
  fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
};
const primaryBtn = (disabled) => ({
  display:"flex", alignItems:"center", gap:6,
  padding:"9px 18px", borderRadius:9, border:"none",
  background: disabled ? C.surfaceHigh : C.primaryGrad,
  color: disabled ? C.textSub : "#fff",
  fontSize:13, fontWeight:700,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled ? "none" : "0 2px 10px rgba(80,70,229,0.28)",
  fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
});
const inputStyle = {
  width:"100%", boxSizing:"border-box",
  border:`1px solid ${C.border}`, borderRadius:9,
  background:"#fff", color:C.text,
  fontFamily:C.font, outline:"none",
  padding:"10px 14px", fontSize:13,
};

/* ── ShareLinkModal ────────────────────────────────────────────────── */
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied]   = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try { const url = await onShare(survey.id); if (url) setShareUrl(url); }
    finally { setLoading(false); }
  };
  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  useEffect(() => { if (!open) { setShareUrl(null); setCopied(false); } }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Chia sẻ khảo sát">
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:C.surfaceHigh, borderRadius:10, border:`1px solid ${C.border}` }}>
          <div style={{ width:38, height:38, borderRadius:10, background:C.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Share2 size={17} color={C.primaryAccent}/>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{survey?.title}</div>
            <div style={{ fontSize:11, color:C.textSub, marginTop:2 }}>Tạo link để chia sẻ với mọi người</div>
          </div>
        </div>
        {shareUrl ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:C.surfaceHigh, borderRadius:9, border:`1px solid ${C.border}` }}>
              <LinkIcon size={13} color={C.textDim} style={{ flexShrink:0 }}/>
              <span style={{ flex:1, fontSize:12, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{shareUrl}</span>
              <button onClick={handleCopy} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:7, border:`1px solid ${copied ? C.successBorder : C.border}`, background: copied ? C.successBg : "#fff", color: copied ? C.success : C.textSub, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                {copied ? <Check size={11}/> : <Copy size={11}/>}
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>
            </div>
            <button onClick={() => window.open(shareUrl, "_blank")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", borderRadius:9, border:`1px solid ${C.primaryBorder}`, background:C.primaryDim, color:C.primaryAccent, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              <ExternalLink size={13}/> Mở link
            </button>
          </div>
        ) : (
          <button onClick={handleGenerate} disabled={loading} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px 0", borderRadius:10, border:"none", background: loading ? C.surfaceHigh : C.primaryGrad, color: loading ? C.textSub : "#fff", fontSize:13, fontWeight:700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> Đang tạo...</> : <><LinkIcon size={15}/> Tạo link chia sẻ</>}
          </button>
        )}
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={onClose} style={cancelBtn}>Đóng</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── InviteModal ───────────────────────────────────────────────────── */
function InviteModal({ open, onClose, survey, onInvite }) {
  const [emails, setEmails]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");
  useEffect(() => { if (!open) { setEmails(""); setSuccess(false); setError(""); } }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (!list.length) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      await Promise.all(list.map(email => onInvite(survey.id, { email, role: "viewer" })));
      setSuccess(true); setEmails("");
    } catch { setError("Mời không thành công."); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mời người tham gia">
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {success && <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:9, background:C.successBg, border:`1px solid ${C.successBorder}`, fontSize:13, color:C.success, fontWeight:600 }}><Check size={13}/> Đã gửi lời mời!</div>}
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <textarea rows={4} value={emails} onChange={e => { setEmails(e.target.value); setError(""); }} placeholder={"example@email.com\nuser2@email.com"} style={{ ...inputStyle, resize:"vertical" }}/>
          {error && <div style={{ fontSize:12, color:C.error }}>{error}</div>}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Đóng</button>
            <button type="submit" disabled={loading} style={primaryBtn(loading)}>
              {loading ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Đang gửi...</> : <><Send size={13}/> Gửi lời mời</>}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ── BulkInviteModal ───────────────────────────────────────────────── */
function BulkInviteModal({ open, onClose, survey, onBulkInvite }) {
  const [emails, setEmails]   = useState("");
  const [role, setRole]       = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError]     = useState("");
  useEffect(() => { if (!open) { setEmails(""); setSuccess(null); setError(""); setRole("viewer"); } }, [open]);

  const parseEmails = () => emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const list = parseEmails();
    if (!list.length) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      const res = await onBulkInvite(survey.id, { emails: list, role });
      setSuccess({ sent: res?.sent ?? list.length, failed: res?.failed ?? 0 });
      setEmails("");
    } catch { setError("Bulk invite thất bại."); }
    finally { setLoading(false); }
  };

  const emailCount = parseEmails().length;
  return (
    <Modal open={open} onClose={onClose} title="Mời hàng loạt" width={520}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {success && (
          <div style={{ padding:"12px 14px", borderRadius:10, background:C.successBg, border:`1px solid ${C.successBorder}` }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.success, display:"flex", alignItems:"center", gap:6 }}><Check size={13}/> Đã gửi lời mời!</div>
            <div style={{ fontSize:12, color:C.textSub, marginTop:6 }}>✅ {success.sent} thành công{success.failed > 0 ? ` · ❌ ${success.failed} thất bại` : ""}</div>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", gap:6 }}>
            {[{ value:"viewer", label:"Viewer" }, { value:"respondent", label:"Respondent" }, { value:"editor", label:"Editor" }].map(r => (
              <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{ flex:1, padding:"8px 6px", borderRadius:9, border:`1.5px solid ${role === r.value ? C.primaryAccent : C.border}`, background: role === r.value ? C.primaryDim : "#fff", cursor:"pointer", fontSize:12, fontWeight:700, color: role === r.value ? C.primaryAccent : C.text }}>
                {r.label}
              </button>
            ))}
          </div>
          <textarea rows={5} value={emails} onChange={e => { setEmails(e.target.value); setError(""); }} placeholder={"user1@email.com\nuser2@email.com, user3@email.com"} style={{ ...inputStyle, resize:"vertical" }}/>
          {error && <div style={{ fontSize:12, color:C.error }}>{error}</div>}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            {emailCount > 0 && <span style={{ fontSize:12, color:C.textSub }}>{emailCount} email</span>}
            <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
              <button type="button" onClick={onClose} style={cancelBtn}>Đóng</button>
              <button type="submit" disabled={loading || !emailCount} style={primaryBtn(loading || !emailCount)}>
                {loading ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Đang gửi...</> : <><UserPlus size={13}/> Mời {emailCount > 0 ? `${emailCount} người` : ""}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ── ParticipantsModal ─────────────────────────────────────────────── */
function ParticipantsModal({ open, onClose, survey, onGetParticipants, onDeleteParticipant }) {
  const [participants, setParticipants] = useState([]);
  const [count, setCount]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [deleting, setDeleting]         = useState(null);
  const [search, setSearch]             = useState("");
  const [confirmPid, setConfirmPid]     = useState(null);
  const [error, setError]               = useState("");

  const load = useCallback(async () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    try {
      const res  = await onGetParticipants(survey.id, {});
      const list = res?.participants ?? [];
      setParticipants(list); setCount(res?.count ?? list.length);
    } catch { setError("Không thể tải danh sách."); }
    finally { setLoading(false); }
  }, [survey?.id, onGetParticipants]);

  useEffect(() => {
    if (open) { load(); setSearch(""); setConfirmPid(null); setError(""); }
    else { setParticipants([]); setCount(0); }
  }, [open, load]);

  const handleDelete = async (pid) => {
    setDeleting(pid);
    try {
      await onDeleteParticipant(survey.id, pid);
      setParticipants(p => p.filter(x => (x.participant_id ?? x.id) !== pid));
      setCount(p => Math.max(0, p - 1));
      setConfirmPid(null);
    } finally { setDeleting(null); }
  };

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    return p.email?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q);
  });

  const AV = [
    { bg:"#dbeafe", color:"#1d4ed8" },
    { bg:"#dcfce7", color:"#15803d" },
    { bg:"#fce7f3", color:"#be185d" },
    { bg:"#fef3c7", color:"#92400e" },
    { bg:"#ede9fe", color:"#6d28d9" },
  ];
  const initials = (name, email) => name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : (email || "?")[0].toUpperCase();

  return (
    <Modal open={open} onClose={onClose} title="Người tham gia" width={540}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ flex:1, padding:"12px 14px", borderRadius:10, background:C.surfaceHigh, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
            <Users size={16} color={C.primaryAccent}/>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:C.text, lineHeight:1 }}>{count}</div>
              <div style={{ fontSize:11, color:C.textSub, marginTop:2 }}>Tổng người tham gia</div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{ padding:"0 14px", borderRadius:10, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:C.textSub }}>
            <RefreshCw size={13} style={loading ? { animation:"spin 1s linear infinite" } : {}}/>
          </button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#fff", border:`1px solid ${C.border}`, borderRadius:9 }}>
          <Search size={13} color={C.textDim}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email..." style={{ flex:1, border:"none", outline:"none", fontSize:12, fontFamily:C.font, color:C.text, background:"transparent" }}/>
          {search && <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", padding:0 }}><X size={12}/></button>}
        </div>
        <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", maxHeight:340, overflowY:"auto" }}>
          {loading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px", gap:10 }}>
              <Loader2 size={22} style={{ animation:"spin 1s linear infinite" }} color={C.primaryAccent}/>
              <span style={{ fontSize:13, color:C.textSub }}>Đang tải...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"36px", color:C.textSub }}>
              <Users size={28} color={C.textDim} style={{ marginBottom:8 }}/>
              <div style={{ fontSize:13, fontWeight:600 }}>{search ? `Không tìm thấy "${search}"` : "Chưa có người tham gia"}</div>
            </div>
          ) : filtered.map((p, i) => {
            const av = AV[i % AV.length];
            const key = p.participant_id ?? p.id;
            const isConfirm = confirmPid === key;
            const isDel     = deleting === key;
            return (
              <div key={key ?? i} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", background: isConfirm ? C.errorBg : "#fff" }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:av.bg, color:av.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{initials(p.name, p.email)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name || p.email}</div>
                  {p.name && <div style={{ fontSize:11, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.email}</div>}
                </div>
                {isConfirm ? (
                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                    <button onClick={() => setConfirmPid(null)} style={{ padding:"4px 8px", borderRadius:6, fontSize:11, fontWeight:600, border:`1px solid ${C.border}`, background:"#fff", color:C.textSub, cursor:"pointer" }}>Huỷ</button>
                    <button onClick={() => handleDelete(key)} disabled={isDel} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:6, fontSize:11, fontWeight:700, border:"none", background: isDel ? C.surfaceHigh : C.error, color: isDel ? C.textSub : "#fff", cursor: isDel ? "not-allowed" : "pointer" }}>
                      {isDel ? <Loader2 size={10} style={{ animation:"spin 1s linear infinite" }}/> : <Trash2 size={10}/>} Xoá
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmPid(key)} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textDim }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#fecaca"; e.currentTarget.style.color=C.error; e.currentTarget.style.background=C.errorBg; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textDim; e.currentTarget.style.background="transparent"; }}>
                    <UserMinus size={12}/>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={onClose} style={cancelBtn}>Đóng</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── PublishModal ──────────────────────────────────────────────────── */
function PublishModal({ open, onClose, survey, onPublish }) {
  const [loading, setLoading] = useState(false);
  const isPub = survey?.is_published;
  const handleConfirm = async () => {
    setLoading(true);
    try { await onPublish(survey.id, { is_published: !isPub }); onClose(); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={isPub ? "Ẩn khảo sát" : "Công khai khảo sát"} width={400}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ padding:16, borderRadius:10, background: isPub ? C.warningBg : C.primaryDim, border:`1px solid ${isPub ? C.warningBorder : C.primaryBorder}`, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>{isPub ? "🔒" : "🌐"}</div>
          <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{isPub ? "Khảo sát sẽ bị ẩn và không nhận thêm câu trả lời." : "Khảo sát sẽ được công khai."}</div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          <button onClick={onClose} style={cancelBtn}>Huỷ</button>
          <button onClick={handleConfirm} disabled={loading} style={primaryBtn(loading)}>
            {loading ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Đang xử lý...</> : isPub ? <><PowerOff size={13}/> Ẩn</> : <><Globe size={13}/> Công khai</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── ExtendModal ───────────────────────────────────────────────────── */
function ExtendModal({ open, onClose, survey, onExtend }) {
  const [submitting, setSubmitting] = useState(false);
  const [newDate, setNewDate]       = useState("");
  const [error, setError]           = useState("");

  useEffect(() => {
    if (open && survey?.end_at) {
      const d = new Date(survey.end_at); d.setDate(d.getDate() + 7);
      setNewDate(d.toISOString().slice(0, 16));
    }
    setError("");
  }, [open, survey]);

  const handleExtend = async () => {
    if (!newDate) { setError("Vui lòng chọn ngày"); return; }
    if (new Date(newDate) <= new Date()) { setError("Ngày phải lớn hơn hiện tại"); return; }
    setSubmitting(true);
    try { await onExtend(survey.id, newDate); onClose(); }
    catch { setError("Gia hạn thất bại"); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Gia hạn khảo sát" width={420}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ padding:"12px 14px", borderRadius:10, background:C.errorBg, border:`1px solid ${C.errorBorder}` }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.error }}>Khảo sát đã hết hạn và không nhận phản hồi mới.</div>
          {survey?.end_at && <div style={{ fontSize:12, color:C.error, marginTop:4 }}>Ngày kết thúc: {new Date(survey.end_at).toLocaleDateString("vi-VN", { day:"2-digit", month:"long", year:"numeric" })}</div>}
        </div>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textSub, marginBottom:6 }}>Ngày kết thúc mới</label>
          <input type="datetime-local" value={newDate} onChange={e => { setNewDate(e.target.value); setError(""); }} min={new Date().toISOString().slice(0, 16)} style={{ ...inputStyle, borderRadius:9 }}/>
          {error && <p style={{ margin:"6px 0 0", fontSize:12, color:C.error }}>{error}</p>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ ...cancelBtn, flex:1 }}>Đóng</button>
          <button onClick={handleExtend} disabled={submitting} style={{ ...primaryBtn(submitting), flex:1, justifyContent:"center" }}>
            {submitting ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> Đang xử lý...</> : <><RefreshCw size={14}/> Gia hạn</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── CardSkeleton ──────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, height:260, overflow:"hidden", animation:"skPulse 1.4s ease-in-out infinite", display:"flex", flexDirection:"column" }}>
      <div style={{ height:8, background:"#e8e4dc" }}/>
      <div style={{ padding:16, flex:1, display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ height:11, background:"#f0ede8", borderRadius:6, width:"60%" }}/>
        <div style={{ height:14, background:"#ede9e3", borderRadius:6, width:"85%" }}/>
        <div style={{ height:11, background:"#f0ede8", borderRadius:6, width:"70%" }}/>
        <div style={{ marginTop:"auto", height:28, background:"#f0ede8", borderRadius:8, width:"40%" }}/>
      </div>
      <style>{`@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MySurveysPage
   ══════════════════════════════════════════════════════════════════ */
export default function MySurveysPage() {
  const navigate = useNavigate();
  const {
    surveys, loading,
    createSurvey, fetchMySurveys,
    closeSurvey, extendSurvey,
    shareLink,
    getParticipants, deleteParticipant,
  } = useSurvey();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [search, setSearch]                 = useState("");
  const [formData, setFormData]             = useState({ title:"", description:"", start_at:"", end_at:"" });
  const [extendModal, setExtendModal]       = useState({ open: false, survey: null });
  const [shareModal, setShareModal]         = useState({ open: false, surveyId: null, surveyTitle: "", shareUrl: "", loading: false, error: "" });

  useEffect(() => { fetchMySurveys(1, 50); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createSurvey({ title: formData.title, description: formData.description || null, start_at: formData.start_at || null, end_at: formData.end_at || null });
      setFormData({ title:"", description:"", start_at:"", end_at:"" });
      setShowCreateForm(false);
      await fetchMySurveys(1, 50);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const filtered = surveys.filter(s => s.title?.toLowerCase().includes(search.toLowerCase()));

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
      setShareModal(p => ({ ...p, loading: false, error: "Tạo link thất bại." }));
    }
  };

  const handleClose  = useCallback(async (id) => { try { await closeSurvey(id); await fetchMySurveys(1, 50); } catch {} }, [closeSurvey, fetchMySurveys]);
  const handleExtend = useCallback(async (id, new_end_at) => { try { await extendSurvey(id, new_end_at); await fetchMySurveys(1, 50); } catch {} }, [extendSurvey, fetchMySurveys]);

  return (
    <main style={{ minHeight:"100vh", background:C.bg, fontFamily:C.font }}>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        {/* Title + count */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:C.text, letterSpacing:"-0.02em" }}>Khảo sát của tôi</h1>
          {!loading && (
            <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:999, background:C.primaryDim, color:C.primaryAccent, border:`1px solid ${C.primaryBorder}` }}>
              {filtered.length}
            </span>
          )}
        </div>

        {/* Search */}
        <div style={{ flex:1, maxWidth:440, position:"relative" }}>
          <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm khảo sát..."
            style={{ width:"100%", height:38, paddingLeft:36, paddingRight: search ? 36 : 14, border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:13, outline:"none", background:"#fafaf8", color:C.text, fontFamily:C.font, boxSizing:"border-box" }}
            onFocus={e => { e.target.style.borderColor = C.primaryAccent; e.target.style.background = "#fff"; }}
            onBlur={e  => { e.target.style.borderColor = C.border; e.target.style.background = "#fafaf8"; }}
          />
          {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", display:"flex", padding:0 }}><X size={14}/></button>}
        </div>

        {/* Right actions */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => fetchMySurveys(1, 50)} style={{ width:36, height:36, borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textSub }}>
            <RefreshCw size={15}/>
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"0 16px", height:36, borderRadius:9, border: showCreateForm ? `1px solid ${C.border}` : "none", background: showCreateForm ? "#fff" : C.primaryGrad, color: showCreateForm ? C.textSub : "#fff", cursor:"pointer", fontWeight:700, fontFamily:C.font, fontSize:13, boxShadow: showCreateForm ? "none" : "0 4px 14px rgba(80,70,229,0.28)" }}
          >
            {showCreateForm ? <X size={14}/> : <Plus size={14}/>}
            {showCreateForm ? "Huỷ" : "Tạo mới"}
          </button>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1320, margin:"0 auto", padding:"28px 32px 60px" }}>

        {/* Create form */}
        {showCreateForm && (
          <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:24, marginBottom:24, boxShadow:"0 2px 16px rgba(0,0,0,0.05)" }}>
            <h2 style={{ margin:"0 0 18px", fontSize:15, fontWeight:700, color:C.text }}>Tạo khảo sát mới</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Tiêu đề khảo sát" required style={{ ...inputStyle }}/>
                <textarea rows={3} name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả (tuỳ chọn)" style={{ ...inputStyle, resize:"vertical" }}/>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:11, color:C.textSub, display:"block", marginBottom:5, fontWeight:600 }}>Bắt đầu</label>
                    <input type="datetime-local" name="start_at" value={formData.start_at} onChange={handleChange} style={{ ...inputStyle }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:C.textSub, display:"block", marginBottom:5, fontWeight:600 }}>Kết thúc</label>
                    <input type="datetime-local" name="end_at" value={formData.end_at} onChange={handleChange} style={{ ...inputStyle }}/>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                  <button type="button" onClick={() => setShowCreateForm(false)} style={cancelBtn}>Huỷ</button>
                  <button type="submit" disabled={submitting} style={primaryBtn(submitting)}>
                    {submitting ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> Đang tạo...</> : <><Plus size={14}/> Tạo khảo sát</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gridAutoRows:260, gap:16 }}>
            {Array(8).fill(0).map((_, i) => <CardSkeleton key={i}/>)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ background:"#fff", borderRadius:16, border:`1px solid ${C.border}`, padding:"80px 20px", textAlign:"center" }}>
            <Inbox size={48} color={C.textDim}/>
            <h3 style={{ marginTop:16, color:C.text, fontWeight:700, marginBottom:6 }}>
              {search ? `Không tìm thấy "${search}"` : "Chưa có khảo sát nào"}
            </h3>
            <p style={{ color:C.textSub, margin:0, fontSize:13 }}>
              {search ? "Thử từ khoá khác" : "Nhấn \"Tạo mới\" để bắt đầu"}
            </p>
          </div>
        )}

        {/* Grid — card đều kích thước */}
        {!loading && filtered.length > 0 && (
          <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <span style={{ fontSize:12, color:C.textSub, fontWeight:500 }}>
                {filtered.length} khảo sát{search ? ` · "${search}"` : ""}
              </span>
            </div>
            <div style={{
              display: "grid",
              /* card đều nhau, tối thiểu 240px, tự co giãn số cột */
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gridAutoRows: "260px",
              gap: 16,
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

      {/* Modals */}
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
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        button{font-family:'Plus Jakarta Sans','DM Sans',sans-serif}
      `}</style>
    </main>
  );
}
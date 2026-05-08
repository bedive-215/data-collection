// ─── SurveysLayout.jsx ─── Redesigned ────────────────────────────
import React, {
  useEffect, useState, useRef, useMemo, useCallback,
} from "react";
import {
  Plus, X, FileText, Calendar, Loader2, Inbox, Search,
  MoreVertical, Trash2, Pencil, Check, Share2, Mail,
  Lock, Globe, Copy, ExternalLink, PowerOff,
  Users, Link as LinkIcon, Send, CheckCircle2, Clock,
  LayoutGrid, List, SlidersHorizontal, RefreshCw, ArrowLeft,
  ChevronDown, ChevronUp, Sparkles,
  UserPlus, UserMinus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSurvey }    from "@/providers/SurveyProvider";
import { useResponse }  from "@/providers/ResponseProvider";

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════════════════════ */
const C = {
  bg:            "#f7f8fc",
  surface:       "#ffffff",
  surfaceHigh:   "#f4f5f9",
  border:        "rgba(0,0,0,0.07)",
  borderMed:     "rgba(0,0,0,0.12)",
  primary:       "#4361ee",
  primaryLight:  "#eef0fd",
  primaryBorder: "#c5cdfb",
  text:          "#0f1117",
  textSub:       "#6b7280",
  textDim:       "#9ca3af",
  error:         "#ef4444",
  errorBg:       "#fef2f2",
  errorBorder:   "#fecaca",
  success:       "#10b981",
  successBg:     "#ecfdf5",
  successBorder: "#a7f3d0",
  warning:       "#f59e0b",
  warningBg:     "#fffbeb",
  warningBorder: "#fde68a",
  font:          "'DM Sans', 'Inter', sans-serif",
  thumbGrads: [
    "linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 100%)",
    "linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)",
    "linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%)",
    "linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)",
    "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
    "linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%)",
  ],
};

/* ════════════════════════════════════════════════════════════════
   SHARED: StatusBadge
════════════════════════════════════════════════════════════════ */
const STATUS_MAP = {
  ACTIVE:    { label:"Đang mở",  color:"#059669", bg:"#d1fae5" },
  DRAFT:     { label:"Nháp",     color:C.textSub, bg:"#f3f4f6" },
  EXPIRED:   { label:"Hết hạn",  color:"#dc2626", bg:"#fee2e2" },
  SCHEDULED: { label:"Lên lịch", color:"#d97706", bg:"#fef3c7" },
  CLOSED:    { label:"Đã đóng",  color:"#6b7280", bg:"#f3f4f6" },
};
function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, color:s.color, background:s.bg, letterSpacing:"0.03em" }}>
      {s.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED: Modal base
════════════════════════════════════════════════════════════════ */
function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(15,17,23,0.5)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      animation:"fadeIn .16s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:20,
        border:`1px solid ${C.border}`,
        boxShadow:"0 32px 80px rgba(0,0,0,0.16), 0 0 0 1px rgba(255,255,255,0.5)",
        width:"100%", maxWidth:width, overflow:"hidden",
        animation:"slideUp .22s cubic-bezier(.16,1,.3,1)",
      }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px", borderBottom:`1px solid ${C.border}`,
        }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:C.text, fontFamily:C.font }}>{title}</h3>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`,
            background:"transparent", cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", color:C.textSub, transition:"all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.errorBg; e.currentTarget.style.color = C.error; e.currentTarget.style.borderColor = C.errorBorder; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = C.border; }}
          ><X size={13}/></button>
        </div>
        <div style={{ padding:"20px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED: GeneratingOverlay
════════════════════════════════════════════════════════════════ */
function GeneratingOverlay({ open }) {
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1100,
      background:"rgba(15,17,23,0.6)", backdropFilter:"blur(8px)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20,
    }}>
      <div style={{ position:"relative", width:64, height:64 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid rgba(67,97,238,0.15)` }}/>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid transparent", borderTopColor:C.primary, animation:"spin .7s linear infinite" }}/>
        <div style={{ position:"absolute", inset:8, borderRadius:"50%", background:"rgba(67,97,238,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <LinkIcon size={18} color={C.primary}/>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4, fontFamily:C.font }}>Đang tạo link...</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", fontFamily:C.font }}>Vui lòng đợi trong giây lát</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEYS: ShareLinkModal
════════════════════════════════════════════════════════════════ */
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const [shareUrl,   setShareUrl]   = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) { setShareUrl(null); setCopied(false); setError(""); }
  }, [open]);

  useEffect(() => {
    if (!open || !survey) return;
    let cancelled = false;
    const generate = async () => {
      setGenerating(true);
      try {
        const result = await onShare(survey.id);
        if (cancelled) return;
        const url = typeof result === "string" ? result : result?.url || result?.data?.url || null;
        if (url) setShareUrl(url);
        else setError("Không lấy được link. Vui lòng thử lại.");
      } catch { if (!cancelled) setError("Tạo link thất bại."); }
      finally   { if (!cancelled) setGenerating(false); }
    };
    generate();
    return () => { cancelled = true; };
  }, [open, survey?.id]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      const el = document.createElement("textarea");
      el.value = shareUrl; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    });
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const handleRetry = async () => {
    setShareUrl(null); setError(""); setGenerating(true);
    try {
      const result = await onShare(survey.id);
      const url = typeof result === "string" ? result : result?.url || result?.data?.url || null;
      if (url) setShareUrl(url); else setError("Không lấy được link.");
    } catch { setError("Tạo link thất bại."); }
    finally { setGenerating(false); }
  };

  return (
    <>
      <GeneratingOverlay open={generating}/>
      <Modal open={open && !generating} onClose={onClose} title="Chia sẻ khảo sát">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ padding:"12px 14px", background:C.primaryLight, borderRadius:12, border:`1px solid ${C.primaryBorder}` }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:C.font }}>{survey?.title}</div>
            <div style={{ fontSize:12, color:C.textSub, marginTop:2, fontFamily:C.font }}>Chia sẻ survey này qua đường dẫn</div>
          </div>
          {error && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:10, background:C.errorBg, border:`1px solid ${C.errorBorder}` }}>
              <span style={{ fontSize:12, color:C.error, fontFamily:C.font }}>{error}</span>
              <button onClick={handleRetry} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.errorBorder}`, background:"#fff", color:C.error, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:C.font }}>Thử lại</button>
            </div>
          )}
          {shareUrl && !error && (
            <div style={{ display:"flex", flexDirection:"column", gap:10, animation:"slideUp .2s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:C.surfaceHigh, borderRadius:10, border:`1px solid ${C.primaryBorder}` }}>
                <LinkIcon size={13} color={C.primary} style={{ flexShrink:0 }}/>
                <span style={{ flex:1, fontSize:12, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'SF Mono','Fira Code',monospace" }}>{shareUrl}</span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={handleCopy} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:10, border:`1px solid ${copied ? C.successBorder : C.primaryBorder}`, background:copied ? C.successBg : C.primaryLight, color:copied ? C.success : C.primary, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:C.font, transition:"all .2s" }}>
                  {copied ? <><Check size={13}/> Đã sao chép!</> : <><Copy size={13}/> Sao chép link</>}
                </button>
                <button onClick={() => window.open(shareUrl, "_blank")} style={{ width:40, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:10, border:`1px solid ${C.border}`, background:"transparent", color:C.textSub, cursor:"pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.textSub; }}
                ><ExternalLink size={14}/></button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEYS: InviteModal
════════════════════════════════════════════════════════════════ */
function InviteModal({ open, onClose, survey, onInvite }) {
  const [emails,    setEmails]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(false); setError(""); setSentCount(0); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (list.length === 0) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError(""); setSuccess(false);
    try {
      await Promise.all(list.map(email => onInvite(survey.id, { email, role:"viewer" })));
      setSentCount(list.length); setSuccess(true); setEmails("");
    } catch { setError("Mời không thành công."); }
    finally { setLoading(false); }
  };

  const inputBase = { width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:13, fontFamily:C.font, outline:"none" };

  return (
    <Modal open={open} onClose={onClose} title="Mời người tham gia">
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {success && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, background:C.successBg, border:`1px solid ${C.successBorder}` }}>
            <Check size={14} color={C.success}/>
            <span style={{ fontSize:12, fontWeight:600, color:"#059669", fontFamily:C.font }}>Đã gửi lời mời đến {sentCount} địa chỉ email.</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.textSub, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:C.font }}>Địa chỉ email</label>
            <textarea rows={4} value={emails} onChange={e => { setEmails(e.target.value); setError(""); }}
              placeholder={"example@email.com\nuser2@email.com"}
              style={{ ...inputBase, resize:"vertical", lineHeight:1.7 }}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryLight}`; }}
              onBlur={e => { e.target.style.borderColor = error ? C.error : C.border; e.target.style.boxShadow = "none"; }}
            />
            {error && <div style={{ fontSize:12, color:C.error, fontFamily:C.font }}>{error}</div>}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
              <button type="button" onClick={onClose} style={sharedCancelBtn}>Đóng</button>
              <button type="submit" disabled={loading} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:9, border:"none", background:loading ? C.surfaceHigh : C.primary, color:loading ? C.textSub : "#fff", fontSize:12, fontWeight:700, cursor:loading ? "not-allowed":"pointer", fontFamily:C.font }}>
                {loading ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Đang gửi...</> : <><Send size={13}/> Gửi lời mời</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   BulkInviteModal
════════════════════════════════════════════════════════════════ */
function BulkInviteModal({ open, onClose, survey, onBulkInvite }) {
  const [emails,  setEmails]  = useState("");
  const [role,    setRole]    = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(null); setError(""); setRole("viewer"); }
  }, [open]);

  const parseEmails = () => emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
  const emailCount  = parseEmails().length;

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

  const ROLES = [
    { value:"viewer",     label:"👁️ Viewer",     desc:"Chỉ xem" },
    { value:"respondent", label:"✏️ Respondent", desc:"Trả lời" },
    { value:"editor",     label:"🛠️ Editor",     desc:"Chỉnh sửa" },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Mời hàng loạt" width={520}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:C.primaryLight, borderRadius:10, border:`1px solid ${C.primaryBorder}` }}>
          <div style={{ width:36, height:36, borderRadius:9, background:"rgba(67,97,238,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <UserPlus size={17} color={C.primary}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:C.font }}>{survey?.title}</div>
            <div style={{ fontSize:11, color:C.textSub, marginTop:2, fontFamily:C.font }}>Nhập nhiều email cùng lúc để mời hàng loạt</div>
          </div>
          {emailCount > 0 && (
            <span style={{ padding:"3px 10px", borderRadius:999, background:"rgba(67,97,238,0.12)", color:C.primary, fontSize:11, fontWeight:700, flexShrink:0, fontFamily:C.font }}>
              {emailCount} email
            </span>
          )}
        </div>

        {success && (
          <div style={{ padding:"12px 14px", borderRadius:10, background:C.successBg, border:`1px solid ${C.successBorder}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:700, color:"#059669", fontFamily:C.font }}>
              <Check size={13}/> Đã gửi lời mời hàng loạt!
            </div>
            <div style={{ display:"flex", gap:16, marginTop:6 }}>
              <span style={{ fontSize:11, color:C.textSub, fontFamily:C.font }}>✅ Thành công: <strong style={{ color:C.success }}>{success.sent}</strong></span>
              {success.failed > 0 && <span style={{ fontSize:11, color:C.textSub, fontFamily:C.font }}>❌ Thất bại: <strong style={{ color:C.error }}>{success.failed}</strong></span>}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:7, fontFamily:C.font }}>Vai trò</label>
              <div style={{ display:"flex", gap:7 }}>
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{
                    flex:1, padding:"8px 10px", borderRadius:9,
                    border:`1.5px solid ${role === r.value ? C.primary : C.border}`,
                    background: role === r.value ? C.primaryLight : "#fff",
                    cursor:"pointer", textAlign:"center", transition:"all .15s",
                  }}>
                    <div style={{ fontSize:12, fontWeight:700, color: role === r.value ? C.primary : C.text, fontFamily:C.font }}>{r.label}</div>
                    <div style={{ fontSize:10, color:C.textDim, marginTop:2, fontFamily:C.font }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:7, fontFamily:C.font }}>Danh sách email</label>
              <textarea rows={6} value={emails} onChange={e => { setEmails(e.target.value); setError(""); }}
                placeholder={"user1@email.com\nuser2@email.com, user3@email.com\n(dấu phẩy, chấm phẩy hoặc xuống dòng)"}
                style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", background:"#fff", border:`1.5px solid ${error ? C.error : C.border}`, borderRadius:10, color:C.text, fontSize:12, fontFamily:C.font, outline:"none", resize:"vertical", lineHeight:1.7 }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryLight}`; }}
                onBlur={e => { e.target.style.borderColor = error ? C.error : C.border; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {error && <div style={{ fontSize:12, color:C.error, fontFamily:C.font }}>{error}</div>}

            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button type="button" onClick={onClose} style={sharedCancelBtn}>Đóng</button>
              <button type="submit" disabled={loading || emailCount === 0} style={{
                display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:9, border:"none",
                background: (loading || emailCount === 0) ? C.surfaceHigh : C.primary,
                color: (loading || emailCount === 0) ? C.textSub : "#fff",
                fontSize:12, fontWeight:700, cursor: (loading || emailCount === 0) ? "not-allowed" : "pointer", fontFamily:C.font,
              }}>
                {loading
                  ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Đang gửi...</>
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

/* ════════════════════════════════════════════════════════════════
   ParticipantsModal
   API response: { count: number, participants: [{ participant_id, id, email, role }] }
════════════════════════════════════════════════════════════════ */
function ParticipantsModal({ open, onClose, survey, onGetParticipants, onDeleteParticipant }) {
  const [participants, setParticipants] = useState([]);
  const [count,        setCount]        = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [deleting,     setDeleting]     = useState(null);
  const [confirmPid,   setConfirmPid]   = useState(null);
  const [search,       setSearch]       = useState("");
  const [error,        setError]        = useState("");

  const load = useCallback(async () => {
  if (!survey?.id) return;
  setLoading(true);
  setError("");
  try {
    const res = await onGetParticipants(survey.id, {});
    // Provider giờ trả về { count, participants }
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
}, [open, load]); // ← thay survey?.id bằng load (vì load đã dep vào survey?.id)

  const handleDelete = async (participantId) => {
    setDeleting(participantId);
    try {
      // participant_id là id dùng để xoá
      await onDeleteParticipant(survey.id, participantId);
      setParticipants(prev => prev.filter(p => p.participant_id !== participantId));
      setCount(prev => Math.max(0, prev - 1));
      setConfirmPid(null);
    } catch {
      // giữ nguyên nếu lỗi
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
    { bg:"#e0e7ff", color:"#3730a3" },
    { bg:"#d1fae5", color:"#065f46" },
    { bg:"#fce7f3", color:"#9d174d" },
    { bg:"#fef3c7", color:"#78350f" },
    { bg:"#f3e8ff", color:"#5b21b6" },
  ];

  const ROLE_STYLE = {
    viewer:     { color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe" },
    respondent: { color:"#059669", bg:"#ecfdf5", border:"#a7f3d0" },
    editor:     { color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
  };

  const getRoleStyle = (role) => ROLE_STYLE[role?.toLowerCase()] ?? { color:C.primary, bg:C.primaryLight, border:C.primaryBorder };

  return (
    <Modal open={open} onClose={onClose} title="Quản lý người tham gia" width={540}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Stats + Reload */}
        <div style={{ display:"flex", gap:10, alignItems:"stretch" }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:11, background:C.primaryLight, border:`1px solid ${C.primaryBorder}` }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"rgba(67,97,238,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Users size={15} color={C.primary}/>
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:C.text, lineHeight:1, fontFamily:C.font }}>{count}</div>
              <div style={{ fontSize:11, color:C.textSub, marginTop:2, fontFamily:C.font }}>Tổng participants</div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{
            padding:"0 14px", borderRadius:11, border:`1px solid ${C.border}`, background:"#fff",
            cursor:loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:6,
            fontSize:11, fontWeight:600, color:C.textSub, flexShrink:0, fontFamily:C.font,
          }}>
            <RefreshCw size={13} style={loading ? { animation:"spin 1s linear infinite" } : {}}/>
            Tải lại
          </button>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:10, background:C.errorBg, border:`1px solid ${C.errorBorder}` }}>
            <span style={{ fontSize:12, color:C.error, fontFamily:C.font }}>{error}</span>
            <button onClick={load} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.errorBorder}`, background:"#fff", color:C.error, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:C.font }}>Thử lại</button>
          </div>
        )}

        {/* Search */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#fff", border:`1px solid ${C.border}`, borderRadius:9 }}>
          <Search size={13} color={C.textDim}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email hoặc vai trò..."
            style={{ flex:1, border:"none", outline:"none", fontSize:12, fontFamily:C.font, color:C.text, background:"transparent" }}/>
          {search && (
            <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", padding:0 }}>
              <X size={12}/>
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ border:`1px solid ${C.border}`, borderRadius:11, overflow:"hidden", maxHeight:340, overflowY:"auto" }}>
          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 20px", gap:12 }}>
              <Loader2 size={26} style={{ animation:"spin 1s linear infinite" }} color={C.primary}/>
              <span style={{ fontSize:12, color:C.textSub, fontFamily:C.font }}>Đang tải...</span>
            </div>
          ) : filtered.length === 0 && !error ? (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <Users size={28} color={C.textDim} style={{ marginBottom:8 }}/>
              <div style={{ fontSize:12, fontWeight:600, color:C.textSub, fontFamily:C.font }}>
                {search ? `Không tìm thấy "${search}"` : "Chưa có người tham gia nào"}
              </div>
              {!search && (
                <div style={{ fontSize:11, color:C.textDim, marginTop:4, fontFamily:C.font }}>
                  Dùng "Mời hàng loạt" để thêm người tham gia
                </div>
              )}
            </div>
          ) : (
            filtered.map((p, i) => {
              const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
              // participant_id dùng để xoá, id là user id
              const deleteKey   = p.participant_id ?? p.id;
              const isConfirming = confirmPid === deleteKey;
              const isDeleting   = deleting === deleteKey;
              const roleStyle    = getRoleStyle(p.role);

              return (
                <div key={p.participant_id ?? p.id ?? i} style={{
                  display:"flex", alignItems:"center", gap:11, padding:"11px 14px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  background: isConfirming ? C.errorBg : "#fff",
                  transition:"background .15s",
                }}>
                  {/* Avatar */}
                  <div style={{
                    width:34, height:34, borderRadius:"50%",
                    background:av.bg, color:av.color,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:700, flexShrink:0, letterSpacing:"0.03em",
                  }}>
                    {getInitials(p.name, p.email)}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:C.font }}>
                      {p.name || p.email}
                    </div>
                    {p.name && (
                      <div style={{ fontSize:11, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:C.font }}>
                        {p.email}
                      </div>
                    )}
                    {!p.name && (
                      <div style={{ fontSize:10, color:C.textDim, fontFamily:C.font }}>
                        ID: {p.id ? p.id.slice(0, 8) + "..." : "—"}
                      </div>
                    )}
                  </div>

                  {/* Role badge */}
                  {p.role && (
                    <span style={{
                      fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:999,
                      flexShrink:0, color:roleStyle.color, background:roleStyle.bg,
                      border:`1px solid ${roleStyle.border}`, fontFamily:C.font,
                    }}>
                      {p.role}
                    </span>
                  )}

                  {/* Delete confirm / button */}
                  {isConfirming ? (
                    <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                      <button onClick={() => setConfirmPid(null)} style={{
                        padding:"4px 9px", borderRadius:6, fontSize:11, fontWeight:600,
                        border:`1px solid ${C.border}`, background:"#fff",
                        color:C.textSub, cursor:"pointer", fontFamily:C.font,
                      }}>
                        Huỷ
                      </button>
                      <button onClick={() => handleDelete(deleteKey)} disabled={isDeleting} style={{
                        display:"flex", alignItems:"center", gap:4,
                        padding:"4px 9px", borderRadius:6, fontSize:11, fontWeight:700,
                        border:"none",
                        background: isDeleting ? C.surfaceHigh : C.error,
                        color: isDeleting ? C.textSub : "#fff",
                        cursor: isDeleting ? "not-allowed" : "pointer", fontFamily:C.font,
                      }}>
                        {isDeleting ? <Loader2 size={10} style={{ animation:"spin 1s linear infinite" }}/> : <Trash2 size={10}/>}
                        Xoá
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPid(deleteKey)}
                      title="Xoá khỏi danh sách"
                      style={{
                        width:28, height:28, borderRadius:7, flexShrink:0,
                        border:`1px solid ${C.border}`, background:"transparent",
                        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                        color:C.textDim, transition:"all .15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.errorBorder; e.currentTarget.style.color = C.error; e.currentTarget.style.background = C.errorBg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = "transparent"; }}
                    >
                      <UserMinus size={12}/>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer count */}
        {!loading && !error && filtered.length > 0 && search && (
          <div style={{ fontSize:11, color:C.textSub, textAlign:"center", fontFamily:C.font }}>
            Hiển thị {filtered.length} / {participants.length} người
          </div>
        )}

        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={onClose} style={sharedCancelBtn}>Đóng</button>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEYS: PublishModal / CloseModal
════════════════════════════════════════════════════════════════ */
function PublishModal({ open, onClose, survey, onPublish }) {
  const [loading, setLoading] = useState(false);
  const isPublished = survey?.is_published;
  const handleConfirm = async () => {
    setLoading(true);
    try { await onPublish(survey.id, { is_published: !isPublished }); onClose(); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={isPublished ? "Ẩn khảo sát" : "Publish khảo sát"} width={400}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ padding:"20px", borderRadius:12, background:isPublished ? C.warningBg : C.primaryLight, border:`1px solid ${isPublished ? C.warningBorder : C.primaryBorder}`, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>{isPublished ? "🔒" : "🌐"}</div>
          <div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:C.font }}>
            {isPublished ? "Khảo sát sẽ bị ẩn và không còn nhận câu trả lời mới." : "Khảo sát sẽ được công khai và có thể nhận câu trả lời."}
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          <button onClick={onClose} style={sharedCancelBtn}>Huỷ</button>
          <button onClick={handleConfirm} disabled={loading} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:9, border:"none", background:loading ? C.surfaceHigh : isPublished ? C.warning : C.primary, color:loading ? C.textSub : "#fff", fontSize:12, fontWeight:700, cursor:loading ? "not-allowed":"pointer", fontFamily:C.font }}>
            {loading ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Đang xử lý...</> : isPublished ? <><PowerOff size={13}/> Ẩn survey</> : <><Globe size={13}/> Publish</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CloseModal({ open, onClose, survey, onCloseSurvey }) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try { await onCloseSurvey(survey.id); onClose(); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Đóng khảo sát" width={400}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ padding:"20px", borderRadius:12, background:C.errorBg, border:`1px solid ${C.errorBorder}`, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⛔</div>
          <div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:C.font }}>Sau khi đóng, survey sẽ không nhận thêm câu trả lời.</div>
          <div style={{ fontSize:12, color:C.textSub, marginTop:4, fontFamily:C.font }}>Hành động này không thể hoàn tác.</div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          <button onClick={onClose} style={sharedCancelBtn}>Huỷ</button>
          <button onClick={handleConfirm} disabled={loading} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:9, border:"none", background:loading ? C.surfaceHigh : C.error, color:loading ? C.textSub : "#fff", fontSize:12, fontWeight:700, cursor:loading ? "not-allowed":"pointer", fontFamily:C.font }}>
            {loading ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Đang đóng...</> : <><PowerOff size={13}/> Đóng survey</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEYS: MySurveyCard
════════════════════════════════════════════════════════════════ */
const inputStyle    = { width:"100%", border:`1px solid ${C.border}`, borderRadius:9, padding:"8px 11px", outline:"none", fontSize:12, color:C.text, fontFamily:C.font, background:"#fff", boxSizing:"border-box" };
const textareaStyle = { ...inputStyle, resize:"none" };
const sharedCancelBtn = { padding:"9px 16px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.textSub, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:C.font };

function MySurveyCard({
  survey, index,
  onDelete, onUpdate, onShare, onInvite, onPublish, onCloseSurvey,
  onBulkInvite, onGetParticipants, onDeleteParticipant,
}) {
  const navigate  = useNavigate();
  const thumb     = C.thumbGrads[index % C.thumbGrads.length];
  const menuRef   = useRef(null);

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [title,       setTitle]       = useState(survey.title);
  const [description, setDescription] = useState(survey.description || "");
  const [startAt,     setStartAt]     = useState(survey.start_at ? survey.start_at.slice(0,16) : "");
  const [endAt,       setEndAt]       = useState(survey.end_at   ? survey.end_at.slice(0,16)   : "");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const [shareOpen,        setShareOpen]        = useState(false);
  const [inviteOpen,       setInviteOpen]       = useState(false);
  const [publishOpen,      setPublishOpen]      = useState(false);
  const [closeOpen,        setCloseOpen]        = useState(false);
  const [bulkInviteOpen,   setBulkInviteOpen]   = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const handleSave = async () => {
    try { setSaving(true); await onUpdate(survey.id, { title, description, start_at:startAt||null, end_at:endAt||null }); setEditing(false); }
    catch (err) { console.error(err); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    try { setDeleting(true); await onDelete(survey.id); } finally { setDeleting(false); }
  };

  const isClosed    = survey.status === "CLOSED";
  const isPublished = survey.is_published;

  const menuItems = [
    { icon:<Pencil size={13}/>,    label:"Chỉnh sửa",       action:() => { setEditing(true); setMenuOpen(false); } },
    { icon:<Share2 size={13}/>,    label:"Tạo link chia sẻ", action:() => { setShareOpen(true); setMenuOpen(false); } },
    { icon:<Mail size={13}/>,      label:"Mời người dùng",   action:() => { setInviteOpen(true); setMenuOpen(false); } },
    { icon:<UserPlus size={13}/>,  label:"Mời hàng loạt",    action:() => { setBulkInviteOpen(true); setMenuOpen(false); }, color:C.primary },
    { icon:<Users size={13}/>,     label:"Xem participants",  action:() => { setParticipantsOpen(true); setMenuOpen(false); } },
    { icon:isPublished ? <Lock size={13}/> : <Globe size={13}/>, label:isPublished ? "Ẩn survey" : "Publish", action:() => { setPublishOpen(true); setMenuOpen(false); }, color:isPublished ? C.warning : C.primary },
    !isClosed && { icon:<PowerOff size={13}/>, label:"Đóng survey", action:() => { setCloseOpen(true); setMenuOpen(false); }, color:"#6b7280" },
    { icon:<Trash2 size={13}/>,    label:"Xóa",              action:handleDelete, color:C.error },
  ].filter(Boolean);

  return (
    <>
      <div
        style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", transition:"all .22s cubic-bezier(0.23,1,0.32,1)", cursor:"pointer", opacity:isClosed ? 0.75 : 1 }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 48px rgba(67,97,238,.1), 0 4px 16px rgba(0,0,0,.06)"; e.currentTarget.style.borderColor="rgba(67,97,238,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor=C.border; }}
        onClick={() => !editing && navigate(`/user/my-surveys/${survey.id}`)}
      >
        {/* Thumb */}
        <div style={{ height:110, background:isClosed ? "linear-gradient(135deg,#f1f5f9,#e2e8f0)" : thumb, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <FileText size={36} color="rgba(67,97,238,.2)" strokeWidth={1.5}/>

          <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:4 }}>
            <StatusBadge status={survey.status}/>
            {isPublished && (
              <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, color:"#4361ee", background:"rgba(67,97,238,0.12)", display:"flex", alignItems:"center", gap:3 }}>
                <Globe size={8}/> Live
              </span>
            )}
          </div>

          {!editing && (
            <div style={{ position:"absolute", bottom:8, left:8, display:"flex", gap:4 }} onClick={e => e.stopPropagation()}>
              {[
                { icon:<Share2 size={11}/>,   action:() => setShareOpen(true),        title:"Chia sẻ" },
                { icon:<Mail size={11}/>,     action:() => setInviteOpen(true),       title:"Mời" },
                { icon:<UserPlus size={11}/>, action:() => setBulkInviteOpen(true),   title:"Mời hàng loạt" },
                { icon:<Users size={11}/>,    action:() => setParticipantsOpen(true), title:"Participants" },
                { icon:isPublished ? <Lock size={11}/> : <Globe size={11}/>, action:() => setPublishOpen(true), title:"Publish", active:isPublished },
                !isClosed && { icon:<PowerOff size={11}/>, action:() => setCloseOpen(true), title:"Đóng" },
              ].filter(Boolean).map((btn, i) => (
                <button key={i} title={btn.title} onClick={btn.action} style={{
                  width:26, height:26, borderRadius:7, border:"1px solid rgba(255,255,255,0.6)",
                  background:btn.active ? "rgba(245,158,11,0.85)" : "rgba(255,255,255,0.75)",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  color:btn.active ? "#fff" : C.textSub, backdropFilter:"blur(4px)", transition:"all .12s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(67,97,238,0.85)"; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="transparent"; }}
                  onMouseLeave={e => { e.currentTarget.style.background=btn.active?"rgba(245,158,11,0.85)":"rgba(255,255,255,0.75)"; e.currentTarget.style.color=btn.active?"#fff":C.textSub; e.currentTarget.style.borderColor="rgba(255,255,255,0.6)"; }}
                >{btn.icon}</button>
              ))}
            </div>
          )}

          <div ref={menuRef} style={{ position:"absolute", top:8, right:8 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ width:28, height:28, borderRadius:8, border:"1px solid rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.75)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)", transition:"all .12s" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.95)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.75)"; }}
            ><MoreVertical size={13} color={C.textSub}/></button>
            {menuOpen && (
              <div style={{ position:"absolute", top:34, right:0, width:188, background:"#fff", border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", boxShadow:"0 12px 40px rgba(0,0,0,.12)", zIndex:20, animation:"slideUp .12s ease" }}>
                {menuItems.map((item, i) => (
                  <button key={i} onClick={item.action} style={{ width:"100%", border:"none", background:"transparent", padding:"9px 13px", display:"flex", alignItems:"center", gap:9, cursor:"pointer", fontSize:12, color:item.color || C.text, fontFamily:C.font, borderBottom:i < menuItems.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background=C.surfaceHigh} onMouseLeave={e => e.currentTarget.style.background="transparent"}
                  >
                    {item.icon}{item.label}
                    {deleting && item.label === "Xóa" && <Loader2 size={11} style={{ marginLeft:"auto", animation:"spin 1s linear infinite" }}/>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"14px 16px" }} onClick={e => editing && e.stopPropagation()}>
          {editing ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Tiêu đề"/>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} style={textareaStyle} placeholder="Mô tả"/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} style={inputStyle}/>
                <input type="datetime-local" value={endAt}   onChange={e => setEndAt(e.target.value)}   style={inputStyle}/>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:6 }}>
                <button onClick={() => setEditing(false)} style={sharedCancelBtn}>Huỷ</button>
                <button onClick={handleSave} style={{ padding:"7px 12px", borderRadius:8, border:"none", background:C.primary, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, fontFamily:C.font }}>
                  {saving ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Check size={13}/>} Lưu
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4, lineHeight:1.5, fontFamily:C.font, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>{survey.title}</h3>
              <p style={{ fontSize:12, color:C.textSub, lineHeight:1.6, minHeight:36, margin:"0 0 12px", fontFamily:C.font, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{survey.description || "Không có mô tả"}</p>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.textDim, fontFamily:C.font }}>
                  <Calendar size={11}/>{survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* All Modals */}
      <ShareLinkModal  open={shareOpen}   onClose={() => setShareOpen(false)}   survey={survey} onShare={onShare}/>
      <InviteModal     open={inviteOpen}  onClose={() => setInviteOpen(false)}  survey={survey} onInvite={onInvite}/>
      <PublishModal    open={publishOpen} onClose={() => setPublishOpen(false)} survey={survey} onPublish={onPublish}/>
      <CloseModal      open={closeOpen}   onClose={() => setCloseOpen(false)}   survey={survey} onCloseSurvey={onCloseSurvey}/>
      <BulkInviteModal
        open={bulkInviteOpen} onClose={() => setBulkInviteOpen(false)}
        survey={survey} onBulkInvite={onBulkInvite}
      />
      <ParticipantsModal
        open={participantsOpen} onClose={() => setParticipantsOpen(false)}
        survey={survey} onGetParticipants={onGetParticipants} onDeleteParticipant={onDeleteParticipant}
      />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC SURVEYS
════════════════════════════════════════════════════════════════ */
const TYPE_META = {
  SINGLE_CHOICE:   { label:"Một lựa chọn",   color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe", accent:"#2563eb" },
  MULTIPLE_CHOICE: { label:"Nhiều lựa chọn", color:"#6d28d9", bg:"#f5f3ff", border:"#ddd6fe", accent:"#7c3aed" },
  TEXT:            { label:"Văn bản",         color:"#0e7490", bg:"#ecfeff", border:"#a5f3fc", accent:"#0891b2" },
};
function typeMeta(type) { return TYPE_META[type] ?? { label:type, color:"#6b7280", bg:"#f3f4f6", border:"#e5e7eb", accent:"#9ca3af" }; }

function OptionRow({ label, isSelected, isMultiple }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, border:`1px solid ${isSelected ? "#bfdbfe" : "#e5e7eb"}`, background:isSelected ? "#eff6ff" : "#fafafa" }}>
      {isMultiple ? (
        <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`, background:isSelected ? "#2563eb" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {isSelected && <svg width="9" height="7" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      ) : (
        <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {isSelected && <div style={{ width:8, height:8, borderRadius:"50%", background:"#2563eb" }}/>}
        </div>
      )}
      <span style={{ fontSize:12, fontWeight:isSelected ? 600 : 400, color:isSelected ? "#1e40af" : "#6b7280", fontFamily:C.font }}>{label}</span>
    </div>
  );
}

function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchSub = async () => {
      try {
        setLoading(true); setError(null);
        const res = await getMySubmission(surveyId);
        if (cancelled) return;
        const raw = res?.data ?? res ?? [];
        setAnswers(raw.flatMap(r => r.answers ?? []));
      } catch { if (!cancelled) setError("Không thể tải câu trả lời."); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchSub();
    return () => { cancelled = true; };
  }, [surveyId]);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(8px)", display:"flex", justifyContent:"center", alignItems:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:600, maxHeight:"90vh", overflow:"hidden", background:"#f7f8fc", borderRadius:20, border:"1px solid rgba(0,0,0,0.08)", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,.2)" }}>
        <div style={{ padding:"14px 18px", background:"#fff", borderBottom:"1px solid rgba(0,0,0,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button onClick={onClose} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:C.textSub, background:"none", border:"none", cursor:"pointer", fontFamily:C.font }}><ArrowLeft size={14}/> Đóng</button>
          <div style={{ fontSize:12, fontWeight:700, color:C.textSub, fontFamily:C.font }}>InsightFlow</div>
          <div style={{ width:50 }}/>
        </div>
        <div style={{ padding:"20px 20px", overflowY:"auto", flex:1 }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:999, background:"#dcfce7", border:"1px solid #86efac", marginBottom:10 }}>
              <CheckCircle2 size={11} color="#16a34a"/>
              <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#15803d", fontFamily:C.font }}>Đã hoàn thành</span>
            </div>
            <h2 style={{ fontSize:18, fontWeight:800, color:C.text, margin:"0 0 4px", fontFamily:C.font }}>{surveyTitle}</h2>
            {!loading && <p style={{ fontSize:12, color:C.textSub, margin:0, fontFamily:C.font }}>{answers.length} câu trả lời</p>}
          </div>
          {loading && <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"48px 0", gap:8, color:C.primary }}><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }}/><span style={{ fontSize:13, fontFamily:C.font }}>Đang tải...</span></div>}
          {!loading && error && <div style={{ textAlign:"center", padding:"48px 0", color:C.textSub, fontFamily:C.font }}>{error}</div>}
          {!loading && !error && answers.length === 0 && <div style={{ textAlign:"center", padding:"48px 0", color:C.textSub, fontFamily:C.font }}>Không có câu trả lời.</div>}
          {!loading && !error && answers.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {answers.map((item, idx) => {
                const meta = typeMeta(item.type);
                const isText = item.type === "TEXT";
                const isMultiple = item.type === "MULTIPLE_CHOICE";
                const selectedSet = isMultiple
                  ? new Set(Array.isArray(item.answer) ? item.answer : String(item.answer ?? "").split(",").map(s => s.trim()))
                  : new Set([String(item.answer ?? "")]);
                return (
                  <div key={idx} style={{ background:"#fff", borderRadius:14, border:"1px solid rgba(0,0,0,0.07)", borderTop:`3px solid ${meta.accent}`, overflow:"hidden" }}>
                    <div style={{ padding:16 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:C.textSub, fontFamily:C.font }}>{idx + 1}. {item.question}</span>
                        <span style={{ background:meta.bg, border:`1px solid ${meta.border}`, color:meta.color, padding:"3px 10px", borderRadius:999, fontSize:10, fontWeight:700, fontFamily:C.font }}>{meta.label}</span>
                      </div>
                      {isText && <div style={{ background:"#f8faff", border:"1px solid #e5e7eb", borderRadius:10, padding:12, fontSize:12, color:"#374151", fontFamily:C.font }}>{item.answer || "Không có dữ liệu"}</div>}
                      {!isText && <div style={{ display:"flex", flexDirection:"column", gap:6 }}>{(item.options ?? []).map((opt, oi) => { const label = opt?.label ?? opt?.value ?? opt?.content ?? ""; const isSel = selectedSet.has(label) || selectedSet.has(String(opt.id)); return <OptionRow key={oi} label={label} isSelected={isSel} isMultiple={isMultiple}/>; })}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC SURVEYS: PublicSurveyCard
════════════════════════════════════════════════════════════════ */
function PublicSurveyCard({ survey, done, onStart, onViewSubmission }) {
  const createdDate = survey?.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : "";
  return (
    <div
      onClick={() => done && onViewSubmission(survey.id, survey.title)}
      style={{ background:"#fff", border:`1px solid ${done ? "rgba(16,185,129,0.2)" : C.border}`, borderRadius:14, padding:18, transition:"all .2s cubic-bezier(0.23,1,0.32,1)", cursor:done ? "pointer" : "default", position:"relative", overflow:"hidden" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=done ? "0 10px 32px rgba(16,185,129,.1)" : "0 10px 32px rgba(67,97,238,.08)"; e.currentTarget.style.borderColor=done ? "rgba(16,185,129,0.3)" : "rgba(67,97,238,0.2)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor=done ? "rgba(16,185,129,0.2)" : C.border; }}
    >
      {done && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(to right, #10b981, #34d399)" }}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ width:38, height:38, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", background:done ? "#ecfdf5" : "#eef0fd" }}>
          {done ? <CheckCircle2 size={19} color="#10b981" strokeWidth={1.6}/> : <FileText size={19} color={C.primary} strokeWidth={1.6}/>}
        </div>
        <span style={{ padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700, letterSpacing:"0.03em", background:done ? "#dcfce7" : C.surfaceHigh, color:done ? "#059669" : C.textDim, border:`1px solid ${done ? "#a7f3d0" : C.border}`, fontFamily:C.font }}>
          {done ? "Đã hoàn thành" : "Survey"}
        </span>
      </div>
      <h3 style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:6, lineHeight:1.5, fontFamily:C.font, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{survey.title}</h3>
      <p style={{ fontSize:12, color:C.textSub, marginBottom:14, lineHeight:1.6, fontFamily:C.font, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{survey.description}</p>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.textDim, fontFamily:C.font }}>
          <Clock size={11}/><span>{createdDate}</span>
        </div>
        {done
          ? <span style={{ padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700, background:"#dcfce7", color:"#059669", border:"1px solid #a7f3d0", fontFamily:C.font }}>Xem kết quả →</span>
          : <button onClick={e => { e.stopPropagation(); onStart(survey.id); }} style={{ padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700, color:"#fff", background:C.primary, border:"none", cursor:"pointer", fontFamily:C.font, transition:"opacity .15s" }} onMouseEnter={e => e.currentTarget.style.opacity=".85"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>Bắt đầu →</button>
        }
      </div>
    </div>
  );
}

function PublicCardSkeleton() {
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:18, animation:"pulse 1.5s ease-in-out infinite" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ width:38, height:38, borderRadius:11, background:"#f3f4f6" }}/>
        <div style={{ width:70, height:20, borderRadius:999, background:"#f3f4f6" }}/>
      </div>
      <div style={{ height:12, background:"#f3f4f6", borderRadius:6, width:"70%", marginBottom:7 }}/>
      <div style={{ height:11, background:"#f3f4f6", borderRadius:5, width:"100%", marginBottom:4 }}/>
      <div style={{ height:11, background:"#f3f4f6", borderRadius:5, width:"60%", marginBottom:16 }}/>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <div style={{ width:50, height:11, background:"#f3f4f6", borderRadius:5 }}/>
        <div style={{ width:80, height:28, background:"#f3f4f6", borderRadius:8 }}/>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEY: Create Form (inline)
════════════════════════════════════════════════════════════════ */
function CreateSurveyForm({ onSubmit, onCancel, submitting }) {
  const [formData, setFormData] = useState({ title:"", description:"", start_at:"", end_at:"" });
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const fieldStyle = { width:"100%", boxSizing:"border-box", padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:9, fontSize:12, color:C.text, fontFamily:C.font, outline:"none", background:"#fff" };
  const focusBorder = (e) => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryLight}`; };
  const blurBorder  = (e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; };

  return (
    <div style={{ background:C.surface, borderRadius:14, border:`1px dashed rgba(67,97,238,0.3)`, padding:18, animation:"slideUp .2s ease" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <Sparkles size={14} color={C.primary}/>
        <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:C.font }}>Tạo survey mới</span>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Tiêu đề survey *" required style={fieldStyle} onFocus={focusBorder} onBlur={blurBorder}/>
          <textarea rows={2} name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả (tuỳ chọn)" style={{ ...fieldStyle, resize:"none" }} onFocus={focusBorder} onBlur={blurBorder}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:10, color:C.textSub, display:"block", marginBottom:4, fontFamily:C.font }}>Bắt đầu</label>
              <input type="datetime-local" name="start_at" value={formData.start_at} onChange={handleChange} style={fieldStyle} onFocus={focusBorder} onBlur={blurBorder}/>
            </div>
            <div>
              <label style={{ fontSize:10, color:C.textSub, display:"block", marginBottom:4, fontFamily:C.font }}>Kết thúc</label>
              <input type="datetime-local" name="end_at" value={formData.end_at} onChange={handleChange} style={fieldStyle} onFocus={focusBorder} onBlur={blurBorder}/>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:7, marginTop:2 }}>
            <button type="button" onClick={onCancel} style={sharedCancelBtn}>Huỷ</button>
            <button type="submit" disabled={submitting} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, border:"none", background:submitting ? C.surfaceHigh : C.primary, color:submitting ? C.textSub : "#fff", fontSize:12, fontWeight:700, cursor:submitting ? "not-allowed":"pointer", fontFamily:C.font, transition:"all .15s" }}>
              {submitting ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Đang tạo...</> : <><Plus size={13}/> Tạo Survey</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
const MY_SURVEYS_PREVIEW = 4;

export default function SurveysLayout() {
  const navigate = useNavigate();

  const {
    mySurveys,
    publicSurveys: providerPublicSurveys,
    loading: myLoading,
    createSurvey, fetchMySurveys, updateSurvey, deleteSurvey,
    closeSurvey, publishSurvey, shareLink, inviteSurvey,
    fetchPublicSurveys,
    bulkInviteSurvey,
    getParticipants,
    deleteParticipant,
  } = useSurvey();

  const { getAllMyResponses } = useResponse();

  const [mySearch,        setMySearch]        = useState("");
  const [showCreateForm,  setShowCreateForm]  = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [myExpanded,      setMyExpanded]      = useState(false);

  const [doneSurveyIds,   setDoneSurveyIds]   = useState(new Set());
  const [publicLoading,   setPublicLoading]   = useState(true);
  const [publicError,     setPublicError]     = useState(null);
  const [modalSurvey,     setModalSurvey]     = useState(null);
  const [publicSearch,    setPublicSearch]    = useState("");
  const [activeTab,       setActiveTab]       = useState("all");
  const [sortBy,          setSortBy]          = useState("newest");
  const [viewMode,        setViewMode]        = useState("grid");
  const [showFilter,      setShowFilter]      = useState(false);

  const globalSearch = mySearch || publicSearch;

  useEffect(() => { fetchMySurveys(1, 20); }, []); // eslint-disable-line

  const fetchPublicData = useCallback(async () => {
    try {
      setPublicLoading(true); setPublicError(null);
      const [, respResult] = await Promise.allSettled([
        fetchPublicSurveys(),
        getAllMyResponses().catch(() => null),
      ]);
      const resp = respResult.status === "fulfilled" ? respResult.value : null;
      const ids  = new Set((resp?.data ?? resp ?? []).map(r => r.survey_id ?? r.surveyId));
      setDoneSurveyIds(ids);
    } catch { setPublicError("Không thể tải danh sách khảo sát."); }
    finally   { setPublicLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { fetchPublicData(); }, []); // eslint-disable-line

  const handleSubmitCreate = async (formData) => {
    try {
      setSubmitting(true);
      await createSurvey({ title:formData.title, description:formData.description||null, start_at:formData.start_at||null, end_at:formData.end_at||null });
      setShowCreateForm(false);
      setMyExpanded(true);
      fetchMySurveys(1, 20);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const myFiltered   = mySurveys.filter(s => s.title?.toLowerCase().includes(mySearch.toLowerCase()));
  const publicSurveys = providerPublicSurveys;

  const displayed = useMemo(() => {
    let list = [...publicSurveys];
    if (activeTab === "pending") list = list.filter(s => !doneSurveyIds.has(s.id));
    if (activeTab === "done")    list = list.filter(s =>  doneSurveyIds.has(s.id));
    if (publicSearch.trim()) {
      const q = publicSearch.toLowerCase();
      list = list.filter(s => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (sortBy === "newest") list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest") list.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "name")   list.sort((a,b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [publicSurveys, doneSurveyIds, activeTab, publicSearch, sortBy]);

  const totalCount   = publicSurveys.length;
  const doneCount    = publicSurveys.filter(s =>  doneSurveyIds.has(s.id)).length;
  const pendingCount = publicSurveys.filter(s => !doneSurveyIds.has(s.id)).length;

  const visibleMySurveys = (myExpanded || showCreateForm) ? myFiltered : myFiltered.slice(0, MY_SURVEYS_PREVIEW);
  const hasMoreMySurveys  = myFiltered.length > MY_SURVEYS_PREVIEW;

  const PUBLIC_TABS = [
    { key:"all",     label:"Tất cả",        count:totalCount },
    { key:"pending", label:"Chưa làm",      count:pendingCount },
    { key:"done",    label:"Đã hoàn thành", count:doneCount },
  ];

  const searchInputStyle = { flex:1, border:"none", outline:"none", background:"transparent", fontSize:13, fontFamily:C.font, color:C.text };

  return (
    <main style={{ minHeight:"100vh", background:C.bg, fontFamily:C.font }}>

      {/* TOP BAR */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 28px", height:60, display:"flex", alignItems:"center", gap:20, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:C.primaryLight, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FileText size={14} color={C.primary} strokeWidth={1.8}/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:C.text, lineHeight:1 }}>Surveys</div>
            <div style={{ fontSize:10, color:C.textSub, marginTop:1 }}>Quản lý và tham gia khảo sát</div>
          </div>
        </div>

        <div style={{ flex:1, maxWidth:400, height:36, borderRadius:999, background:C.surfaceHigh, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8, padding:"0 14px", transition:"border-color .15s" }}>
          <Search size={13} color={C.textSub}/>
          <input placeholder="Tìm survey..." style={searchInputStyle} value={globalSearch}
            onChange={e => { setMySearch(e.target.value); setPublicSearch(e.target.value); }}/>
          {globalSearch && <button onClick={() => { setMySearch(""); setPublicSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", padding:0 }}><X size={12}/></button>}
        </div>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12, fontSize:11, color:C.textSub, flexShrink:0 }}>
          <span><strong style={{ color:C.text, fontWeight:700 }}>{mySurveys.length}</strong> của tôi</span>
          <span style={{ color:C.border }}>·</span>
          <span><strong style={{ color:C.text, fontWeight:700 }}>{totalCount}</strong> công khai</span>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"28px 24px", display:"flex", flexDirection:"column", gap:0 }}>

        {/* SECTION 1: MY SURVEYS */}
        <section style={{ marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <h2 style={{ fontSize:15, fontWeight:800, color:C.text, margin:0, fontFamily:C.font }}>My Surveys</h2>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:999, background:C.primaryLight, color:C.primary, border:`1px solid ${C.primaryBorder}` }}>{myFiltered.length}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ height:32, borderRadius:8, background:"#fff", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:7, padding:"0 10px", minWidth:160 }}>
                <Search size={12} color={C.textSub}/>
                <input value={mySearch} onChange={e => setMySearch(e.target.value)} placeholder="Tìm..." style={{ ...searchInputStyle, fontSize:12, width:110 }}/>
                {mySearch && <button onClick={() => setMySearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", padding:0 }}><X size={11}/></button>}
              </div>
              <button onClick={() => { setShowCreateForm(v => !v); if (!showCreateForm) setMyExpanded(true); }} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, border:showCreateForm ? `1px solid ${C.border}` : "none", background:showCreateForm ? "#fff" : C.primary, color:showCreateForm ? C.textSub : "#fff", cursor:"pointer", fontWeight:700, fontFamily:C.font, fontSize:12, boxShadow:showCreateForm ? "none":"0 2px 12px rgba(67,97,238,0.3)", transition:"all .15s", whiteSpace:"nowrap" }}>
                {showCreateForm ? <X size={13}/> : <Plus size={13}/>}{showCreateForm ? "Huỷ" : "Tạo mới"}
              </button>
            </div>
          </div>

          {myLoading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"48px 0" }}>
              <Loader2 size={28} style={{ animation:"spin 1s linear infinite" }} color={C.primary}/>
            </div>
          ) : (
            <>
              {showCreateForm && (
                <div style={{ marginBottom:16 }}>
                  <CreateSurveyForm onSubmit={handleSubmitCreate} onCancel={() => setShowCreateForm(false)} submitting={submitting}/>
                </div>
              )}

              {myFiltered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 0", color:C.textSub }}>
                  <Inbox size={40} color={C.textDim} style={{ marginBottom:12 }}/>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:C.font }}>{mySearch ? `Không tìm thấy "${mySearch}"` : "Chưa có survey nào"}</div>
                  <div style={{ fontSize:12, color:C.textSub, marginTop:4, fontFamily:C.font }}>{mySearch ? "Thử từ khoá khác" : "Hãy tạo survey đầu tiên"}</div>
                </div>
              ) : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
                    {visibleMySurveys.map((survey, index) => (
                      <MySurveyCard
                        key={survey.id} survey={survey} index={index}
                        onDelete={deleteSurvey} onUpdate={updateSurvey}
                        onShare={shareLink} onInvite={inviteSurvey}
                        onPublish={publishSurvey} onCloseSurvey={closeSurvey}
                        onBulkInvite={bulkInviteSurvey}
                        onGetParticipants={getParticipants}
                        onDeleteParticipant={deleteParticipant}
                      />
                    ))}
                  </div>

                  {hasMoreMySurveys && !showCreateForm && (
                    <div style={{ display:"flex", justifyContent:"center", marginTop:16 }}>
                      <button onClick={() => setMyExpanded(v => !v)} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 20px", borderRadius:999, border:`1px solid ${C.border}`, background:"#fff", color:C.textSub, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:C.font, transition:"all .15s", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(67,97,238,0.3)"; e.currentTarget.style.color=C.primary; e.currentTarget.style.background=C.primaryLight; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textSub; e.currentTarget.style.background="#fff"; }}
                      >
                        {myExpanded ? <><ChevronUp size={13}/> Thu gọn</> : <><ChevronDown size={13}/> Xem thêm {myFiltered.length - MY_SURVEYS_PREVIEW} survey</>}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
          <div style={{ flex:1, height:"1px", background:`linear-gradient(to right, transparent, ${C.border}, ${C.border}, transparent)` }}/>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 14px", borderRadius:999, border:`1px solid ${C.border}`, background:"#fff" }}>
            <Globe size={11} color={C.textDim}/>
            <span style={{ fontSize:10, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.1em", whiteSpace:"nowrap", fontFamily:C.font }}>Khảo sát công khai</span>
          </div>
          <div style={{ flex:1, height:"1px", background:`linear-gradient(to right, ${C.border}, ${C.border}, transparent)` }}/>
        </div>

        {/* SECTION 2: PUBLIC SURVEYS */}
        <section>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <h2 style={{ fontSize:15, fontWeight:800, color:C.text, margin:0, fontFamily:C.font }}>Khảo Sát</h2>
              {!publicLoading && <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:999, background:"#dcfce7", color:"#059669", border:"1px solid #a7f3d0" }}>{totalCount}</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:2, background:C.surfaceHigh, padding:3, borderRadius:9, border:`1px solid ${C.border}` }}>
                {PUBLIC_TABS.map(tab => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:7, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:C.font, transition:"all .12s", background:isActive ? "#fff" : "transparent", color:isActive ? C.primary : C.textSub, boxShadow:isActive ? "0 1px 3px rgba(0,0,0,.07)" : "none" }}>
                      {tab.label}
                      {!publicLoading && <span style={{ padding:"1px 6px", borderRadius:999, fontSize:10, background:isActive ? C.primaryLight : "transparent", color:isActive ? C.primary : C.textDim }}>{tab.count}</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowFilter(v => !v)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:`1px solid ${showFilter ? C.primary : C.border}`, background:showFilter ? C.primaryLight : "#fff", color:showFilter ? C.primary : C.textSub, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:C.font }}>
                <SlidersHorizontal size={12}/> Lọc
              </button>
              <div style={{ display:"flex", alignItems:"center", background:"#fff", borderRadius:8, border:`1px solid ${C.border}`, overflow:"hidden" }}>
                <button onClick={() => setViewMode("grid")} style={{ padding:"6px 10px", border:"none", cursor:"pointer", background:viewMode==="grid" ? C.primaryLight : "transparent", color:viewMode==="grid" ? C.primary : C.textSub, transition:"all .1s" }}><LayoutGrid size={13}/></button>
                <div style={{ width:1, background:C.border, height:16 }}/>
                <button onClick={() => setViewMode("list")} style={{ padding:"6px 10px", border:"none", cursor:"pointer", background:viewMode==="list" ? C.primaryLight : "transparent", color:viewMode==="list" ? C.primary : C.textSub, transition:"all .1s" }}><List size={13}/></button>
              </div>
              <button onClick={fetchPublicData} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", color:C.textSub, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:C.font }}>
                <RefreshCw size={12}/>
              </button>
            </div>
          </div>

          <div style={{ position:"relative", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, maxWidth:360, height:36, borderRadius:9, background:"#fff", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8, padding:"0 12px" }}>
              <Search size={13} color={C.textSub}/>
              <input value={publicSearch} onChange={e => setPublicSearch(e.target.value)} placeholder="Tìm khảo sát..." style={{ ...searchInputStyle, fontSize:12 }}/>
              {publicSearch && <button onClick={() => setPublicSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", padding:0 }}><X size={12}/></button>}
            </div>
          </div>

          {showFilter && (
            <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:11, padding:14, marginBottom:14, display:"flex", flexWrap:"wrap", gap:14, alignItems:"flex-end", animation:"slideUp .14s ease" }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:C.textSub, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:C.font }}>Sắp xếp theo</p>
                <div style={{ display:"flex", gap:5 }}>
                  {[{key:"newest",label:"Mới nhất"},{key:"oldest",label:"Cũ nhất"},{key:"name",label:"Tên A-Z"}].map(item => (
                    <button key={item.key} onClick={() => setSortBy(item.key)} style={{ padding:"5px 11px", borderRadius:7, border:`1px solid ${sortBy===item.key ? C.primary : C.border}`, background:sortBy===item.key ? C.primaryLight : "#fff", color:sortBy===item.key ? C.primary : C.textSub, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:C.font }}>{item.label}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setPublicSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }} style={{ marginLeft:"auto", padding:"6px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color:C.textSub, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:C.font }}>Reset</button>
            </div>
          )}

          {modalSurvey && <SubmissionModal surveyId={modalSurvey.id} surveyTitle={modalSurvey.title} onClose={() => setModalSurvey(null)}/>}

          {publicLoading && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
              {Array(6).fill(0).map((_,i) => <PublicCardSkeleton key={i}/>)}
            </div>
          )}

          {!publicLoading && publicError && (
            <div style={{ textAlign:"center", padding:"48px 0", color:C.textSub }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
              <div style={{ fontSize:13, fontFamily:C.font }}>{publicError}</div>
              <button onClick={fetchPublicData} style={{ marginTop:12, color:C.primary, fontWeight:700, background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:C.font }}>Thử lại</button>
            </div>
          )}

          {!publicLoading && !publicError && displayed.length === 0 && (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <Inbox size={40} color={C.textDim} style={{ marginBottom:12 }}/>
              <div style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:C.font }}>{publicSearch ? `Không tìm thấy "${publicSearch}"` : "Không có khảo sát nào"}</div>
              <div style={{ fontSize:12, color:C.textSub, marginTop:4, fontFamily:C.font }}>{publicSearch ? "Thử từ khoá khác" : "Chưa có dữ liệu"}</div>
            </div>
          )}

          {!publicLoading && !publicError && displayed.length > 0 && (
            <>
              <div style={{ marginBottom:12, fontSize:11, color:C.textSub, fontFamily:C.font }}>
                {displayed.length} khảo sát{publicSearch ? ` · "${publicSearch}"` : ""}
                {doneCount > 0 && <span style={{ marginLeft:8, color:C.success, fontWeight:600 }}>· {doneCount} đã hoàn thành</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:viewMode==="grid" ? "repeat(auto-fill,minmax(240px,1fr))" : "1fr", gap:14 }}>
                {displayed.map(survey => (
                  <PublicSurveyCard key={survey.id} survey={survey}
                    done={doneSurveyIds.has(survey.id)}
                    onStart={id => navigate(`/user/survey/${id}`)}
                    onViewSubmission={(id, title) => setModalSurvey({ id, title })}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes pulse   { 0%,100%{opacity:.7;}50%{opacity:1;} }
      `}</style>
    </main>
  );
}
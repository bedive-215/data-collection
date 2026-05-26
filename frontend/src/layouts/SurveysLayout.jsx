// ─── SurveysLayout.jsx ─── Redesigned to match Dashboard aesthetic ──
import React, {
  useEffect, useState, useMemo, useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  Plus, X, FileText, Calendar, Loader2, Inbox, Search,
  Trash2, Check,
  Lock, Globe, Copy, ExternalLink, PowerOff,
  Users, Link as LinkIcon, Send, CheckCircle2, Clock,
  LayoutGrid, List, SlidersHorizontal, RefreshCw, ArrowLeft,
  ChevronDown, ChevronUp, Sparkles, Edit2,
  UserPlus, UserMinus, Rocket, TrendingUp, Zap,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSurvey }    from "@/providers/SurveyProvider";
import { useResponse }  from "@/providers/ResponseProvider";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import CreateSurveyComposer from "@/components/survey/CreateSurveyComposer";
import { SurveyCardHome } from "@/components/survey/SurveyCardHome";
import { ShareModal } from "@/components/survey/SurveyCardHome";
import { ROUTERS } from "@/utils/constants";

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS — matching Dashboard
════════════════════════════════════════════════════════════════ */
const C = {
  bg:            "linear-gradient(165deg, #eef2ff 0%, #f8fafc 42%, #e0f2fe 78%, #fdf4ff 100%)",
  surface:       "rgba(255,255,255,0.78)",
  surfaceHigh:   "rgba(255,255,255,0.92)",
  glass:         "rgba(255,255,255,0.65)",
  glassBorder:   "rgba(255,255,255,0.55)",
  border:        "rgba(99,102,241,0.1)",
  borderMed:     "rgba(0,0,0,0.1)",
  primary:       "#4f46e5",
  primaryLight:  "rgba(79,70,229,0.14)",
  primaryBorder: "rgba(79,70,229,0.35)",
  text:          "#0f172a",
  textSub:       "#64748b",
  textDim:       "#94a3b8",
  error:         "#ef4444",
  errorBg:       "rgba(239,68,68,0.1)",
  errorBorder:   "rgba(239,68,68,0.25)",
  success:       "#10b981",
  successBg:     "rgba(16,185,129,0.1)",
  successBorder: "rgba(16,185,129,0.25)",
  warning:       "#f59e0b",
  warningBg:     "rgba(245,158,11,0.1)",
  warningBorder: "rgba(245,158,11,0.25)",
  font:          "'DM Sans','Inter',sans-serif",
  thumbGrads: [
    "conic-gradient(from 0deg at 50% 50%, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #ff6b6b)",
    "conic-gradient(from 0deg at 50% 50%, #a8edea, #fed6e3, #ff9999, #a8edea)",
    "conic-gradient(from 0deg at 50% 50%, #667eea, #764ba2, #f093fb, #667eea)",
    "conic-gradient(from 0deg at 50% 50%, #f5af19, #f12711, #fa709a, #f5af19)",
    "conic-gradient(from 0deg at 50% 50%, #4facfe, #00f2fe, #43e97b, #4facfe)",
    "conic-gradient(from 0deg at 50% 50%, #30cfd0, #330867, #a8edea, #30cfd0)",
  ],
};

/* ════════════════════════════════════════════════════════════════
   GLASSMORPHISM CARD (matches Dashboard GlassmorphCard)
════════════════════════════════════════════════════════════════ */
function GlassCard({ children, style={}, delay=0, hover=true }) {
  const base = {
    background: C.surface,
    backdropFilter:"blur(24px) saturate(190%)",
    WebkitBackdropFilter:"blur(24px) saturate(190%)",
    border:`1px solid ${C.glassBorder}`,
    borderRadius:22,
    boxShadow:"0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 32px rgba(15,23,42,0.07)",
    animation:`slideInUp 0.8s ease-out ${delay}s both`,
    transition:"transform 0.28s ease, box-shadow 0.28s ease, border-color 0.22s ease",
    ...style,
  };
  return (
    <div
      style={base}
      onMouseEnter={hover ? e => {
        e.currentTarget.style.transform="translateY(-5px)";
        e.currentTarget.style.boxShadow="0 2px 0 rgba(255,255,255,0.95) inset, 0 18px 44px rgba(79,70,229,0.12), 0 0 0 1px rgba(99,102,241,0.12)";
        e.currentTarget.style.borderColor="rgba(129,140,248,0.35)";
      } : undefined}
      onMouseLeave={hover ? e => {
        e.currentTarget.style.transform="translateY(0)";
        e.currentTarget.style.boxShadow="0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 32px rgba(15,23,42,0.07)";
        e.currentTarget.style.borderColor=C.glassBorder;
      } : undefined}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STATUS BADGE
════════════════════════════════════════════════════════════════ */
const STATUS_MAP = {
  ACTIVE:    { label:"Đang mở",  color:"#059669", bg:"rgba(16,185,129,0.15)" },
  DRAFT:     { label:"Nháp",     color:C.textSub, bg:"rgba(107,114,128,0.12)" },
  EXPIRED:   { label:"Hết hạn",  color:"#dc2626", bg:"rgba(239,68,68,0.12)" },
  SCHEDULED: { label:"Lên lịch", color:"#d97706", bg:"rgba(245,158,11,0.12)" },
  CLOSED:    { label:"Đã đóng",  color:"#6b7280", bg:"rgba(107,114,128,0.12)" },
};
function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <span style={{
      fontSize:10, fontWeight:700, padding:"3px 10px",
      borderRadius:999, color:s.color, background:s.bg,
      letterSpacing:"0.04em", fontFamily:C.font,
    }}>{s.label}</span>
  );
}

/* ════════════════════════════════════════════════════════════════
   MODAL BASE
════════════════════════════════════════════════════════════════ */
function Modal({ open, onClose, title, children, width=480 }) {
  useEffect(() => {
    if (!open) return;
    const h = e => { if (e.key==="Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:10050,
      background:"rgba(15,17,23,0.55)", backdropFilter:"blur(10px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      animation:"fadeIn .16s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"rgba(255,255,255,0.92)",
        backdropFilter:"blur(24px)",
        borderRadius:24, border:`1px solid ${C.glassBorder}`,
        boxShadow:"0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5)",
        width:"100%", maxWidth:width, overflow:"hidden",
        animation:"slideUp .22s cubic-bezier(.16,1,.3,1)",
      }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px", borderBottom:`1px solid rgba(0,0,0,0.06)`,
        }}>
          <h3 style={{margin:0, fontSize:14, fontWeight:800, color:C.text, fontFamily:C.font}}>{title}</h3>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8,
            border:`1px solid rgba(0,0,0,0.08)`, background:"transparent",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            color:C.textSub, transition:"all .15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.errorBg;e.currentTarget.style.color=C.error;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textSub;}}
          ><X size={13}/></button>
        </div>
        <div style={{padding:"20px"}}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* shared button styles */
const sharedCancelBtn = {
  padding:"9px 16px", borderRadius:10,
  border:`1px solid rgba(0,0,0,0.1)`, background:"transparent",
  color:C.textSub, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:C.font,
};
const sharedPrimaryBtn = (disabled=false) => ({
  display:"flex", alignItems:"center", gap:6,
  padding:"9px 18px", borderRadius:10, border:"none",
  background:disabled ? "rgba(0,0,0,0.05)" : "linear-gradient(135deg,#4361ee,#6c7ef7)",
  color:disabled ? C.textSub : "#fff",
  fontSize:12, fontWeight:700, cursor:disabled?"not-allowed":"pointer", fontFamily:C.font,
  boxShadow:disabled?"none":"0 4px 14px rgba(67,97,238,0.35)",
  transition:"all .2s",
});

/* ════════════════════════════════════════════════════════════════
   SHARE LINK MODAL (giống trang admin: bấm «Tạo link» — tránh gọi API
   tự động khi mở modal, Strict Mode không gọi share hai lần)
════════════════════════════════════════════════════════════════ */
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setShareUrl(null);
      setCopied(false);
      setError("");
      setLoading(false);
    }
  }, [open]);

  const parseUrlFromResult = (result) =>
    typeof result === "string"
      ? result
      : result?.url ?? result?.data?.url ?? null;

  const handleGenerate = async () => {
    if (!survey?.id) return;
    setLoading(true);
    setError("");
    try {
      const result = await onShare(survey.id);
      const url = parseUrlFromResult(result);
      if (url) setShareUrl(url);
      else setError("Không lấy được link.");
    } catch {
      setError("Tạo link thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Chia sẻ khảo sát">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ padding: "14px 16px", background: "rgba(67,97,238,0.08)", borderRadius: 14, border: `1px solid rgba(67,97,238,0.2)` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: C.font }}>{survey?.title}</div>
          <div style={{ fontSize: 12, color: C.textSub, marginTop: 2, fontFamily: C.font }}>
            Tạo link để chia sẻ survey với mọi người
          </div>
        </div>
        {error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: C.errorBg, border: `1px solid ${C.errorBorder}` }}>
            <span style={{ fontSize: 12, color: C.error, fontFamily: C.font }}>{error}</span>
            <button type="button" onClick={handleGenerate} disabled={loading} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.errorBorder}`, background: "rgba(255,255,255,0.8)", color: C.error, fontSize: 11, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: C.font }}>
              Thử lại
            </button>
          </div>
        )}
        {shareUrl ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "slideUp .2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(255,255,255,0.6)", borderRadius: 12, border: `1px solid rgba(67,97,238,0.2)`, backdropFilter: "blur(8px)" }}>
              <LinkIcon size={13} color={C.primary} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'SF Mono','Fira Code',monospace" }}>{shareUrl}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={handleCopy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 11, border: `1px solid ${copied ? C.successBorder : "rgba(67,97,238,0.3)"}`, background: copied ? C.successBg : "rgba(67,97,238,0.08)", color: copied ? C.success : C.primary, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.font, transition: "all .2s" }}>
                {copied ? <><Check size={13} /> Đã sao chép!</> : <><Copy size={13} /> Sao chép link</>}
              </button>
              <button type="button" onClick={() => window.open(shareUrl, "_blank")} style={{ width: 42, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, border: `1px solid rgba(0,0,0,0.08)`, background: "transparent", color: C.textSub, cursor: "pointer", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primaryBorder; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
              >
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 0",
              borderRadius: 12,
              border: "none",
              background: loading ? "rgba(0,0,0,0.06)" : "linear-gradient(135deg,#4361ee,#6c7ef7)",
              color: loading ? C.textSub : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: C.font,
              boxShadow: loading ? "none" : "0 4px 14px rgba(67,97,238,0.35)",
            }}
          >
            {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang tạo link...</> : <><LinkIcon size={15} /> Tạo link chia sẻ</>}
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   INVITE MODAL
════════════════════════════════════════════════════════════════ */
function InviteModal({ open, onClose, survey, onInvite }) {
  const [emails,setEmails]=useState("");
  const [role,setRole]=useState("viewer");
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(false);
  const [sentCount,setSentCount]=useState(0);
  const [error,setError]=useState("");
  useEffect(()=>{ if(!open){setEmails("");setSuccess(false);setError("");setSentCount(0);setRole("viewer");} },[open]);
  const ROLES=[
    {value:"viewer",label:"👁️ Viewer",desc:"Chỉ xem"},
    {value:"editor",label:"✏️ Editor",desc:"Có thể chỉnh sửa"},
  ];
  const handleSubmit=async e=>{
    e.preventDefault();
    const list=emails.split(/[\n,;]+/).map(e=>e.trim()).filter(Boolean);
    if(!list.length){setError("Vui lòng nhập ít nhất 1 email.");return;}
    setLoading(true);setError("");setSuccess(false);
    try{await Promise.all(list.map(email=>onInvite(survey.id,{email,role})));setSentCount(list.length);setSuccess(true);setEmails("");}
    catch{setError("Mời không thành công.");}
    finally{setLoading(false);}
  };
  return (
    <Modal open={open} onClose={onClose} title="Mời người tham gia">
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {success&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:C.successBg,border:`1px solid ${C.successBorder}`}}>
          <Check size={14} color={C.success}/>
          <span style={{fontSize:12,fontWeight:600,color:"#059669",fontFamily:C.font}}>Đã gửi lời mời đến {sentCount} địa chỉ email.</span>
        </div>}
        <form onSubmit={handleSubmit}><div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textSub,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7,fontFamily:C.font}}>Vai trò</label>
            <div style={{display:"flex",gap:8}}>
              {ROLES.map(r=>(
                <button key={r.value} type="button" onClick={()=>setRole(r.value)} style={{flex:1,padding:"9px 10px",borderRadius:11,border:`1.5px solid ${role===r.value?C.primary:"rgba(0,0,0,0.08)"}`,background:role===r.value?"rgba(67,97,238,0.1)":"rgba(255,255,255,0.6)",cursor:"pointer",textAlign:"center",transition:"all .15s",backdropFilter:"blur(8px)"}}>
                  <div style={{fontSize:12,fontWeight:700,color:role===r.value?C.primary:C.text,fontFamily:C.font}}>{r.label}</div>
                  <div style={{fontSize:10,color:C.textSub,marginTop:2,fontFamily:C.font}}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textSub,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7,fontFamily:C.font}}>Địa chỉ email</label>
          <textarea rows={4} value={emails} onChange={e=>{setEmails(e.target.value);setError("");}}
            placeholder={"example@email.com\nuser2@email.com"}
            style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",background:"rgba(255,255,255,0.8)",backdropFilter:"blur(8px)",border:`1.5px solid ${error?C.error:"rgba(0,0,0,0.1)"}`,borderRadius:11,color:C.text,fontSize:13,fontFamily:C.font,outline:"none",resize:"vertical",lineHeight:1.7}}
            onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow=`0 0 0 3px rgba(67,97,238,0.1)`;}}
            onBlur={e=>{e.target.style.borderColor=error?C.error:"rgba(0,0,0,0.1)";e.target.style.boxShadow="none";}}
          />
          {error&&<div style={{fontSize:12,color:C.error,fontFamily:C.font}}>{error}</div>}
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:4}}>
            <button type="button" onClick={onClose} style={sharedCancelBtn}>Đóng</button>
            <button type="submit" disabled={loading} style={sharedPrimaryBtn(loading)}>
              {loading?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang gửi...</>:<><Send size={13}/> Gửi lời mời</>}
            </button>
          </div>
        </div></form>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   BULK INVITE MODAL
════════════════════════════════════════════════════════════════ */
function BulkInviteModal({ open, onClose, survey, onBulkInvite }) {
  const [emails,setEmails]=useState("");
  const [role,setRole]=useState("viewer");
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(null);
  const [error,setError]=useState("");
  useEffect(()=>{ if(!open){setEmails("");setSuccess(null);setError("");setRole("viewer");} },[open]);
  const parseEmails=()=>emails.split(/[\n,;]+/).map(e=>e.trim()).filter(Boolean);
  const emailCount=parseEmails().length;
  const handleSubmit=async e=>{
    e.preventDefault();
    const list=parseEmails();
    if(!list.length){setError("Vui lòng nhập ít nhất 1 email.");return;}
    setLoading(true);setError("");
    try{const res=await onBulkInvite(survey.id,{emails:list,role});setSuccess({sent:res?.created??list.length,failed:res?.failed??0});setEmails("");}
    catch{setError("Bulk invite thất bại.");}
    finally{setLoading(false);}
  };
  const ROLES=[
    {value:"viewer",label:"👁️ Viewer",desc:"Chỉ xem"},
    {value:"editor",label:"✏️ Editor",desc:"Có thể chỉnh sửa"},
  ];
  return (
    <Modal open={open} onClose={onClose} title="Mời hàng loạt" width={520}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"rgba(67,97,238,0.08)",borderRadius:12,border:`1px solid rgba(67,97,238,0.2)`}}>
          <div style={{width:38,height:38,borderRadius:10,background:"rgba(67,97,238,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <UserPlus size={17} color={C.primary}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.font}}>{survey?.title}</div>
            <div style={{fontSize:11,color:C.textSub,marginTop:2,fontFamily:C.font}}>Nhập nhiều email để mời hàng loạt</div>
          </div>
          {emailCount>0&&<span style={{padding:"3px 10px",borderRadius:999,background:"rgba(67,97,238,0.15)",color:C.primary,fontSize:11,fontWeight:700,flexShrink:0,fontFamily:C.font}}>{emailCount} email</span>}
        </div>
        {success&&<div style={{padding:"12px 14px",borderRadius:12,background:C.successBg,border:`1px solid ${C.successBorder}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:700,color:"#059669",fontFamily:C.font}}><Check size={13}/> Đã gửi lời mời hàng loạt!</div>
          <div style={{display:"flex",gap:16,marginTop:6}}>
            <span style={{fontSize:11,color:C.textSub,fontFamily:C.font}}>✅ Thành công: <strong style={{color:C.success}}>{success.sent}</strong></span>
            {success.failed>0&&<span style={{fontSize:11,color:C.textSub,fontFamily:C.font}}>❌ Thất bại: <strong style={{color:C.error}}>{success.failed}</strong></span>}
          </div>
        </div>}
        <form onSubmit={handleSubmit}><div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textSub,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7,fontFamily:C.font}}>Vai trò</label>
            <div style={{display:"flex",gap:7}}>
              {ROLES.map(r=>(
                <button key={r.value} type="button" onClick={()=>setRole(r.value)} style={{flex:1,padding:"9px 10px",borderRadius:11,border:`1.5px solid ${role===r.value?C.primary:"rgba(0,0,0,0.08)"}`,background:role===r.value?"rgba(67,97,238,0.1)":"rgba(255,255,255,0.6)",cursor:"pointer",textAlign:"center",transition:"all .15s",backdropFilter:"blur(8px)"}}>
                  <div style={{fontSize:12,fontWeight:700,color:role===r.value?C.primary:C.text,fontFamily:C.font}}>{r.label}</div>
                  <div style={{fontSize:10,color:C.textDim,marginTop:2,fontFamily:C.font}}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textSub,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7,fontFamily:C.font}}>Danh sách email</label>
            <textarea rows={6} value={emails} onChange={e=>{setEmails(e.target.value);setError("");}}
              placeholder={"user1@email.com\nuser2@email.com, user3@email.com"}
              style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",background:"rgba(255,255,255,0.8)",backdropFilter:"blur(8px)",border:`1.5px solid ${error?C.error:"rgba(0,0,0,0.1)"}`,borderRadius:11,color:C.text,fontSize:12,fontFamily:C.font,outline:"none",resize:"vertical",lineHeight:1.7}}
              onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow=`0 0 0 3px rgba(67,97,238,0.1)`;}}
              onBlur={e=>{e.target.style.borderColor=error?C.error:"rgba(0,0,0,0.1)";e.target.style.boxShadow="none";}}
            />
          </div>
          {error&&<div style={{fontSize:12,color:C.error,fontFamily:C.font}}>{error}</div>}
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button type="button" onClick={onClose} style={sharedCancelBtn}>Đóng</button>
            <button type="submit" disabled={loading||emailCount===0} style={sharedPrimaryBtn(loading||emailCount===0)}>
              {loading?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang gửi...</>:<><UserPlus size={13}/> Mời {emailCount>0?`${emailCount} người`:"hàng loạt"}</>}
            </button>
          </div>
        </div></form>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   PARTICIPANTS MODAL
════════════════════════════════════════════════════════════════ */
function ParticipantsModal({ open, onClose, survey, onGetParticipants, onDeleteParticipant }) {
  const [participants,setParticipants]=useState([]);
  const [count,setCount]=useState(0);
  const [loading,setLoading]=useState(false);
  const [deleting,setDeleting]=useState(null);
  const [confirmPid,setConfirmPid]=useState(null);
  const [search,setSearch]=useState("");
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    if(!survey?.id) return;
    setLoading(true);setError("");
    try{const res=await onGetParticipants(survey.id,{});setParticipants(res?.participants??[]);setCount(res?.count??0);}
    catch{setError("Không thể tải danh sách.");}
    finally{setLoading(false);}
  },[survey?.id, onGetParticipants]);

  useEffect(()=>{ if(open){load();setSearch("");setConfirmPid(null);setError("");}else{setParticipants([]);setCount(0);} },[open,load]);

  const handleDelete=async pid=>{
    setDeleting(pid);
    try{await onDeleteParticipant(survey.id,pid);setParticipants(p=>p.filter(x=>x.participant_id!==pid));setCount(c=>Math.max(0,c-1));setConfirmPid(null);}
    finally{setDeleting(null);}
  };

  const filtered=participants.filter(p=>{
    const q=search.toLowerCase();
    return p.email?.toLowerCase().includes(q)||p.name?.toLowerCase().includes(q)||p.role?.toLowerCase().includes(q);
  });

  const getInitials=(name,email)=>{
    if(name) return name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    return (email||"?")[0].toUpperCase();
  };

  const AV=[{bg:"#e0e7ff",color:"#3730a3"},{bg:"#d1fae5",color:"#065f46"},{bg:"#fce7f3",color:"#9d174d"},{bg:"#fef3c7",color:"#78350f"},{bg:"#f3e8ff",color:"#5b21b6"}];
  const ROLE_STYLE={viewer:{color:"#1d4ed8",bg:"#eff6ff",border:"#bfdbfe"},respondent:{color:"#059669",bg:"#ecfdf5",border:"#a7f3d0"},editor:{color:"#7c3aed",bg:"#f5f3ff",border:"#ddd6fe"}};
  const getRoleStyle=role=>ROLE_STYLE[role?.toLowerCase()]??{color:C.primary,bg:"rgba(67,97,238,0.1)",border:"rgba(67,97,238,0.3)"};

  return (
    <Modal open={open} onClose={onClose} title="Quản lý người tham gia" width={540}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:"rgba(67,97,238,0.08)",border:`1px solid rgba(67,97,238,0.2)`}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(67,97,238,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Users size={16} color={C.primary}/>
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1,fontFamily:C.font}}>{count}</div>
              <div style={{fontSize:11,color:C.textSub,marginTop:2,fontFamily:C.font}}>Tổng người tham gia</div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{padding:"0 14px",borderRadius:12,border:`1px solid rgba(0,0,0,0.08)`,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:C.textSub,flexShrink:0,fontFamily:C.font}}>
            <RefreshCw size={13} style={loading?{animation:"spin 1s linear infinite"}:{}}/>Tải lại
          </button>
        </div>
        {error&&!loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,background:C.errorBg,border:`1px solid ${C.errorBorder}`}}>
          <span style={{fontSize:12,color:C.error,fontFamily:C.font}}>{error}</span>
          <button onClick={load} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.errorBorder}`,background:"rgba(255,255,255,0.8)",color:C.error,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:C.font}}>Thử lại</button>
        </div>}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",border:`1px solid rgba(0,0,0,0.07)`,borderRadius:10}}>
          <Search size={13} color={C.textDim}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên, email hoặc vai trò..."
            style={{flex:1,border:"none",outline:"none",fontSize:12,fontFamily:C.font,color:C.text,background:"transparent"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,display:"flex",padding:0}}><X size={12}/></button>}
        </div>
        <div style={{border:`1px solid rgba(0,0,0,0.07)`,borderRadius:14,overflow:"hidden",maxHeight:340,overflowY:"auto",background:"rgba(255,255,255,0.5)",backdropFilter:"blur(8px)"}}>
          {loading?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 20px",gap:12}}>
              <Loader2 size={26} style={{animation:"spin 1s linear infinite"}} color={C.primary}/>
              <span style={{fontSize:12,color:C.textSub,fontFamily:C.font}}>Đang tải...</span>
            </div>
          ):filtered.length===0&&!error?(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <Users size={28} color={C.textDim} style={{marginBottom:8}}/>
              <div style={{fontSize:12,fontWeight:600,color:C.textSub,fontFamily:C.font}}>{search?`Không tìm thấy "${search}"`:"Chưa có người tham gia"}</div>
            </div>
          ):(
            filtered.map((p,i)=>{
              const av=AV[i%AV.length];
              const deleteKey=p.participant_id??p.id;
              const isConfirming=confirmPid===deleteKey;
              const isDeleting=deleting===deleteKey;
              const roleStyle=getRoleStyle(p.role);
              return (
                <div key={p.participant_id??p.id??i} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 14px",borderBottom:i<filtered.length-1?`1px solid rgba(0,0,0,0.05)`:"none",background:isConfirming?C.errorBg:"transparent",transition:"background .15s"}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:av.bg,color:av.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{getInitials(p.name,p.email)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:C.font}}>{p.name||p.email}</div>
                    {p.name&&<div style={{fontSize:11,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:C.font}}>{p.email}</div>}
                    {!p.name&&<div style={{fontSize:10,color:C.textDim,fontFamily:C.font}}>ID: {p.id?p.id.slice(0,8)+"...":"—"}</div>}
                  </div>
                  {p.role&&<span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:999,flexShrink:0,color:roleStyle.color,background:roleStyle.bg,border:`1px solid ${roleStyle.border}`,fontFamily:C.font}}>{p.role==="ADMIN"?"Quản trị":p.role==="owner"?"Chủ sở hữu":p.role==="editor"?"Biên tập":p.role==="viewer"?"Người xem":p.role==="respondent"?"Người trả lời":p.role}</span>}
                  {isConfirming?(
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      <button onClick={()=>setConfirmPid(null)} style={{padding:"4px 9px",borderRadius:7,fontSize:11,fontWeight:600,border:`1px solid rgba(0,0,0,0.1)`,background:"rgba(255,255,255,0.8)",color:C.textSub,cursor:"pointer",fontFamily:C.font}}>Huỷ</button>
                      <button onClick={()=>handleDelete(deleteKey)} disabled={isDeleting} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:7,fontSize:11,fontWeight:700,border:"none",background:isDeleting?"rgba(0,0,0,0.05)":C.error,color:isDeleting?C.textSub:"#fff",cursor:isDeleting?"not-allowed":"pointer",fontFamily:C.font}}>
                        {isDeleting?<Loader2 size={10} style={{animation:"spin 1s linear infinite"}}/>:<Trash2 size={10}/>} Xoá
                      </button>
                    </div>
                  ):(
                    <button onClick={()=>setConfirmPid(deleteKey)} style={{width:28,height:28,borderRadius:8,flexShrink:0,border:`1px solid rgba(0,0,0,0.08)`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.errorBorder;e.currentTarget.style.color=C.error;e.currentTarget.style.background=C.errorBg;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,0,0,0.08)";e.currentTarget.style.color=C.textDim;e.currentTarget.style.background="transparent";}}
                    ><UserMinus size={12}/></button>
                  )}
                </div>
              );
            })
          )}
        </div>
        {!loading&&!error&&filtered.length>0&&search&&<div style={{fontSize:11,color:C.textSub,textAlign:"center",fontFamily:C.font}}>Hiển thị {filtered.length} / {participants.length} người</div>}
        <div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={onClose} style={sharedCancelBtn}>Đóng</button></div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLISH / CLOSE MODALS
════════════════════════════════════════════════════════════════ */
function PublishModal({ open, onClose, survey, onPublish }) {
  const [loading,setLoading]=useState(false);
  const isPublished=survey?.is_published;
  const handleConfirm=async()=>{setLoading(true);try{await onPublish(survey.id,{is_published:!isPublished});onClose();}finally{setLoading(false);}};
  return (
    <Modal open={open} onClose={onClose} title={isPublished?"Ẩn khảo sát":"Công khai khảo sát"} width={400}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{padding:"20px",borderRadius:14,background:isPublished?"rgba(245,158,11,0.08)":"rgba(67,97,238,0.08)",border:`1px solid ${isPublished?"rgba(245,158,11,0.3)":"rgba(67,97,238,0.3)"}`,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:10}}>{isPublished?"🔒":"🌐"}</div>
          <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:C.font}}>{isPublished?"Khảo sát sẽ bị ẩn và không còn nhận câu trả lời mới.":"Khảo sát sẽ được công khai và có thể nhận câu trả lời."}</div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <button onClick={onClose} style={sharedCancelBtn}>Huỷ</button>
          <button onClick={handleConfirm} disabled={loading} style={{...sharedPrimaryBtn(loading),background:loading?"rgba(0,0,0,0.05)":isPublished?"rgba(245,158,11,0.9)":"linear-gradient(135deg,#4361ee,#6c7ef7)"}}>
            {loading?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang xử lý...</>:isPublished?<><PowerOff size={13}/> Ẩn survey</>:<><Globe size={13}/> Công khai</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CloseModal({ open, onClose, survey, onCloseSurvey }) {
  const [loading,setLoading]=useState(false);
  const handleConfirm=async()=>{setLoading(true);try{await onCloseSurvey(survey.id);onClose();}finally{setLoading(false);}};
  return (
    <Modal open={open} onClose={onClose} title="Đóng khảo sát" width={400}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{padding:"20px",borderRadius:14,background:C.errorBg,border:`1px solid ${C.errorBorder}`,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:10}}>⛔</div>
          <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:C.font}}>Sau khi đóng, survey sẽ không nhận thêm câu trả lời.</div>
          <div style={{fontSize:12,color:C.textSub,marginTop:4,fontFamily:C.font}}>Hành động này không thể hoàn tác.</div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <button onClick={onClose} style={sharedCancelBtn}>Huỷ</button>
          <button onClick={handleConfirm} disabled={loading} style={{...sharedPrimaryBtn(loading),background:loading?"rgba(0,0,0,0.05)":C.error}}>
            {loading?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang đóng...</>:<><PowerOff size={13}/> Đóng survey</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUBMISSION MODAL (view answers)
════════════════════════════════════════════════════════════════ */
const TYPE_CONFIG={
  SINGLE_CHOICE:{label:"Một lựa chọn",barColor:"#2563eb",badgeBg:"#eff6ff",badgeBorder:"#bfdbfe",badgeColor:"#1d4ed8"},
  MULTIPLE_CHOICE:{label:"Nhiều lựa chọn",barColor:"#7c3aed",badgeBg:"#f5f3ff",badgeBorder:"#ddd6fe",badgeColor:"#6d28d9"},
  TEXT:{label:"Văn bản",barColor:"#0891b2",badgeBg:"#ecfeff",badgeBorder:"#a5f3fc",badgeColor:"#0e7490"},
};
function getTypeCfg(type){return TYPE_CONFIG[type]??{label:type,barColor:"#888",badgeBg:"#f3f4f6",badgeBorder:"#e5e7eb",badgeColor:"#6b7280"};}
function getAnswerSet(answer){
  if(answer===null||answer===undefined) return new Set();
  if(Array.isArray(answer)) return new Set(answer.map(s=>String(s).trim()).filter(Boolean));
  return new Set(String(answer).split(",").map(s=>s.trim()).filter(Boolean));
}
function AnswerBlock({ item }) {
  const isText=item.type==="TEXT";
  const isMultiple=item.type==="MULTIPLE_CHOICE";
  const answerSet=getAnswerSet(item.answer);
  const hasAnswer=answerSet.size>0;
  if(isText) return item.answer?.trim()?<div style={{background:"rgba(248,250,255,0.8)",border:"1px solid #e5e7eb",borderRadius:10,padding:"11px 13px",fontSize:12,color:"#374151",lineHeight:1.6}}>{item.answer}</div>:<p style={{fontSize:12,color:C.textDim,fontStyle:"italic",margin:0}}>Không có câu trả lời</p>;
  const options=item.options??[];
  const renderOption=(label,isSelected,key)=>(
    <div key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 11px",borderRadius:10,border:`1px solid ${isSelected?"#bfdbfe":"#e5e7eb"}`,background:isSelected?"rgba(239,246,255,0.85)":"rgba(250,250,250,0.8)"}}>
      {isMultiple?(
        <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${isSelected?"#2563eb":"#d1d5db"}`,background:isSelected?"#2563eb":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {isSelected&&<svg width="9" height="7" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      ):(
        <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${isSelected?"#2563eb":"#d1d5db"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {isSelected&&<div style={{width:8,height:8,borderRadius:"50%",background:"#2563eb"}}/>}
        </div>
      )}
      <span style={{fontSize:12,fontWeight:isSelected?600:400,color:isSelected?"#1e40af":"#6b7280"}}>{label}</span>
    </div>
  );
  if(options.length>0) return <div style={{display:"flex",flexDirection:"column",gap:6}}>{options.map((opt,i)=>{const label=typeof opt==="string"?opt:(opt.label??opt.value??opt.content??"");const isSelected=answerSet.has(label)||answerSet.has(String(opt.id??""));return renderOption(label,isSelected,i);})}</div>;
  if(hasAnswer) return <div style={{display:"flex",flexDirection:"column",gap:6}}>{[...answerSet].map((label,i)=>renderOption(label,true,i))}</div>;
  return <p style={{fontSize:12,color:C.textDim,fontStyle:"italic",margin:0}}>Không có câu trả lời</p>;
}
function QuestionCard({ item, index }) {
  const cfg=getTypeCfg(item.type);
  return (
    <div style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(12px)",borderRadius:16,border:"1px solid rgba(255,255,255,0.3)",borderTop:`3px solid ${cfg.barColor}`,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
      <div style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontSize:11,color:C.textSub,fontFamily:C.font}}>Câu {index+1}</span>
          <span style={{background:cfg.badgeBg,border:`1px solid ${cfg.badgeBorder}`,color:cfg.badgeColor,padding:"2px 9px",borderRadius:999,fontSize:10,fontWeight:700,fontFamily:C.font}}>{cfg.label}</span>
        </div>
        <h3 style={{fontSize:13,fontWeight:700,color:C.text,margin:"0 0 12px",lineHeight:1.5,fontFamily:C.font}}>{item.question}</h3>
        <AnswerBlock item={item}/>
      </div>
    </div>
  );
}
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission }=useResponse();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [expiredWarning,setExpiredWarning]=useState(false);
  const [answers,setAnswers]=useState([]);
  useEffect(()=>{
    let cancelled=false;
    const fetch=async()=>{
      try{setLoading(true);setError(null);setExpiredWarning(false);
        const res=await getMySubmission(surveyId);
        if(cancelled) return;
        // Check if response indicates survey is expired
        if(res?.expired || res?.status === "EXPIRED" || res?.survey_status === "EXPIRED"){
          setExpiredWarning(true);
        }
        const raw=res?.data??res??[];
        const all=Array.isArray(raw)?raw.flatMap(r=>r.answers??[]):(raw.answers??[]);
        setAnswers(all);
      }
      catch(err){
        if(cancelled) return;
        const status = err?.response?.status;
        if(status === 403 || status === 404){
          setError("Khảo sát này đã hết hạn hoặc không còn khả dụng.");
        } else {
          setError("Không thể tải câu trả lời.");
        }
      }
      finally{if(!cancelled)setLoading(false);}
    };
    fetch();return()=>{cancelled=true;};
  },[surveyId]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,zIndex:10040,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(10px)",display:"flex",justifyContent:"center",alignItems:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"hidden",background:"rgba(245,247,250,0.95)",backdropFilter:"blur(20px)",borderRadius:24,border:`1px solid ${C.glassBorder}`,display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.2)"}}>
        <div style={{padding:"14px 18px",background:"rgba(255,255,255,0.8)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,color:C.textSub,background:"none",border:"none",cursor:"pointer",fontFamily:C.font}}>
            <ArrowLeft size={14}/> Đóng
          </button>
          <div style={{fontSize:12,fontWeight:700,color:C.textSub,fontFamily:C.font}}>InsightFlow</div>
          <div style={{width:50}}/>
        </div>
        <div style={{padding:"20px",overflowY:"auto",flex:1}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            {(expiredWarning || error) ? (
              <>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:999,background:"rgba(245,158,11,0.15)",border:"1px solid #fcd34d",marginBottom:10,backdropFilter:"blur(8px)"}}>
                  <Clock size={11} color="#d97706"/>
                  <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#92400e",fontFamily:C.font}}>Hết hạn</span>
                </div>
                <h2 style={{fontSize:18,fontWeight:800,color:C.text,margin:"0 0 4px",fontFamily:C.font}}>{surveyTitle}</h2>
              </>
            ) : (
              <>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:999,background:"rgba(220,252,231,0.8)",border:"1px solid #86efac",marginBottom:10,backdropFilter:"blur(8px)"}}>
                  <CheckCircle2 size={11} color="#16a34a"/>
                  <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#15803d",fontFamily:C.font}}>Đã hoàn thành</span>
                </div>
                <h2 style={{fontSize:18,fontWeight:800,color:C.text,margin:"0 0 4px",fontFamily:C.font}}>{surveyTitle}</h2>
                {!loading&&<p style={{fontSize:12,color:C.textSub,margin:0,fontFamily:C.font}}>{answers.length} câu hỏi</p>}
              </>
            )}
          </div>
          {loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 0",gap:8,color:C.primary}}><Loader2 size={18} style={{animation:"spin 1s linear infinite"}}/><span style={{fontSize:13,fontFamily:C.font}}>Đang tải...</span></div>}
          {!loading&&error&&<div style={{textAlign:"center",padding:"32px 20px"}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#fef3c7,#fde68a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 16px rgba(217,119,6,0.20)"}}>
              <Clock size={32} color="#d97706"/>
            </div>
            <h3 style={{fontSize:18,fontWeight:800,color:"#111827",marginBottom:8,fontFamily:C.font}}>Khảo sát đã kết thúc</h3>
            <p style={{fontSize:14,color:"#6b7280",marginBottom:24,lineHeight:1.7,fontFamily:C.font}}>Khảo sát này đã kết thúc. Cảm ơn bạn đã quan tâm!</p>
            <div style={{height:1,background:"#f3f4f6",marginBottom:20}}/>
            <button onClick={onClose} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 28px",background:"linear-gradient(135deg,#4361ee,#6c7ef7)",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:C.font,boxShadow:"0 4px 14px rgba(79,110,247,0.30)"}}>
              Đã hiểu
            </button>
          </div>}
          {!loading&&!error&&expiredWarning&&<div style={{textAlign:"center",padding:"32px 20px",background:"rgba(245,158,11,0.08)",borderRadius:14,border:"1px solid rgba(245,158,11,0.2)"}}>
            <div style={{fontSize:13,color:"#92400e",fontFamily:C.font,lineHeight:1.6,marginBottom:16}}>Khảo sát này đã kết thúc. Kết quả của bạn vẫn được lưu.</div>
          </div>}
          {!loading&&!error&&!expiredWarning&&answers.length===0&&<div style={{textAlign:"center",padding:"48px 0"}}><Inbox size={36} color={C.textDim} style={{marginBottom:8}}/><div style={{fontSize:13,color:C.textSub,fontFamily:C.font}}>Không có câu trả lời.</div></div>}
          {!loading&&!error&&!expiredWarning&&answers.length>0&&<div style={{display:"flex",flexDirection:"column",gap:12}}>{answers.map((item,idx)=><QuestionCard key={item.question_id??idx} item={item} index={idx}/>)}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC SURVEY CARD — hover nhẹ (không nghiêng theo chuột)
════════════════════════════════════════════════════════════════ */
function PublicSurveyCard({ survey, done, onStart, onViewSubmission, index }) {
  const thumb=C.thumbGrads[index%C.thumbGrads.length];
  const createdDate=survey?.created_at?new Date(survey.created_at).toLocaleDateString("vi-VN"):"";

  return (
    <div
      onClick={()=>done&&onViewSubmission(survey.id,survey.title)}
      onMouseEnter={e=>{
        const el=e.currentTarget;
        el.style.transform="translateY(-4px)";
        el.style.boxShadow=done?"0 12px 32px rgba(16,185,129,0.18), 0 4px 14px rgba(15,23,42,0.06)":"0 12px 32px rgba(79,70,229,0.16), 0 4px 14px rgba(15,23,42,0.06)";
        el.style.borderColor=done?"rgba(16,185,129,0.45)":"rgba(99,102,241,0.28)";
      }}
      onMouseLeave={e=>{
        const el=e.currentTarget;
        el.style.transform="translateY(0)";
        el.style.boxShadow="0 4px 20px rgba(15,23,42,0.08)";
        el.style.borderColor=done?"rgba(16,185,129,0.28)":C.glassBorder;
      }}
      style={{
        background:"rgba(255,255,255,0.82)", backdropFilter:"blur(18px)",
        border:`1px solid ${done?"rgba(16,185,129,0.28)":C.glassBorder}`,
        borderRadius:20, overflow:"hidden",
        cursor:done?"pointer":"default",
        transition:"transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease",
        boxShadow:"0 4px 20px rgba(15,23,42,0.08)",
        display:"flex", flexDirection:"column",
      }}
    >
      {/* Thumb */}
      <div style={{height:120,background:done?"linear-gradient(135deg,#d1fae5,#a7f3d0)":thumb,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(45deg,rgba(255,255,255,0.1),transparent 50%,rgba(0,0,0,0.05))"}}/>
        {done?<CheckCircle2 size={52} color="rgba(5,150,105,0.25)" strokeWidth={0.8}/>:<FileText size={52} color="rgba(255,255,255,0.2)" strokeWidth={0.8}/>}
        <div style={{position:"absolute",top:10,left:10,display:"flex",gap:5}}>
          {done&&<span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:999,color:"#059669",background:"rgba(220,252,231,0.9)",border:"1px solid #a7f3d0",fontFamily:C.font}}>✓ Hoàn thành</span>}
          {!done&&survey.status&&<StatusBadge status={survey.status}/>}
        </div>
        {done&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(to right,#10b981,#34d399)"}}/>}
      </div>

      {/* Body */}
      <div style={{padding:"16px 18px",flex:1,display:"flex",flexDirection:"column"}}>
        <h3 style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:6,lineHeight:1.4,fontFamily:C.font,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{survey.title}</h3>
        <p style={{fontSize:12,color:C.textSub,marginBottom:14,lineHeight:1.6,flex:1,fontFamily:C.font,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{survey.description||"Không có mô tả"}</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.textDim,fontFamily:C.font}}>
            <Clock size={11}/><span>{createdDate}</span>
          </div>
          {done?(
            <span style={{padding:"6px 14px",borderRadius:10,fontSize:11,fontWeight:700,background:"rgba(220,252,231,0.9)",color:"#059669",border:"1px solid #a7f3d0",fontFamily:C.font}}>Xem kết quả →</span>
          ):(
            <button onClick={e=>{e.stopPropagation();onStart(survey.id);}} style={{padding:"6px 14px",borderRadius:10,fontSize:11,fontWeight:700,color:"#fff",background:"linear-gradient(135deg,#4361ee,#6c7ef7)",border:"none",cursor:"pointer",fontFamily:C.font,transition:"all .2s",boxShadow:"0 4px 12px rgba(67,97,238,0.3)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.boxShadow="0 6px 20px rgba(67,97,238,0.4)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 12px rgba(67,97,238,0.3)";}}
            >Bắt đầu →</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC CARD SKELETON
════════════════════════════════════════════════════════════════ */
function PublicCardSkeleton() {
  return (
    <div style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(12px)",border:`1px solid ${C.glassBorder}`,borderRadius:20,overflow:"hidden",animation:"pulse 1.5s ease-in-out infinite"}}>
      <div style={{height:120,background:"rgba(0,0,0,0.04)"}}/>
      <div style={{padding:"16px 18px"}}>
        <div style={{height:13,background:"rgba(0,0,0,0.06)",borderRadius:6,width:"70%",marginBottom:8}}/>
        <div style={{height:11,background:"rgba(0,0,0,0.04)",borderRadius:5,width:"100%",marginBottom:4}}/>
        <div style={{height:11,background:"rgba(0,0,0,0.04)",borderRadius:5,width:"60%",marginBottom:16}}/>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <div style={{width:50,height:11,background:"rgba(0,0,0,0.04)",borderRadius:5}}/>
          <div style={{width:80,height:28,background:"rgba(0,0,0,0.04)",borderRadius:10}}/>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEY CARD — 3D matching Dashboard
════════════════════════════════════════════════════════════════ */
function MySurveyCard({
  survey, index,
  onDelete, onUpdate, onShare, onInvite, onPublish, onCloseSurvey,
  onBulkInvite, onGetParticipants, onDeleteParticipant,
}) {
  const navigate=useNavigate();
  const thumb=C.thumbGrads[index%C.thumbGrads.length];

  const [editing,setEditing]=useState(false);
  const [title,setTitle]=useState(survey.title);
  const [description,setDescription]=useState(survey.description||"");
  const [startAt,setStartAt]=useState(survey.start_at?survey.start_at.slice(0,16):"");
  const [endAt,setEndAt]=useState(survey.end_at?survey.end_at.slice(0,16):"");
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(false);

  const [shareOpen,setShareOpen]=useState(false);
  const [inviteOpen,setInviteOpen]=useState(false);
  const [publishOpen,setPublishOpen]=useState(false);
  const [closeOpen,setCloseOpen]=useState(false);
  const [bulkInviteOpen,setBulkInviteOpen]=useState(false);
  const [participantsOpen,setParticipantsOpen]=useState(false);

  const handleSave=async()=>{
    try{setSaving(true);await onUpdate(survey.id,{title,description,start_at:startAt||null,end_at:endAt||null});setEditing(false);}
    catch(err){console.error(err);}finally{setSaving(false);}
  };
  const handleDelete=async()=>{try{setDeleting(true);await onDelete(survey.id);}finally{setDeleting(false);}};
  const isClosed=survey.status==="CLOSED";
  const isPublished=survey.is_published;

  const inputBase={
    width:"100%",boxSizing:"border-box",padding:"8px 11px",
    background:"rgba(255,255,255,0.8)",backdropFilter:"blur(8px)",
    border:`1px solid rgba(0,0,0,0.1)`,borderRadius:9,
    fontSize:12,color:C.text,fontFamily:C.font,outline:"none",
  };

  return (
    <>
      <div
        onMouseEnter={e=>{
          const el=e.currentTarget;
          el.style.transform="translateY(-4px)";
          el.style.boxShadow="0 12px 28px rgba(79,70,229,0.14), 0 4px 12px rgba(15,23,42,0.06)";
          el.style.borderColor="rgba(99,102,241,0.28)";
        }}
        onMouseLeave={e=>{
          const el=e.currentTarget;
          el.style.transform="translateY(0)";
          el.style.boxShadow="0 4px 18px rgba(15,23,42,0.08)";
          el.style.borderColor=C.glassBorder;
        }}
        style={{
          position:"relative",
          background:"rgba(255,255,255,0.85)",backdropFilter:"blur(18px)",
          border:`1px solid ${C.glassBorder}`,borderRadius:20,overflow:"hidden",
          cursor:"pointer",transition:"transform 0.22s ease, box-shadow 0.22s ease, border-color 0.2s ease",
          boxShadow:"0 4px 18px rgba(15,23,42,0.08)",
          opacity:isClosed?0.7:1,display:"flex",flexDirection:"column",height:"100%",
        }}
        onClick={()=>!editing&&navigate(`/user/my-surveys/${survey.id}/studio`)}
      >
        {/* Thumb */}
        <div style={{height:120,background:isClosed?"linear-gradient(135deg,#f1f5f9,#e2e8f0)":thumb,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(45deg,rgba(255,255,255,0.1),transparent 50%,rgba(0,0,0,0.05))"}}/>
          <FileText size={48} color={isClosed?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.2)"} strokeWidth={0.8}/>
          <div style={{position:"absolute",top:10,left:10,display:"flex",flexDirection:"column",gap:4}}>
            <StatusBadge status={survey.status}/>
            {isPublished&&<span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,color:"#4361ee",background:"rgba(67,97,238,0.15)",display:"flex",alignItems:"center",gap:3,fontFamily:C.font}}><Globe size={8}/> Đang live</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{padding:"14px 16px",flex:1,display:"flex",flexDirection:"column"}} onClick={e=>editing&&e.stopPropagation()}>
          {editing?(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <input value={title} onChange={e=>setTitle(e.target.value)} style={inputBase} placeholder="Tiêu đề"/>
              <textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)} style={{...inputBase,resize:"none"}} placeholder="Mô tả"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <input type="datetime-local" value={startAt} onChange={e=>setStartAt(e.target.value)} style={inputBase}/>
                <input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} style={inputBase}/>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:6}}>
                <button onClick={()=>setEditing(false)} style={sharedCancelBtn}>Huỷ</button>
                <button onClick={handleSave} style={{...sharedPrimaryBtn(saving),padding:"7px 12px"}}>
                  {saving?<Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>:<Check size={13}/>} Lưu
                </button>
              </div>
            </div>
          ):(
            <>
              <h3 style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4,lineHeight:1.5,fontFamily:C.font,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>{survey.title}</h3>
              <p style={{fontSize:12,color:C.textSub,lineHeight:1.6,minHeight:36,margin:"0 0 12px",fontFamily:C.font,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{survey.description||"Không có mô tả"}</p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.textDim,fontFamily:C.font}}>
                  <Calendar size={11}/>{survey.created_at?new Date(survey.created_at).toLocaleDateString("vi-VN"):""}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ShareLinkModal open={shareOpen} onClose={()=>setShareOpen(false)} survey={survey} onShare={onShare}/>
      <InviteModal open={inviteOpen} onClose={()=>setInviteOpen(false)} survey={survey} onInvite={onInvite}/>
      <PublishModal open={publishOpen} onClose={()=>setPublishOpen(false)} survey={survey} onPublish={onPublish}/>
      <CloseModal open={closeOpen} onClose={()=>setCloseOpen(false)} survey={survey} onCloseSurvey={onCloseSurvey}/>
      <BulkInviteModal open={bulkInviteOpen} onClose={()=>setBulkInviteOpen(false)} survey={survey} onBulkInvite={onBulkInvite}/>
      <ParticipantsModal open={participantsOpen} onClose={()=>setParticipantsOpen(false)} survey={survey} onGetParticipants={onGetParticipants} onDeleteParticipant={onDeleteParticipant}/>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   STATS STRIP — mini hero banner showing progress
════════════════════════════════════════════════════════════════ */
function StatsStrip({ mySurveys, total, done, pending, loading }) {
  const stats=[
    {label:"Khảo sát của tôi",value:mySurveys,icon:FileText,color:"#6366f1",grad:"linear-gradient(135deg,#6366f1,#a855f7)"},
    {label:"Đã hoàn thành",value:done,icon:CheckCircle2,color:"#10b981",grad:"linear-gradient(135deg,#34d399,#059669)"},
    {label:"Chưa làm",value:pending,icon:Zap,color:"#f59e0b",grad:"linear-gradient(135deg,#fbbf24,#ea580c)"},
    {label:"Tổng khảo sát",value:total,icon:TrendingUp,color:"#ec4899",grad:"linear-gradient(135deg,#f472b6,#db2777)"},
  ];
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"repeat(auto-fit,minmax(200px,280px))",
      gap:14,
      marginBottom:36,
    }}>
      {stats.map((s,i)=>(
        <GlassCard key={i} delay={i * 0.06} hover style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:44, height:44, borderRadius:14, background:s.grad,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              boxShadow:`0 8px 18px ${s.color}38`,
            }}>
              <s.icon size={21} color="#fff" strokeWidth={1.8}/>
            </div>
            <div>
              <div style={{
                fontSize:24, fontWeight:900, lineHeight:1,
                background:s.grad, backgroundClip:"text", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              }}>{loading?"—":s.value}</div>
              <div style={{ fontSize:10, color:C.textSub, marginTop:4, fontFamily:C.font, fontWeight:700, letterSpacing:"0.04em" }}>{s.label}</div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
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
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"rgba(15,23,42,0.5)",
      backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, animation:"fadeIn .15s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16,
        border:"1px solid #e8ecf2",
        boxShadow:"0 24px 60px rgba(0,0,0,0.15)",
        width:"100%", maxWidth:420, overflow:"hidden",
        animation:"slideUp .2s cubic-bezier(.16,1,.3,1)",
        fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, padding:"20px 24px 0" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#f59e0b,#fbbf24)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 4px 14px rgba(245,158,11,0.3)" }}>
            <RefreshCw size={20} color="#fff"/>
          </div>
          <div>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Khảo sát đã hết hạn</h3>
            <p style={{ margin:"4px 0 0", fontSize:12, color:"#64748b", maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{survey?.title}</p>
          </div>
        </div>

        <div style={{ padding:"16px 24px 20px" }}>
          <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", marginBottom:20 }}>
            <p style={{ margin:0, fontSize:13, color:"#dc2626", fontWeight:600 }}>
              Khảo sát này đã hết hạn và không thể nhận phản hồi mới.
            </p>
            {survey?.end_at && (
              <p style={{ margin:"6px 0 0", fontSize:12, color:"#ef4444" }}>
                Ngày kết thúc cũ: {new Date(survey.end_at).toLocaleDateString("vi-VN", { day:"2-digit", month:"long", year:"numeric" })}
              </p>
            )}
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#0f172a", marginBottom:6 }}>Ngày kết thúc mới</label>
            <input
              type="datetime-local"
              value={newDate}
              onChange={e => { setNewDate(e.target.value); setError(""); }}
              min={new Date().toISOString().slice(0, 16)}
              style={{
                width:"100%", padding:"10px 14px", borderRadius:10,
                border:`1.5px solid ${error ? "#fecaca" : "#e8ecf2"}`,
                background:"#fff", fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"#0f172a",
                outline:"none",
              }}
            />
            {error && <p style={{ margin:"6px 0 0", fontSize:12, color:"#ef4444" }}>{error}</p>}
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:"10px 16px", borderRadius:10, border:"1.5px solid #e8ecf2", background:"#fff", color:"#64748b", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Đóng
            </button>
            <button
              onClick={handleExtend}
              disabled={submitting}
              style={{
                flex:1, padding:"10px 16px", borderRadius:10,
                background: submitting ? "#94a3b8" : "linear-gradient(135deg,#f59e0b,#fbbf24)",
                border:"none", color:"#fff", fontSize:14, fontWeight:700,
                cursor: submitting ? "not-allowed" : "pointer", fontFamily:"'DM Sans',sans-serif",
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
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
const MY_SURVEYS_PREVIEW=5;

export default function SurveysLayout() {
  const navigate=useNavigate();
  const { pathname } = useLocation();
  const isMySurveysRoute = pathname.startsWith(ROUTERS.USER.MY_SURVEYS);
  const {
    mySurveys, publicSurveys:providerPublicSurveys, loading:myLoading,
    fetchMySurveys, updateSurvey, deleteSurvey,
    closeSurvey, publishSurvey, shareLink, inviteSurvey,
    fetchPublicSurveys, bulkInviteSurvey, getParticipants, deleteParticipant,
    invitedSurveys, fetchInvitedSurveys,
  }=useSurvey();
  const { getAllMyResponses }=useResponse();

  const [mySearch,setMySearch]=useState("");
  const [showCreateForm,setShowCreateForm]=useState(false);
  const [myExpanded,setMyExpanded]=useState(false);
  const [doneSurveyIds,setDoneSurveyIds]=useState(new Set());
  const [publicLoading,setPublicLoading]=useState(true);
  const [publicError,setPublicError]=useState(null);
  const [modalSurvey,setModalSurvey]=useState(null);
  const [publicSearch,setPublicSearch]=useState("");
  const [activeTab,setActiveTab]=useState("all");
  const [sortBy,setSortBy]=useState("newest");
  const [viewMode,setViewMode]=useState("grid");
  const [showFilter,setShowFilter]=useState(false);
  const [globalSearch,setGlobalSearch]=useState("");
  const [shareModal,setShareModal]=useState({open:false,surveyId:null,surveyTitle:"",shareUrl:"",loading:false,error:""});
  const [extendModal,setExtendModal]=useState({open:false,survey:null});

  const fetchAllData = useCallback(async () => {
    try {
      setPublicLoading(true);
      setPublicError(null);
      const [pubResult, respResult] = await Promise.allSettled([
        fetchPublicSurveys(),
        getAllMyResponses().catch(() => null),
      ]);
      const resp = respResult.status === "fulfilled" ? respResult.value : null;
      const ids = new Set((resp?.data ?? resp ?? []).map(r => r.survey_id ?? r.surveyId));
      setDoneSurveyIds(ids);
    } catch {
      setPublicError("Không thể tải danh sách khảo sát.");
    } finally {
      setPublicLoading(false);
    }
  }, []);

  useEffect(() => { fetchMySurveys(1, 20); fetchInvitedSurveys(1, 20); fetchAllData(); }, []);

  const handleGlobalSearch=v=>{setGlobalSearch(v);setMySearch(v);setPublicSearch(v);};

  const handleShareLayout=useCallback((surveyId)=>{
    const s=mySurveys.find(x=>x.id===surveyId);
    setShareModal({open:true,surveyId,surveyTitle:s?.title||"",shareUrl:"",loading:false,error:""});
  },[mySurveys]);

  const handleGenerateLink=async()=>{
    setShareModal(p=>({...p,loading:true,error:""}));
    try{
      const result=await shareLink(shareModal.surveyId);
      const url=typeof result==="string"?result:result?.url??result?.data?.url??"";
      setShareModal(p=>({...p,shareUrl:url,loading:false}));
    }catch{setShareModal(p=>({...p,loading:false,error:"Tạo link thất bại. Vui lòng thử lại."}));}
  };

  const handleCloseLayout=useCallback(async(surveyId)=>{
    try{await closeSurvey(surveyId);setDoneSurveyIds(prev=>{const n=new Set(prev);n.add(surveyId);return n;});await fetchMySurveys(1,20);}
    catch(err){console.error("Lock error:",err);}
  },[closeSurvey,fetchMySurveys]);

  const handleExtendLayout=useCallback(async(surveyId,new_end_at)=>{
    try{await updateSurvey(surveyId,{end_at:new_end_at});await fetchMySurveys(1,20);}
    catch(err){console.error("Extend error:",err);}
  },[updateSurvey,fetchMySurveys]);

  const handleSaveEditLayout=useCallback(async(surveyId,formData)=>{
    try{
      await updateSurvey(surveyId, formData);
      await fetchMySurveys(1,20);
    }catch(err){console.error("Edit error:",err);}
  },[updateSurvey,fetchMySurveys]);

  const myFiltered=mySurveys.filter(s=>s.title?.toLowerCase().includes(mySearch.toLowerCase()));
  const publicSurveys=providerPublicSurveys;

  const displayed=useMemo(()=>{
    let list=[...publicSurveys];
    if(activeTab==="pending") list=list.filter(s=>!doneSurveyIds.has(s.id));
    if(activeTab==="done")    list=list.filter(s=>doneSurveyIds.has(s.id));
    if(publicSearch.trim()){const q=publicSearch.toLowerCase();list=list.filter(s=>s.title?.toLowerCase().includes(q)||s.description?.toLowerCase().includes(q));}
    if(sortBy==="newest") list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    if(sortBy==="oldest") list.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    if(sortBy==="name")   list.sort((a,b)=>(a.title??"").localeCompare(b.title??""));
    return list;
  },[publicSurveys,doneSurveyIds,activeTab,publicSearch,sortBy]);

  const totalCount=publicSurveys.length;
  const doneCount=publicSurveys.filter(s=>doneSurveyIds.has(s.id)).length;
  const pendingCount=publicSurveys.filter(s=>!doneSurveyIds.has(s.id)).length;
  const visibleMySurveys=(myExpanded||showCreateForm)?myFiltered:myFiltered.slice(0,MY_SURVEYS_PREVIEW);
  const hasMoreMySurveys=myFiltered.length>MY_SURVEYS_PREVIEW;

  const PUBLIC_TABS=[
    {key:"all",label:"Tất cả",count:totalCount},
    {key:"pending",label:"Chưa làm",count:pendingCount},
    {key:"done",label:"Đã hoàn thành",count:doneCount},
  ];

  return (
    <main style={{minHeight:"100vh",background:"transparent",fontFamily:C.font,overflowX:"hidden",position:"relative"}}>
      <AnimatedSurveyBackdrop/>

      <div style={{position:"relative",zIndex:1,maxWidth:1260,margin:"0 auto",padding:"12px 18px 52px"}}>

        {/* Hero — shimmer + bóng, không transform 3D (tránh che click) */}
        <div style={{
          display:"flex",flexWrap:"wrap",alignItems:"stretch",justifyContent:"space-between",
          gap:24,marginBottom:32,
        }}>
          <div style={{flex:"1 1 300px",animation:"slideInUp 0.72s ease-out both"}}>
            <div style={{
              position:"relative",padding:"28px 30px 30px",borderRadius:28,overflow:"hidden",
              background:"linear-gradient(148deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.48) 55%, rgba(238,242,255,0.65) 100%)",
              backdropFilter:"blur(26px)",WebkitBackdropFilter:"blur(26px)",
              border:"1px solid rgba(255,255,255,0.82)",
              boxShadow:"0 2px 0 rgba(255,255,255,0.95) inset, 0 24px 56px rgba(15,23,42,0.08), 0 48px 90px rgba(79,70,229,0.1)",
            }}>
              <div aria-hidden style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:28}}>
                <div style={{
                  position:"absolute",top:"-60%",left:"-30%",width:"55%",height:"220%",
                  background:"linear-gradient(118deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.15) 58%, transparent 100%)",
                  animation:"shimmerSweep 7s ease-in-out infinite",
                  transform:"rotate(-18deg)",
                  willChange:"transform",
                }}/>
              </div>
              <div style={{
                position:"absolute",top:8,right:12,width:88,height:88,borderRadius:22,
                background:"linear-gradient(135deg, rgba(129,140,248,0.45), rgba(244,114,182,0.25))",
                opacity:0.85,transform:"rotate(-16deg)",pointerEvents:"none",filter:"blur(1px)",
                animation:"floatAccent 10s ease-in-out infinite",
              }}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{
                    width:38,height:38,borderRadius:13,
                    background:"linear-gradient(135deg,#6366f1,#a855f7)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    boxShadow:"0 10px 26px rgba(99,102,241,0.5)",
                  }}><Rocket size={18} color="#fff" strokeWidth={1.9}/></div>
                  <span style={{fontSize:11,fontWeight:800,letterSpacing:"0.18em",color:"#4f46e5",textTransform:"uppercase"}}>Không gian khảo sát</span>
                </div>
                <h1 style={{
                  margin:0,fontSize:"clamp(1.6rem, 3.8vw, 2.35rem)",fontWeight:900,lineHeight:1.1,fontFamily:C.font,
                  background:"linear-gradient(102deg, #0f172a 0%, #4338ca 38%, #7c3aed 62%, #db2777 100%)",
                  backgroundSize:"180% 180%",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                  animation:"titleAurora 14s ease-in-out infinite alternate",
                  textShadow:"0 2px 40px rgba(79,70,229,0.15)",
                }}>Không gian khảo sát 3D</h1>
                <p style={{margin:"12px 0 0",fontSize:13,color:C.textSub,maxWidth:440,lineHeight:1.55}}>
                  Tìm nhanh, tạo mới và tham gia khảo sát công khai — thẻ nổi, kính mờ và ánh sáng mềm.
                </p>
                <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:16}}>
                  <span style={{padding:"6px 13px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(99,102,241,0.12)",color:"#4338ca",border:"1px solid rgba(99,102,241,0.28)"}}>{mySurveys.length} của tôi</span>
                  <span style={{padding:"6px 13px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(16,185,129,0.12)",color:"#047857",border:"1px solid rgba(16,185,129,0.24)"}}>{totalCount} công khai</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{
            flex:"1 1 260px",display:"flex",flexDirection:"column",justifyContent:"center",gap:12,
            animation:"slideInUp 0.78s 0.08s ease-out both",
          }}>
            <div style={{
              height:52,borderRadius:999,
              background:"linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.72))",
              backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",
              border:"1px solid rgba(255,255,255,0.88)",
              boxShadow:"0 2px 0 rgba(255,255,255,0.98) inset, 0 16px 40px rgba(15,23,42,0.08)",
              display:"flex",alignItems:"center",gap:12,padding:"0 20px",
              transition:"box-shadow .22s, transform .22s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 2px 0 rgba(255,255,255,1) inset, 0 20px 48px rgba(79,70,229,0.15)";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 0 rgba(255,255,255,0.98) inset, 0 16px 40px rgba(15,23,42,0.08)";e.currentTarget.style.transform="translateY(0)";}}
            >
              <Search size={17} color={C.primary}/>
              <input placeholder="Tìm nhanh toàn trang..." style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,fontFamily:C.font,color:C.text}} value={globalSearch} onChange={e=>handleGlobalSearch(e.target.value)}/>
              {globalSearch&&<button type="button" onClick={()=>handleGlobalSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,display:"flex",padding:0}}><X size={14}/></button>}
            </div>
            <p style={{margin:0,fontSize:11,color:C.textDim,paddingLeft:6,lineHeight:1.4}}>Đồng bộ ô tìm với Khảo sát của tôi và khảo sát công khai</p>
          </div>
        </div>

        <StatsStrip mySurveys={mySurveys.length} total={totalCount} done={doneCount} pending={pendingCount} loading={myLoading||publicLoading}/>

        {/* ── MY SURVEYS SECTION ── */}
        <section style={{marginBottom:40}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <h2 style={{fontSize:16,fontWeight:800,color:C.text,margin:0,fontFamily:C.font}}>Khảo sát của tôi</h2>
              <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:999,background:"rgba(67,97,238,0.12)",color:C.primary,border:`1px solid rgba(67,97,238,0.25)`,fontFamily:C.font}}>{myFiltered.length}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{height:34,borderRadius:10,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",border:`1px solid rgba(0,0,0,0.08)`,display:"flex",alignItems:"center",gap:7,padding:"0 10px",minWidth:160}}>
                <Search size={12} color={C.textSub}/>
                <input value={mySearch} onChange={e=>setMySearch(e.target.value)} placeholder="Tìm..." style={{flex:1,border:"none",outline:"none",fontSize:12,fontFamily:C.font,color:C.text,background:"transparent",width:100}}/>
                {mySearch&&<button onClick={()=>setMySearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,display:"flex",padding:0}}><X size={11}/></button>}
              </div>
              <button onClick={()=>{setShowCreateForm(v=>!v);if(!showCreateForm)setMyExpanded(true);}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,border:showCreateForm?`1px solid rgba(0,0,0,0.1)`:"none",background:showCreateForm?"rgba(255,255,255,0.7)":"linear-gradient(135deg,#4361ee,#6c7ef7)",color:showCreateForm?C.textSub:"#fff",cursor:"pointer",fontWeight:700,fontFamily:C.font,fontSize:12,boxShadow:showCreateForm?"none":"0 4px 14px rgba(67,97,238,0.35)",transition:"all .15s",whiteSpace:"nowrap"}}>
                {showCreateForm?<X size={13}/>:<Plus size={13}/>}{showCreateForm?"Huỷ":"Tạo mới"}
              </button>
            </div>
          </div>

          {myLoading?(
            <div style={{display:"flex",justifyContent:"center",padding:"48px 0"}}>
              <div style={{position:"relative",width:48,height:48}}>
                <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid rgba(67,97,238,0.15)`}}/>
                <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"2px solid transparent",borderTopColor:C.primary,animation:"spin .7s linear infinite"}}/>
              </div>
            </div>
          ):(
            <>
              {showCreateForm&&<div style={{marginBottom:16}}><CreateSurveyComposer onCancel={()=>setShowCreateForm(false)} onSuccess={()=>{setShowCreateForm(false);setMyExpanded(true);}}/></div>}
              {myFiltered.length===0?(
                <GlassCard style={{textAlign:"center",padding:"48px 20px"}}>
                  <Inbox size={40} color={C.textDim} style={{marginBottom:12}}/>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:C.font}}>{mySearch?`Không tìm thấy "${mySearch}"`:"Chưa có survey nào"}</div>
                  <div style={{fontSize:12,color:C.textSub,marginTop:4,fontFamily:C.font}}>{mySearch?"Thử từ khoá khác":"Hãy tạo survey đầu tiên"}</div>
                </GlassCard>
              ):(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:18}}>
                    {visibleMySurveys.map((survey,index)=>(
                      <SurveyCardHome
                        key={survey.id}
                        survey={survey}
                        index={index}
                        onClick={() => navigate(`/user/my-surveys/${survey.id}/studio`)}
                        type="my"
                        onShare={handleShareLayout}
                        onLock={handleCloseLayout}
                        onViewAnalytics={(id) => navigate(`/user/my-surveys/${id}/studio?tab=analyze`)}
                        onExpiredClick={(s) => setExtendModal({ open: true, survey: s })}
                        onSaveEdit={handleSaveEditLayout}
                      />
                    ))}
                  </div>
                  {hasMoreMySurveys&&!showCreateForm&&(
                    <div style={{display:"flex",justifyContent:"center",marginTop:18}}>
                      <button onClick={()=>setMyExpanded(v=>!v)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 22px",borderRadius:999,border:`1px solid rgba(0,0,0,0.08)`,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",color:C.textSub,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:C.font,transition:"all .15s",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primaryBorder;e.currentTarget.style.color=C.primary;e.currentTarget.style.background="rgba(67,97,238,0.08)";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,0,0,0.08)";e.currentTarget.style.color=C.textSub;e.currentTarget.style.background="rgba(255,255,255,0.7)";}}
                      >
                        {myExpanded?<><ChevronUp size={13}/> Thu gọn</>:<><ChevronDown size={13}/> Xem thêm {myFiltered.length-MY_SURVEYS_PREVIEW} survey</>}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* ── INVITED SURVEYS SECTION ── */}
        {invitedSurveys.length > 0 && (
          <section style={{marginBottom:40}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <h2 style={{fontSize:16,fontWeight:800,color:C.text,margin:0,fontFamily:C.font}}>Khảo sát được mời</h2>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:999,background:"rgba(245,158,11,0.12)",color:C.warning,border:"1px solid rgba(245,158,11,0.25)",fontFamily:C.font}}>{invitedSurveys.length}</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,280px))",gap:14}}>
              {invitedSurveys.map((survey,index)=>{
                const isDone = doneSurveyIds.has(survey.id);
                const isExpired = survey.end_at && new Date(survey.end_at) < new Date();
                const computedStatus = isExpired ? "EXPIRED" : (survey.status || "ACTIVE");
                return (
                  <SurveyCardHome
                    key={survey.id}
                    survey={{ ...survey, status: computedStatus }}
                    index={index}
                    overrideStatus={isDone ? "COMPLETED" : null}
                    onClick={() => isDone ? navigate(`/user/survey/${survey.id}/response`) : navigate(`/user/survey/${survey.id}`)}
                    type="public"
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Divider */}
        {!isMySurveysRoute && (
        <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:32}}>
          <div style={{flex:1,height:2,borderRadius:2,background:"linear-gradient(to right,transparent,rgba(99,102,241,0.2),rgba(99,102,241,0.08))"}}/>
          <div style={{
            display:"flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:999,
            background:"linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.65))",
            backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.85)",
            boxShadow:"0 8px 24px rgba(79,70,229,0.1)",
          }}>
            <Globe size={13} color={C.primary}/>
            <span style={{fontSize:10,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:"0.14em",whiteSpace:"nowrap",fontFamily:C.font}}>Khảo sát công khai</span>
          </div>
          <div style={{flex:1,height:2,borderRadius:2,background:"linear-gradient(to left,transparent,rgba(99,102,241,0.2),rgba(99,102,241,0.08))"}}/>
        </div>
        )}

        {/* ── PUBLIC SURVEYS SECTION ── */}
        {!isMySurveysRoute && (
          <section>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <h2 style={{fontSize:16,fontWeight:800,color:C.text,margin:0,fontFamily:C.font}}>Khảo Sát</h2>
              {!publicLoading&&<span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:999,background:"rgba(16,185,129,0.12)",color:C.success,border:"1px solid rgba(16,185,129,0.25)",fontFamily:C.font}}>{totalCount}</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {/* Tabs */}
              <div style={{display:"flex",alignItems:"center",gap:2,background:"rgba(255,255,255,0.6)",backdropFilter:"blur(8px)",padding:3,borderRadius:11,border:`1px solid rgba(0,0,0,0.07)`}}>
                {PUBLIC_TABS.map(tab=>{
                  const isActive=activeTab===tab.key;
                  return (
                    <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:C.font,transition:"all .12s",background:isActive?"rgba(255,255,255,0.9)":"transparent",color:isActive?C.primary:C.textSub,boxShadow:isActive?"0 2px 8px rgba(0,0,0,0.08)":"none"}}>
                      {tab.label}
                      {!publicLoading&&<span style={{padding:"1px 6px",borderRadius:999,fontSize:10,background:isActive?"rgba(67,97,238,0.1)":"transparent",color:isActive?C.primary:C.textDim,fontFamily:C.font}}>{tab.count}</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={()=>setShowFilter(v=>!v)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:9,border:`1px solid ${showFilter?C.primaryBorder:"rgba(0,0,0,0.08)"}`,background:showFilter?"rgba(67,97,238,0.1)":"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",color:showFilter?C.primary:C.textSub,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:C.font}}>
                <SlidersHorizontal size={12}/> Lọc
              </button>
              <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",borderRadius:9,border:`1px solid rgba(0,0,0,0.08)`,overflow:"hidden"}}>
                <button onClick={()=>setViewMode("grid")} style={{padding:"6px 10px",border:"none",cursor:"pointer",background:viewMode==="grid"?"rgba(67,97,238,0.1)":"transparent",color:viewMode==="grid"?C.primary:C.textSub,transition:"all .1s"}}><LayoutGrid size={13}/></button>
                <div style={{width:1,background:"rgba(0,0,0,0.06)",height:16}}/>
                <button onClick={()=>setViewMode("list")} style={{padding:"6px 10px",border:"none",cursor:"pointer",background:viewMode==="list"?"rgba(67,97,238,0.1)":"transparent",color:viewMode==="list"?C.primary:C.textSub,transition:"all .1s"}}><List size={13}/></button>
              </div>
              <button onClick={fetchAllData} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:9,border:`1px solid rgba(0,0,0,0.08)`,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",color:C.textSub,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:C.font,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.color=C.primary;e.currentTarget.style.borderColor=C.primaryBorder;}}
                onMouseLeave={e=>{e.currentTarget.style.color=C.textSub;e.currentTarget.style.borderColor="rgba(0,0,0,0.08)";}}
              ><RefreshCw size={12}/></button>
            </div>
          {/* Search & Filter */}
            <div style={{maxWidth:380,height:38,borderRadius:11,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",border:`1px solid rgba(0,0,0,0.08)`,display:"flex",alignItems:"center",gap:8,padding:"0 12px"}}>
              <Search size={13} color={C.textSub}/>
              <input value={publicSearch} onChange={e=>setPublicSearch(e.target.value)} placeholder="Tìm khảo sát..." style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:12,fontFamily:C.font,color:C.text}}/>
              {publicSearch&&<button onClick={()=>setPublicSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,display:"flex",padding:0}}><X size={12}/></button>}
            </div>
          </div>

          {showFilter&&(
            <GlassCard style={{padding:16,marginBottom:16}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:14,alignItems:"flex-end"}}>
                <div>
                  <p style={{fontSize:10,fontWeight:700,color:C.textSub,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:C.font}}>Sắp xếp theo</p>
                  <div style={{display:"flex",gap:5}}>
                    {[{key:"newest",label:"Mới nhất"},{key:"oldest",label:"Cũ nhất"},{key:"name",label:"Tên A-Z"}].map(item=>(
                      <button key={item.key} onClick={()=>setSortBy(item.key)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${sortBy===item.key?C.primaryBorder:"rgba(0,0,0,0.08)"}`,background:sortBy===item.key?"rgba(67,97,238,0.1)":"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",color:sortBy===item.key?C.primary:C.textSub,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:C.font}}>{item.label}</button>
                    ))}
                  </div>
                </div>
                <button onClick={()=>{setPublicSearch("");setSortBy("newest");setActiveTab("all");setShowFilter(false);}} style={{marginLeft:"auto",padding:"6px 12px",borderRadius:8,border:`1px solid rgba(0,0,0,0.08)`,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",color:C.textSub,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:C.font}}>Đặt lại</button>
              </div>
            </GlassCard>
          )}

          {modalSurvey&&<SubmissionModal surveyId={modalSurvey.id} surveyTitle={modalSurvey.title} onClose={()=>setModalSurvey(null)}/>}

          {publicLoading&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,280px))",gap:14}}>
              {Array(6).fill(0).map((_,i)=><PublicCardSkeleton key={i}/>)}
            </div>
          )}
          {!publicLoading&&publicError&&(
            <GlassCard style={{textAlign:"center",padding:"48px 20px"}}>
              <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
              <div style={{fontSize:13,fontFamily:C.font,color:C.textSub}}>{publicError}</div>
              <button onClick={fetchAllData} style={{marginTop:12,color:C.primary,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontSize:13,fontFamily:C.font}}>Thử lại</button>
            </GlassCard>
          )}
          {!publicLoading&&!publicError&&displayed.length===0&&(
            <GlassCard style={{textAlign:"center",padding:"48px 20px"}}>
              <Inbox size={40} color={C.textDim} style={{marginBottom:12}}/>
              <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:C.font}}>{publicSearch?`Không tìm thấy "${publicSearch}"`:"Không có khảo sát nào"}</div>
              <div style={{fontSize:12,color:C.textSub,marginTop:4,fontFamily:C.font}}>{publicSearch?"Thử từ khoá khác":"Chưa có dữ liệu"}</div>
            </GlassCard>
          )}
          {!publicLoading&&!publicError&&displayed.length>0&&(
            <>
              <div style={{marginBottom:14,fontSize:11,color:C.textSub,fontFamily:C.font}}>
                {displayed.length} khảo sát{publicSearch?` · "${publicSearch}"`:""}
                {doneCount>0&&<span style={{marginLeft:8,color:C.success,fontWeight:600}}>· {doneCount} đã hoàn thành</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:18}}>
                {displayed.map((survey,i)=>(
                  <SurveyCardHome
                    key={survey.id}
                    survey={survey}
                    index={i}
                    overrideStatus={doneSurveyIds.has(survey.id) ? "COMPLETED" : null}
                    onClick={() => doneSurveyIds.has(survey.id) ? navigate(`/user/survey/${survey.id}/response`) : navigate(`/user/survey/${survey.id}`)}
                    type="public"
                  />
                ))}
              </div>
            </>
          )}
        </section>
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
        onExtend={handleExtendLayout}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
        @keyframes slideInUp{from{opacity:0;transform:translateY(40px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:.7;}50%{opacity:1;}}
        @keyframes shimmerSweep{0%{transform:rotate(-18deg) translateX(-55%);}100%{transform:rotate(-18deg) translateX(155%);}}
        @keyframes floatAccent{0%,100%{transform:rotate(-16deg) translate(0,0);}50%{transform:rotate(-12deg) translate(-6px,8px);}}
        @keyframes titleAurora{0%{background-position:0% 50%;}100%{background-position:100% 50%;}}
        *{box-sizing:border-box;}
        button{font-family:'DM Sans',sans-serif;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:999px;}
      `}</style>
    </main>
  );
}
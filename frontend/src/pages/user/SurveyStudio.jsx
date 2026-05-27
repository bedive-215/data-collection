// ─── SurveyStudio.jsx ─── SurveyMonkey-style studio page ──
// Flow: click card → SurveyStudio → 3 tabs: Design / Send / Analyze
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Plus, Trash2, Pencil, Check, GripVertical, PlusCircle,
  Image, ChevronLeft, ChevronRight, ChevronDown, Copy,
  ExternalLink, Link as LinkIcon, CheckCircle2, Users,
  Share2, Mail, UserPlus, Lock, Globe, PowerOff, RefreshCw,
  Search, X, FileText, Loader, Eye, EyeOff, Trash,
  Send, LayoutTemplate, BarChart3, Loader2,
} from "lucide-react";
import MySurveyQuestionsPage from "@/pages/user/MySurveyQuestionsPage";
import UserAnalyticsPage from "@/pages/user/AnalyticsPage";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import { useSurvey } from "@/providers/SurveyProvider";

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════════════════════ */
const C = {
  bg:          "linear-gradient(165deg, #eef2ff 0%, #f8fafc 42%, #e0f2fe 78%, #fdf4ff 100%)",
  surface:     "rgba(255,255,255,0.82)",
  surfaceHigh: "rgba(255,255,255,0.95)",
  glassBorder: "rgba(255,255,255,0.55)",
  border:      "rgba(99,102,241,0.1)",
  borderMed:   "rgba(0,0,0,0.1)",
  primary:     "#4f46e5",
  primaryLight:"rgba(79,70,229,0.12)",
  primaryGrad: "linear-gradient(135deg,#4361ee,#6c7ef7)",
  text:        "#0f172a",
  textSub:     "#64748b",
  textDim:     "#94a3b8",
  error:       "#ef4444",
  errorBg:     "rgba(239,68,68,0.1)",
  errorBorder: "rgba(239,68,68,0.25)",
  success:     "#10b981",
  successBg:   "rgba(16,185,129,0.1)",
  successBorder:"rgba(16,185,129,0.25)",
  warning:     "#f59e0b",
  warningBg:   "rgba(245,158,11,0.1)",
  warningBorder:"rgba(245,158,11,0.25)",
  font:        "'DM Sans','Inter',sans-serif",
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
   HELPERS
════════════════════════════════════════════════════════════════ */
function getTypeLabel(type) {
  const map = {
    TEXT:"Văn bản ngắn", PARAGRAPH:"Đoạn văn", EMAIL:"Email",
    DATE:"Ngày", NUMBER:"Số", RATING:"Xếp hạng",
    SINGLE_CHOICE:"Một lựa chọn", MULTIPLE_CHOICE:"Nhiều lựa chọn",
    DROPDOWN:"Menu thả xuống", LINEAR_SCALE:"Phạm vi tuyến tính",
    TIME:"Giờ", FILE_UPLOAD:"Tải tệp lên",
  };
  return map[type] || type;
}

function getTypeColor(type) {
  const map = {
    TEXT:"#4f6ef7", PARAGRAPH:"#7c3aed", EMAIL:"#0891b2",
    DATE:"#b45309", NUMBER:"#059669", RATING:"#d97706",
    SINGLE_CHOICE:"#ea580c", MULTIPLE_CHOICE:"#16a34a",
    DROPDOWN:"#6d28d9", LINEAR_SCALE:"#7c3aed",
    TIME:"#0891b2",
  };
  const c = map[type] || "#6b7280";
  return { color: c, bg: `${c}18`, border: `${c}40` };
}

function STATUS_MAP(status) {
  const m = {
    ACTIVE:   { label:"Đang mở",  color:"#059669", bg:"rgba(16,185,129,0.15)" },
    DRAFT:    { label:"Nháp",      color:C.textSub, bg:"rgba(107,114,128,0.12)" },
    EXPIRED:  { label:"Hết hạn",   color:"#dc2626", bg:"rgba(239,68,68,0.12)" },
    SCHEDULED:{ label:"Lên lịch",  color:"#d97706", bg:"rgba(245,158,11,0.12)" },
    CLOSED:   { label:"Đã đóng",   color:"#6b7280", bg:"rgba(107,114,128,0.12)" },
  };
  return m[status] || m.DRAFT;
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
        background:"rgba(255,255,255,0.95)",
        backdropFilter:"blur(24px)", borderRadius:24,
        border:`1px solid ${C.glassBorder}`,
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
        <div style={{padding:"20px", maxHeight:"70vh", overflowY:"auto"}}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARE LINK MODAL
════════════════════════════════════════════════════════════════ */
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) { setShareUrl(null); setCopied(false); setError(""); setLoading(false); }
  }, [open]);

  const handleGenerate = async () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    try {
      const result = await onShare(survey.id);
      const url = typeof result === "string" ? result : result?.url ?? result?.data?.url ?? null;
      if (url) setShareUrl(url); else setError("Không lấy được link.");
    } catch { setError("Tạo link thất bại."); }
    finally { setLoading(false); }
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
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{padding:"14px 16px",background:"rgba(67,97,238,0.08)",borderRadius:14,border:`1px solid rgba(67,97,238,0.2)`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.font}}>{survey?.title}</div>
          <div style={{fontSize:12,color:C.textSub,marginTop:2,fontFamily:C.font}}>Tạo link để chia sẻ survey với mọi người</div>
        </div>
        {error && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,background:C.errorBg,border:`1px solid ${C.errorBorder}`}}>
            <span style={{fontSize:12,color:C.error,fontFamily:C.font}}>{error}</span>
            <button onClick={handleGenerate} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.errorBorder}`,background:"rgba(255,255,255,0.8)",color:C.error,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:C.font}}>Thử lại</button>
          </div>
        )}
        {shareUrl ? (
          <div style={{display:"flex",flexDirection:"column",gap:10,animation:"slideUp .2s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"rgba(255,255,255,0.6)",borderRadius:12,border:`1px solid rgba(67,97,238,0.2)`,backdropFilter:"blur(8px)"}}>
              <LinkIcon size={13} color={C.primary} style={{flexShrink:0}}/>
              <span style={{flex:1,fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"monospace"}}>{shareUrl}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleCopy} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:11,border:`1px solid ${copied ? C.successBorder : "rgba(67,97,238,0.3)"}`,background:copied ? C.successBg : "rgba(67,97,238,0.08)",color:copied ? C.success : C.primary,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:C.font,transition:"all .2s"}}>
                {copied ? <><CheckCircle2 size={13}/> Đã sao chép!</> : <><Copy size={13}/> Sao chép link</>}
              </button>
              <button onClick={() => window.open(shareUrl,"_blank")} style={{width:42,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:11,border:`1px solid rgba(0,0,0,0.08)`,background:"transparent",color:C.textSub,cursor:"pointer"}}>
                <ExternalLink size={14}/>
              </button>
            </div>
          </div>
        ) : (
          <button onClick={handleGenerate} disabled={loading} style={{
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 0",
            borderRadius:12,border:"none",
            background:loading ? "rgba(0,0,0,0.06)" : C.primaryGrad,
            color:"#fff",fontSize:13,fontWeight:700,
            cursor:loading?"not-allowed":"pointer",fontFamily:C.font,
            boxShadow:loading?"none":"0 4px 14px rgba(67,97,238,0.35)",
          }}>
            {loading ? <><Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> Đang tạo link...</> : <><LinkIcon size={15}/> Tạo link chia sẻ</>}
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
    {value:"respondent",label:"Trả lời",desc:"Chỉ trả lời",icon:"📋"},
    {value:"viewer",label:"Xem",desc:"Chỉ xem",icon:"👁️"},
    {value:"editor",label:"Chỉnh sửa",desc:"Xem & chỉnh sửa",icon:"✏️"},
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
  const sharedCancelBtn={padding:"9px 16px",borderRadius:10,border:`1px solid rgba(0,0,0,0.1)`,background:"transparent",color:C.textSub,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:C.font};
  const sharedPrimaryBtn=(disabled=false)=>({display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,border:"none",background:disabled?"rgba(0,0,0,0.05)":C.primaryGrad,color:disabled?C.textSub:"#fff",fontSize:12,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:C.font,boxShadow:disabled?"none":"0 4px 14px rgba(67,97,238,0.35)",transition:"all .2s"});
  return (
    <Modal open={open} onClose={onClose} title="Mời người tham gia" width={500}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {success&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:C.successBg,border:`1px solid ${C.successBorder}`}}>
          <CheckCircle2 size={14} color={C.success}/>
          <span style={{fontSize:12,fontWeight:600,color:"#059669",fontFamily:C.font}}>Đã gửi lời mời đến {sentCount} địa chỉ email.</span>
        </div>}
        <form onSubmit={handleSubmit}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:C.textSub,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:7,display:"block",fontFamily:C.font}}>Vai trò</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:8}}>
                {ROLES.map(r=>(
                  <button key={r.value} type="button" onClick={()=>setRole(r.value)} style={{padding:"10px 8px",borderRadius:12,border:`1.5px solid ${role===r.value?C.primary:"rgba(0,0,0,0.08)"}`,background:role===r.value?"rgba(67,97,238,0.1)":"rgba(255,255,255,0.6)",cursor:"pointer",textAlign:"center",transition:"all .15s",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{fontSize:16,lineHeight:1}}>{r.icon}</div>
                    <div style={{fontSize:12,fontWeight:700,color:role===r.value?C.primary:C.text,fontFamily:C.font}}>{r.label}</div>
                    <div style={{fontSize:10,color:C.textSub,fontFamily:C.font}}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <label style={{fontSize:11,fontWeight:700,color:C.textSub,letterSpacing:"0.05em",textTransform:"uppercase",fontFamily:C.font}}>Địa chỉ email</label>
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
                {loading?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> Đang gửi...</>:<><Mail size={13}/> Gửi lời mời</>}
              </button>
            </div>
          </div>
        </form>
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
  },[survey?.id,onGetParticipants]);

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
    <Modal open={open} onClose={onClose} title="Quản lý người tham gia" width={560}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:"rgba(67,97,238,0.08)",border:`1px solid rgba(67,97,238,0.2)`}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(67,97,238,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Users size={16} color={C.primary}/>
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1,fontFamily:C.font}}>{count}</div>
              <div style={{fontSize:11,color:C.textSub,marginTop:2,fontFamily:C.font}}>Tổng participants</div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{padding:"0 14px",borderRadius:12,border:"1px solid rgba(0,0,0,0.08)",background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:C.textSub,flexShrink:0,fontFamily:C.font}}>
            <RefreshCw size={13} style={loading ? {animation:"spin 1s linear infinite"} : {}}/>Tải lại
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
                  {p.role&&<span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:999,flexShrink:0,color:roleStyle.color,background:roleStyle.bg,border:`1px solid ${roleStyle.border}`,fontFamily:C.font}}>{p.role}</span>}
                  {isConfirming?(
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      <button onClick={()=>setConfirmPid(null)} style={{padding:"4px 9px",borderRadius:7,fontSize:11,fontWeight:600,border:`1px solid rgba(0,0,0,0.1)`,background:"rgba(255,255,255,0.8)",color:C.textSub,cursor:"pointer",fontFamily:C.font}}>Huỷ</button>
                      <button onClick={()=>handleDelete(deleteKey)} disabled={isDeleting} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:7,fontSize:11,fontWeight:700,border:"none",background:isDeleting?"rgba(0,0,0,0.05)":C.error,color:isDeleting?C.textSub:"#fff",cursor:isDeleting?"not-allowed":"pointer",fontFamily:C.font}}>
                        {isDeleting?<Loader2 size={10} style={{animation:"spin 1s linear infinite"}}/>:<Trash size={10}/>} Xoá
                      </button>
                    </div>
                  ):(
                    <button onClick={()=>setConfirmPid(deleteKey)} style={{width:28,height:28,borderRadius:8,flexShrink:0,border:`1px solid rgba(0,0,0,0.08)`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.errorBorder;e.currentTarget.style.color=C.error;e.currentTarget.style.background=C.errorBg;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,0,0,0.08)";e.currentTarget.style.color=C.textDim;e.currentTarget.style.background="transparent";}}
                    ><Trash size={12}/></button>
                  )}
                </div>
              );
            })
          )}
        </div>
        {!loading&&!error&&filtered.length>0&&search&&<div style={{fontSize:11,color:C.textSub,textAlign:"center",fontFamily:C.font}}>Hiển thị {filtered.length} / {participants.length} người</div>}
        <div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={onClose} style={{padding:"9px 16px",borderRadius:10,border:`1px solid rgba(0,0,0,0.1)`,background:"transparent",color:C.textSub,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:C.font}}>Đóng</button></div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB BAR
════════════════════════════════════════════════════════════════ */
function SendPanel({ survey, onShare, onInvite, onPublish, onCloseSurvey, onBulkInvite, onGetParticipants, onDeleteParticipant }) {
  const [shareOpen,setShareOpen]=useState(false);
  const [inviteOpen,setInviteOpen]=useState(false);
  const [participantsOpen,setParticipantsOpen]=useState(false);
  const isPublished = survey?.is_published;
  const isClosed = survey?.status==="CLOSED";

  const cardStyle = (hover=true, delay=0) => ({
    background:"rgba(255,255,255,0.9)",backdropFilter:"blur(20px)",
    border:"1px solid rgba(255,255,255,0.6)",borderRadius:20,
    padding:"24px",boxShadow:"0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 32px rgba(15,23,42,0.06)",
    animation:`slideUp .4s ease ${delay}s both`,
    transition:hover?"all .2s ease":"none",
    cursor:hover?"pointer":"default",
  });

  const ActionCard = ({icon:Icon,title,desc,sub,onClick,color=C.primary,delay=0}) => (
    <div onClick={onClick} onMouseEnter={e=>{if(hover){e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(99,102,241,0.14)";e.currentTarget.style.borderColor=`${color}50`;}}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 32px rgba(15,23,42,0.06)";e.currentTarget.style.borderColor="rgba(255,255,255,0.6)";}} style={cardStyle(true,delay)}>
      <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
        <div style={{width:48,height:48,borderRadius:14,background:`${color}18`,border:`1px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon size={22} color={color}/>
        </div>
        <div style={{flex:1}}>
          <h3 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 4px",fontFamily:C.font}}>{title}</h3>
          <p style={{fontSize:12,color:C.textSub,margin:0,lineHeight:1.5,fontFamily:C.font}}>{desc}</p>
          {sub&&<span style={{display:"inline-block",marginTop:8,padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:`${color}15`,color,border:`1px solid ${color}30`,fontFamily:C.font}}>{sub}</span>}
        </div>
      </div>
    </div>
  );

  const hover = true;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,padding:"0 0 40px"}}>
      <ActionCard icon={Share2} title="Chia sẻ link" desc="Tạo link công khai để chia sẻ khảo sát với bất kỳ ai" sub={isPublished?"Đang hoạt động":"Chưa công khai"} onClick={()=>setShareOpen(true)} color={isPublished?"#10b981":C.primary} delay={0}/>
      <ActionCard icon={Mail} title="Mời qua email" desc="Gửi lời mời khảo sát trực tiếp đến email của người tham gia" onClick={()=>setInviteOpen(true)} color="#7c3aed" delay={0.05}/>
      <ActionCard icon={Users} title="Quản lý người tham gia" desc="Xem danh sách những người đã được mời tham gia khảo sát này" onClick={()=>setParticipantsOpen(true)} color="#0891b2" delay={0.1}/>
      <div style={{display:"flex",gap:16}}>
        <div onClick={()=>onPublish&&onPublish(survey.id,{is_published:!isPublished})} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(99,102,241,0.14)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 32px rgba(15,23,42,0.06)";}} style={{...cardStyle(true,0.15),flex:1,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:isPublished?"rgba(245,158,11,0.15)":"rgba(16,185,129,0.15)",border:`1px solid ${isPublished?"rgba(245,158,11,0.3)":"rgba(16,185,129,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {isPublished?<Lock size={18} color="#d97706"/>:<Globe size={18} color="#059669"/>}
            </div>
            <div>
              <h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0,fontFamily:C.font}}>{isPublished?"Ẩn survey":"Công khai survey"}</h3>
              <p style={{fontSize:11,color:C.textSub,margin:0,fontFamily:C.font}}>{isPublished?"Không ai khác có thể trả lời":"Mọi người đều có thể trả lời"}</p>
            </div>
          </div>
        </div>
        {!isClosed&&<div onClick={()=>onCloseSurvey&&onCloseSurvey(survey.id)} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(239,68,68,0.12)";e.currentTarget.style.borderColor=C.errorBorder;}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 32px rgba(15,23,42,0.06)";e.currentTarget.style.borderColor="rgba(255,255,255,0.6)";}} style={{...cardStyle(true,0.2),flex:1,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:C.errorBg,border:`1px solid ${C.errorBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <PowerOff size={18} color={C.error}/>
            </div>
            <div>
              <h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0,fontFamily:C.font}}>Đóng survey</h3>
              <p style={{fontSize:11,color:C.textSub,margin:0,fontFamily:C.font}}>Ngừng nhận câu trả lời</p>
            </div>
          </div>
        </div>}
      </div>
      <ShareLinkModal open={shareOpen} onClose={()=>setShareOpen(false)} survey={survey} onShare={onShare}/>
      <InviteModal open={inviteOpen} onClose={()=>setInviteOpen(false)} survey={survey} onInvite={onInvite}/>
      <ParticipantsModal open={participantsOpen} onClose={()=>setParticipantsOpen(false)} survey={survey} onGetParticipants={onGetParticipants} onDeleteParticipant={onDeleteParticipant}/>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB BAR
════════════════════════════════════════════════════════════════ */
const TABS_CONFIG = [
  { id:"design", label:"Thiết kế", icon:LayoutTemplate },
  { id:"send",   label:"Gửi khảo sát", icon:Send },
  { id:"analyze",label:"Phân tích", icon:BarChart3 },
];

function TabBar({ active, onChange }) {
  const tabStyle = {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(24px) saturate(190%)",
    WebkitBackdropFilter: "blur(24px) saturate(190%)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: 18,
    boxShadow: "0 2px 0 rgba(255,255,255,0.9) inset, 0 4px 20px rgba(15,23,42,0.04)",
    display: "flex", gap: 5, padding: 5,
  };
  return (
    <div style={tabStyle}>
      {TABS_CONFIG.map(tab=>{
        const Icon = tab.icon;
        const is = active===tab.id;
        return (
          <button key={tab.id} onClick={()=>onChange(tab.id)} style={{
            display:"flex",alignItems:"center",gap:8,padding:"10px 18px",
            borderRadius:12,border:"none",cursor:"pointer",
            fontSize:13,fontWeight:is?700:500,
            fontFamily:C.font,transition:"all .2s ease",
            background:is?"linear-gradient(135deg,#6366f1,#7c5df7)":"transparent",
            color:is?"#fff":C.textSub,
            boxShadow:is?"0 4px 14px rgba(99,102,241,0.35)":"none",
          }}>
            <Icon size={15}/>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SURVEY STUDIO — MAIN PAGE
════════════════════════════════════════════════════════════════ */
export default function SurveyStudio() {
  const { surveyId } = useParams();
  const { fetchSurveyById, currentSurvey, publishSurvey, shareLink, inviteSurvey, closeSurvey, bulkInviteSurvey, getParticipants, deleteParticipant } = useSurvey();

  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["design", "send", "analyze"];
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "design"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId) return;
    setLoading(true);
    fetchSurveyById(surveyId).finally(() => setLoading(false));
  }, [surveyId]);

  const thumbGrad = C.thumbGrads[0];
  const survey = currentSurvey;
  const statusInfo = STATUS_MAP(survey?.status);

  return (
    <main style={{minHeight:"100vh",background:"transparent",fontFamily:C.font,position:"relative",overflowX:"hidden"}}>
      <AnimatedSurveyBackdrop/>

      {/* ── STUDIO HEADER ── */}
      <div style={{
        borderBottom:"1px solid rgba(99,102,241,0.1)",
        boxShadow:"0 1px 3px rgba(15,23,42,0.04)",
      }}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"14px 20px",display:"flex",alignItems:"center",gap:20}}>
          {!loading&&(
            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              <div style={{width:34,height:34,borderRadius:10,background:thumbGrad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <FileText size={14} color="rgba(255,255,255,0.9)" strokeWidth={1.5}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <h1 style={{fontSize:13,fontWeight:800,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:220,fontFamily:C.font}}>{survey?.title||"Khảo sát"}</h1>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,color:statusInfo.color,background:statusInfo.bg,flexShrink:0,fontFamily:C.font}}>{statusInfo.label}</span>
              </div>
            </div>
          )}
          {loading&&(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:34,height:34,borderRadius:10,background:"rgba(0,0,0,0.06)"}}/>
              <div style={{width:120,height:12,borderRadius:6,background:"rgba(0,0,0,0.06)"}}/>
            </div>
          )}
          <div style={{width:1,height:28,background:"rgba(0,0,0,0.08)",flexShrink:0}}/>
          <TabBar active={activeTab} onChange={setActiveTab}/>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{maxWidth:1200,margin:"20px auto 60px",padding:"0 20px"}}>
        {/* Loading */}
        {loading&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:16}}>
            <Loader2 size={32} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>
            <span style={{fontSize:13,color:C.textSub,fontFamily:C.font}}>Đang tải khảo sát...</span>
          </div>
        )}

        {/* Design tab → MySurveyQuestionsPage */}
        {!loading&&activeTab==="design"&&(
          <MySurveyQuestionsPage />
        )}

        {/* Send tab */}
        {!loading&&activeTab==="send"&&(
          <SendPanel
            survey={survey}
            onShare={shareLink}
            onInvite={inviteSurvey}
            onPublish={publishSurvey}
            onCloseSurvey={closeSurvey}
            onBulkInvite={bulkInviteSurvey}
            onGetParticipants={getParticipants}
            onDeleteParticipant={deleteParticipant}
          />
        )}

        {/* Analyze tab → UserAnalyticsPage */}
        {!loading&&activeTab==="analyze"&&(
          <UserAnalyticsPage />
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:999px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,0.15);}
      `}</style>
    </main>
  );
}

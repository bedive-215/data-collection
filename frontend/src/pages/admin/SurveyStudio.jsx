// ─── AdminSurveyStudio.jsx ─── Admin version of SurveyStudio ───
// 3 tabs: Design (QuestionPage) / Send (share, invite, publish) / Analyze (AnalyticsPage)
// Dark theme, embedded sub-pages, no layout shell (used inside AdminLayout)
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Send, LayoutTemplate, BarChart3, Loader2,
  Share2, Mail, Users, Lock, Globe, PowerOff, RefreshCw,
  Search, X, FileText, ExternalLink, Link as LinkIcon,
  CheckCircle2, Copy, Eye, Trash, UserPlus, ChevronDown} from "lucide-react";
import QuestionPage from "@/pages/admin/QuestionPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import surveyService from "@/services/surveyService";
import { toast } from "react-toastify";

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS — aligned with Admin Design System v2
════════════════════════════════════════════════════════════════ */
const C = {
  bg:          "#0F1117",
  bgSecondary: "#141620",
  surface:     "#1A1D2E",
  surfaceHigh: "#222638",
  glassBorder: "rgba(42,45,62,0.7)",
  border:      "#2A2D3E",
  borderHover: "#3A3D50",
  primary:     "#F59E0B",
  primaryHover:"#D97706",
  primaryGrad: "linear-gradient(135deg,#F59E0B,#D97706)",
  primaryLight:"rgba(245,158,11,0.12)",
  primaryDim:  "rgba(245,158,11,0.08)",
  text:        "#F9FAFB",
  textSub:     "#9CA3AF",
  textDim:     "#4B5563",
  error:       "#EF4444",
  errorBg:     "rgba(239,68,68,0.10)",
  errorBorder: "rgba(239,68,68,0.20)",
  success:     "#10B981",
  successBg:   "rgba(16,185,129,0.10)",
  successBorder:"rgba(16,185,129,0.20)",
  warning:     "#F59E0B",
  warningBg:   "rgba(245,158,11,0.10)",
  font:        "'Plus Jakarta Sans',sans-serif"};

/* ════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════ */
function STATUS_MAP(status) {
  const m = {
    ACTIVE:    { label:"Đang mở",  color:"#10b981", bg:"rgba(16,185,129,0.15)" },
    DRAFT:     { label:"Nháp",      color:C.textSub, bg:"rgba(107,114,128,0.12)" },
    EXPIRED:   { label:"Hết hạn",   color:"#ef4444", bg:"rgba(239,68,68,0.12)" },
    SCHEDULED: { label:"Lên lịch",  color:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
    CLOSED:    { label:"Đã đóng",   color:"#6b7280", bg:"rgba(107,114,128,0.12)" }};
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
  if (!open || typeof document === "undefined") return null;
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:10050,
      background:"rgba(0,0,0,0.65)", backdropFilter:"blur(10px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.surfaceHigh, border:`1px solid ${C.glassBorder}`,
        borderRadius:20,
        width:"100%", maxWidth:width, overflow:"hidden"}}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px", borderBottom:`1px solid ${C.border}`}}>
          <h3 style={{margin:0, fontSize:15, fontWeight:800, color:C.text, fontFamily:C.font}}>{title}</h3>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`,
            background:"transparent", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:C.textSub}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.errorBg;e.currentTarget.style.borderColor=C.errorBorder;e.currentTarget.style.color=C.error;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSub;}}
          ><X size={13}/></button>
        </div>
        <div style={{padding:"20px", maxHeight:"70vh", overflowY:"auto"}}>{children}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARE LINK MODAL
════════════════════════════════════════════════════════════════ */
function ShareLinkModal({ open, onClose, survey }) {
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
      const res = await surveyService.shareSurveyLink(survey.id);
      const data = res?.data ?? res;
      const accessToken = data?.access_token ?? data?.accessToken ?? data?.survey?.access_token;
      const base = window.location.origin;
      const url = accessToken
        ? `${base}/user/surveys/${survey.id}?access_token=${accessToken}`
        : `${base}/user/surveys/${survey.id}`;
      setShareUrl(url);
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

  const cardStyle = {
    background: C.surface, border:`1px solid ${C.border}`,
    borderRadius:16, padding:"18px"};

  return (
    <Modal open={open} onClose={onClose} title="Chia sẻ khảo sát" width={500}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{...cardStyle, borderColor:"rgba(108,126,247,0.2)", background: C.primaryDim}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.font}}>{survey?.title}</div>
          <div style={{fontSize:12,color:C.textSub,marginTop:2,fontFamily:C.font}}>Tạo link để chia sẻ survey với mọi người</div>
        </div>
        {error && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,background:C.errorBg,border:`1px solid ${C.errorBorder}`}}>
            <span style={{fontSize:12,color:C.error,fontFamily:C.font}}>{error}</span>
            <button onClick={handleGenerate} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.errorBorder}`,background:"transparent",color:C.error,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:C.font}}>Thử lại</button>
          </div>
        )}
        {shareUrl ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background: C.surface,borderRadius:12,border:`1px solid ${C.primaryDim}`}}>
              <LinkIcon size={13} color={C.primary} style={{flexShrink:0}}/>
              <span style={{flex:1,fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"monospace"}}>{shareUrl}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleCopy} style={{
                flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",
                borderRadius:11,border:`1px solid ${copied ? C.successBorder : C.primaryDim}`,
                background:copied ? C.successBg : "transparent",
                color:copied ? C.success : C.primary,fontSize:12,fontWeight:700,cursor:"pointer",
                fontFamily:C.font}}>
                {copied ? <><CheckCircle2 size={13}/> Đã sao chép!</> : <><Copy size={13}/> Sao chép link</>}
              </button>
              <button onClick={() => window.open(shareUrl,"_blank")} style={{
                width:42,display:"flex",alignItems:"center",justifyContent:"center",
                borderRadius:11,border:`1px solid ${C.border}`,background:"transparent",color:C.textSub,cursor:"pointer"}}>
                <ExternalLink size={14}/>
              </button>
            </div>
          </div>
        ) : (
          <button onClick={handleGenerate} disabled={loading} style={{
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 0",
            borderRadius:12,border:"none",
            background:loading ? "rgba(255,255,255,0.05)" : C.primaryGrad,
            color:"#fff",fontSize:13,fontWeight:700,
            cursor:loading?"not-allowed":"pointer",fontFamily:C.font}}>
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
function InviteModal({ open, onClose, survey }) {
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
    try{
      await Promise.all(list.map(email=>surveyService.inviteSurvey(survey.id,{email,role})));
      setSentCount(list.length);setSuccess(true);setEmails("");
    }
    catch{setError("Mời không thành công.");}
    finally{setLoading(false);}
  };

  const sharedCancelBtn={padding:"9px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.textSub,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:C.font};

  return (
    <Modal open={open} onClose={onClose} title="Mời người tham gia" width={500}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {success&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:C.successBg,border:`1px solid ${C.successBorder}`}}>
          <CheckCircle2 size={14} color={C.success}/>
          <span style={{fontSize:12,fontWeight:600,color:C.success,fontFamily:C.font}}>Đã gửi lời mời đến {sentCount} địa chỉ email.</span>
        </div>}
        <form onSubmit={handleSubmit}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textSub,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7,fontFamily:C.font}}>Vai trò</label>
              <div style={{display:"flex",gap:8}}>
                {ROLES.map(r=>(
                  <button key={r.value} type="button" onClick={()=>setRole(r.value)} style={{flex:1,padding:"9px 10px",borderRadius:11,border:`1.5px solid ${role===r.value?C.primary:C.border}`,background:role===r.value?C.primaryLight:"rgba(255,255,255,0.05)",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:12,fontWeight:700,color:role===r.value?C.primary:C.text,fontFamily:C.font}}>{r.label}</div>
                    <div style={{fontSize:10,color:C.textSub,marginTop:2,fontFamily:C.font}}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <label style={{fontSize:11,fontWeight:700,color:C.textSub,letterSpacing:"0.05em",textTransform:"uppercase",fontFamily:C.font}}>Địa chỉ email</label>
            <textarea rows={4} value={emails} onChange={e=>{setEmails(e.target.value);setError("");}}
              placeholder={"example@email.com\nuser2@email.com"}
              style={{
                width:"100%",boxSizing:"border-box",padding:"10px 12px",
                background:C.surface,border:`1.5px solid ${error?C.error:C.border}`,
                borderRadius:11,color:C.text,fontSize:13,fontFamily:C.font,
                outline:"none",resize:"vertical",lineHeight:1.7}}
              onFocus={e=>{e.target.style.borderColor=C.primary;}}
              onBlur={e=>{e.target.style.borderColor=error?C.error:C.border;}}
            />
            {error&&<div style={{fontSize:12,color:C.error,fontFamily:C.font}}>{error}</div>}
            <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:4}}>
              <button type="button" onClick={onClose} style={sharedCancelBtn}>Đóng</button>
              <button type="submit" disabled={loading} style={{
                display:"flex",alignItems:"center",gap:6,padding:"9px 18px",
                borderRadius:10,border:"none",
                background:loading?"rgba(255,255,255,0.05)":C.primaryGrad,
                color:"#fff",fontSize:12,fontWeight:700,
                cursor:loading?"not-allowed":"pointer",fontFamily:C.font}}>
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
function ParticipantsModal({ open, onClose, survey }) {
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
    try{
      const res=await surveyService.getParticipants(survey.id,{});
      const raw = res?.data ?? res;
      setParticipants(raw?.participants??[]);
      setCount(raw?.count??0);
    }
    catch{setError("Không thể tải danh sách.");}
    finally{setLoading(false);}
  },[survey?.id]);

  useEffect(()=>{ if(open){load();setSearch("");setConfirmPid(null);setError("");}else{setParticipants([]);setCount(0);} },[open,load]);

  const handleDelete=async pid=>{
    setDeleting(pid);
    try{
      await surveyService.deleteParticipant(survey.id,pid);
      setParticipants(p=>p.filter(x=>x.participant_id!==pid));
      setCount(c=>Math.max(0,c-1));
      setConfirmPid(null);
    }
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

  const AV=[{bg:"#1e293b",color:"#94a3b8"},{bg:"#1a2e1a",color:"#4ade80"},{bg:"#2e1a2e",color:"#f472b6"},{bg:"#2e2a1a",color:"#facc15"},{bg:"#1a1a2e",color:"#a78bfa"}];
  const ROLE_STYLE={
    viewer:{color:"#60a5fa",bg:"rgba(96,165,250,0.1)",border:"rgba(96,165,250,0.2)"},
    respondent:{color:"#4ade80",bg:"rgba(74,222,128,0.1)",border:"rgba(74,222,128,0.2)"},
    editor:{color:"#c084fc",bg:"rgba(192,132,252,0.1)",border:"rgba(192,132,252,0.2)"}};
  const getRoleStyle=role=>ROLE_STYLE[role?.toLowerCase()]??{color:C.primary,bg:C.primaryDim,border:C.primaryDim};

  return (
    <Modal open={open} onClose={onClose} title="Quản lý người tham gia" width={560}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:C.primaryDim,border:`1px solid rgba(108,126,247,0.2)`}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Users size={16} color={C.primary}/>
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1,fontFamily:C.font}}>{count}</div>
              <div style={{fontSize:11,color:C.textSub,marginTop:2,fontFamily:C.font}}>Tổng participants</div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{
            padding:"0 14px",borderRadius:12,border:`1px solid ${C.border}`,
            background:"transparent",cursor:loading?"not-allowed":"pointer",
            display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:C.textSub,
            flexShrink:0,fontFamily:C.font}}>
            <RefreshCw size={13} style={loading ? {animation:"spin 1s linear infinite"} : {}}/>Tải lại
          </button>
        </div>

        {error&&!loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,background:C.errorBg,border:`1px solid ${C.errorBorder}`}}>
          <span style={{fontSize:12,color:C.error,fontFamily:C.font}}>{error}</span>
          <button onClick={load} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.errorBorder}`,background:"transparent",color:C.error,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:C.font}}>Thử lại</button>
        </div>}

        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10}}>
          <Search size={13} color={C.textDim}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên, email hoặc vai trò..."
            style={{flex:1,border:"none",outline:"none",fontSize:12,fontFamily:C.font,color:C.text,background:"transparent"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,display:"flex",padding:0}}><X size={12}/></button>}
        </div>

        <div style={{border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",maxHeight:340,overflowY:"auto",background:C.surface}}>
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
                <div key={p.participant_id??p.id??i} style={{
                  display:"flex",alignItems:"center",gap:11,padding:"11px 14px",
                  borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",
                  background:isConfirming?C.errorBg:"transparent"}}>
                  <div style={{
                    width:34,height:34,borderRadius:"50%",background:av.bg,color:av.color,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,fontWeight:700,flexShrink:0}}>{getInitials(p.name,p.email)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:C.font}}>{p.name||p.email}</div>
                    {p.name&&<div style={{fontSize:11,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:C.font}}>{p.email}</div>}
                  </div>
                  {p.role&&<span style={{
                    fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:999,flexShrink:0,
                    color:roleStyle.color,background:roleStyle.bg,border:`1px solid ${roleStyle.border}`,fontFamily:C.font}}>{p.role}</span>}
                  {isConfirming?(
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      <button onClick={()=>setConfirmPid(null)} style={{padding:"4px 9px",borderRadius:7,fontSize:11,fontWeight:600,border:`1px solid ${C.border}`,background:"transparent",color:C.textSub,cursor:"pointer",fontFamily:C.font}}>Huỷ</button>
                      <button onClick={()=>handleDelete(deleteKey)} disabled={isDeleting} style={{
                        display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:7,fontSize:11,fontWeight:700,border:"none",
                        background:isDeleting?"rgba(255,255,255,0.05)":C.error,
                        color:isDeleting?C.textSub:"#fff",cursor:isDeleting?"not-allowed":"pointer",fontFamily:C.font}}>
                        {isDeleting?<Loader2 size={10} style={{animation:"spin 1s linear infinite"}}/>:<Trash size={10}/>} Xoá
                      </button>
                    </div>
                  ):(
                    <button onClick={()=>setConfirmPid(deleteKey)} style={{
                      width:28,height:28,borderRadius:8,flexShrink:0,border:`1px solid ${C.border}`,
                      background:"transparent",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:C.textDim}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.errorBorder;e.currentTarget.style.color=C.error;e.currentTarget.style.background=C.errorBg;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textDim;e.currentTarget.style.background="transparent";}}
                    ><Trash size={12}/></button>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.textSub,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:C.font}}>Đóng</button>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   SEND PANEL
════════════════════════════════════════════════════════════════ */
function SendPanel({ survey, onPublish, onCloseSurvey }) {
  const [shareOpen,setShareOpen]=useState(false);
  const [inviteOpen,setInviteOpen]=useState(false);
  const [participantsOpen,setParticipantsOpen]=useState(false);
  const isPublished = survey?.is_published;
  const isClosed = survey?.status==="CLOSED";

  const cardStyle = (hover=true, delay=0) => ({
    background: C.surface, border:`1px solid ${C.glassBorder}`,
    borderRadius:20, padding:"22px",
    transition:hover?"all .2s ease":"none",
    cursor:hover?"pointer":"default"});

  const ActionCard = ({icon:Icon,title,desc,sub,onClick,color=C.primary,delay=0}) => (
    <div onClick={onClick} style={cardStyle(true,delay)}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)"e.currentTarget.style.borderColor=`${color}50`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"e.currentTarget.style.borderColor=C.glassBorder;}}
    >
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

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,padding:"0 0 40px"}}>
      <ActionCard icon={Share2} title="Chia sẻ link" desc="Tạo link công khai để chia sẻ khảo sát với bất kỳ ai" sub={isPublished?"Đang hoạt động":"Chưa công khai"} onClick={()=>setShareOpen(true)} color={isPublished?"#10b981":C.primary} delay={0}/>
      <ActionCard icon={Mail} title="Mời qua email" desc="Gửi lời mời khảo sát trực tiếp đến email của người tham gia" onClick={()=>setInviteOpen(true)} color="#a78bfa" delay={0.05}/>
      <ActionCard icon={Users} title="Quản lý người tham gia" desc="Xem danh sách những người đã được mời tham gia khảo sát này" onClick={()=>setParticipantsOpen(true)} color="#0891b2" delay={0.1}/>

      <div style={{display:"flex",gap:16}}>
        <div onClick={()=>onPublish&&onPublish(survey.id,{is_published:!isPublished})}
          style={{...cardStyle(true,0.15),flex:1,cursor:"pointer"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)"}}
          onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"}}
        >
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:isPublished?"rgba(245,158,11,0.15)":"rgba(16,185,129,0.15)",border:`1px solid ${isPublished?"rgba(245,158,11,0.3)":"rgba(16,185,129,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {isPublished?<Lock size={18} color="#d97706"/>:<Globe size={18} color="#10b981"/>}
            </div>
            <div>
              <h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0,fontFamily:C.font}}>{isPublished?"Ẩn survey":"Công khai survey"}</h3>
              <p style={{fontSize:11,color:C.textSub,margin:0,fontFamily:C.font}}>{isPublished?"Không ai khác có thể trả lời":"Mọi người đều có thể trả lời"}</p>
            </div>
          </div>
        </div>

        {!isClosed&&<div onClick={()=>onCloseSurvey&&onCloseSurvey(survey.id)}
          style={{...cardStyle(true,0.2),flex:1,cursor:"pointer"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)"e.currentTarget.style.borderColor=C.errorBorder;}}
          onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"e.currentTarget.style.borderColor=C.glassBorder;}}
        >
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

      <ShareLinkModal open={shareOpen} onClose={()=>setShareOpen(false)} survey={survey}/>
      <InviteModal open={inviteOpen} onClose={()=>setInviteOpen(false)} survey={survey}/>
      <ParticipantsModal open={participantsOpen} onClose={()=>setParticipantsOpen(false)} survey={survey}/>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB BAR
════════════════════════════════════════════════════════════════ */
const TABS_CONFIG = [
  { id:"design",  label:"Thiết kế",       icon:LayoutTemplate },
  { id:"send",    label:"Gửi khảo sát",  icon:Send },
  { id:"analyze", label:"Phân tích",      icon:BarChart3 },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:6,
      background:"rgba(255,255,255,0.04)",border:`1px solid ${C.glassBorder}`,
      borderRadius:16, padding:5}}>
      {TABS_CONFIG.map(tab=>{
        const Icon = tab.icon;
        const is = active===tab.id;
        return (
          <button key={tab.id} onClick={()=>onChange(tab.id)} style={{
            display:"flex",alignItems:"center",gap:7,padding:"9px 18px",
            borderRadius:12,border:"none",cursor:"pointer",
            fontSize:13,fontWeight:is?700:500,
            fontFamily:C.font,
            background:is?C.primaryGrad:"transparent",
            color:is?"#fff":C.textSub}}>
            <Icon size={15}/>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN SURVEY STUDIO — MAIN PAGE
════════════════════════════════════════════════════════════════ */
export default function AdminSurveyStudio() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return ["design", "send", "analyze"].includes(tab) ? tab : "design";
  });

  useEffect(() => {
    if (!surveyId) return;
    setLoading(true);
    surveyService.getSurveyById(surveyId)
      .then(res => {
        const body = res?.data;
        const s = body?.data ?? body?.survey ?? (body?.id != null ? body : null);
        setSurvey(s);
      })
      .catch(() => toast.error("Không tải được thông tin khảo sát"))
      .finally(() => setLoading(false));
  }, [surveyId]);

  const handlePublish = async (id, payload) => {
    try {
      await surveyService.publishSurvey(id, payload);
      setSurvey(prev => ({ ...prev, ...payload }));
      toast.success(payload.is_published ? "Đã công khai khảo sát" : "Đã ẩn khảo sát");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleClose = async (id) => {
    try {
      await surveyService.closeSurvey(id);
      setSurvey(prev => ({ ...prev, status: "CLOSED" }));
      toast.success("Đã đóng khảo sát");
    } catch (err) {
      toast.error(err.response?.data?.message || "Đóng thất bại");
    }
  };

  const statusInfo = STATUS_MAP(survey?.status);

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.font,position:"relative"}}>
      {/* Background */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        background:"radial-gradient(ellipse 80% 50% at 20% 20%, rgba(99,102,241,0.06) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168,85,247,0.04) 0%, transparent 50%)"}}/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize:"48px 48px"}}/>

      {/* ── STUDIO HEADER ── */}
      <div style={{
        position:"sticky",top:0,zIndex:100,
        background:"rgba(8,12,26,0.92)",backdropFilter:"blur(24px) saturate(180%)",
        WebkitBackdropFilter:"blur(24px) saturate(180%)",
        borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",gap:16}}>
          {/* Back */}
          <button onClick={()=>navigate("/admin/surveys")} style={{
            display:"flex",alignItems:"center",justifyContent:"center",width:40,height:40,
            borderRadius:12,border:`1px solid ${C.border}`,background:C.surface,
            cursor:"pointer",flexShrink:0,
            color:C.textSub}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.primaryDim;e.currentTarget.style.borderColor=C.primaryDim;e.currentTarget.style.color=C.primary;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSub;}}
          >
            <ArrowLeft size={16}/>
          </button>

          {/* Survey info */}
          <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
            <div style={{width:40,height:40,borderRadius:12,background:C.primaryGrad,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <FileText size={18} color="rgba(255,255,255,0.9)"/>
            </div>
            <div style={{minWidth:0,flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <h1 style={{fontSize:15,fontWeight:800,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:C.font}}>
                  {loading?"...":survey?.title||"Khảo sát"}
                </h1>
                {!loading&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,color:statusInfo.color,background:statusInfo.bg,flexShrink:0,fontFamily:C.font}}>{statusInfo.label}</span>}
              </div>
              {!loading&&survey?.description&&<p style={{fontSize:11,color:C.textSub,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:C.font}}>{survey.description}</p>}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{flexShrink:0}}>
            <TabBar active={activeTab} onChange={setActiveTab}/>
          </div>
        </div>
        <div style={{height:1,background:`linear-gradient(to right,transparent,rgba(99,102,241,0.15),rgba(99,102,241,0.15),transparent)`}}/>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 24px 60px",position:"relative",zIndex:1}}>
        {loading&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:16}}>
            <Loader2 size={32} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>
            <span style={{fontSize:13,color:C.textSub,fontFamily:C.font}}>Đang tải khảo sát...</span>
          </div>
        )}

        {/* Design tab */}
        {!loading&&activeTab==="design"&&(
          <div style={{background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <QuestionPage surveyId={surveyId} embedded />
          </div>
        )}

        {/* Send tab */}
        {!loading&&activeTab==="send"&&(
          <SendPanel
            survey={survey}
            onPublish={handlePublish}
            onCloseSurvey={handleClose}
          />
        )}

        {/* Analyze tab */}
        {!loading&&activeTab==="analyze"&&(
          <AnalyticsPage surveyId={surveyId} embedded />
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg);}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:999px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.12);}
      `}</style>
    </div>
  );
}

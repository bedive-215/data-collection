// ─── InvitedSurveyPage.jsx ─── Role-aware page for invited participants ──
// respondent → inline survey form
// viewer    → questions read-only
// editor    → auto-redirects to SurveyStudio
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSurvey } from "@/providers/SurveyProvider";
import { useResponse } from "@/providers/ResponseProvider";
import { useQuestion } from "@/providers/QuestionProvider";
import { useOption } from "@/providers/OptionProvider";
import {
  FileText, Eye, Loader2, CheckCircle2, ChevronLeft,
  ChevronRight, Home, Send, CircleDot, CheckSquare,
  Star, Clock, Calendar, ChevronDown} from "lucide-react";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";

/* ── Design tokens ──────────────────────────────────────────── */
const C = {
  primary: "#4f46e5",
  primaryLight: "rgba(79,70,229,0.12)",
  primaryGrad: "linear-gradient(135deg,#4361ee,#6c7ef7)",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  success: "#10b981",
  successBg: "rgba(16,185,129,0.1)",
  successBorder: "rgba(16,185,129,0.25)",
  error: "#ef4444",
  warning: "#f59e0b",
  font: "'DM Sans','Inter',sans-serif"};

/* ── Type config ────────────────────────────────────────────── */
const TYPE_CONFIG = {
  TEXT:            { label: "Văn bản ngắn",   Icon: FileText,  color: "#4f6ef7", bg: "#eef2ff", border: "#c7d2fe" },
  PARAGRAPH:       { label: "Đoạn văn",        Icon: FileText,   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  EMAIL:           { label: "Email",            Icon: FileText,   color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  DATE:            { label: "Ngày tháng",        Icon: Calendar,   color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  NUMBER:          { label: "Số",               Icon: FileText,   color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  RATING:          { label: "Xếp hạng",        Icon: Star,       color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  SINGLE_CHOICE:    { label: "Một lựa chọn",    Icon: CircleDot,  color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  MULTIPLE_CHOICE:  { label: "Nhiều lựa chọn",  Icon: CheckSquare, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  DROPDOWN:        { label: "Danh sách thả",    Icon: ChevronDown, color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  LINEAR_SCALE:     { label: "Phạm vi tuyến tính", Icon: FileText, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  TIME:            { label: "Giờ",              Icon: Clock,      color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" }};

/* ── SuccessScreen (respondent) ─────────────────────────────── */
function SuccessScreen({ onGoHome, thankYouMessage }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",fontFamily:C.font }}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#d1fae5,#a7f3d0)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24}}>
        <CheckCircle2 size={40} color="#16a34a"/>
      </div>
      <h2 style={{fontSize:24,fontWeight:800,color:C.text,margin:"0 0 12px"}}>Gửi thành công!</h2>
      <p style={{fontSize:14,color:C.textSub,margin:"0 0 32px",maxWidth:400,textAlign:"center",lineHeight:1.7}}>
        {thankYouMessage || "Câu trả lời của bạn đã được ghi nhận. Cảm ơn bạn đã dành thời gian hoàn thành khảo sát này."}
      </p>
      <button onClick={onGoHome} style={{display:"flex",alignItems:"center",gap:8,padding:"13px 32px",background:C.primaryGrad,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>
        <Home size={16}/>Về trang chủ
      </button>
    </div>
  );
}

/* ── ViewerQuestionCard (read-only) ─────────────────────────── */
function ViewerQuestionCard({ question }) {
  const cfg = TYPE_CONFIG[question.type] ?? TYPE_CONFIG.TEXT;
  const { Icon, label, color, bg, border } = cfg;
  const opts = question.options ?? [];

  const renderChoice = (opt, i) => (
    <div key={opt.id || i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",border:`1.5px solid #e5e7eb`,borderRadius:10,background:"rgba(255,255,255,0.5)",opacity:0.7}}>
      <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid #d1d5db`,flexShrink:0,background:"#f9fafb"}}/>
      {opt.label && <span style={{fontSize:13,color:C.textSub}}>{opt.label}</span>}
    </div>
  );

  return (
    <div style={{background:"rgba(255,255,255,0.85)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.6)",borderRadius:20,padding:"1.75rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:bg,border:`1px solid ${border}`,fontSize:11,fontWeight:700,color}}>
          <Icon size={11}/>{label}
        </span>
        {question.required && <span style={{fontSize:11,color:C.error,fontWeight:700}}>* Bắt buộc</span>}
      </div>
      <h3 style={{fontSize:17,fontWeight:700,color:C.text,lineHeight:1.5,margin:"0 0 14px"}} dangerouslySetInnerHTML={{__html:question.content}} />
      {question.description && <p style={{fontSize:13,color:C.textSub,marginBottom:12,lineHeight:1.6}} dangerouslySetInnerHTML={{__html:question.description}} />}
      {question.media_url && (
        question.media_type === "video"
          ? <video src={question.media_url} controls style={{width:"100%",borderRadius:12,marginBottom:14,maxHeight:280,objectFit:"contain"}}/>
          : <img src={question.media_url} alt="Media" style={{width:"100%",borderRadius:12,marginBottom:14,maxHeight:280,objectFit:"cover"}}/>
      )}
      {["SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN"].includes(question.type) && opts.length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {opts.map((opt,i) => renderChoice(opt,i))}
        </div>
      )}
      {question.type === "TEXT" && (
        <div style={{padding:"12px 14px",background:"rgba(255,255,255,0.6)",border:"1.5px solid #e5e7eb",borderRadius:10,color:C.textDim,fontSize:14}}>
          {question.placeholder || "Câu trả lời ngắn..."}
        </div>
      )}
      {question.type === "PARAGRAPH" && (
        <div style={{padding:"12px 14px",background:"rgba(255,255,255,0.6)",border:"1.5px solid #e5e7eb",borderRadius:10,color:C.textDim,fontSize:14,minHeight:80}}>
          {question.placeholder || "Câu trả lời..."}
        </div>
      )}
      {["DATE","TIME","NUMBER","RATING","LINEAR_SCALE"].includes(question.type) && (
        <div style={{padding:"12px 14px",background:"rgba(255,255,255,0.6)",border:"1.5px solid #e5e7eb",borderRadius:10,color:C.textDim,fontSize:14}}>
          — Nhấn để xem chi tiết —
        </div>
      )}
    </div>
  );
}

/* ── InlineRespondForm ───────────────────────────────────────── */
const inputStyle = {
  width:"100%",padding:"12px 14px",
  border:"1.5px solid #e5e7eb",borderRadius:12,
  fontSize:14,color:"#111827",outline:"none",
  fontFamily:"inherit",boxSizing:"border-box",background:"#fafafa"};

function RatingInput({ settings, value, onChange }) {
  const min = settings?.min ?? 1;
  const max = settings?.max ?? 5;
  const [hovered,setHovered]=useState(null);
  const steps = Array.from({length:max-min+1},(_,i)=>min+i);
  return (
    <div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {steps.map(s=>{
          const active = hovered!==null ? s<=hovered : s<=(value??0);
          return (
            <button key={s} onClick={()=>onChange(s)} onMouseEnter={()=>setHovered(s)} onMouseLeave={()=>setHovered(null)}
              style={{background:"none",border:"none",cursor:"pointer",padding:2,transition:"transform .12s",transform:active?"scale(1.15)":"scale(1)"}}>
              <Star size={32} fill={active?"#f59e0b":"transparent"} color={active?"#f59e0b":"#d1d5db"} strokeWidth={1.5}/>
            </button>
          );
        })}
      </div>
      {value!=null&&<p style={{fontSize:13,color:C.textSub,margin:"8px 0 0"}}>Bạn chọn: <strong style={{color:"#d97706"}}>{value} / {max}</strong></p>}
    </div>
  );
}

function DropdownInput({ options, value, onChange }) {
  const [open,setOpen]=useState(false);
  const selected=options.find(o=>o.id===value);
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(v=>!v)} style={{width:"100%",padding:"13px 16px",border:`1.5px solid ${open?"#6d28d9":"#e5e7eb"}`,borderRadius:12,background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:14,color:selected?"#111827":"#9ca3af",fontWeight:selected?600:400,cursor:"pointer",fontFamily:"inherit"}}>
        <span>{selected?.label||"Chọn một lựa chọn..."}</span>
        <ChevronDown size={16} color="#6b7280" style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}/>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100%+6px)",left:0,right:0,zIndex:50,background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,overflow:"hidden",animation:"fadeUp .15s ease"}}>
          {options.map(opt=>{
            const sel=opt.id===value;
            return (
              <button key={opt.id} onClick={()=>{onChange(opt.id);setOpen(false);}} style={{width:"100%",padding:"12px 16px",textAlign:"left",background:sel?"#f5f3ff":"transparent",border:"none",borderBottom:"1px solid #f3f4f6",fontSize:14,color:sel?"#6d28d9":"#374151",fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit"}}>
                {sel&&<CheckCircle2 size={14} color="#6d28d9" style={{marginRight:8}}/>}{opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function normalizeOption(opt,index=0) {
  return {
    id:opt.id||opt.option_id,
    label:opt.label||opt.content||opt.value||`Lựa chọn ${index+1}`,
    order_index:opt.order_index??index};
}
function resolveOptions(question,optionsMap) {
  const raw=optionsMap?.[question.id];
  let list;
  if(Array.isArray(raw)) list=raw;
  else if(raw?.data) list=raw.data;
  else if(raw?.options) list=raw.options;
  else if(Array.isArray(question.options)) list=question.options;
  else list=[];
  return list.map(normalizeOption).sort((a,b)=>(a.order_index??0)-(b.order_index??0));
}

function RespondQuestionCard({ question, answer, onChange }) {
  const cfg=TYPE_CONFIG[question.type]??TYPE_CONFIG.TEXT;
  const {Icon,label,color,bg,border}=cfg;
  const opts=question.options??[];
  const settings=question.settings??{};
  const placeholder=question.placeholder||"";
  const description=question.description||null;

  const toggleMulti=optId=>{
    const cur=answer instanceof Set?new Set(answer):new Set();
    if(cur.has(optId))cur.delete(optId);else cur.add(optId);
    onChange(question.id,cur);
  };

  return (
    <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.6)",borderRadius:20,padding:"2rem"}}>
      <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:bg,border:`1px solid ${border}`,fontSize:11,fontWeight:700,color,marginBottom:16}}>
        <Icon size={11}/>{label}
        {question.required&&<span style={{color:"#ef4444",marginLeft:2}}>*</span>}
      </span>
      <h2 style={{fontSize:18,fontWeight:700,color:"#111827",lineHeight:1.5,marginBottom:description?"0.5rem":"1.5rem"}} dangerouslySetInnerHTML={{__html:question.content}} />

      {question.type==="TEXT"&&(
        <input type="text" placeholder={placeholder||"Nhập câu trả lời ngắn..."} value={answer??"" }
          onChange={e=>onChange(question.id,e.target.value)} style={inputStyle}
          onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
      )}
      {question.type==="PARAGRAPH"&&(
        <textarea rows={4} placeholder={placeholder||"Nhập đoạn văn..."} value={answer??"" }
          onChange={e=>onChange(question.id,e.target.value)} style={{...inputStyle,resize:"vertical"}}
          onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
      )}
      {question.type==="EMAIL"&&(
        <input type="email" placeholder={placeholder||"example@email.com"} value={answer??"" }
          onChange={e=>onChange(question.id,e.target.value)} style={inputStyle}
          onFocus={e=>e.target.style.borderColor="#0891b2"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
      )}
      {question.type==="DATE"&&(
        <input type="date" value={answer??"" }
          onChange={e=>onChange(question.id,e.target.value)} style={{...inputStyle,width:"auto",minWidth:200}}
          onFocus={e=>e.target.style.borderColor="#b45309"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
      )}
      {question.type==="NUMBER"&&(
        <input type="number" placeholder={settings.min!==undefined&&settings.max!==undefined?`Từ ${settings.min} đến ${settings.max}`:"Nhập số..."}
          value={answer??"" } onChange={e=>onChange(question.id,e.target.value)} style={inputStyle}
          onFocus={e=>e.target.style.borderColor="#059669"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
      )}
      {question.type==="RATING"&&<RatingInput settings={settings} value={answer} onChange={v=>onChange(question.id,v)}/>}
      {question.type==="SINGLE_CHOICE"&&opts.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {opts.map(opt=>{
            const sel=opt.id===answer;
            return (
              <button key={opt.id} onClick={()=>onChange(question.id,opt.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",border:`2px solid ${sel?"#4f46e5":"#e5e7eb"}`,borderRadius:12,background:sel?"#eef2ff":"transparent",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
                <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?"#4f46e5":"#d1d5db"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {sel&&<div style={{width:10,height:10,borderRadius:"50%",background:"#4f46e5"}}/>}
                </div>
                <span style={{fontSize:14,fontWeight:sel?600:400,color:sel?"#3730a3":"#374151"}}>{opt.label||opt.content}</span>
              </button>
            );
          })}
        </div>
      )}
      {question.type==="MULTIPLE_CHOICE"&&opts.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {opts.map(opt=>{
            const sel=answer instanceof Set?answer.has(opt.id):false;
            return (
              <button key={opt.id} onClick={()=>toggleMulti(opt.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",border:`2px solid ${sel?"#16a34a":"#d1d5db"}`,borderRadius:12,background:sel?"#f0fdf4":"transparent",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
                <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${sel?"#16a34a":"#d1d5db"}`,background:sel?"#16a34a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {sel&&<svg width="11"height="9"viewBox="0 0 11 9"fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{fontSize:14,fontWeight:sel?600:400,color:sel?"#14532d":"#374151"}}>{opt.label||opt.content}</span>
              </button>
            );
          })}
        </div>
      )}
      {question.type==="DROPDOWN"&&<DropdownInput options={opts} value={answer} onChange={v=>onChange(question.id,v)}/>}
      {question.type==="LINEAR_SCALE"&&(()=>{
        const min=settings?.min??1;const max=settings?.max??5;
        const steps=Array.from({length:max-min+1},(_,i)=>min+i);
        return (
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
            {steps.map(v=>{
              const sel=answer===v;
              return (
                <button key={v} onClick={()=>onChange(question.id,v)} style={{minWidth:44,padding:"10px 8px",borderRadius:10,border:`2px solid ${sel?"#7c3aed":"#e5e7eb"}`,background:sel?"#f5f3ff":"transparent",color:sel?"#6d28d9":"#374151",fontWeight:sel?700:400,fontSize:15,cursor:"pointer",transition:"all .15s"}}>
                  {v}
                </button>
              );
            })}
          </div>
        );
      })()}
      {question.type==="TIME"&&(
        <input type="time" value={answer??"" } onChange={e=>onChange(question.id,e.target.value)} style={inputStyle}
          onFocus={e=>e.target.style.borderColor="#0891b2"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
      )}
    </div>
  );
}

/* ── Main InvitedSurveyPage ──────────────────────────────────── */
export default function InvitedSurveyPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { currentSurvey, fetchSurveyById, loading: surveyLoading } = useSurvey();
  const { questions, fetchQuestionsBySurvey, loading: qLoading } = useQuestion();
  const { options, fetchOptions } = useOption();
  const { startSurvey, submitSurvey, submitting } = useResponse();

  const [role, setRole] = useState(null);       // "respondent" | "viewer" | "editor"
  const [surveyStatus, setSurveyStatus] = useState(null);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [optionsMap, setOptionsMap] = useState({});
  const [fetchError, setFetchError] = useState("");

  // Load survey and questions
  useEffect(() => {
    if (!surveyId) return;
    setFetchError("");
    fetchSurveyById(surveyId).catch(()=>{});
    fetchQuestionsBySurvey(surveyId).then(list=>{
      if(!Array.isArray(list))return;
      const choice=list.filter(q=>["SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN"].includes(q.type));
      choice.forEach(q=>fetchOptions(q.id,surveyId).then(opts=>{
        setOptionsMap(m=>({...m,[q.id]:opts}));
      }));
    });
  }, [surveyId]);

  // Derive role from backend response
  useEffect(() => {
    if (!currentSurvey) return;
    // currentSurvey.role is set by the SurveyProvider from API response
    const r = currentSurvey.role;
    if (r) setRole(r);
    // Check status
    const now=new Date(), start=currentSurvey.start_at?new Date(currentSurvey.start_at):null, end=currentSurvey.end_at?new Date(currentSurvey.end_at):null;
    if(start&&now<start) setSurveyStatus("not_started");
    else if(end&&now>end) setSurveyStatus("expired");
    else setSurveyStatus("active");
  }, [currentSurvey]);

  // Guard: editors should not reach this page (card click opens modal instead)
  useEffect(() => {
    if (role === "editor") navigate("/user/home");
  }, [role]);

  // Merge options into questions
  const mergedQuestions = [...questions].sort((a,b)=>(a.order_index??0)-(b.order_index??0)).map(q=>({...q,options:resolveOptions(q,optionsMap)}));

  const canProceed = () => {
    if (!current) return false;
    if (!current.required) return true;
    const ans=answers[current.id];
    if(ans===undefined||ans===null) return false;
    if(typeof ans==="string"&&!ans.trim()) return false;
    if(ans instanceof Set&&ans.size===0) return false;
    return true;
  };

  const handleChange=(qId,val)=>setAnswers(p=>({...p,[qId]:val}));

  const buildPayload=()=>{
    const r=[];
    mergedQuestions.forEach(q=>{
      const val=answers[q.id];
      if(["TEXT","PARAGRAPH","EMAIL","TIME"].includes(q.type)){if(typeof val==="string"&&val.trim())r.push({question_id:q.id,answer_text:val.trim()});}
      else if(["NUMBER","RATING","LINEAR_SCALE"].includes(q.type)){if(val!=null)r.push({question_id:q.id,answer_number:Number(val)});}
      else if(["SINGLE_CHOICE","DROPDOWN"].includes(q.type)){if(val)r.push({question_id:q.id,option_id:val});}
      else if(q.type==="MULTIPLE_CHOICE"){const sel=val instanceof Set?[...val]:[];if(sel.length)r.push({question_id:q.id,option_ids:sel});}
      else if(q.type==="DATE"){if(val)r.push({question_id:q.id,answer_text:val});}
    });
    return r;
  };

  const handleSubmit=async()=>{
    if(!canProceed()||submitting)return;
    const payload=buildPayload();
    try{
      await submitSurvey(surveyId, {answers:payload});
      setSubmitted(true);
    }catch{
      // error handled by provider
    }
  };

  const total=mergedQuestions.length;
  const current=mergedQuestions[currentIndex];
  const isFirst=currentIndex===0;
  const isLast=total-1===currentIndex;

  // Loading
  if((surveyLoading||qLoading)&&!currentSurvey){
    return (
      <div style={{minHeight:"100vh",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,fontFamily:C.font}}>
        <Loader2 size={32} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>
        <span style={{fontSize:14,color:C.textSub}}>Đang tải khảo sát...</span>
      </div>
    );
  }

  if(!currentSurvey){
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,fontFamily:C.font}}>
        <FileText size={40} color={C.textDim}/>
        <p style={{fontSize:15,color:C.textSub,margin:0}}>Không tìm thấy khảo sát hoặc bạn không có quyền truy cập.</p>
        <button onClick={()=>navigate("/user/home")} style={{padding:"10px 24px",background:C.primaryGrad,color:"#fff",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer"}}>Về trang chủ</button>
      </div>
    );
  }

  // ── VIEWER → Read-only questions
  if(role==="viewer"){
    return (
      <main style={{minHeight:"100vh",background:"transparent",position:"relative",fontFamily:C.font,padding:"2.5rem 1.5rem",overflowX:"hidden"}}>
        <AnimatedSurveyBackdrop/>
        <div style={{maxWidth:640,margin:"0 auto",position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"2rem"}}>
            <button onClick={()=>navigate(-1)} style={{width:38,height:38,borderRadius:10,border:"1px solid rgba(0,0,0,0.08)",background:"rgba(255,255,255,0.75)",backdropFilter:"blur(8px)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <ChevronLeft size={18}/>
            </button>
            <div>
              <h1 style={{fontSize:17,fontWeight:800,color:C.text,margin:0}}>{currentSurvey.title ? <span dangerouslySetInnerHTML={{__html:currentSurvey.title}}/> : "Khảo sát"}</h1>
              <p style={{fontSize:11,color:C.textSub,margin:"2px 0 0"}}>Chế độ xem câu hỏi</p>
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:999,background:"rgba(67,97,238,0.1)",border:"1px solid rgba(67,97,238,0.2)"}}>
              <Eye size={13} color={C.primary}/>
              <span style={{fontSize:11,fontWeight:700,color:C.primary}}>Chỉ xem</span>
            </div>
          </div>

          {surveyStatus==="not_started"&&(
            <div style={{textAlign:"center",padding:"3rem 2rem",background:"rgba(255,255,255,0.85)",backdropFilter:"blur(16px)",borderRadius:20,border:"1px solid rgba(255,255,255,0.6)"}}>
              <Calendar size={40} color={C.textDim} style={{margin:"0 auto 12px",display:"block"}}/>
              <p style={{fontSize:15,fontWeight:700,color:C.text,margin:"0 0 8px"}}>Khảo sát chưa bắt đầu</p>
              <p style={{fontSize:13,color:C.textSub,margin:0}}>Hãy quay lại sau khi khảo sát bắt đầu.</p>
            </div>
          )}
          {surveyStatus==="expired"&&(
            <div style={{textAlign:"center",padding:"3rem 2rem",background:"rgba(255,255,255,0.85)",backdropFilter:"blur(16px)",borderRadius:20,border:"1px solid rgba(255,255,255,0.6)"}}>
              <FileText size={40} color={C.textDim} style={{margin:"0 auto 12px",display:"block"}}/>
              <p style={{fontSize:15,fontWeight:700,color:C.text,margin:"0 0 8px"}}>Khảo sát đã kết thúc</p>
              <p style={{fontSize:13,color:C.textSub,margin:0}}>Khảo sát này đã đóng. Cảm ơn bạn đã quan tâm.</p>
            </div>
          )}
          {surveyStatus==="active"&&mergedQuestions.length===0&&!qLoading&&(
            <div style={{textAlign:"center",padding:"3rem",background:"rgba(255,255,255,0.82)",backdropFilter:"blur(14px)",borderRadius:20,border:"1px solid rgba(255,255,255,0.55)",color:C.textSub}}>
              <p style={{fontSize:15,margin:0}}>Khảo sát này chưa có câu hỏi nào.</p>
            </div>
          )}
          {surveyStatus==="active"&&mergedQuestions.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {mergedQuestions.map(q=>(
                <ViewerQuestionCard key={q.id} question={q}/>
              ))}
            </div>
          )}
          {surveyStatus==="active"&&mergedQuestions.length>0&&(
            <div style={{marginTop:24,padding:"16px 20px",background:"rgba(255,255,255,0.7)",backdropFilter:"blur(12px)",borderRadius:16,border:"1px solid rgba(255,255,255,0.6)",textAlign:"center"}}>
              <p style={{fontSize:12,color:C.textSub,margin:0}}>Bạn đang ở chế độ xem. Bạn không thể trả lời khảo sát này.</p>
            </div>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}`}</style>
      </main>
    );
  }

  // ── RESPONDENT → Inline survey form
  if(submitted){
    return (
      <div style={{minHeight:"100vh",background:"transparent",position:"relative",fontFamily:C.font}}>
        <AnimatedSurveyBackdrop/>
        <div style={{maxWidth:640,margin:"0 auto",position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"80vh"}}>
          <SuccessScreen onGoHome={()=>navigate("/user/home")} thankYouMessage={currentSurvey.thank_you_message}/>
        </div>
      </div>
    );
  }

  if(surveyStatus==="not_started"){
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:C.font,padding:"2rem"}}>
        <AnimatedSurveyBackdrop/>
        <div style={{position:"relative",zIndex:1,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(20px)",borderRadius:22,padding:"3rem 2.5rem",maxWidth:480,width:"100%",textAlign:"center"}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#dbeafe,#bfdbfe)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem"}}>
            <Calendar size={32} color="#2563eb"/>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 8px"}}>Khảo sát chưa bắt đầu</h2>
          <p style={{fontSize:14,color:C.textSub,margin:"0 0 2rem",lineHeight:1.7}}>
            Khảo sát này sẽ mở vào ngày {currentSurvey.start_at?new Date(currentSurvey.start_at).toLocaleDateString("vi-VN",{day:"2-digit",month:"long",year:"numeric"}):""}.
          </p>
          <button onClick={()=>navigate("/user/home")} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"13px 32px",background:C.primaryGrad,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>
            <Home size={16}/>Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if(surveyStatus==="expired"){
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:C.font,padding:"2rem"}}>
        <AnimatedSurveyBackdrop/>
        <div style={{position:"relative",zIndex:1,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(20px)",borderRadius:22,padding:"3rem 2.5rem",maxWidth:480,width:"100%",textAlign:"center"}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#fef3c7,#fde68a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem"}}>
            <FileText size={32} color="#d97706"/>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 8px"}}>Khảo sát đã kết thúc</h2>
          <p style={{fontSize:14,color:C.textSub,margin:"0 0 2rem"}}>Cảm ơn bạn đã quan tâm!</p>
          <button onClick={()=>navigate("/user/home")} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"13px 32px",background:C.primaryGrad,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>
            <Home size={16}/>Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Active survey — show intro if not started, or question form
  if(!started){
    const accent=currentSurvey.accent_color||C.primary;
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:C.font,padding:"2rem"}}>
        <AnimatedSurveyBackdrop/>
        <div style={{position:"relative",zIndex:1,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(20px)",borderRadius:22,padding:"3rem 2.5rem",maxWidth:520,width:"100%",textAlign:"center"}}>
          {currentSurvey.logo_url&&<img src={currentSurvey.logo_url} alt="Logo" style={{width:64,height:64,borderRadius:12,objectFit:"contain",marginBottom:"1rem"}}/>}
          <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${accent}22,${accent}44)`,border:`2px solid ${accent}33`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem"}}>
            <FileText size={32} color={accent}/>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 8px"}}>{currentSurvey.title ? <span dangerouslySetInnerHTML={{__html:currentSurvey.title}}/> : "Khảo sát"}</h2>
          {currentSurvey.description&&<p style={{fontSize:14,color:C.textSub,margin:"0 0 2rem",lineHeight:1.7}}><span dangerouslySetInnerHTML={{__html:currentSurvey.description}}/></p>}
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.textSub,justifyContent:"center",marginBottom:"1.75rem"}}>
            <FileText size={13}/>{questions.length} câu hỏi
          </div>
          <div style={{height:1,background:"#f3f4f6",margin:"0 0 1.75rem"}}/>
          <button onClick={async()=>{ try{ await startSurvey(surveyId); setStarted(true); }catch(e){} }} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 40px",background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",width:"100%"}}>
            <FileText size={16}/>Bắt đầu làm khảo sát
          </button>
          <button onClick={()=>navigate("/user/home")} style={{marginTop:"0.75rem",background:"none",border:"none",fontSize:13,color:C.textDim,cursor:"pointer"}}>← Quay lại</button>
        </div>
      </div>
    );
  }

  // Active survey — question form
  const pct=Math.round(((currentIndex+1)/total)*100);

  return (
    <main style={{minHeight:"100vh",background:"transparent",position:"relative",fontFamily:C.font,padding:"2.5rem 1.5rem",overflowX:"hidden"}}>
      <AnimatedSurveyBackdrop/>
      <div style={{maxWidth:640,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.75rem"}}>
          <button onClick={()=>navigate(-1)} style={{width:38,height:38,borderRadius:10,border:"1px solid rgba(0,0,0,0.08)",background:"rgba(255,255,255,0.75)",backdropFilter:"blur(8px)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <ChevronLeft size={18}/>
          </button>
          <div style={{flex:1}}>
            <h1 style={{fontSize:17,fontWeight:800,color:C.text,margin:0}}>{currentSurvey.title ? <span dangerouslySetInnerHTML={{__html:currentSurvey.title}}/> : "Làm khảo sát"}</h1>
            <p style={{fontSize:11,color:C.textSub,margin:"2px 0 0"}}>Câu {currentIndex+1} / {total}</p>
          </div>
          <div style={{padding:"4px 14px",borderRadius:999,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",color:"#059669",fontSize:13,fontWeight:800}}>
            {pct}%
          </div>
        </div>

        <div style={{height:6,background:"rgba(15,23,42,0.08)",borderRadius:99,overflow:"hidden",marginBottom:"1.75rem"}}>
          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#4f46e5)",borderRadius:99,transition:"width .4s cubic-bezier(.4,0,.2,1)"}}/>
        </div>

        {!qLoading&&current&&(
          <>
            <RespondQuestionCard key={current.id} question={current} answer={answers[current.id]} onChange={handleChange}/>
            {current.required&&!canProceed()&&(
              <p style={{fontSize:12,color:C.error,marginTop:10}}>* Câu hỏi này bắt buộc</p>
            )}
            <div style={{display:"flex",gap:12,marginTop:"1.5rem"}}>
              {!isFirst&&(
                <button onClick={()=>setCurrentIndex(i=>i-1)} style={{display:"flex",alignItems:"center",gap:6,padding:"13px 20px",background:"rgba(255,255,255,0.85)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:12,fontSize:14,fontWeight:600,color:C.text,cursor:"pointer",fontFamily:C.font}}>
                  <ChevronLeft size={16}/>Quay lại
                </button>
              )}
              {!isLast?(
                <button onClick={()=>{if(canProceed())setCurrentIndex(i=>i+1);}} disabled={!canProceed()} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px 20px",background:canProceed()?C.primaryGrad:"rgba(15,23,42,0.06)",color:canProceed()?"#fff":C.textDim,border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:canProceed()?"pointer":"not-allowed",transition:"all .15s",fontFamily:C.font}}>
                  Câu tiếp theo<ChevronRight size={16}/>
                </button>
              ):(
                <button onClick={handleSubmit} disabled={!canProceed()||submitting} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px 20px",background:!canProceed()||submitting?"rgba(15,23,42,0.06)":"linear-gradient(135deg,#059669,#10b981)",color:!canProceed()||submitting?C.textDim:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:(!canProceed()||submitting)?"not-allowed":"pointer",transition:"all .15s",fontFamily:C.font}}>
                  {submitting?<><Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/>Đang gửi...</>:<><Send size={15}/>Nộp khảo sát</>}
                </button>
              )}
            </div>
          </>
        )}

        {qLoading&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"5rem 0",gap:14}}>
            <Loader2 size={32} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>
            <p style={{fontSize:14,margin:0,color:C.textSub}}>Đang tải câu hỏi...</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}`}</style>
    </main>
  );
}

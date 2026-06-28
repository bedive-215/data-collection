// --- QuestionPage.jsx --- Flat design system --
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuestion } from "@/providers/QuestionProvider";
import { useSurvey } from "@/providers/SurveyProvider";
import surveyService from "@/services/surveyService";
import mediaService from "@/services/mediaService";
import { ROUTERS } from "@/utils/constants";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import AiQuestionAssistant from "@/components/survey/AiQuestionAssistant";
import { toast } from "react-toastify";
import {
  Plus, Trash2, Loader2, AlertCircle, Inbox, X,
  Pencil, Check, GripVertical, PlusCircle, Image, ChevronLeft, Sparkles,
  Type, AlignLeft, ChevronDown, List, CheckSquare,
  ToggleLeft, Star, Grid, FileUp, Calendar, Clock, Mail,
  FileText, Video, Minus, Copy, Bold, Italic, Underline,
  Link, AlignLeft as AlignLeftIcon, AlignCenter, AlignRight,
  ImagePlus, Layout, ChevronRight} from "lucide-react";

/* -- Design tokens (flat, no glass) -- */
const C = {
  bg:            "#F0EBF8",
  surface:       "#FFFFFF",
  surfaceHover:  "#F3F4F7",
  border:        "#E8E6F0",
  primary:       "#3B82F6",
  primaryGrad:   "linear-gradient(135deg,#3B82F6,#2563EB)",
  primaryLight:  "#DBEAFE",
  primaryBg:     "#EFF6FF",
  text:          "#374151",
  textSub:       "#9CA3AF",
  textDim:       "#9CA3AF",
  textMuted:     "#9CA3AF",
  error:         "#EF4444",
  errorBg:       "#FEF2F2",
  errorBorder:   "#FECACA",
  font:          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};

/* -- TYPE MAPPING -- */
const BE_TO_FE_TYPE = {
  text:            "TEXT",
  paragraph:       "PARAGRAPH",
  email:           "EMAIL",
  date:            "DATE",
  number:          "NUMBER",
  rating:          "RATING",
  single_choice:   "SINGLE_CHOICE",
  multiple_choice: "MULTIPLE_CHOICE",
  dropdown:        "DROPDOWN",
  TEXT:            "TEXT",
  PARAGRAPH:       "PARAGRAPH",
  EMAIL:           "EMAIL",
  DATE:            "DATE",
  NUMBER:          "NUMBER",
  RATING:          "RATING",
  SINGLE_CHOICE:   "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  DROPDOWN:        "DROPDOWN"};

const toFEType = (beType) => BE_TO_FE_TYPE[beType] ?? "TEXT";
const toBEType = (feType) => feType;

/* -- Question type definitions (UI only) -- */
const Q_TYPES = [
  { value:"TEXT",            label:"Trả lời ngắn",      icon:<Type size={15}/> },
  { value:"PARAGRAPH",       label:"Đoạn văn",           icon:<AlignLeft size={15}/> },
  { value:"SINGLE_CHOICE",   label:"Trắc nghiệm",        icon:<span style={{fontSize:15,lineHeight:1}}>⭕</span> },
  { value:"MULTIPLE_CHOICE", label:"Hộp kiểm",           icon:<CheckSquare size={15}/> },
  { value:"DROPDOWN",        label:"Menu thả xuống",     icon:<List size={15}/> },
  { value:"LINEAR_SCALE",    label:"Phạm vi tuyến tính", icon:<ToggleLeft size={15}/> },
  { value:"RATING",          label:"Xếp hạng",           icon:<Star size={15}/> },
  { value:"GRID",            label:"Lưới trắc nghiệm",   icon:<Grid size={15}/> },
  { value:"NUMBER",          label:"Số",                 icon:<span style={{fontSize:13,lineHeight:1,fontWeight:700}}>#</span> },
  { value:"DATE",            label:"Ngày",               icon:<Calendar size={15}/> },
  { value:"TIME",            label:"Giờ",                icon:<Clock size={15}/> },
  { value:"EMAIL",          label:"Email",               icon:<Mail size={15}/> },
  { value:"FILE_UPLOAD",     label:"Tải tập lên",        icon:<FileUp size={15}/> },
];

const SETTINGS_TYPES = ["NUMBER", "RATING", "DATE", "TEXT", "PARAGRAPH", "LINEAR_SCALE"];
const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/* -- Shared helpers -- */
const inp = (err) => ({
  width:"100%", boxSizing:"border-box", padding:"10px 14px",
  background:"#fff", border:"1px solid " + (err?C.error:C.border),
  borderRadius:6, color:C.text, fontSize:14,
  fontFamily:C.font, outline:"none"});
const lbl = {
  display:"block", fontSize:11, fontWeight:500,
  letterSpacing:"0.04em", textTransform:"uppercase",
  color:C.textDim, marginBottom:7};

function iconBtn(color, borderColor, bg) {
  return {
    display:"flex", alignItems:"center", justifyContent:"center",
    width:30, height:30, borderRadius:8,
    border: borderColor ? "1px solid " + borderColor : "none",
    background: bg ?? "transparent", cursor:"pointer",
    color: color ?? "#9CA3AF",
    transition:"background .12s", flexShrink:0};
}

/* -- Default option row factory -- */
const newOptionRow = () => ({ label: "", value: "", order_index: 0, is_other: false, image: null });

const buildBEOptions = (optionRows) =>
  optionRows
    .filter(r => r.label.trim() && r.value.trim())
    .map((r, i) => ({
      label:       r.label.trim(),
      value:       r.value.trim(),
      order_index: i,
      is_other:    r.is_other ?? false,
      image_url:   r.image?.url || r.image_url || null}));

/* -- getPlainText helper -- */
const getPlainText = (html) => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.innerText ?? "";
};

/* -- Toggle -- */
function Toggle({ checked, onChange }) {
  return (
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
      <span style={{fontSize:12,fontWeight:500,color:C.textSub}}>Bắt buộc</span>
      <div onClick={()=>onChange(!checked)} style={{
        width:44,height:24,borderRadius:999,
        background:checked?C.primary:C.border,
        position:"relative",transition:"background .2s",cursor:"pointer"}}>
        <div style={{
          position:"absolute",top:3,left:checked?22:3,
          width:16,height:16,borderRadius:"50%",background:"#fff",
          transition:"left .2s"}}/>
      </div>
    </label>
  );
}

/* -- Section Panel (Page builder) -- */
function SectionPanel({ sections, activeSectionId, onSelect, onDelete, onAdd }) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft("");
    setAdding(false);
  };

  return (
    <div style={{
      background: C.surface, border: "1px solid " + C.border,
      borderRadius: 10, overflow: "hidden"}}>
      <div style={{
        padding: "8px 12px 6px",
        borderBottom: "1px solid " + C.border,
        display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          TRANG / PHẦN
        </span>
        <button onClick={() => setAdding(v => !v)} title="Thêm trang mới"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 22, height: 22, borderRadius: 6,
            background: "transparent",
            border: "none", cursor: "pointer",
            color: C.primary, transition: "all .12s"}}
          onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          {adding ? <X size={12} strokeWidth={2.5}/> : <Plus size={12} strokeWidth={2.5}/>}
        </button>
      </div>

      {adding && (
        <div style={{ padding: "8px 10px", borderBottom: "1px solid " + C.border, background: C.surfaceHover }}>
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setAdding(false); setDraft(""); } }}
            placeholder="Tên trang mới..."
            style={{
              width: "100%", padding: "5px 8px",
              border: "1px solid " + C.border, borderRadius: 6,
              fontSize: 11, fontFamily: C.font, color: C.text,
              background: "#fff", outline: "none", boxSizing: "border-box"}}
          />
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <button onClick={submit}
              style={{ flex: 1, padding: "4px 6px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: C.font, background: C.primary, color: "#fff" }}>
              Thêm
            </button>
            <button onClick={() => { setAdding(false); setDraft(""); }}
              style={{ flex: 1, padding: "4px 6px", borderRadius: 6, border: "1px solid " + C.border, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: C.font, background: "transparent", color: C.textSub }}>
              Huỷ
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => onSelect(null)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "7px 11px",
          background: "transparent",
          border: "none", borderBottom: "1px solid " + C.border,
          cursor: "pointer", fontFamily: C.font, fontSize: 12,
          color: C.text,
          borderLeft: activeSectionId === null ? "3px solid " + C.primary : "3px solid transparent",
          paddingLeft: activeSectionId === null ? 8 : 11,
          transition: "all .12s"}}
        onMouseEnter={e => { if (activeSectionId !== null) e.currentTarget.style.background = C.surfaceHover; }}
        onMouseLeave={e => { if (activeSectionId !== null) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Layout size={12} strokeWidth={2}/>
          Tất cả câu hỏi
        </span>
      </button>

      {sections.map(sec => (
        <div key={sec.id}
          style={{
            display: "flex", alignItems: "center",
            background: "transparent",
            borderBottom: "1px solid " + C.border,
            borderLeft: activeSectionId === sec.id ? "3px solid " + C.primary : "3px solid transparent",
            transition: "all .12s"}}
          onMouseEnter={e => { if (activeSectionId !== sec.id) e.currentTarget.style.background = C.surfaceHover; }}
          onMouseLeave={e => { if (activeSectionId !== sec.id) e.currentTarget.style.background = "transparent"; }}
        >
          <button
            onClick={() => onSelect(sec.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", gap: 6,
              padding: "7px 9px",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: C.font, fontSize: 12,
              color: activeSectionId === sec.id ? C.primary : C.text,
              textAlign: "left", transition: "color .12s"}}
          >
            <ChevronRight size={10} color={C.textSub} style={{ flexShrink: 0 }}/>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sec.title || "Không có tiêu đề"}
            </span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(sec.id); }}
            title="Xóa trang"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24, marginRight: 4,
              background: "none", border: "none", cursor: "pointer",
              color: "#CCC", borderRadius: 6, transition: "all .12s"}}
            onMouseEnter={e => { e.currentTarget.style.background = C.errorBg; e.currentTarget.style.color = C.error; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#CCC"; }}
          >
            <Trash2 size={10}/>
          </button>
        </div>
      ))}

      {sections.length === 0 && !adding && (
        <div style={{ padding: "16px 12px", textAlign: "center", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
          <Layout size={24} color={C.textDim} style={{ opacity: 0.4 }}/>
          <p style={{ fontSize: 12, color: C.textSub, margin: 0, fontWeight:500 }}>
            Chưa có trang nào
          </p>
          <button
            onClick={() => setAdding(true)}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"6px 12px",
              background: C.primary, color:"#fff",
              border:"none", borderRadius:8,
              fontSize:12, fontWeight:600, cursor:"pointer",
              fontFamily:C.font}}
          >
            <Plus size={12}/> Thêm trang
          </button>
        </div>
      )}
    </div>
  );
}

/* -- QuestionTypeDropdown -- */
function QuestionTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = Q_TYPES.find(t => t.value === value) ?? Q_TYPES[0];

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position:"relative", minWidth:200 }}>
      <button onClick={() => setOpen(v=>!v)} style={{
        display:"flex", alignItems:"center", gap:8,
        width:"100%", padding:"8px 12px",
        background: "#fff", border:"1px solid " + (open?C.primary:C.border),
        borderRadius:6, cursor:"pointer", color:C.text, fontFamily:C.font, fontSize:13,
        justifyContent:"space-between",
        transition:"border-color .15s"}}>
        <span style={{display:"flex",alignItems:"center",gap:8,color:C.textSub}}>
          {current.icon}
          <span style={{color:C.text}}>{current.label}</span>
        </span>
        <ChevronDown size={14} color={C.textSub} style={{transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0)"}}/>
      </button>

      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:20,
          background:"#fff", border:"1px solid " + C.border,
          borderRadius:8, overflow:"hidden",
          maxHeight:320, overflowY:"auto"}}>
          {Q_TYPES.map(t => (
            <button key={t.value} onClick={()=>{ onChange(t.value); setOpen(false); }}
              style={{
                display:"flex", alignItems:"center", gap:10,
                width:"100%", padding:"9px 14px",
                background: t.value===value ? C.primaryBg : "transparent",
                border:"none", fontSize:13, fontWeight:500,
                color: t.value===value ? C.primary : C.text,
                cursor:"pointer", fontFamily:C.font}}
              onMouseEnter={e=>e.currentTarget.style.background=t.value===value?C.primaryBg:C.surfaceHover}
              onMouseLeave={e=>e.currentTarget.style.background=t.value===value?C.primaryBg:"transparent"}
            >
              <span style={{color:t.value===value?C.primary:C.textSub}}>{t.icon}</span>
              {t.label}
              {t.value===value && <Check size={13} style={{marginLeft:"auto"}}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -- ImageUploadButton  UI only -- */
function ImageUploadButton({ image, onImageChange, size = "sm" }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onImageChange({ file, url, name: file.name });
    e.target.value = "";
  };

  if (image) {
    return (
      <div style={{
        position:"relative", display:"inline-flex", borderRadius:6,
        overflow:"hidden", border:"1px solid " + C.border,
        width: size === "sm" ? 44 : 80,
        height: size === "sm" ? 44 : 60,
        flexShrink:0}}>
        <img src={image.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <button
          type="button"
          onClick={() => onImageChange(null)}
          style={{
            position:"absolute",top:2,right:2,
            width:16,height:16,borderRadius:"50%",
            background:"rgba(0,0,0,0.6)",border:"none",
            color:"#fff",cursor:"pointer",fontSize:10,
            display:"flex",alignItems:"center",justifyContent:"center",
            lineHeight:1}}
        >×</button>
      </div>
    );
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title="Thêm ảnh"
        style={{
          display:"flex", alignItems:"center", justifyContent:"center",
          width: size === "sm" ? 28 : 32,
          height: size === "sm" ? 28 : 32,
          borderRadius:6, border:"1px solid " + C.border,
          background:"transparent", color:"#9CA3AF",
          cursor:"pointer", flexShrink:0,
          transition:"all .12s"}}
        onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.color=C.primary;e.currentTarget.style.borderColor=C.primary;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textSub;e.currentTarget.style.borderColor=C.border;}}
      >
        <ImagePlus size={size === "sm" ? 13 : 15}/>
      </button>
    </>
  );
}

/* -- RichTextEditor -- */
function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung...", minHeight = 80, hasError = false }) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
      setIsEmpty(false);
    }
  }, []);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  };

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText ?? "";
    const html = el.innerHTML ?? "";
    setIsEmpty(!text.trim());
    onChange(html);
  };

  const insertImageInEditor = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = "<img src=\"" + url + "\" alt=\"\" style=\"max-width:100%;max-height:200px;border-radius:6px;margin:4px 0;display:block;\"/>";
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, img);
    handleInput();
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        insertImageInEditor(file);
        return;
      }
    }
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const toolbarBtn = (cmd, children, title, val = null) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
      style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        width:26, height:26, borderRadius:8,
        border:"none", background:"transparent",
        color:"#9CA3AF", cursor:"pointer",
        transition:"all .1s"}}
      onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceHover;e.currentTarget.style.color=C.text;}}
      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#9CA3AF";}}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      border:"1.5px solid " + (hasError ? C.error : isFocused ? C.primary : C.border),
      borderRadius:6, overflow:"hidden",
      transition:"border-color .15s",
      background:"#fff"}}>
      <div style={{
        display:"flex", alignItems:"center", gap:2, padding:"6px 10px",
        borderBottom:"1px solid " + C.border, background: C.surfaceHover,
        flexWrap:"wrap"}}>
        {toolbarBtn("bold",    <Bold size={13}/>,      "In đậm")}
        {toolbarBtn("italic",  <Italic size={13}/>,    "In nghiêng")}
        {toolbarBtn("underline",<Underline size={13}/>,"Gạch chân")}

        <div style={{width:1,height:18,background:C.border,margin:"0 4px"}}/>

        {toolbarBtn("justifyLeft",   <AlignLeftIcon size={13}/>,  "Can trái")}
        {toolbarBtn("justifyCenter", <AlignCenter size={13}/>,    "Can giữa")}
        {toolbarBtn("justifyRight",  <AlignRight size={13}/>,     "Căn phải")}

        <div style={{width:1,height:18,background:C.border,margin:"0 4px"}}/>

        {toolbarBtn("insertUnorderedList", <span style={{fontSize:12,fontWeight:700}}></span>, "Danh sách")}
        {toolbarBtn("insertOrderedList",   <span style={{fontSize:12,fontWeight:700}}>1.</span>,  "Danh sách có thứ tự")}

        <div style={{width:1,height:18,background:C.border,margin:"0 4px"}}/>

        <select
          onChange={e => { exec("formatBlock", e.target.value); e.target.value = "p"; }}
          defaultValue="p"
          style={{
            background:"#fff", border:"1px solid " + C.border, borderRadius:6,
            color:C.textSub, fontSize:11, padding:"2px 4px",
            cursor:"pointer", fontFamily:C.font, outline:"none"}}
        >
          <option value="p">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>

        <div style={{width:1,height:18,background:C.border,margin:"0 4px"}}/>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{display:"none"}}
          onChange={e => { const f = e.target.files?.[0]; if(f) insertImageInEditor(f); e.target.value=""; }}
        />
        <button
          type="button"
          title="Chèn ảnh"
          onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}
          style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            width:26, height:26, borderRadius:6,
            border:"none", background:"transparent",
            color:"#9CA3AF", cursor:"pointer",
            transition:"all .1s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.color=C.primary;}}
      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#9CA3AF";}}
        >
          <ImagePlus size={13}/>
        </button>

        <div style={{marginLeft:"auto",fontSize:10,color:C.textDim}}>
          Ctrl+B · I · U
        </div>
      </div>

      <div style={{position:"relative"}}>
        {isEmpty && (
          <div style={{
            position:"absolute", top:0, left:0, right:0,
            padding:"10px 14px", fontSize:14, color:C.textDim,
            pointerEvents:"none", userSelect:"none"}}>
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPaste={handlePaste}
          style={{
            minHeight,
            padding:"10px 14px",
            color:C.text,
            fontSize:14,
            fontFamily:C.font,
            outline:"none",
            lineHeight:1.6,
            wordBreak:"break-word"}}
        />
      </div>
    </div>
  );
}

/* -- QuestionImageUploadArea  UI only -- */
function QuestionImageUploadArea({ image, onImageChange }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onImageChange({ file, url, name: file.name });
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onImageChange({ file, url, name: file.name });
  };

  if (image) {
    return (
      <div style={{position:"relative",borderRadius:6,overflow:"hidden",border:"1px solid " + C.border,maxWidth:300}}>
        <img src={image.url} alt={image.name} style={{width:"100%",maxHeight:180,objectFit:"cover",display:"block"}}/>
        <div style={{
          position:"absolute",top:0,left:0,right:0,bottom:0,
          background:"rgba(0,0,0,0)",transition:"background .15s",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.4)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0)"}
        >
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              padding:"5px 10px",background:"rgba(0,0,0,0.7)",
              border:"none",borderRadius:6,color:"#fff",
              fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:C.font,
              opacity:0,transition:"opacity .15s"}}
            onMouseEnter={e=>e.currentTarget.style.opacity="1"}
            onMouseLeave={e=>e.currentTarget.style.opacity="0"}
          >Thay ảnh</button>
          <button
            type="button"
            onClick={() => onImageChange(null)}
            style={{
              padding:"5px 10px",background:"rgba(180,30,30,0.8)",
              border:"none",borderRadius:6,color:"#fff",
              fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:C.font,
              opacity:0,transition:"opacity .15s"}}
            onMouseEnter={e=>e.currentTarget.style.opacity="1"}
            onMouseLeave={e=>e.currentTarget.style.opacity="0"}
          >Xóa ảnh</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
        <div style={{padding:"5px 10px",fontSize:11,color:C.textDim,background:C.surfaceHover}}>
          {image.name}
          <span style={{marginLeft:6,color:C.primary,fontSize:10}}>UI only · chua gợi server</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e=>e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border:"1.5px dashed " + C.border,
          borderRadius:6,padding:"14px 20px",
          textAlign:"center",cursor:"pointer",
          color:C.textDim,fontSize:12,
          transition:"border-color .15s, background .15s",background:"transparent",
          display:"flex",alignItems:"center",gap:10}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.color=C.primary;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textDim;}}
      >
        <ImagePlus size={16}/>
        <span>Thêm ảnh cho câu hỏi · <span style={{color:C.textDim,fontSize:11}}>UI only</span></span>
      </div>
    </>
  );
}

/* -- OptionRow -- */
function OptionRow({ opt, questionId, index, qType, onDelete, onUpdate }) {
  const [editing,  setEditing]  = useState(false);
  const [label,    setLabel]    = useState(opt.label ?? "");
  const [value,    setValue]    = useState(opt.value ?? "");
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [optImage, setOptImage] = useState(null);

  const startEdit = () => { setLabel(opt.label ?? ""); setValue(opt.value ?? ""); setEditing(true); };

  const saveEdit = async () => {
    const trimLabel = label.trim();
    const trimValue = value.trim();
    if (!trimLabel || !trimValue) { setEditing(false); return; }
    if (trimLabel === opt.label && trimValue === opt.value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onUpdate(opt.id, questionId, { label: trimLabel, value: trimValue });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleDel = async () => {
    setDeleting(true);
    try { await onDelete(opt.id, questionId); } finally { setDeleting(false); }
  };

  const fileRef = useRef(null);
  const handleOptImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOptImage({ file, url, name: file.name });
    e.target.value = "";
  };

  const Marker = () => {
    if (qType === "MULTIPLE_CHOICE") return (
      <div style={{width:16,height:16,borderRadius:3,border:"1.5px solid " + C.border,flexShrink:0}}/>
    );
    if (qType === "DROPDOWN") return (
      <span style={{fontSize:12,color:C.textSub,minWidth:20,flexShrink:0}}>{index+1}.</span>
    );
    return (
      <div style={{width:16,height:16,borderRadius:"50%",border:"1.5px solid " + C.border,flexShrink:0}}/>
    );
  };

  return (
    <div style={{
      display:"flex",flexDirection:"column",gap:6,
      padding:"7px 0",borderBottom:"1px solid " + C.border}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <GripVertical size={13} color={"#888"} style={{flexShrink:0,cursor:"grab"}}/>
        <Marker/>

        {editing ? (
          <div style={{display:"flex",gap:8,flex:1}}>
            <input
              autoFocus value={label}
              onChange={e=>setLabel(e.target.value)}
              placeholder="Label (hiển thị)"
              onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditing(false);}}
              style={{...inp(false),flex:1,padding:"5px 10px",fontSize:13}}
            />
            <input
              value={value}
              onChange={e=>setValue(e.target.value)}
              placeholder="Value (luu DB)"
              onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditing(false);}}
              style={{...inp(false),flex:1,padding:"5px 10px",fontSize:13,color:C.textSub}}
            />
          </div>
        ) : (
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
            {optImage && (
              <img src={optImage.url} alt="" style={{width:32,height:32,objectFit:"cover",borderRadius:6,border:"1px solid " + C.border}}/>
            )}
            <span style={{fontSize:13,color:C.text}}>{opt.label}</span>
            <span style={{fontSize:11,color:C.textDim,background:C.surfaceHover,padding:"1px 7px",borderRadius:4,border:"1px solid " + C.border}}>
              {opt.value}
            </span>
          </div>
        )}

        <div style={{display:"flex",gap:4}}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleOptImageFile} style={{display:"none"}}/>
          <button
            type="button"
            title="Thêm ảnh lựa chỉn (UI only)"
            onClick={()=>fileRef.current?.click()}
            style={iconBtn(optImage?C.primary:"#9CA3AF")}
            onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <ImagePlus size={11}/>
          </button>

          {editing ? (
            <>
              <button onClick={saveEdit} disabled={saving} style={iconBtn("#16a34a","#bbf7d0","#f0fdf4")}
                onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"}
                onMouseLeave={e=>e.currentTarget.style.background="#f0fdf4"}>
                {saving?<Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>:<Check size={11}/>}
              </button>
              <button onClick={()=>setEditing(false)} style={iconBtn(C.textSub)}
                onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHover}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <X size={11}/>
              </button>
            </>
          ) : (
            <>
              <button onClick={startEdit} style={iconBtn(C.primary, C.primary)} title="Sửa"
                onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Pencil size={11}/>
              </button>
              <button onClick={handleDel} disabled={deleting} style={iconBtn(C.error,C.errorBorder,C.errorBg)} title="Xóa"
                onMouseEnter={e=>e.currentTarget.style.background="#fee2e2"}
                onMouseLeave={e=>e.currentTarget.style.background=C.errorBg}>
                {deleting?<Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>:<X size={11}/>}
              </button>
            </>
          )}
        </div>
      </div>

      {optImage && !editing && (
        <div style={{paddingLeft:56,display:"flex",alignItems:"center",gap:8}}>
          <img src={optImage.url} alt="" style={{maxWidth:120,maxHeight:80,objectFit:"cover",borderRadius:6,border:"1px solid " + C.border}}/>
          <button
            type="button"
            onClick={()=>setOptImage(null)}
            style={{fontSize:10,color:C.error,background:"none",border:"none",cursor:"pointer",fontFamily:C.font}}
          >× Xóa ảnh</button>
          <span style={{fontSize:10,color:C.textDim}}>UI only</span>
        </div>
      )}
    </div>
  );
}

/* -- InlineOptionBuilder -- */
function InlineOptionBuilder({ qType, optionRows, onChange }) {
  const labelRefs = useRef([]);

  const addRow = (afterIndex) => {
    const next = [...optionRows];
    next.splice(afterIndex + 1, 0, newOptionRow());
    onChange(next);
    setTimeout(() => labelRefs.current[afterIndex + 1]?.focus(), 30);
  };

  const removeRow = (i) => {
    if (optionRows.length <= 1) return;
    const next = [...optionRows];
    next.splice(i, 1);
    onChange(next);
    setTimeout(() => labelRefs.current[Math.max(0, i - 1)]?.focus(), 30);
  };

  const handleLabelChange = (i, labelVal) => {
    const autoValue = labelVal
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    onChange(optionRows.map((row, idx) =>
      idx === i ? { ...row, label: labelVal, value: autoValue } : row
    ));
  };

  const updateRow = (i, field, val) => {
    onChange(optionRows.map((row, idx) =>
      idx === i ? { ...row, [field]: val } : row
    ));
  };

  const handleOptImage = (i, imageObj) => {
    onChange(optionRows.map((row, idx) =>
      idx === i ? { ...row, image: imageObj } : row
    ));
  };

  const Marker = ({ index }) => {
    if (qType === "MULTIPLE_CHOICE") return (
      <div style={{width:16,height:16,borderRadius:3,border:"1.5px solid " + C.border,flexShrink:0,marginTop:2}}/>
    );
    if (qType === "DROPDOWN") return (
      <span style={{fontSize:12,color:C.textSub,minWidth:20,flexShrink:0,textAlign:"right",marginTop:2}}>{index + 1}.</span>
    );
    return (
      <div style={{width:16,height:16,borderRadius:"50%",border:"1.5px solid " + C.border,flexShrink:0,marginTop:2}}/>
    );
  };

  return (
    <div>
      <span style={lbl}>
        Các lựa chọn{" "}
        <span style={{color:C.textDim,fontWeight:400,textTransform:"none",letterSpacing:0}}>
          (label + value)
        </span>
      </span>

      <div style={{display:"flex",gap:8,marginBottom:4,paddingLeft:56}}>
        <span style={{flex:1,fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>
          Label (hiển thị)
        </span>
        <span style={{flex:1,fontSize:10,color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>
          Value (luu DB)
        </span>
        <div style={{width:58}}/>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {optionRows.map((row, i) => (
          <div key={i} style={{display:"flex",flexDirection:"column",gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <GripVertical size={12} color={"#888"} style={{flexShrink:0}}/>
              <Marker index={i}/>

              <input
                ref={el => labelRefs.current[i] = el}
                value={row.label}
                placeholder={"Label " + (i + 1)}
                onChange={e => handleLabelChange(i, e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); addRow(i); }
                  if (e.key === "Backspace" && !row.label && !row.value && optionRows.length > 1) {
                    e.preventDefault(); removeRow(i);
                  }
                }}
                style={{
                  flex:1, padding:"6px 10px",
                  background:"#fff", border:"1px solid " + C.border,
                  borderRadius:7, color:C.text, fontSize:13,
                  fontFamily:C.font, outline:"none"}}
                onFocus={e => { e.target.style.borderColor = C.primary; }}
                onBlur={e => { e.target.style.borderColor = C.border; }}
              />

              <input
                value={row.value}
                placeholder={"value_" + (i + 1)}
                onChange={e => updateRow(i, "value", e.target.value)}
                style={{
                  flex:1, padding:"6px 10px",
                  background:C.surfaceHover, border:"1px solid " + C.border,
                  borderRadius:7, color:C.textSub, fontSize:12,
                  fontFamily:"monospace", outline:"none"}}
                onFocus={e => { e.target.style.borderColor = C.primary; }}
                onBlur={e => { e.target.style.borderColor = C.border; }}
              />

              <ImageUploadButton image={row.image} onImageChange={img => handleOptImage(i, img)} size="sm"/>

              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={optionRows.length <= 1}
                style={{
                  width:22, height:22, borderRadius:6, border:"none",
                  background:"transparent",
                  cursor: optionRows.length <= 1 ? "not-allowed" : "pointer",
                  color: "#9CA3AF", display:"flex", alignItems:"center",
                  justifyContent:"center", flexShrink:0}}
                onMouseEnter={e => { if (optionRows.length > 1) { e.currentTarget.style.color=C.error; e.currentTarget.style.background=C.errorBg; }}}
                onMouseLeave={e => { e.currentTarget.style.color="#9CA3AF"; e.currentTarget.style.background="transparent"; }}
              >×</button>
            </div>

            {row.image && (
              <div style={{paddingLeft:52,display:"flex",alignItems:"center",gap:8}}>
                <img
                  src={row.image.url}
                  alt=""
                  style={{maxWidth:100,maxHeight:64,objectFit:"cover",borderRadius:6,border:"1px solid " + C.border}}
                />
                <span style={{fontSize:10,color:C.textDim}}>UI only · chua gợi server</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:10,paddingLeft:28}}>
        <button
          type="button"
          onClick={() => addRow(optionRows.length - 1)}
          style={{
            background:"none", border:"none", color:C.primary,
            fontSize:13, fontWeight:600, fontFamily:C.font,
            cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:0}}
        >
          <PlusCircle size={14}/> Thêm lựa chọn
        </button>
      </div>

      {optionRows.some(o => o.label.trim()) && (
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
          {optionRows.filter(o => o.label.trim()).map((o, i) => (
            <span key={i} style={{
              display:"inline-flex", alignItems:"center", gap:5,
              padding:"3px 10px", borderRadius:20,
              background:C.primaryLight, border:"1px solid " + C.primaryLight,
              fontSize:12, color:C.primary, fontWeight:500}}>
              {o.image && <img src={o.image.url} alt="" style={{width:14,height:14,objectFit:"cover",borderRadius:3}}/>}
              <span style={{width:5,height:5,borderRadius:"50%",background:C.primary,flexShrink:0}}/>
              {o.label}
              {o.value && <span style={{color:C.textSub,fontSize:10}}>({o.value})</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* -- SettingsEditor -- */
function SettingsEditor({ type, settings, onChange }) {
  if (type === "TEXT" || type === "PARAGRAPH") {
    return (
      <div>
        <span style={lbl}>Giới hạn ký tự</span>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Tối thiểu</span>
            <input
              type="number"
              value={settings?.min_chars ?? ""}
              placeholder="Không giới hạn"
              onChange={e => onChange({ ...settings, min_chars: e.target.value !== "" ? Number(e.target.value) : undefined })}
              style={{...inp(false),padding:"7px 10px",fontSize:13}}
            />
          </div>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Tối đa</span>
            <input
              type="number"
              value={settings?.max_chars ?? ""}
              placeholder="Không giới hạn"
              onChange={e => onChange({ ...settings, max_chars: e.target.value !== "" ? Number(e.target.value) : undefined })}
              style={{...inp(false),padding:"7px 10px",fontSize:13}}
            />
          </div>
        </div>
      </div>
    );
  }

  if (type === "NUMBER") {
    return (
      <div>
        <span style={lbl}>Giới hạn số</span>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Min</span>
            <input
              type="number"
              value={settings?.min ?? ""}
              placeholder="Không giới hạn"
              onChange={e => onChange({ ...settings, min: e.target.value !== "" ? Number(e.target.value) : undefined })}
              style={{...inp(false),padding:"7px 10px",fontSize:13}}
            />
          </div>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Max</span>
            <input
              type="number"
              value={settings?.max ?? ""}
              placeholder="Không giới hạn"
              onChange={e => onChange({ ...settings, max: e.target.value !== "" ? Number(e.target.value) : undefined })}
              style={{...inp(false),padding:"7px 10px",fontSize:13}}
            />
          </div>
        </div>
      </div>
    );
  }

  if (type === "LINEAR_SCALE") {
    const min = settings?.min ?? 1;
    const max = settings?.max ?? 5;
    return (
      <div>
        <span style={lbl}>Phạm vi tuyến tính</span>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Min</span>
            <input
              type="number"
              value={min}
              onChange={e => onChange({ ...settings, min: Number(e.target.value) })}
              style={{...inp(false),padding:"7px 10px",fontSize:13}}
            />
          </div>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Max</span>
            <input
              type="number"
              value={max}
              onChange={e => onChange({ ...settings, max: Number(e.target.value) })}
              style={{...inp(false),padding:"7px 10px",fontSize:13}}
            />
          </div>
        </div>
        <div style={{display:"flex",gap:12,marginTop:8}}>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Nhãn min</span>
            <input type="text" value={settings?.min_label ?? ""} placeholder="Ví để: Không hài lòng"
              onChange={e => onChange({ ...settings, min_label: e.target.value || undefined })}
              style={{...inp(false),padding:"7px 10px",fontSize:12}}/>
          </div>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Nhãn max</span>
            <input type="text" value={settings?.max_label ?? ""} placeholder="Ví dụ: Rất hài lòng"
              onChange={e => onChange({ ...settings, max_label: e.target.value || undefined })}
              style={{...inp(false),padding:"7px 10px",fontSize:12}}/>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12,padding:"8px 12px",background:C.surfaceHover,borderRadius:10,gap:4}}>
          {[...Array(max-min+1)].map((_, i) => {
            const val = min + i;
            return (
              <div key={val} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flex:1}}>
                <span style={{fontSize:13,fontWeight:700,color:C.primary}}>{val}</span>
                <div style={{width:"100%",height:6,background:C.primary,borderRadius:3}}/>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "RATING") {
    return (
      <div>
        <span style={lbl}>Phạm vi đánh giá</span>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Min</span>
            <input
              type="number"
              value={settings?.min ?? 1}
              onChange={e => onChange({ ...settings, min: Number(e.target.value) })}
              style={{...inp(false),padding:"7px 10px",fontSize:13}}
            />
          </div>
          <div style={{flex:1}}>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Max</span>
            <input
              type="number"
              value={settings?.max ?? 5}
              onChange={e => onChange({ ...settings, max: Number(e.target.value) })}
              style={{...inp(false),padding:"7px 10px",fontSize:13}}
            />
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {Array.from({length:(settings?.max??5)-(settings?.min??1)+1},(_,i)=>i+(settings?.min??1)).map(i=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:11,color:C.textSub}}>{i}</span>
              <span style={{fontSize:20,color:C.textDim,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.color="#eab308"}
                onMouseLeave={e=>e.currentTarget.style.color=C.textDim}>☆</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

/* -- QuestionBody -- */
function QuestionBody({ q, type }) {
  const opts = q.options ?? q.option ?? [];

  if (type === "TEXT") return (
    <div style={{borderBottom:"1px dashed " + C.border,padding:"10px 0",fontSize:13,color:C.textDim,width:"60%"}}>
      Văn bản câu trả lời ngắn
    </div>
  );
  if (type === "PARAGRAPH") return (
    <div style={{borderBottom:"1px dashed " + C.border,padding:"10px 0",fontSize:13,color:C.textDim,width:"100%"}}>
      Văn bản câu trả lời dài
    </div>
  );
  if (type === "NUMBER") return (
    <div style={{borderBottom:"1px dashed " + C.border,padding:"10px 0",fontSize:13,color:C.textDim,width:"40%"}}>
      Nhập số
    </div>
  );
  if (type === "DATE") return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",color:C.textDim,fontSize:13}}>
      <Calendar size={16}/> Ngày / Tháng / Nam
    </div>
  );
  if (type === "TIME") return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",color:C.textDim,fontSize:13}}>
      <Clock size={16}/> Giờ : Phút
    </div>
  );

  if (CHOICE_TYPES.includes(type)) return (
    <div>
      {opts.length === 0 ? (
        <div style={{fontSize:12,color:C.textDim,padding:"8px 0",fontStyle:"italic"}}>
          Chưa có lựa chọn nào.
        </div>
      ) : (
        opts.map((opt, i) => (
          <div key={opt.id ?? i} style={{
            display:"flex",alignItems:"center",gap:10,
            padding:"6px 0",borderBottom:"1px solid " + C.border}}>
            {type === "MULTIPLE_CHOICE"
              ? <div style={{width:15,height:15,borderRadius:3,border:"1.5px solid " + C.border,flexShrink:0}}/>
              : type === "DROPDOWN"
              ? <span style={{fontSize:12,color:C.textSub,minWidth:18}}>{i+1}.</span>
              : <div style={{width:15,height:15,borderRadius:"50%",border:"1.5px solid " + C.border,flexShrink:0}}/>
            }
            <span style={{fontSize:13,color:C.text,flex:1}}>{opt.label}</span>
            <span style={{fontSize:11,color:C.textDim,background:C.surfaceHover,padding:"1px 7px",borderRadius:4,border:"1px solid " + C.border}}>
              {opt.value}
            </span>
          </div>
        ))
      )}
    </div>
  );

  if (type === "RATING") return (
    <div style={{display:"flex",gap:6,marginTop:4,padding:"8px 0"}}>
      {[1,2,3,4,5].map(i=>(
        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <span style={{fontSize:11,color:C.textSub}}>{i}</span>
          <span style={{fontSize:22,color:C.textDim,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.color="#eab308"}
            onMouseLeave={e=>e.currentTarget.style.color=C.textDim}>☆</span>
        </div>
      ))}
    </div>
  );

  if (type === "FILE_UPLOAD") return (
    <div style={{padding:"14px 0",color:C.textDim,fontSize:13}}>
      <div style={{border:"1.5px dashed " + C.border,borderRadius:10,padding:"16px 20px",textAlign:"center"}}>
        <FileUp size={20} style={{marginBottom:6,opacity:0.5}}/>
        <div>Người dùng có thể tải tập lên tại đây</div>
      </div>
    </div>
  );

  return null;
}

/* -- ConditionEditor  skip logic UI -- */
const OPERATORS = [
  { value: "equals",        label: "bằng",        types: ["TEXT","PARAGRAPH","EMAIL","NUMBER","SINGLE_CHOICE","DROPDOWN","LINEAR_SCALE"] },
  { value: "not_equals",    label: "không bằng",  types: ["TEXT","PARAGRAPH","EMAIL","NUMBER","SINGLE_CHOICE","DROPDOWN","LINEAR_SCALE"] },
  { value: "contains",      label: "chứa",         types: ["TEXT","PARAGRAPH","EMAIL"] },
  { value: "not_contains",  label: "không chứa",  types: ["TEXT","PARAGRAPH","EMAIL"] },
  { value: "greater",       label: "lớn hơn",      types: ["NUMBER","LINEAR_SCALE","RATING"] },
  { value: "less",          label: "nhỏ hơn",      types: ["NUMBER","LINEAR_SCALE","RATING"] },
  { value: "answered",      label: "đã trả lời",    types: ["TEXT","PARAGRAPH","EMAIL","NUMBER","DATE","TIME","SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN","RATING","LINEAR_SCALE"] },
  { value: "not_answered",  label: "chưa trả lời",  types: ["TEXT","PARAGRAPH","EMAIL","NUMBER","DATE","TIME","SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN","RATING","LINEAR_SCALE"] },
];

function ConditionEditor({ questions, currentQId, value, onChange }) {
  const [open, setOpen] = useState(false);
  const sourceId = value?.source_question_id ?? "";
  const operator = value?.operator ?? "";
  const condValue = value?.value ?? "";

  const sourceQ = questions.find(q => q.id === sourceId);
  const srcFEType = sourceQ ? toFEType(sourceQ.type) : "";
  const availableOps = OPERATORS.filter(op => !srcFEType || op.types.includes(srcFEType));
  const hasCondition = !!sourceId && !!operator;

  const getValueInput = () => {
    if (!sourceId || operator === "answered" || operator === "not_answered") return null;
    const isChoice = ["SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN"].includes(srcFEType);
    if (isChoice) {
      const opts = sourceQ?.options ?? sourceQ?.option ?? [];
      return (
        <select value={condValue}
          onChange={e => onChange({ source_question_id: sourceId, operator, value: e.target.value })}
          style={{...inp(false), padding:"5px 8px", fontSize:12, flex:1}}>
          <option value="">— Chọn đáp án —</option>
          {opts.map((o,i) => (
            <option key={i} value={typeof o === "string" ? o : (o.value ?? o.label ?? "")}>
              {typeof o === "string" ? o : (o.label ?? o.value ?? "")}
            </option>
          ))}
        </select>
      );
    }
    if (["NUMBER","LINEAR_SCALE","RATING"].includes(srcFEType)) {
      return (
        <input type="number" value={condValue}
          onChange={e => onChange({ source_question_id: sourceId, operator, value: e.target.value })}
          placeholder="Giá trị..." style={{...inp(false), padding:"5px 8px", fontSize:12, flex:1}}/>
      );
    }
    return (
      <input type="text" value={condValue}
        onChange={e => onChange({ source_question_id: sourceId, operator, value: e.target.value })}
        placeholder="Giá trị..." style={{...inp(false), padding:"5px 8px", fontSize:12, flex:1}}/>
    );
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <span style={{...lbl, marginBottom:0}}>Điều kiện hiển thị (Skip logic)</span>
        <button onClick={() => setOpen(v => !v)} style={{
          display:"flex",alignItems:"center",gap:5,
          padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",
          fontSize:11,fontWeight:600,fontFamily:C.font,
          background: hasCondition ? C.primary : C.surfaceHover,
          color: hasCondition ? "#fff" : C.textSub, transition:"all .12s"}}>
          {hasCondition ? "? Có điều kiện" : "+ Thêm điều kiện"}
        </button>
      </div>

      {open && (
        <div style={{
          background:C.surfaceHover,border:"1px solid " + C.border,borderRadius:10,
          padding:12,display:"flex",flexDirection:"column",gap:10,marginTop:6}}>
          <p style={{fontSize:11,color:C.textSub,margin:0,lineHeight:1.4}}>
            Câu hỏi này chỉ hiển thị khi điều kiện bên dưới được thỏa mãn.
          </p>

          <div>
            <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Câu hỏi nguồn</span>
            <select value={sourceId} onChange={e => onChange({ source_question_id: e.target.value, operator: "", value: "" })}
              style={{...inp(false),padding:"6px 10px",fontSize:12,background:"#fff"}}>
              <option value="">— Chọn câu hỏi —</option>
              {questions.filter(q => q.id !== currentQId).map(q => (
                <option key={q.id} value={q.id}>
                  {String(q.order_index ?? questions.indexOf(q) + 1)}. {getPlainText(q.content ?? "").slice(0, 40)}
                </option>
              ))}
            </select>
          </div>

          {sourceId && (
            <div>
              <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Điều kiện</span>
              <select value={operator} onChange={e => onChange({ source_question_id: sourceId, operator: e.target.value, value: "" })}
                style={{...inp(false),padding:"6px 10px",fontSize:12,background:"#fff"}}>
                <option value="">— Chọn điều kiện —</option>
                {availableOps.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
          )}

          {sourceId && operator && !["answered","not_answered"].includes(operator) && (
            <div>
              <span style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4}}>Giá trị</span>
              {getValueInput()}
            </div>
          )}

          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={() => { onChange(null); setOpen(false); }}
              style={{padding:"5px 12px",borderRadius:7,border:"1px solid " + C.border,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:600,color:C.textSub,fontFamily:C.font}}>
              Xóa điều kiện
            </button>
            <button onClick={() => setOpen(false)}
              style={{padding:"5px 12px",borderRadius:7,border:"none",background:C.primary,cursor:"pointer",fontSize:11,fontWeight:600,color:"#fff",fontFamily:C.font}}>
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -- QuestionCard -- */
function QuestionCard({ q, index, isActive, onActivate, onSave, onCancel, onDelete, onDuplicate, deletingId, sections, questions, surveyId }) {
  const [contentHtml, setContentHtml] = useState(q.content ?? "");
  const [type,        setType]        = useState(toFEType(q.type));
  const [sectionId,   setSectionId]   = useState(q.section_id ?? null);
  const [required,    setRequired]    = useState(q.required ?? true);
  const [description, setDescription] = useState(q.description ?? "");
  const [placeholder, setPlaceholder] = useState(q.placeholder ?? "");
  const [mediaUrl,    setMediaUrl]   = useState(q.media_url ?? "");
  const [uploading,   setUploading]  = useState(false);
  const [condition,  setCondition]  = useState(q.condition ?? null);

  const existingOptions = q.options ?? q.option ?? [];
  const [optionRows, setOptionRows] = useState(
    existingOptions.length > 0
      ? existingOptions.map(o =>
          typeof o === "string"
            ? { label: o, value: o, order_index: 0, is_other: false, image: null }
            : {
                label: o.label ?? "",
                value: o.value ?? "",
                order_index: o.order_index ?? 0,
                is_other: o.is_other ?? false,
                image: o.image_url ? { url: o.image_url } : null}
        )
      : [newOptionRow()]
  );
  const [settings,   setSettings]   = useState(q.settings ?? null);
  const [saving,     setSaving]     = useState(false);
  const [hovered,    setHovered]    = useState(false);

  const isChoice    = CHOICE_TYPES.includes(type);
  const hasSettings = SETTINGS_TYPES.includes(type);
  const isDeleting  = deletingId === q.id;

  const handleTypeChange = (newType) => {
    setType(newType);
    if (CHOICE_TYPES.includes(newType) && !CHOICE_TYPES.includes(type)) {
      setOptionRows([newOptionRow()]);
    }
    if (!SETTINGS_TYPES.includes(newType)) setSettings(null);
    if (newType === "RATING") setSettings({ min: 1, max: 5 });
    if (newType === "LINEAR_SCALE") setSettings({ min: 1, max: 5 });
  };

  const handleSave = async () => {
    const plainContent = getPlainText(contentHtml).trim();
    if (!plainContent) return;

    if (isChoice) {
      const validOpts = buildBEOptions(optionRows);
      if (validOpts.length < 2) return;
    }

    setSaving(true);
    let finalMediaUrl = mediaUrl.trim() || null;
    if (finalMediaUrl && finalMediaUrl.startsWith("blob:")) {
      const blobRes = await fetch(finalMediaUrl);
      const blob = await blobRes.blob();
      const file = new File([blob], "question_image.png", { type: blob.type });
      try {
        const uploadRes = await mediaService.uploadQuestionMedia(file);
        finalMediaUrl = uploadRes?.url || uploadRes?.data?.url || null;
      } catch (err) {
        console.error("[SaveQuestion] Image upload failed:", err);
      }
    }

    let finalOptionRows = optionRows;
    if (isChoice) {
      const rowsWithFiles = optionRows.filter(r => r.image?.url?.startsWith("blob:"));
      if (rowsWithFiles.length > 0) {
        finalOptionRows = await Promise.all(optionRows.map(async (row) => {
          if (!row.image?.url?.startsWith("blob:")) return row;
          try {
            const blobRes = await fetch(row.image.url);
            const blob = await blobRes.blob();
            const file = new File([blob], "option_image.png", { type: blob.type });
            const uploadRes = await mediaService.uploadOptionMedia(file);
            const uploadedUrl = uploadRes?.url || uploadRes?.data?.url;
            return { ...row, image: uploadedUrl ? { url: uploadedUrl } : row.image };
          } catch (err) {
            console.error("[SaveQuestion] Option image upload failed:", err);
            return row;
          }
        }));
      }
    }

    const payload = {
      content:  contentHtml,
      type:     toBEType(type),
      required,
      settings: hasSettings ? settings : undefined,
      description: description.trim() || null,
      placeholder: placeholder.trim() || null,
      media_url: finalMediaUrl,
      section_id: sectionId || null,
      condition: condition || null};
    if (isChoice) payload.options = buildBEOptions(finalOptionRows);

   try { await onSave(q.id, surveyId, payload); }
    finally { setSaving(false); }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!MEDIA_TYPES.includes(file.type)) { alert("Chỉ hỗ trợ ảnh JPG, PNG, GIF, WEBP"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File quá lớn. Tối đa 5MB."); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await surveyService.uploadQuestionMedia(formData);
      const data = res?.data ?? res;
      setMediaUrl(data?.url || data?.data?.url || "");
    } catch (err) {
      console.error(err);
      alert("Upload thịt bởi: " + (err?.response?.data?.message || err.message));
    } finally { setUploading(false); }
  };

  if (!isActive) {
    return (
      <div
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
        onClick={()=>onActivate(q.id)}
        style={{
          background: C.surface,
          border: "1px solid " + C.border,
          borderRadius: 10,
          padding: 12,
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", position: "relative",
          transition: "all .18s ease"}}
      >
        <div style={{opacity:hovered?1:0,transition:"opacity .15s",flexShrink:0,display:"flex"}}>
          <GripVertical size={14} color={"#888"} style={{cursor:"grab"}}/>
        </div>
        <span style={{
          display:"inline-flex",alignItems:"center",justifyContent:"center",
          width:18,height:18,borderRadius:"50%",
          background:C.primaryLight,color:C.primary,
          fontSize:10,fontWeight:600,flexShrink:0}}>
          {index+1}
        </span>

        <p
          style={{flex:1,margin:0,fontSize:13,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
          dangerouslySetInnerHTML={{
            __html: q.content
              ? q.content
              : "<em style=\"color:" + C.textDim + ";font-weight:400\">Câu hỏi chưa có tiêu đề</em>"
          }}
        />

        <span style={{
          fontSize:11,fontWeight:500,flexShrink:0,
          background:C.primaryBg,color:C.primary,
          padding:"1px 8px",borderRadius:999}}>
  {Q_TYPES.find(t=>t.value===toFEType(q.type))?.label}
</span>

{sections?.length > 0 && (
  <select
    value={q.section_id || ""}
    onClick={e => e.stopPropagation()}
    onChange={async (e) => {
      e.stopPropagation();
      await onSave(q.id, surveyId, {
        content:    q.content,
        type:       q.type,
        required:   q.required,
        options:    q.options,
        settings:   q.settings,
        description: q.description,
        placeholder: q.placeholder,
        media_url:   q.media_url,
        condition:   q.condition,
        section_id:  e.target.value || null});
    }}
    style={{
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 6,
      border: "1px solid " + C.border,
      background: C.surface,
      color: C.textSub,
      cursor: "pointer",
      fontFamily: C.font,
      outline: "none",
      maxWidth: 110,
      flexShrink: 0}}
  >
    <option value="">Chưa phân trang</option>
    {sections.map(s => (
      <option key={s.id} value={s.id}>
        {s.title?.slice(0, 14)}
      </option>
    ))}
  </select>
)}

<button onClick={e=>{e.stopPropagation();onDelete(q.id);}} disabled={isDeleting}
        style={{...iconBtn("#CCC"),flexShrink:0}}
        onMouseEnter={e=>{e.currentTarget.style.background=C.errorBg;e.currentTarget.style.color=C.error;e.currentTarget.style.borderColor=C.errorBorder;}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#CCC";e.currentTarget.style.borderColor="transparent";}}>
        {isDeleting?<Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>:<Trash2 size={11}/>}
      </button>
      </div>
    );
  }

  return (
    <div style={{
      background: C.surface,
      border: "1px solid " + C.primary,
      borderRadius: 10}}>
      <div style={{display:"flex",justifyContent:"center",padding:"5px 0",borderBottom:"1px solid " + C.border}}>
        <GripVertical size={14} color={"#888"} style={{cursor:"grab"}}/>
      </div>

      <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px 0"}}>
        <div style={{flex:1}}>
          <span style={{...lbl,marginBottom:4}}>Nội dung câu hỏi</span>
          <RichTextEditor
            value={contentHtml}
            onChange={setContentHtml}
            placeholder="Câu hỏi không có tiêu đề"
            minHeight={44}
          />
        </div>
        <div style={{marginTop:18,minWidth:180}}>
          <QuestionTypeDropdown value={type} onChange={handleTypeChange}/>
        </div>
      </div>

      <div style={{padding:"6px 14px 0",paddingLeft:28,display:"flex",flexDirection:"column",gap:6}}>
        <div>
          <span style={{...lbl, marginBottom:3}}>Mô tả câu hỏi (tùy chọn)</span>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Thêm gợi ý hoặc mô tả cho câu hỏi..."
            style={{...inp(false), padding:"6px 10px", fontSize:12}}
          />
        </div>
        {["TEXT","PARAGRAPH","EMAIL","DATE","NUMBER","TIME"].includes(type) && (
          <div>
            <span style={{...lbl, marginBottom:3}}>Placeholder (tùy chọn)</span>
            <input
              type="text"
              value={placeholder}
              onChange={e => setPlaceholder(e.target.value)}
              placeholder="Văn bản gợi ý trong ô nhập liệu..."
              style={{...inp(false), padding:"6px 10px", fontSize:12}}
            />
          </div>
        )}
      </div>

      <div style={{padding:"6px 14px 0",paddingLeft:28}}>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <span style={{...lbl, marginBottom:3}}>Hình ảnh / Video (URL tùy chọn)</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input
              type="url"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={{...inp(false), padding:"6px 10px", fontSize:12, flex:1}}
            />
            <label style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"6px 10px",border:"1px solid " + C.border,borderRadius:6,cursor:"pointer",fontSize:11,color:"#9CA3AF",background:C.surfaceHover,transition:"all .12s"}}
              onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.surfaceHover; e.currentTarget.style.color = "#9CA3AF"; }}>
              {uploading ? <Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> : <ImagePlus size={12}/>}
              <input type="file" accept="image/*" onChange={handleMediaUpload} style={{display:"none"}}/>
            </label>
          </div>
          {mediaUrl && (
            <div style={{marginTop:4}}>
              <img src={mediaUrl} alt="Preview" style={{maxWidth:100,maxHeight:60,borderRadius:6,objectFit:"cover",border:"1px solid " + C.border}}/>
            </div>
          )}
        </div>
      </div>

      <div style={{padding:"6px 14px 0",paddingLeft:28}}>
        <span style={{...lbl, marginBottom:3}}>Trang / Phần</span>
        <select
          value={sectionId || ""}
          onChange={e => setSectionId(e.target.value || null)}
          style={{
            width:"100%",padding:"6px 10px",
            border:"1px solid " + C.border,borderRadius:6,
            fontSize:12,fontFamily:C.font,color:C.text,
            background:"#fff",outline:"none",cursor:"pointer"}}
        >
          <option value="">— Không thuộc trang nào —</option>
          {sections.map(s => (
            <option key={s.id} value={s.id}>{s.title || "Không có tiêu đề"}</option>
          ))}
        </select>
      </div>

      <div style={{padding:"6px 14px 0",paddingLeft:28}}>
        <ConditionEditor
          questions={questions}
          currentQId={q.id}
          value={condition}
          onChange={setCondition}
        />
      </div>

      <div style={{padding:"8px 14px 0",paddingLeft:28,display:"flex",flexDirection:"column",gap:12}}>
        {isChoice && (
          <InlineOptionBuilder qType={type} optionRows={optionRows} onChange={setOptionRows}/>
        )}
        {hasSettings && (
          <SettingsEditor type={type} settings={settings} onChange={setSettings}/>
        )}
        {!isChoice && !hasSettings && (
          <QuestionBody q={q} type={type}/>
        )}
      </div>

      <div style={{
        display:"flex", alignItems:"center", justifyContent:"flex-end",
        gap:4, padding:"10px 14px 12px",
        borderTop:"1px solid " + C.border, marginTop:10}}>
        <button onClick={()=>onDuplicate(q)} title="Nhân đôi"
          style={iconBtn("#9CA3AF")}
          onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHover}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <Copy size={13}/>
        </button>
        <button onClick={()=>onDelete(q.id)} disabled={isDeleting} title="Xóa"
          style={iconBtn(C.error,C.errorBorder,C.errorBg)}
          onMouseEnter={e=>e.currentTarget.style.background="#fee2e2"}
          onMouseLeave={e=>e.currentTarget.style.background=C.errorBg}>
          {isDeleting?<Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>:<Trash2 size={13}/>}
        </button>

        <div style={{width:1,height:20,background:C.border,margin:"0 6px"}}/>
        <Toggle checked={required} onChange={setRequired}/>
        <div style={{width:1,height:20,background:C.border,margin:"0 6px"}}/>

        <button onClick={handleSave} disabled={saving} style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"0 12px",
          background:C.primary,
          color:"#fff",
          border:"none",
          borderRadius:8, fontSize:13, fontWeight:600,
          cursor:saving?"not-allowed":"pointer",
          fontFamily:C.font, height:32}}>
          {saving&&<Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>}
          Lưu
        </button>
        <button onClick={onCancel} style={{
          padding:"0 12px", background:"#fff",
          border:"1px solid " + C.primary, borderRadius:8,
          fontSize:13, fontWeight:600, color:C.primary,
          cursor:"pointer", fontFamily:C.font, height:32,
          transition:"background .12s"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg}
          onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
          Đóng
        </button>
      </div>
    </div>
  );
}



/* -- Survey title / description (view + edit) -- */
function SurveyHeroCard({ loading, title, description, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [localErr, setLocalErr] = useState("");

  const cardBase = {
    background: C.surface,
    border: "1px solid " + C.border,
    borderRadius: 10,
    padding: 14};

  const startEdit = () => {
    setDraftTitle(title);
    setDraftDesc(description || "");
    setLocalErr("");
    setEditing(true);
  };

  if (loading) {
    return (
      <div style={{ ...cardBase, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
        <Loader2 size={20} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={cardBase}>
      {!editing ? (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: C.textDim, textTransform: "uppercase" }}>
              Khảo sát của bạn
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "6px 0 8px", lineHeight: 1.25 }}>
              {title?.trim() ? <span dangerouslySetInnerHTML={{ __html: title }} /> : "Chưa đặt tiêu đề cho khảo sát này."}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {description?.trim() ? <span dangerouslySetInnerHTML={{ __html: description }} /> : "Chưa có mô tả cho khảo sát này."}
            </p>
          </div>
          <button
            type="button"
            onClick={startEdit}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 12px", background: "#fff",
              border: "1px solid " + C.primary, borderRadius: 8,
              fontSize: 13, fontWeight: 600, color: C.primary,
              cursor: "pointer", fontFamily: C.font, height: 32, flexShrink: 0}}
          >
            <Pencil size={13} />
            Sửa
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <span style={{ ...lbl, marginBottom: 4, display: "block" }}>Tiêu đề</span>
              <RichTextEditor
                value={draftTitle}
                onChange={(v) => { setDraftTitle(v); setLocalErr(""); }}
                placeholder="Tên khảo sát"
                minHeight={36}
              />
            </div>
            <div>
              <span style={{ ...lbl, marginBottom: 4, display: "block" }}>Mô tả</span>
              <RichTextEditor
                value={draftDesc}
                onChange={(v) => { setDraftDesc(v); setLocalErr(""); }}
                placeholder="Mô tả khảo sát"
                minHeight={60}
              />
            </div>
          </div>
          {localErr && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12,
              color: C.error, background: C.errorBg, padding: "6px 10px", borderRadius: 6,
              border: "1px solid " + C.errorBorder}}>
              <AlertCircle size={13} />
              {localErr}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => { setEditing(false); setLocalErr(""); }}
              style={{
                padding: "0 12px", background: "#fff",
                border: "1px solid " + C.primary, borderRadius: 8,
                fontSize: 13, fontWeight: 600, color: C.primary,
                cursor: "pointer", fontFamily: C.font, height: 32}}
            >
              Huỷ
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                const t = draftTitle.trim();
                if (!t) { setLocalErr("Tiêu đề không được để trống."); return; }
                try {
                  await onSave(t, draftDesc.trim());
                  setEditing(false);
                } catch {}
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0 12px",
                background: C.primary,
                color: "#fff",
                border: "none",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                height: 32,
                cursor: saving ? "not-allowed" : "pointer", fontFamily: C.font}}
            >
              {saving && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* -- QuestionPage -- */
export default function QuestionPage({ surveyTitle: propTitle, surveyDescription: propDesc } = {}) {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { updateSurvey } = useSurvey();
  const {
    questions, loading,
    createQuestion, fetchQuestionsBySurvey,
    updateQuestion, deleteQuestion, bulkCreateQuestions} = useQuestion();

  const [surveyTitle, setSurveyTitle] = useState(propTitle ?? "");
  const [surveyDescription, setSurveyDescription] = useState(propDesc ?? "");
  const [surveyMetaLoading, setSurveyMetaLoading] = useState(!propTitle);
  const [metaSaving, setMetaSaving] = useState(false);

  const [activeId,    setActiveId]    = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [aiOpen,      setAiOpen]      = useState(false);

  const [contentHtml, setContentHtml] = useState("");
  const [type,        setType]        = useState("TEXT");
  const [required,    setRequired]    = useState(true);
  const [description, setDescription] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [mediaUrl,    setMediaUrl]    = useState("");
  const [optionRows,  setOptionRows]  = useState([newOptionRow()]);
  const [settings,    setSettings]    = useState(null);
  const [formError,   setFormError]   = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [qImage,      setQImage]      = useState(null);

  const [deletingId,  setDeletingId]  = useState(null);
  const pendingIdRef = useRef(null);

  const [sections,       setSections]       = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [addingSection,  setAddingSection]  = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

const fetchSections = useCallback(async (sid) => {
  if (!sid) return;
  setSectionsLoading(true);
  try {
    const res = await surveyService.getSections(sid);
    const data = res?.data?.sections ?? res?.data?.data ?? res?.data ?? [];
    setSections(Array.isArray(data) ? data : []);
  } catch {
    setSections([]);
  } finally {
    setSectionsLoading(false);
  }
}, []);
  useEffect(() => {
    if (surveyId) {
      fetchSections(surveyId);
      setActiveSectionId(null);
    }
  }, [surveyId, fetchSections]);

  const handleCreateSection = async (title) => {
    const t = (title || newSectionTitle).trim();
    if (!t) return;
    try {
      const res = await surveyService.createSection(surveyId, {
        title: t,
        order_index: sections.length});
      const created = res?.data?.section ?? res?.data?.data ?? res?.data;
      if (created) {
        setSections(prev => [...prev, created]);
        setNewSectionTitle("");
        setAddingSection(false);
      }
    } catch {}
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      await surveyService.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      if (activeSectionId === sectionId) setActiveSectionId(null);
    } catch {}
  };

  const questionsBySection = useCallback(() => {
    const grouped = {};
    grouped["__none__"] = questions.filter(q => !q.section_id);
    sections.forEach(s => {
      grouped[s.id] = questions.filter(q => q.section_id === s.id);
    });
    return grouped;
  }, [questions, sections]);

  const displayedQuestions = activeSectionId
    ? questions.filter(q => q.section_id === activeSectionId)
    : questions;

  const sectionCount = sections.length;
  const noSectionCount = questions.filter(q => !q.section_id).length;

  useEffect(() => { if (propTitle !== undefined && propTitle !== surveyTitle) setSurveyTitle(propTitle); }, [propTitle]);
  useEffect(() => { if (propDesc !== undefined && propDesc !== surveyDescription) setSurveyDescription(propDesc); }, [propDesc]);
  useEffect(() => { if (surveyId) fetchQuestionsBySurvey(surveyId); }, [surveyId]);

  useEffect(() => {
    if (propTitle !== undefined) return;
    let cancelled = false;
    if (!surveyId) return;
    (async () => {
      setSurveyMetaLoading(true);
      try {
        const res = await surveyService.getSurveyById(surveyId);
        const body = res?.data;
        const s = body?.data ?? body?.survey ?? (body?.id != null ? body : null);
        if (!cancelled && s) {
          setSurveyTitle(s.title || "");
          setSurveyDescription(s.description || "");
        }
      } catch {
        if (!cancelled) {
          setSurveyTitle("");
          setSurveyDescription("");
        }
      } finally {
        if (!cancelled) setSurveyMetaLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [surveyId, propTitle]);

  useEffect(() => {
    if (!pendingIdRef.current) return;
    const found = questions.find(q => q.id === pendingIdRef.current);
    if (found) { setActiveId(found.id); pendingIdRef.current = null; }
  }, [questions]);

  const resetForm = () => {
    setContentHtml("");
    setType("TEXT");
    setRequired(true);
    setDescription("");
    setPlaceholder("");
    setMediaUrl("");
    setOptionRows([newOptionRow()]);
    setSettings(null);
    setFormError("");
    setQImage(null);
  };

  const handleFormTypeChange = (v) => {
    setType(v);
    setFormError("");
    if (!CHOICE_TYPES.includes(v)) setOptionRows([newOptionRow()]);
    if (!SETTINGS_TYPES.includes(v)) setSettings(null);
    if (v === "RATING") setSettings({ min: 1, max: 5 });
    if (v === "LINEAR_SCALE") setSettings({ min: 1, max: 5 });
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    const plainContent = getPlainText(contentHtml).trim();
    if (!plainContent) {
      setFormError("Nội dung câu hỏi không được để trống.");
      return;
    }

    const isChoice    = CHOICE_TYPES.includes(type);
    const hasSettings = SETTINGS_TYPES.includes(type);

    if (isChoice) {
      const valid = buildBEOptions(optionRows);
      if (valid.length < 2) {
        setFormError("Cần ít nhất 2 lựa chọn hợp lệ (label và value không được rỗng).");
        return;
      }
    }

    if (type === "NUMBER" && settings?.min !== undefined && settings?.max !== undefined) {
      if (settings.min > settings.max) {
        setFormError("Min phải nhỏ hơn hoặc bằng Max.");
        return;
      }
    }

    setFormError("");

    let finalMediaUrl = mediaUrl.trim() || null;
    if (qImage?.file) {
      try {
        const uploadRes = await mediaService.uploadQuestionMedia(qImage.file);
        finalMediaUrl = uploadRes?.url || uploadRes?.data?.url || finalMediaUrl;
      } catch (err) {
        console.error("[AddQuestion] Image upload failed:", err);
        toast.error("Upload ảnh thịt bởi. Câu hỏi s? được tạo không có ảnh.");
      }
    }

    let finalOptionRows = optionRows;
    if (isChoice) {
      const rowsWithImages = optionRows.filter(r => r.image?.file);
      if (rowsWithImages.length > 0) {
        finalOptionRows = await Promise.all(optionRows.map(async (row) => {
          if (!row.image?.file) return row;
          try {
            const uploadRes = await mediaService.uploadOptionMedia(row.image.file);
            const uploadedUrl = uploadRes?.url || uploadRes?.data?.url;
            return { ...row, image: uploadedUrl ? { url: uploadedUrl } : row.image };
          } catch (err) {
            console.error("[AddQuestion] Option image upload failed:", err);
            return row;
          }
        }));
      }
    }

    const payload = {
      content:     contentHtml,
      type:        toBEType(type),
      required,
      order_index: questions.length,
      settings:    hasSettings ? settings : undefined,
      description: description.trim() || null,
      placeholder: placeholder.trim() || null,
      media_url: finalMediaUrl,
      section_id: activeSectionId || null};

    if (isChoice) {
      payload.options = buildBEOptions(finalOptionRows);
    }

    setShowForm(false);
    resetForm();

    setFormLoading(true);
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingIdRef.current = created.id;
    } catch {} finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteQuestion(id, surveyId); if (activeId === id) setActiveId(null); }
    finally { setDeletingId(null); }
  };

  const handleDuplicate = useCallback(async (q) => {
    const opts = q.options ?? q.option ?? [];
    const payload = {
      content:     q.content + " (bản sao)",
      type:        toBEType(toFEType(q.type)),
      required:    q.required,
      order_index: questions.length,
      settings:    q.settings ?? undefined,
      description: q.description ?? null,
      placeholder: q.placeholder ?? null,
      media_url:   q.media_url ?? null,
      section_id:  q.section_id ?? null};
    const feType = toFEType(q.type);
    if (CHOICE_TYPES.includes(feType) && opts.length > 0) {
      payload.options = opts
        .map((o, i) => ({
          label:       typeof o === "string" ? o : (o.label ?? ""),
          value:       typeof o === "string" ? o : (o.value ?? ""),
          order_index: i,
          is_other:    typeof o === "object" ? (o.is_other ?? false) : false}))
        .filter(o => o.label && o.value);
    }
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingIdRef.current = created.id;
    } catch {}
  }, [questions, surveyId, createQuestion, fetchQuestionsBySurvey]);

  const handleUpdate = useCallback(async (id, sid, payload) => {
    const mappedPayload = {
      ...payload,
      type: payload.type ? toBEType(toFEType(payload.type)) : undefined};
    delete mappedPayload.option;
    if (Array.isArray(mappedPayload.options)) {
      mappedPayload.options = mappedPayload.options
        .map((o, i) =>
          typeof o === "string"
            ? { label: o, value: o, order_index: i, is_other: false }
            : o
        )
        .filter(o => o.label && o.value);
    }
    await updateQuestion(id, sid, mappedPayload);
    setActiveId(null);
  }, [updateQuestion]);

  const triggerAdd = () => {
    setShowForm(v => !v);
    setFormError("");
    setActiveId(null);
    if (showForm) resetForm();
  };

  const handleSaveSurveyMeta = async (title, description) => {
    setMetaSaving(true);
    try {
      const updated = await updateSurvey(surveyId, {
        title,
        description: description || undefined});
      if (updated) {
        setSurveyTitle(updated.title);
        setSurveyDescription(updated.description || "");
      }
    } finally {
      setMetaSaving(false);
    }
  };

  const isChoice    = CHOICE_TYPES.includes(type);
  const hasSettings = SETTINGS_TYPES.includes(type);

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:0,fontFamily:C.font,position:"relative",overflowX:"hidden"}}>
      <div style={{position:"relative",zIndex:1}}>

      <div style={{
        maxWidth:1000,margin:"0 auto",padding:"0 20px 24px",
        display:"flex",gap:14,alignItems:"flex-start"}}>

        <div style={{width:180,flexShrink:0}}>
          <SectionPanel
            sections={sections}
            activeSectionId={activeSectionId}
            onSelect={setActiveSectionId}
            onDelete={handleDeleteSection}
            onAdd={handleCreateSection}
          />
        </div>

        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:10}}>

          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            flexWrap:"wrap",gap:10}}>
            <button
              type="button"
              onClick={() => navigate(ROUTERS.USER.MY_SURVEYS)}
              style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"0 12px",
                background:"#fff",
                border:"1px solid " + C.primary,
                borderRadius:8,fontSize:13,fontWeight:600,color:C.primary,
                cursor:"pointer",fontFamily:C.font,height:32}}
            >
              <ChevronLeft size={16} strokeWidth={2} />
              DS khảo sát
            </button>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              {formLoading && <Loader2 size={13} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>}
              <span style={{fontSize:12,color:C.textSub,fontWeight:500}}>{questions.length} câu hỏi</span>
              <button
                type="button"
                onClick={() => { setAiOpen(true); setShowForm(false); setActiveId(null); }}
                style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"0 12px",
                  background:"#fff",
                  color:C.primary,
                  border:"1px solid " + C.primary,
                  borderRadius:8,fontSize:13,fontWeight:600,
                  cursor:"pointer",fontFamily:C.font,height:32}}
              >
                <Sparkles size={15} />
                AI
              </button>
              <button type="button" onClick={triggerAdd} style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"0 12px",
                background:C.primary,
                color:"#fff",
                border:"none",
                borderRadius:8,fontSize:13,fontWeight:600,
                cursor:"pointer",fontFamily:C.font,height:32}}>
                {showForm?<X size={15}/>:<Plus size={15}/>}
                {showForm?"Huỷ":"Câu hỏi"}
              </button>
            </div>
          </div>

          <SurveyHeroCard
            loading={surveyMetaLoading}
            title={surveyTitle}
            description={surveyDescription}
            saving={metaSaving}
            onSave={handleSaveSurveyMeta}
          />

          {showForm && (
            <div style={{
              background:C.surface,
              border:"1px solid " + C.primary,borderRadius:10,
              padding:14}}>
              <h2 style={{fontSize:15,fontWeight:600,color:C.text,margin:"0 0 12px"}}>Câu hỏi mới</h2>
              <form onSubmit={handleAdd}>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>

                  <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <span style={lbl}>Nội dung câu hỏi *</span>
                      <RichTextEditor
                        value={contentHtml}
                        onChange={(html) => { setContentHtml(html); setFormError(""); }}
                        placeholder="Nhập nội dung câu hỏi..."
                        minHeight={56}
                        hasError={!!formError && !getPlainText(contentHtml).trim()}
                      />
                    </div>
                    <div style={{minWidth:180}}>
                      <span style={lbl}>Loại câu hỏi</span>
                      <QuestionTypeDropdown value={type} onChange={handleFormTypeChange}/>
                    </div>
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <div>
                      <span style={lbl}>Mô tả câu hỏi (tùy chọn)</span>
                      <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Thêm gợi ý hoặc mô tả..."
                        style={{...inp(false), padding:"6px 10px", fontSize:12}}/>
                    </div>
                    {["TEXT","PARAGRAPH","EMAIL","DATE","NUMBER","TIME"].includes(type) && (
                      <div>
                        <span style={lbl}>Placeholder (tùy chọn)</span>
                        <input type="text" value={placeholder} onChange={e => setPlaceholder(e.target.value)}
                          placeholder="Văn bản gợi ý trong ô nhập liệu..."
                          style={{...inp(false), padding:"6px 10px", fontSize:12}}/>
                      </div>
                    )}
                    <div>
                      <span style={lbl}>Hình ảnh / Video (tùy chọn)</span>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { toast.error("File quá lớn. Tối đa 5MB."); return; }
                            setQImage({ file, url: URL.createObjectURL(file) });
                            e.target.value = "";
                          }}
                          style={{display:"none"}}
                          id="q-image-upload"
                        />
                        <label htmlFor="q-image-upload" style={{
                          display:"inline-flex",alignItems:"center",gap:6,
                          padding:"6px 10px",border:"1px solid " + C.border,borderRadius:6,
                          cursor:"pointer",fontSize:11,color:"#9CA3AF",background:C.surfaceHover,
                          transition:"all .12s"}}>
                          <ImagePlus size={13}/> Chọn ảnh
                        </label>
                        {qImage && (
                          <img src={qImage.url} alt="Preview" style={{maxWidth:60,maxHeight:40,borderRadius:6,objectFit:"cover",border:"1px solid " + C.border}}/>
                        )}
                        {qImage && (
                          <button type="button" onClick={() => { setQImage(null); }}
                            style={{padding:"3px 8px",border:"none",borderRadius:6,background:"rgba(239,68,68,0.1)",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:600}}>
                            Xóa
                          </button>
                        )}
                        <input
                          type="url"
                          value={mediaUrl}
                          onChange={e => { setMediaUrl(e.target.value); setQImage(null); }}
                          placeholder="Hoặc dán URL ảnh..."
                          style={{...inp(false), padding:"6px 10px", fontSize:12, flex:1, maxWidth:180}}
                        />
                      </div>
                    </div>
                  </div>

                  <Toggle checked={required} onChange={setRequired}/>

                  {isChoice && (
                    <InlineOptionBuilder
                      qType={type}
                      optionRows={optionRows}
                      onChange={(rows) => { setOptionRows(rows); setFormError(""); }}
                    />
                  )}

                  {hasSettings && (
                    <SettingsEditor type={type} settings={settings} onChange={setSettings}/>
                  )}

                  {formError && (
                    <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.error,background:C.errorBg,padding:"6px 10px",borderRadius:6,border:"1px solid " + C.errorBorder}}>
                      <AlertCircle size={13}/>{formError}
                    </div>
                  )}

                  <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                    <button
                      type="button"
                      onClick={()=>{ setShowForm(false); resetForm(); }}
                      style={{
                        padding:"0 12px",background:"#fff",
                        border:"1px solid " + C.primary,borderRadius:8,
                        fontSize:13,fontWeight:600,color:C.primary,
                        cursor:"pointer",fontFamily:C.font,height:32,
                        transition:"background .12s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}
                    >
                      Huỷ
                    </button>
                    <button type="submit" disabled={formLoading} style={{
                      display:"flex",alignItems:"center",gap:6,
                      padding:"0 12px",
                      background:formLoading?C.surfaceHover:C.primary,
                      color:"#fff",
                      border:"none",
                      borderRadius:8,fontSize:13,fontWeight:600,
                      cursor:formLoading?"not-allowed":"pointer",height:32,
                      fontFamily:C.font}}>
                      {formLoading
                        ? <Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>
                        : <Plus size={12}/>
                      }
                      {formLoading ? "Đang thêm..." : "Thêm"}
                    </button>
                  </div>

                </div>
              </form>
            </div>
          )}

          {loading && questions.length === 0 ? (
            <div style={{display:"flex",justifyContent:"center",padding:"3rem 0"}}>
              <Loader2 size={24} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>
            </div>
          ) : questions.length === 0 ? (
            <div style={{
              display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",gap:12,
              background:C.surface,
              borderRadius:10,padding:16,border:"1px solid " + C.border}}>
              <Inbox size={44} strokeWidth={1.2} color={C.textDim}/>
              <p style={{fontSize:14,margin:0,color:C.text,fontWeight:600}}>Chưa có câu hỏi nào</p>
              <p style={{fontSize:12,margin:0,color:C.textSub}}>Hãy tạo câu hỏi đầu tiên hoặc nhờ AI gợi ý</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                <button type="button" onClick={()=>setShowForm(true)} style={{
                  fontSize:13,fontWeight:600,color:"#fff",background:C.primary,
                  border:"none",cursor:"pointer",borderRadius:8,
                  padding:"0 12px",height:32,fontFamily:C.font}}>
                  + Câu hỏi đầu tiên
                </button>
                <button type="button" onClick={()=>setAiOpen(true)} style={{
                  fontSize:13,fontWeight:600,color:C.primary,background:"#fff",
                  border:"1px solid " + C.primary,cursor:"pointer",borderRadius:8,
                  padding:"0 12px",height:32,fontFamily:C.font,
                  display:"flex",alignItems:"center",gap:6}}>
                  <Sparkles size={14} /> Trợ lý AI
                </button>
              </div>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {activeSectionId && (() => {
                const sec = sections.find(s => s.id === activeSectionId);
                return sec ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.primaryBg,borderRadius:6,border:"1px solid " + C.primaryLight}}>
                    <Layout size={14} color={C.primary}/>
                    <span style={{fontSize:12,fontWeight:600,color:C.primary}}>{sec.title}</span>
                    <span style={{fontSize:11,color:C.textSub,marginLeft:"auto"}}>{displayedQuestions.length} câu hỏi</span>
                  </div>
                ) : null;
              })()}

              {displayedQuestions.map((q, index) => (
                <QuestionCard
                  key={q.id} q={q} index={index}
                  isActive={activeId === q.id}
                  onActivate={(id) => { setActiveId(id); setShowForm(false); }}
                  onSave={handleUpdate}
                  onCancel={() => setActiveId(null)}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  deletingId={deletingId}
                  sections={sections}
                  questions={questions}
                  surveyId={surveyId} 
                />
              ))}
            </div>
          )}
        </div>

      </div>

      <AiQuestionAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        surveyId={surveyId}
        surveyTitle={surveyTitle}
        surveyDescription={surveyDescription}
        existingCount={questions.length}
        C={C}
        onApplied={(payload) => bulkCreateQuestions(surveyId, payload)}
      />

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    </div>
  );
}

// ─── QuestionPage.jsx ─── Google Forms editor style, dark theme ──
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuestion } from "@/providers/QuestionProvider";
import {
  Plus, Trash2, Loader2, AlertCircle, Inbox, X,
  Pencil, Check, GripVertical, PlusCircle, Image,
  Type, AlignLeft, ChevronDown, List, CheckSquare,
  ToggleLeft, Star, Grid, FileUp, Calendar, Clock,
  FileText, Video, Minus, Copy, Bold, Italic, Underline,
  Link, AlignLeft as AlignLeftIcon, AlignCenter, AlignRight,
  ImagePlus,
} from "lucide-react";

/* ── Design tokens ────────────────────────────────────────────────── */
const C = {
  bg:            "#080b14",
  surfaceLow:    "#0d1120",
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
  errorBg:       "#150f0f",
  errorBorder:   "#2a1010",
  font:          "'DM Sans','Plus Jakarta Sans',sans-serif",
};

/* ─────────────────────────────────────────────────────────────────────
 * TYPE MAPPING
 * ───────────────────────────────────────────────────────────────────── */
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
  DROPDOWN:        "DROPDOWN",
};

const toFEType = (beType) => BE_TO_FE_TYPE[beType] ?? "TEXT";
const toBEType = (feType) => feType;

/* ── Question type definitions (UI only) ──────────────────────────── */
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
  { value:"FILE_UPLOAD",     label:"Tải tệp lên",        icon:<FileUp size={15}/> },
];

const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];
const SETTINGS_TYPES = ["NUMBER", "RATING", "DATE"];

/* ── Shared helpers ───────────────────────────────────────────────── */
const inp = (err) => ({
  width:"100%", boxSizing:"border-box", padding:"10px 14px",
  background:C.bg, border:`1.5px solid ${err?C.error:C.border}`,
  borderRadius:10, color:C.text, fontSize:14,
  fontFamily:C.font, outline:"none", transition:"border-color .15s",
});
const lbl = {
  display:"block", fontSize:11, fontWeight:700,
  letterSpacing:"0.04em", textTransform:"uppercase",
  color:C.textSub, marginBottom:7,
};

function iconBtn(color, borderColor, bg) {
  return {
    display:"flex", alignItems:"center", justifyContent:"center",
    width:30, height:30, borderRadius:7,
    border:`1px solid ${borderColor??C.border}`,
    background:bg??"transparent", cursor:"pointer", color,
    transition:"background .12s", flexShrink:0,
  };
}

/* ── Default option row factory ───────────────────────────────────── */
const newOptionRow = () => ({ label: "", value: "", order_index: 0, is_other: false, image: null });

const buildBEOptions = (optionRows) =>
  optionRows
    .filter(r => r.label.trim() && r.value.trim())
    .map((r, i) => ({
      label:       r.label.trim(),
      value:       r.value.trim(),
      order_index: i,
      is_other:    r.is_other ?? false,
      // image is UI-only, not sent to BE
    }));

/* ── Toggle ───────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
      <span style={{fontSize:12,fontWeight:600,color:C.textSub}}>Bắt buộc</span>
      <div onClick={()=>onChange(!checked)} style={{
        width:44,height:24,borderRadius:999,
        background:checked?C.primary:C.surfaceHigh,
        position:"relative",transition:"background .2s",cursor:"pointer",
        border:`1px solid ${checked?C.primaryBorder:C.border}`,
      }}>
        <div style={{
          position:"absolute",top:3,left:checked?22:3,
          width:16,height:16,borderRadius:"50%",background:"#fff",
          transition:"left .2s",
        }}/>
      </div>
    </label>
  );
}

/* ── QuestionTypeDropdown ─────────────────────────────────────────── */
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
        background: C.surfaceHigh, border:`1px solid ${open?C.borderHover:C.border}`,
        borderRadius:8, cursor:"pointer", color:C.text, fontFamily:C.font, fontSize:13,
        justifyContent:"space-between",
      }}>
        <span style={{display:"flex",alignItems:"center",gap:8,color:C.textSub}}>
          {current.icon}
          <span style={{color:C.text}}>{current.label}</span>
        </span>
        <ChevronDown size={14} color={C.textSub} style={{transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0)"}}/>
      </button>

      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:20,
          background:C.surfaceHigh, border:`1px solid ${C.border}`,
          borderRadius:10, overflow:"hidden",
          boxShadow:"0 8px 24px rgba(0,0,0,0.5)", maxHeight:320, overflowY:"auto",
        }}>
          {Q_TYPES.map(t => (
            <button key={t.value} onClick={()=>{ onChange(t.value); setOpen(false); }}
              style={{
                display:"flex", alignItems:"center", gap:10,
                width:"100%", padding:"9px 14px",
                background: t.value===value ? C.primaryDim : "transparent",
                border:"none", fontSize:13, fontWeight:500,
                color: t.value===value ? C.primary : C.text,
                cursor:"pointer", fontFamily:C.font,
              }}
              onMouseEnter={e=>e.currentTarget.style.background=t.value===value?C.primaryDim:C.surface}
              onMouseLeave={e=>e.currentTarget.style.background=t.value===value?C.primaryDim:"transparent"}
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

/* ── ImageUploadButton — UI only, không gửi BE ────────────────────── */
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
        position:"relative", display:"inline-flex", borderRadius:8,
        overflow:"hidden", border:`1px solid ${C.border}`,
        width: size === "sm" ? 44 : 80,
        height: size === "sm" ? 44 : 60,
        flexShrink:0,
      }}>
        <img src={image.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <button
          type="button"
          onClick={() => onImageChange(null)}
          style={{
            position:"absolute",top:2,right:2,
            width:16,height:16,borderRadius:"50%",
            background:"rgba(0,0,0,0.75)",border:"none",
            color:"#fff",cursor:"pointer",fontSize:10,
            display:"flex",alignItems:"center",justifyContent:"center",
            lineHeight:1,
          }}
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
          borderRadius:7, border:`1px solid ${C.border}`,
          background:"transparent", color:C.textSub,
          cursor:"pointer", flexShrink:0,
          transition:"all .12s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.background=C.primaryDim;e.currentTarget.style.color=C.primary;e.currentTarget.style.borderColor=C.primary;}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textSub;e.currentTarget.style.borderColor=C.border;}}
      >
        <ImagePlus size={size === "sm" ? 13 : 15}/>
      </button>
    </>
  );
}

/* ── RichTextEditor ────────────────────────────────────────────────── */
function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung...", minHeight = 80, hasError = false }) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const imageInputRef = useRef(null);

  // Sync initial value once
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
    const img = `<img src="${url}" alt="" style="max-width:100%;max-height:200px;border-radius:6px;margin:4px 0;display:block;"/>`;
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
    // plain text paste
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
        width:26, height:26, borderRadius:5,
        border:"none", background:"transparent",
        color:C.textSub, cursor:"pointer",
        transition:"all .1s",
      }}
      onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceHigh;e.currentTarget.style.color=C.text;}}
      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textSub;}}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      border:`1.5px solid ${hasError ? C.error : isFocused ? C.primary : C.border}`,
      borderRadius:10, overflow:"hidden",
      transition:"border-color .15s",
      background:C.bg,
    }}>
      {/* Toolbar */}
      <div style={{
        display:"flex", alignItems:"center", gap:2, padding:"6px 10px",
        borderBottom:`1px solid ${C.border}`, background:C.surfaceHigh,
        flexWrap:"wrap",
      }}>
        {toolbarBtn("bold",    <Bold size={13}/>,      "In đậm")}
        {toolbarBtn("italic",  <Italic size={13}/>,    "In nghiêng")}
        {toolbarBtn("underline",<Underline size={13}/>,"Gạch chân")}

        <div style={{width:1,height:18,background:C.border,margin:"0 4px"}}/>

        {toolbarBtn("justifyLeft",   <AlignLeftIcon size={13}/>,  "Căn trái")}
        {toolbarBtn("justifyCenter", <AlignCenter size={13}/>,    "Căn giữa")}
        {toolbarBtn("justifyRight",  <AlignRight size={13}/>,     "Căn phải")}

        <div style={{width:1,height:18,background:C.border,margin:"0 4px"}}/>

        {toolbarBtn("insertUnorderedList", <span style={{fontSize:12,fontWeight:700}}>•—</span>, "Danh sách")}
        {toolbarBtn("insertOrderedList",   <span style={{fontSize:12,fontWeight:700}}>1.</span>,  "Danh sách số")}

        <div style={{width:1,height:18,background:C.border,margin:"0 4px"}}/>

        {/* Heading select */}
        <select
          onChange={e => { exec("formatBlock", e.target.value); e.target.value = "p"; }}
          defaultValue="p"
          style={{
            background:C.bg, border:`1px solid ${C.border}`, borderRadius:5,
            color:C.textSub, fontSize:11, padding:"2px 4px",
            cursor:"pointer", fontFamily:C.font, outline:"none",
          }}
        >
          <option value="p">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>

        <div style={{width:1,height:18,background:C.border,margin:"0 4px"}}/>

        {/* Image insert */}
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
            width:26, height:26, borderRadius:5,
            border:"none", background:"transparent",
            color:C.textSub, cursor:"pointer",
            transition:"all .1s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=C.primaryDim;e.currentTarget.style.color=C.primary;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textSub;}}
        >
          <ImagePlus size={13}/>
        </button>

        <div style={{marginLeft:"auto",fontSize:10,color:C.textDim}}>
          Ctrl+B · I · U
        </div>
      </div>

      {/* Editable area */}
      <div style={{position:"relative"}}>
        {isEmpty && (
          <div style={{
            position:"absolute", top:0, left:0, right:0,
            padding:"10px 14px", fontSize:14, color:C.textDim,
            pointerEvents:"none", userSelect:"none",
          }}>
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
            wordBreak:"break-word",
          }}
        />
      </div>
    </div>
  );
}

/* ── QuestionImageUploadArea — UI only ────────────────────────────── */
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
      <div style={{position:"relative",borderRadius:10,overflow:"hidden",border:`1px solid ${C.border}`,maxWidth:300}}>
        <img src={image.url} alt={image.name} style={{width:"100%",maxHeight:180,objectFit:"cover",display:"block"}}/>
        <div style={{
          position:"absolute",top:0,left:0,right:0,bottom:0,
          background:"rgba(0,0,0,0)",transition:"background .15s",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
        }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.5)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0)"}
        >
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              padding:"5px 10px",background:"rgba(0,0,0,0.7)",
              border:"none",borderRadius:6,color:"#fff",
              fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:C.font,
              opacity:0,transition:"opacity .15s",
            }}
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
              opacity:0,transition:"opacity .15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity="1"}
            onMouseLeave={e=>e.currentTarget.style.opacity="0"}
          >Xóa ảnh</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
        <div style={{padding:"5px 10px",fontSize:11,color:C.textDim,background:C.surfaceHigh}}>
          {image.name}
          <span style={{marginLeft:6,color:C.primary,fontSize:10}}>UI only · chưa gửi server</span>
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
          border:`1.5px dashed ${C.border}`,
          borderRadius:10,padding:"14px 20px",
          textAlign:"center",cursor:"pointer",
          color:C.textDim,fontSize:12,
          transition:"all .15s",background:"transparent",
          display:"flex",alignItems:"center",gap:10,
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.background=C.primaryDim;e.currentTarget.style.color=C.primary;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textDim;}}
      >
        <ImagePlus size={16}/>
        <span>Thêm ảnh cho câu hỏi · <span style={{color:C.textDim,fontSize:11}}>UI only</span></span>
      </div>
    </>
  );
}

/* ── OptionRow — for existing saved options (label/value schema) ───── */
function OptionRow({ opt, questionId, index, qType, onDelete, onUpdate }) {
  const [editing,  setEditing]  = useState(false);
  const [label,    setLabel]    = useState(opt.label ?? "");
  const [value,    setValue]    = useState(opt.value ?? "");
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [optImage, setOptImage] = useState(null); // UI only

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
      <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${C.textDim}`,flexShrink:0}}/>
    );
    if (qType === "DROPDOWN") return (
      <span style={{fontSize:12,color:C.textSub,minWidth:20,flexShrink:0}}>{index+1}.</span>
    );
    return (
      <div style={{width:16,height:16,borderRadius:"50%",border:`1.5px solid ${C.textDim}`,flexShrink:0}}/>
    );
  };

  return (
    <div style={{
      display:"flex",flexDirection:"column",gap:6,
      padding:"7px 0",borderBottom:`1px solid ${C.border}`,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <GripVertical size={13} color={C.textDim} style={{flexShrink:0,cursor:"grab"}}/>
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
              placeholder="Value (lưu DB)"
              onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditing(false);}}
              style={{...inp(false),flex:1,padding:"5px 10px",fontSize:13,color:C.textSub}}
            />
          </div>
        ) : (
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
            {optImage && (
              <img src={optImage.url} alt="" style={{width:32,height:32,objectFit:"cover",borderRadius:5,border:`1px solid ${C.border}`}}/>
            )}
            <span style={{fontSize:13,color:C.text}}>{opt.label}</span>
            <span style={{fontSize:11,color:C.textDim,background:C.surfaceHigh,padding:"1px 7px",borderRadius:4,border:`1px solid ${C.border}`}}>
              {opt.value}
            </span>
          </div>
        )}

        <div style={{display:"flex",gap:4}}>
          {/* Image upload for option — UI only */}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleOptImageFile} style={{display:"none"}}/>
          <button
            type="button"
            title="Thêm ảnh lựa chọn (UI only)"
            onClick={()=>fileRef.current?.click()}
            style={iconBtn(optImage?C.primary:C.textSub)}
            onMouseEnter={e=>e.currentTarget.style.background=C.primaryDim}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <ImagePlus size={11}/>
          </button>

          {editing ? (
            <>
              <button onClick={saveEdit} disabled={saving} style={iconBtn("#22c55e","#14532d")}
                onMouseEnter={e=>e.currentTarget.style.background="#0a1a0a"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {saving?<Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>:<Check size={11}/>}
              </button>
              <button onClick={()=>setEditing(false)} style={iconBtn(C.textSub)}
                onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHigh}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <X size={11}/>
              </button>
            </>
          ) : (
            <>
              <button onClick={startEdit} style={iconBtn(C.primary)} title="Sửa"
                onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHigh}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Pencil size={11}/>
              </button>
              <button onClick={handleDel} disabled={deleting} style={iconBtn(C.error,C.errorBorder)} title="Xóa"
                onMouseEnter={e=>e.currentTarget.style.background=C.errorBg}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {deleting?<Loader2 size={11} style={{animation:"spin 1s linear infinite"}}/>:<X size={11}/>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Show option image preview if uploaded */}
      {optImage && !editing && (
        <div style={{paddingLeft:56,display:"flex",alignItems:"center",gap:8}}>
          <img src={optImage.url} alt="" style={{maxWidth:120,maxHeight:80,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`}}/>
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

/* ── InlineOptionBuilder — label+value rows for new question form ─── */
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
      <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${C.textDim}`,flexShrink:0,marginTop:2}}/>
    );
    if (qType === "DROPDOWN") return (
      <span style={{fontSize:12,color:C.textSub,minWidth:20,flexShrink:0,textAlign:"right",marginTop:2}}>{index + 1}.</span>
    );
    return (
      <div style={{width:16,height:16,borderRadius:"50%",border:`1.5px solid ${C.textDim}`,flexShrink:0,marginTop:2}}/>
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
          Value (lưu DB)
        </span>
        <div style={{width:58}}/>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {optionRows.map((row, i) => (
          <div key={i} style={{display:"flex",flexDirection:"column",gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <GripVertical size={12} color={C.textDim} style={{flexShrink:0}}/>
              <Marker index={i}/>

              <input
                ref={el => labelRefs.current[i] = el}
                value={row.label}
                placeholder={`Label ${i + 1}`}
                onChange={e => handleLabelChange(i, e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); addRow(i); }
                  if (e.key === "Backspace" && !row.label && !row.value && optionRows.length > 1) {
                    e.preventDefault(); removeRow(i);
                  }
                }}
                style={{
                  flex:1, padding:"6px 10px",
                  background:C.surfaceHigh, border:`1px solid ${C.border}`,
                  borderRadius:7, color:C.text, fontSize:13,
                  fontFamily:C.font, outline:"none",
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />

              <input
                value={row.value}
                placeholder={`value_${i + 1}`}
                onChange={e => updateRow(i, "value", e.target.value)}
                style={{
                  flex:1, padding:"6px 10px",
                  background:C.bg, border:`1px solid ${C.border}`,
                  borderRadius:7, color:C.textSub, fontSize:12,
                  fontFamily:"monospace", outline:"none",
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />

              {/* Image for option row — UI only */}
              <ImageUploadButton image={row.image} onImageChange={img => handleOptImage(i, img)} size="sm"/>

              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={optionRows.length <= 1}
                style={{
                  width:22, height:22, borderRadius:6, border:"none",
                  background:"transparent",
                  cursor: optionRows.length <= 1 ? "not-allowed" : "pointer",
                  color: C.textDim, display:"flex", alignItems:"center",
                  justifyContent:"center", flexShrink:0,
                }}
                onMouseEnter={e => { if (optionRows.length > 1) { e.currentTarget.style.color=C.error; e.currentTarget.style.background=C.errorBg; }}}
                onMouseLeave={e => { e.currentTarget.style.color=C.textDim; e.currentTarget.style.background="transparent"; }}
              >×</button>
            </div>

            {/* Option image preview */}
            {row.image && (
              <div style={{paddingLeft:52,display:"flex",alignItems:"center",gap:8}}>
                <img
                  src={row.image.url}
                  alt=""
                  style={{maxWidth:100,maxHeight:64,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`}}
                />
                <span style={{fontSize:10,color:C.textDim}}>UI only · chưa gửi server</span>
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
            cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:0,
          }}
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
              background:C.surfaceHigh, border:`1px solid ${C.border}`,
              fontSize:12, color:C.textSub, fontWeight:500,
            }}>
              {o.image && <img src={o.image.url} alt="" style={{width:14,height:14,objectFit:"cover",borderRadius:3}}/>}
              <span style={{width:5,height:5,borderRadius:"50%",background:C.primary,flexShrink:0}}/>
              {o.label}
              {o.value && <span style={{color:C.textDim,fontSize:10}}>({o.value})</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── SettingsEditor ────────────────────────────────────────────────── */
function SettingsEditor({ type, settings, onChange }) {
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

/* ── QuestionBody ──────────────────────────────────────────────────── */
function QuestionBody({ q, type }) {
  const opts = q.options ?? q.option ?? [];

  if (type === "TEXT") return (
    <div style={{borderBottom:`1px dashed ${C.border}`,padding:"10px 0",fontSize:13,color:C.textDim,width:"60%"}}>
      Văn bản câu trả lời ngắn
    </div>
  );
  if (type === "PARAGRAPH") return (
    <div style={{borderBottom:`1px dashed ${C.border}`,padding:"10px 0",fontSize:13,color:C.textDim,width:"100%"}}>
      Văn bản câu trả lời dài
    </div>
  );
  if (type === "NUMBER") return (
    <div style={{borderBottom:`1px dashed ${C.border}`,padding:"10px 0",fontSize:13,color:C.textDim,width:"40%"}}>
      Nhập số
    </div>
  );
  if (type === "DATE") return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",color:C.textDim,fontSize:13}}>
      <Calendar size={16}/> Ngày / Tháng / Năm
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
            padding:"6px 0",borderBottom:`1px solid ${C.border}`,
          }}>
            {type === "MULTIPLE_CHOICE"
              ? <div style={{width:15,height:15,borderRadius:3,border:`1.5px solid ${C.textDim}`,flexShrink:0}}/>
              : type === "DROPDOWN"
              ? <span style={{fontSize:12,color:C.textSub,minWidth:18}}>{i+1}.</span>
              : <div style={{width:15,height:15,borderRadius:"50%",border:`1.5px solid ${C.textDim}`,flexShrink:0}}/>
            }
            <span style={{fontSize:13,color:C.text,flex:1}}>{opt.label}</span>
            <span style={{fontSize:11,color:C.textDim,background:C.surfaceHigh,padding:"1px 7px",borderRadius:4,border:`1px solid ${C.border}`}}>
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
      <div style={{border:`1.5px dashed ${C.border}`,borderRadius:10,padding:"16px 20px",textAlign:"center"}}>
        <FileUp size={20} style={{marginBottom:6,opacity:0.5}}/>
        <div>Người dùng có thể tải tệp lên tại đây</div>
      </div>
    </div>
  );

  return null;
}

/* ── QuestionCard ─────────────────────────────────────────────────── */
function QuestionCard({ q, index, isActive, onActivate, onSave, onCancel, onDelete, onDuplicate, deletingId }) {
  const [contentHtml, setContentHtml] = useState(q.content);
  const [type,        setType]        = useState(toFEType(q.type));
  const [required,    setRequired]    = useState(q.required ?? true);
  const [qImage,      setQImage]      = useState(null); // UI only

  const existingOptions = q.options ?? q.option ?? [];
  const [optionRows, setOptionRows] = useState(
    existingOptions.length > 0
      ? existingOptions.map(o =>
          typeof o === "string"
            ? { label: o, value: o, order_index: 0, is_other: false, image: null }
            : { label: o.label ?? "", value: o.value ?? "", order_index: o.order_index ?? 0, is_other: o.is_other ?? false, image: null }
        )
      : [newOptionRow()]
  );
  const [settings,   setSettings]   = useState(q.settings ?? null);
  const [saving,     setSaving]     = useState(false);
  const [hovered,    setHovered]    = useState(false);

  const isChoice    = CHOICE_TYPES.includes(type);
  const hasSettings = SETTINGS_TYPES.includes(type);
  const isDeleting  = deletingId === q.id;

  // Extract plain text from HTML for content field sent to BE
  const getPlainText = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.innerText ?? "";
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    if (CHOICE_TYPES.includes(newType) && !CHOICE_TYPES.includes(type)) {
      setOptionRows([newOptionRow()]);
    }
    if (!SETTINGS_TYPES.includes(newType)) setSettings(null);
    if (newType === "RATING") setSettings({ min: 1, max: 5 });
  };

  const handleSave = async () => {
    const plainContent = getPlainText(contentHtml).trim();
    if (!plainContent) return;

    if (isChoice) {
      const validOpts = buildBEOptions(optionRows);
      if (validOpts.length < 2) return;
    }

    setSaving(true);
    const payload = {
      content:  plainContent,
      type:     toBEType(type),
      required,
      settings: hasSettings ? settings : undefined,
    };
    if (isChoice) payload.options = buildBEOptions(optionRows);

    try { await onSave(q.id, q.survey_id, payload); }
    finally { setSaving(false); }
  };

  if (!isActive) {
    return (
      <div
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
        onClick={()=>onActivate(q.id)}
        style={{
          background: C.surfaceLow,
          border: `1px solid ${hovered?C.borderHover:C.border}`,
          borderLeft: `4px solid ${hovered?C.primary:"transparent"}`,
          borderRadius: 12,
          padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 14,
          cursor: "pointer", position: "relative",
          transition: "all .18s",
          boxShadow: hovered?"0 4px 20px rgba(79,110,247,0.10)":"none",
          transform: hovered?"translateY(-1px)":"none",
        }}
      >
        <GripVertical size={14} color={C.textDim} style={{cursor:"grab",flexShrink:0}}/>
        <span style={{fontSize:11,fontWeight:700,color:hovered?C.primary:C.textDim,minWidth:22}}>
          {String(index+1).padStart(2,"0")}
        </span>
        <p style={{flex:1,margin:0,fontSize:14,fontWeight:600,color:hovered?C.text:C.textSub}}>
          {q.content || <em style={{color:C.textDim}}>Câu hỏi chưa có tiêu đề</em>}
        </p>
        <span style={{fontSize:11,color:C.textDim,flexShrink:0}}>
          {Q_TYPES.find(t=>t.value===toFEType(q.type))?.label}
        </span>
        <button onClick={e=>{e.stopPropagation();onDelete(q.id);}} disabled={isDeleting}
          style={{...iconBtn(C.textSub),flexShrink:0}}
          onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHigh}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          {isDeleting?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Trash2 size={12}/>}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.borderHover}`,
      borderLeft: `4px solid ${C.primary}`,
      borderRadius: 12,
      boxShadow: "0 4px 24px rgba(79,110,247,0.15)",
    }}>
      <div style={{display:"flex",justifyContent:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
        <GripVertical size={16} color={C.textDim} style={{cursor:"grab"}}/>
      </div>

      {/* Content editor + type dropdown */}
      <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"16px 20px 0"}}>
        <div style={{flex:1}}>
          <span style={{...lbl,marginBottom:6}}>Nội dung câu hỏi</span>
          <RichTextEditor
            value={contentHtml}
            onChange={setContentHtml}
            placeholder="Câu hỏi không có tiêu đề"
            minHeight={56}
          />
        </div>
        <div style={{marginTop:22,minWidth:200}}>
          <QuestionTypeDropdown value={type} onChange={handleTypeChange}/>
        </div>
      </div>

      {/* Question image — UI only */}
      <div style={{padding:"10px 20px 0",paddingLeft:36}}>
        <QuestionImageUploadArea image={qImage} onImageChange={setQImage}/>
      </div>

      <div style={{padding:"12px 20px 4px",paddingLeft:36,display:"flex",flexDirection:"column",gap:16}}>
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
        gap:4, padding:"12px 20px 14px",
        borderTop:`1px solid ${C.border}`, marginTop:12,
      }}>
        <button onClick={()=>onDuplicate(q)} title="Nhân đôi"
          style={iconBtn(C.textSub)}
          onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHigh}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <Copy size={14}/>
        </button>
        <button onClick={()=>onDelete(q.id)} disabled={isDeleting} title="Xóa"
          style={iconBtn(C.error,C.errorBorder)}
          onMouseEnter={e=>e.currentTarget.style.background=C.errorBg}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          {isDeleting?<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>:<Trash2 size={14}/>}
        </button>

        <div style={{width:1,height:24,background:C.border,margin:"0 8px"}}/>
        <Toggle checked={required} onChange={setRequired}/>
        <div style={{width:1,height:24,background:C.border,margin:"0 8px"}}/>

        <button onClick={handleSave} disabled={saving} style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"7px 16px",
          background:saving?C.surfaceHigh:C.primaryGrad,
          color:saving?C.textSub:"#fff",
          border:saving?`1px solid ${C.border}`:"none",
          borderRadius:9, fontSize:12, fontWeight:700,
          cursor:saving?"not-allowed":"pointer",
          fontFamily:C.font,
          boxShadow:saving?"none":"0 2px 10px rgba(79,110,247,0.3)",
        }}>
          {saving&&<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>}
          Lưu
        </button>
        <button onClick={onCancel} style={{
          padding:"7px 14px", background:"transparent",
          border:`1px solid ${C.border}`, borderRadius:9,
          fontSize:12, fontWeight:600, color:C.textSub,
          cursor:"pointer", fontFamily:C.font,
        }}>
          Đóng
        </button>
      </div>
    </div>
  );
}

/* ── Right Sidebar ────────────────────────────────────────────────── */
function Sidebar({ onAddQuestion }) {
  const items = [
    { icon:<Plus size={18}/>,    title:"Thêm câu hỏi",   action:onAddQuestion },
    { icon:<FileText size={18}/>,title:"Import câu hỏi", action:()=>{} },
    { icon:<Type size={18}/>,    title:"Thêm tiêu đề",   action:()=>{} },
    { icon:<Image size={18}/>,   title:"Thêm hình ảnh",  action:()=>{} },
    { icon:<Video size={18}/>,   title:"Thêm video",     action:()=>{} },
    { icon:<Minus size={18}/>,   title:"Thêm phần mới",  action:()=>{} },
  ];
  return (
    <div style={{
      position:"sticky",top:24,alignSelf:"flex-start",
      background:C.surface,border:`1px solid ${C.border}`,
      borderRadius:12,overflow:"hidden",
      display:"flex",flexDirection:"column",
    }}>
      {items.map((item,i)=>(
        <button key={i} onClick={item.action} title={item.title}
          style={{
            display:"flex",alignItems:"center",justifyContent:"center",
            width:44,height:44,background:"transparent",border:"none",
            cursor:"pointer",color:C.textSub,transition:"all .12s",
            borderBottom:i<items.length-1?`1px solid ${C.border}`:"none",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=C.primaryDim;e.currentTarget.style.color=C.primary;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textSub;}}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}

/* ── QuestionPage ─────────────────────────────────────────────────── */
export default function QuestionPage() {
  const { surveyId } = useParams();
  const {
    questions, loading,
    createQuestion, fetchQuestionsBySurvey,
    updateQuestion, deleteQuestion,
  } = useQuestion();

  const [activeId,    setActiveId]    = useState(null);
  const [showForm,    setShowForm]    = useState(false);

  // ── New question form state ──────────────────────────────────────
  const [contentHtml, setContentHtml] = useState("");
  const [type,        setType]        = useState("TEXT");
  const [required,    setRequired]    = useState(true);
  const [optionRows,  setOptionRows]  = useState([newOptionRow()]);
  const [settings,    setSettings]    = useState(null);
  const [formError,   setFormError]   = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [qImage,      setQImage]      = useState(null); // UI only
  // ────────────────────────────────────────────────────────────────

  const [deletingId,  setDeletingId]  = useState(null);
  const pendingIdRef = useRef(null);

  useEffect(() => { if (surveyId) fetchQuestionsBySurvey(surveyId); }, [surveyId]);

  useEffect(() => {
    if (!pendingIdRef.current) return;
    const found = questions.find(q => q.id === pendingIdRef.current);
    if (found) { setActiveId(found.id); pendingIdRef.current = null; }
  }, [questions]);

  const resetForm = () => {
    setContentHtml("");
    setType("TEXT");
    setRequired(true);
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
  };

  // Extract plain text from HTML
  const getPlainText = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.innerText ?? "";
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

    const payload = {
      content:     plainContent,   // gửi plain text cho BE
      type:        toBEType(type),
      required,
      order_index: questions.length,
      settings:    hasSettings ? settings : undefined,
    };

    if (isChoice) {
      payload.options = buildBEOptions(optionRows);
    }

    setShowForm(false);
    resetForm();

    setFormLoading(true);
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingIdRef.current = created.id;
    } catch {
      // toast handled in provider
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteQuestion(id); if (activeId === id) setActiveId(null); }
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
    };
    const feType = toFEType(q.type);
    if (CHOICE_TYPES.includes(feType) && opts.length > 0) {
      payload.options = opts
        .map((o, i) => ({
          label:       typeof o === "string" ? o : (o.label ?? ""),
          value:       typeof o === "string" ? o : (o.value ?? ""),
          order_index: i,
          is_other:    typeof o === "object" ? (o.is_other ?? false) : false,
        }))
        .filter(o => o.label && o.value);
    }
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingIdRef.current = created.id;
    } catch { }
  }, [questions, surveyId, createQuestion, fetchQuestionsBySurvey]);

  const handleUpdate = useCallback(async (id, sid, payload) => {
    const mappedPayload = {
      ...payload,
      type: payload.type ? toBEType(toFEType(payload.type)) : undefined,
    };
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

  const isChoice    = CHOICE_TYPES.includes(type);
  const hasSettings = SETTINGS_TYPES.includes(type);

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"0",fontFamily:C.font}}>

      {/* ── Header ── */}
      <div style={{
        background:C.surface,borderBottom:`1px solid ${C.border}`,
        padding:"0 24px",display:"flex",alignItems:"center",
        justifyContent:"space-between",height:60,gap:16,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{
            width:36,height:36,borderRadius:8,background:C.primaryGrad,
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            <FileText size={18} color="#fff"/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:C.textDim,textTransform:"uppercase",marginBottom:1}}>
              KHẢO SÁT
            </div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,letterSpacing:"-0.01em"}}>
              Quản lý câu hỏi
            </div>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {formLoading && <Loader2 size={14} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>}
          <span style={{fontSize:12,color:C.textSub}}>{questions.length} câu hỏi</span>
          <button onClick={triggerAdd} style={{
            display:"flex",alignItems:"center",gap:7,
            padding:"8px 16px",
            background:showForm?C.surfaceHigh:C.primaryGrad,
            color:showForm?C.textSub:"#fff",
            border:showForm?`1px solid ${C.border}`:"none",
            borderRadius:9,fontSize:13,fontWeight:700,
            cursor:"pointer",fontFamily:C.font,
            boxShadow:showForm?"none":"0 2px 12px rgba(79,110,247,0.3)",
          }}>
            {showForm?<X size={14}/>:<Plus size={14}/>}
            {showForm?"Huỷ":"Câu hỏi mới"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{
        maxWidth:900,margin:"0 auto",padding:"28px 24px",
        display:"flex",gap:16,alignItems:"flex-start",
      }}>
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:12}}>

          {/* Form header card */}
          <div style={{
            background:C.surface,border:`1px solid ${C.border}`,
            borderTop:`6px solid ${C.primary}`,borderRadius:12,
            padding:"20px 24px",marginBottom:4,
          }}>
            <input
              defaultValue="Mẫu khảo sát"
              style={{
                width:"100%",background:"transparent",
                border:"none",borderBottom:`1px solid ${C.border}`,
                color:C.text,fontSize:22,fontWeight:700,fontFamily:C.font,
                outline:"none",padding:"4px 0 8px",
              }}
              onFocus={e=>e.target.style.borderBottomColor=C.primary}
              onBlur={e=>e.target.style.borderBottomColor=C.border}
            />
            <input
              defaultValue=""
              placeholder="Mô tả biểu mẫu"
              style={{
                width:"100%",background:"transparent",
                border:"none",borderBottom:`1px solid ${C.border}`,
                color:C.textSub,fontSize:13,fontFamily:C.font,
                outline:"none",padding:"8px 0 4px",marginTop:8,
              }}
              onFocus={e=>e.target.style.borderBottomColor=C.primary}
              onBlur={e=>e.target.style.borderBottomColor=C.border}
            />
          </div>

          {/* ── New question form ── */}
          {showForm && (
            <div style={{
              background:C.surfaceLow,border:`1px solid ${C.borderHover}`,
              borderLeft:`4px solid ${C.primary}`,borderRadius:12,
              padding:"20px 24px",boxShadow:"0 4px 24px rgba(0,0,0,0.4)",
            }}>
              <h2 style={{fontSize:14,fontWeight:700,color:C.text,margin:"0 0 14px"}}>Câu hỏi mới</h2>
              <form onSubmit={handleAdd}>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>

                  {/* Content (rich editor) + Type row */}
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <span style={lbl}>Nội dung câu hỏi *</span>
                      <RichTextEditor
                        value={contentHtml}
                        onChange={(html) => { setContentHtml(html); setFormError(""); }}
                        placeholder="Nhập nội dung câu hỏi..."
                        minHeight={72}
                        hasError={!!formError && !getPlainText(contentHtml).trim()}
                      />
                    </div>
                    <div style={{paddingTop:24,minWidth:200}}>
                      <span style={lbl}>Loại câu hỏi</span>
                      <QuestionTypeDropdown value={type} onChange={handleFormTypeChange}/>
                    </div>
                  </div>

                  {/* Question image — UI only */}
                  <QuestionImageUploadArea image={qImage} onImageChange={setQImage}/>

                  {/* Required toggle */}
                  <Toggle checked={required} onChange={setRequired}/>

                  {/* Options builder — only for CHOICE types */}
                  {isChoice && (
                    <InlineOptionBuilder
                      qType={type}
                      optionRows={optionRows}
                      onChange={(rows) => { setOptionRows(rows); setFormError(""); }}
                    />
                  )}

                  {/* Settings — NUMBER / RATING */}
                  {hasSettings && (
                    <SettingsEditor type={type} settings={settings} onChange={setSettings}/>
                  )}

                  {/* Debug hint */}
                  <div style={{fontSize:11,color:C.textDim,fontFamily:"monospace",lineHeight:1.6}}>
                    <span>BE type: <span style={{color:C.primary}}>{toBEType(type)}</span></span>
                    {isChoice && (
                      <span style={{marginLeft:12}}>
                        · options[]: <span style={{color:C.primary}}>
                          {buildBEOptions(optionRows).map(o => `{${o.label}:${o.value}}`).join(", ") || "—"}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Error */}
                  {formError && (
                    <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.error}}>
                      <AlertCircle size={14}/>{formError}
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                    <button
                      type="button"
                      onClick={()=>{ setShowForm(false); resetForm(); }}
                      style={{
                        padding:"7px 14px",background:"transparent",
                        border:`1.5px solid ${C.border}`,borderRadius:9,
                        fontSize:12,fontWeight:600,color:C.textSub,
                        cursor:"pointer",fontFamily:C.font,
                      }}
                    >
                      Huỷ
                    </button>
                    <button type="submit" disabled={formLoading} style={{
                      display:"flex",alignItems:"center",gap:6,
                      padding:"8px 16px",
                      background:formLoading?C.surfaceHigh:C.primaryGrad,
                      color:formLoading?C.textSub:"#fff",
                      border:formLoading?`1px solid ${C.border}`:"none",
                      borderRadius:9,fontSize:12,fontWeight:700,
                      cursor:formLoading?"not-allowed":"pointer",
                      fontFamily:C.font,
                      boxShadow:formLoading?"none":"0 2px 10px rgba(79,110,247,0.3)",
                    }}>
                      {formLoading
                        ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>
                        : <Plus size={13}/>
                      }
                      {formLoading ? "Đang thêm..." : "Thêm câu hỏi"}
                    </button>
                  </div>

                </div>
              </form>
            </div>
          )}

          {/* ── Question list ── */}
          {loading && questions.length === 0 ? (
            <div style={{display:"flex",justifyContent:"center",padding:"4rem 0"}}>
              <Loader2 size={28} color={C.primary} style={{animation:"spin 1s linear infinite"}}/>
            </div>
          ) : questions.length === 0 ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"5rem 0",gap:14}}>
              <Inbox size={48} strokeWidth={1.2} color={C.textDim}/>
              <p style={{fontSize:15,margin:0,color:C.textSub}}>Chưa có câu hỏi nào.</p>
              <button onClick={()=>setShowForm(true)} style={{
                fontSize:13,fontWeight:600,color:C.primary,background:"none",
                border:"none",cursor:"pointer",textDecoration:"underline",fontFamily:C.font,
              }}>
                Thêm câu hỏi đầu tiên
              </button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {questions.map((q, index) => (
                <QuestionCard
                  key={q.id} q={q} index={index}
                  isActive={activeId === q.id}
                  onActivate={(id) => { setActiveId(id); setShowForm(false); }}
                  onSave={handleUpdate}
                  onCancel={() => setActiveId(null)}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  deletingId={deletingId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar onAddQuestion={triggerAdd}/>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
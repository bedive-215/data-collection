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
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Inbox,
  X,
  Pencil,
  Check,
  GripVertical,
  PlusCircle,
  Image,
  ChevronLeft,
  Sparkles,
  Type,
  AlignLeft,
  ChevronDown,
  List,
  CheckSquare,
  ToggleLeft,
  Star,
  Grid,
  FileUp,
  Calendar,
  Clock,
  Mail,
  FileText,
  Video,
  Minus,
  Copy,
  Bold,
  Italic,
  Underline,
  Link,
  AlignLeft as AlignLeftIcon,
  AlignCenter,
  AlignRight,
  ImagePlus,
  Layout,
  ChevronRight
} from "lucide-react";
const C = {
  bg: "#F4F3F8",
  surface: "#FFFFFF",
  surfaceHover: "#F8F7FC",
  border: "#E8E6F0",
  primary: "#5B4EE8",
  primaryLight: "#EDE9FF",
  primaryBg: "#F0EFF8",
  text: "#111827",
  textSub: "#64748B",
  textDim: "#999999",
  textMuted: "#888888",
  error: "#E24B4A",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  font: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};
const BE_TO_FE_TYPE = {
  text: "TEXT",
  paragraph: "PARAGRAPH",
  email: "EMAIL",
  date: "DATE",
  number: "NUMBER",
  rating: "RATING",
  single_choice: "SINGLE_CHOICE",
  multiple_choice: "MULTIPLE_CHOICE",
  dropdown: "DROPDOWN",
  TEXT: "TEXT",
  PARAGRAPH: "PARAGRAPH",
  EMAIL: "EMAIL",
  DATE: "DATE",
  NUMBER: "NUMBER",
  RATING: "RATING",
  SINGLE_CHOICE: "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  DROPDOWN: "DROPDOWN"
};
const toFEType = (beType) => BE_TO_FE_TYPE[beType] ?? "TEXT";
const toBEType = (feType) => feType;
const Q_TYPES = [
  { value: "TEXT", label: "Tr\u1EA3 l\u1EDDi ng\u1EAFn", icon: /* @__PURE__ */ React.createElement(Type, { size: 15 }) },
  { value: "PARAGRAPH", label: "\u0110o\u1EA1n v\u0103n", icon: /* @__PURE__ */ React.createElement(AlignLeft, { size: 15 }) },
  { value: "SINGLE_CHOICE", label: "Tr\u1EAFc nghi\u1EC7m", icon: /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, lineHeight: 1 } }, "\u2B55") },
  { value: "MULTIPLE_CHOICE", label: "H\u1ED9p ki\u1EC3m", icon: /* @__PURE__ */ React.createElement(CheckSquare, { size: 15 }) },
  { value: "DROPDOWN", label: "Menu th\u1EA3 xu\u1ED1ng", icon: /* @__PURE__ */ React.createElement(List, { size: 15 }) },
  { value: "LINEAR_SCALE", label: "Ph\u1EA1m vi tuy\u1EBFn t\xEDnh", icon: /* @__PURE__ */ React.createElement(ToggleLeft, { size: 15 }) },
  { value: "RATING", label: "X\u1EBFp h\u1EA1ng", icon: /* @__PURE__ */ React.createElement(Star, { size: 15 }) },
  { value: "GRID", label: "L\u01B0\u1EDBi tr\u1EAFc nghi\u1EC7m", icon: /* @__PURE__ */ React.createElement(Grid, { size: 15 }) },
  { value: "NUMBER", label: "S\u1ED1", icon: /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, lineHeight: 1, fontWeight: 700 } }, "#") },
  { value: "DATE", label: "Ng\xE0y", icon: /* @__PURE__ */ React.createElement(Calendar, { size: 15 }) },
  { value: "TIME", label: "Gi\u1EDD", icon: /* @__PURE__ */ React.createElement(Clock, { size: 15 }) },
  { value: "EMAIL", label: "Email", icon: /* @__PURE__ */ React.createElement(Mail, { size: 15 }) },
  { value: "FILE_UPLOAD", label: "T\u1EA3i t\u1EC7p l\xEAn", icon: /* @__PURE__ */ React.createElement(FileUp, { size: 15 }) }
];
const SETTINGS_TYPES = ["NUMBER", "RATING", "DATE", "TEXT", "PARAGRAPH", "LINEAR_SCALE"];
const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const inp = (err) => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  background: "#fff",
  border: "1px solid " + (err ? C.error : C.border),
  borderRadius: 6,
  color: C.text,
  fontSize: 14,
  fontFamily: C.font,
  outline: "none"
});
const lbl = {
  display: "block",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: C.textDim,
  marginBottom: 7
};
function iconBtn(color, borderColor, bg) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: 6,
    border: borderColor ? "1px solid " + borderColor : "none",
    background: bg ?? "transparent",
    cursor: "pointer",
    color: color ?? "#888",
    transition: "background .12s",
    flexShrink: 0
  };
}
const newOptionRow = () => ({ label: "", value: "", order_index: 0, is_other: false, image: null });
const buildBEOptions = (optionRows) => optionRows.filter((r) => r.label.trim() && r.value.trim()).map((r, i) => ({
  label: r.label.trim(),
  value: r.value.trim(),
  order_index: i,
  is_other: r.is_other ?? false,
  image_url: r.image?.url || r.image_url || null
}));
const getPlainText = (html) => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.innerText ?? "";
};
function Toggle({ checked, onChange }) {
  return /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 500, color: C.textSub } }, "B\u1EAFt bu\u1ED9c"), /* @__PURE__ */ React.createElement("div", { onClick: () => onChange(!checked), style: {
    width: 44,
    height: 24,
    borderRadius: 999,
    background: checked ? C.primary : C.border,
    position: "relative",
    transition: "background .2s",
    cursor: "pointer"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 3,
    left: checked ? 22 : 3,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#fff",
    transition: "left .2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
  } })));
}
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
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: C.surface,
    border: "1px solid " + C.border,
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: "10px 14px 8px",
    borderBottom: "1px solid " + C.border,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.1em" } }, "TRANG / PH\u1EA6N"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setAdding((v) => !v),
      title: "Th\xEAm trang m\u1EDBi",
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: 6,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: C.primary,
        transition: "all .12s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = C.primaryBg;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
      }
    },
    /* @__PURE__ */ React.createElement(Plus, { size: 14, strokeWidth: 2.5 })
  )), adding && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 12px", borderBottom: "1px solid " + C.border, background: C.surfaceHover } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      autoFocus: true,
      type: "text",
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") {
          setAdding(false);
          setDraft("");
        }
      },
      placeholder: "T\xEAn trang m\u1EDBi...",
      style: {
        width: "100%",
        padding: "6px 10px",
        border: "1px solid " + C.border,
        borderRadius: 6,
        fontSize: 12,
        fontFamily: C.font,
        color: C.text,
        background: "#fff",
        outline: "none",
        boxSizing: "border-box"
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 6 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: submit,
      style: { flex: 1, padding: "5px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: C.font, background: C.primary, color: "#fff" }
    },
    "Th\xEAm"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setAdding(false);
        setDraft("");
      },
      style: { flex: 1, padding: "5px 8px", borderRadius: 6, border: "1px solid " + C.border, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: C.font, background: "transparent", color: C.textSub }
    },
    "Hu\u1EF7"
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onSelect(null),
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "9px 14px",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid " + C.border,
        cursor: "pointer",
        fontFamily: C.font,
        fontSize: 13,
        color: C.text,
        borderLeft: activeSectionId === null ? "3px solid " + C.primary : "3px solid transparent",
        paddingLeft: activeSectionId === null ? 11 : 14,
        transition: "all .12s"
      },
      onMouseEnter: (e) => {
        if (activeSectionId !== null) e.currentTarget.style.background = C.surfaceHover;
      },
      onMouseLeave: (e) => {
        if (activeSectionId !== null) e.currentTarget.style.background = "transparent";
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(Layout, { size: 14, strokeWidth: 2 }), "T\u1EA5t c\u1EA3 c\xE2u h\u1ECFi")
  ), sections.map((sec) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: sec.id,
      style: {
        display: "flex",
        alignItems: "center",
        background: "transparent",
        borderBottom: "1px solid " + C.border,
        borderLeft: activeSectionId === sec.id ? "3px solid " + C.primary : "3px solid transparent",
        transition: "all .12s"
      },
      onMouseEnter: (e) => {
        if (activeSectionId !== sec.id) e.currentTarget.style.background = C.surfaceHover;
      },
      onMouseLeave: (e) => {
        if (activeSectionId !== sec.id) e.currentTarget.style.background = "transparent";
      }
    },
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onSelect(sec.id),
        style: {
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 11px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: C.font,
          fontSize: 13,
          color: activeSectionId === sec.id ? C.primary : C.text,
          textAlign: "left",
          transition: "color .12s"
        }
      },
      /* @__PURE__ */ React.createElement(ChevronRight, { size: 12, color: C.textSub, style: { flexShrink: 0 } }),
      /* @__PURE__ */ React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, sec.title || "Kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1")
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          onDelete(sec.id);
        },
        title: "X\xF3a trang",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          marginRight: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#CCC",
          borderRadius: 6,
          transition: "all .12s"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = C.errorBg;
          e.currentTarget.style.color = C.error;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "#CCC";
        }
      },
      /* @__PURE__ */ React.createElement(Trash2, { size: 12 })
    )
  )), sections.length === 0 && !adding && /* @__PURE__ */ React.createElement("div", { style: { padding: "24px 14px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(Layout, { size: 32, color: C.textDim, style: { opacity: 0.4 } }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.textSub, margin: 0, fontWeight: 500 } }, "Ch\u01B0a c\xF3 trang n\xE0o"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setAdding(true),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        background: C.primary,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: C.font
      }
    },
    /* @__PURE__ */ React.createElement(Plus, { size: 14 }),
    " Th\xEAm trang"
  )));
}
function QuestionTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = Q_TYPES.find((t) => t.value === value) ?? Q_TYPES[0];
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative", minWidth: 200 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen((v) => !v), style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 12px",
    background: "#fff",
    border: "1px solid " + (open ? C.primary : C.border),
    borderRadius: 6,
    cursor: "pointer",
    color: C.text,
    fontFamily: C.font,
    fontSize: 13,
    justifyContent: "space-between",
    transition: "border-color .15s"
  } }, /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8, color: C.textSub } }, current.icon, /* @__PURE__ */ React.createElement("span", { style: { color: C.text } }, current.label)), /* @__PURE__ */ React.createElement(ChevronDown, { size: 14, color: C.textSub, style: { transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0)" } })), open && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    zIndex: 20,
    background: "#fff",
    border: "1px solid " + C.border,
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    maxHeight: 320,
    overflowY: "auto"
  } }, Q_TYPES.map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t.value,
      onClick: () => {
        onChange(t.value);
        setOpen(false);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 14px",
        background: t.value === value ? C.primaryBg : "transparent",
        border: "none",
        fontSize: 13,
        fontWeight: 500,
        color: t.value === value ? C.primary : C.text,
        cursor: "pointer",
        fontFamily: C.font
      },
      onMouseEnter: (e) => e.currentTarget.style.background = t.value === value ? C.primaryBg : C.surfaceHover,
      onMouseLeave: (e) => e.currentTarget.style.background = t.value === value ? C.primaryBg : "transparent"
    },
    /* @__PURE__ */ React.createElement("span", { style: { color: t.value === value ? C.primary : C.textSub } }, t.icon),
    t.label,
    t.value === value && /* @__PURE__ */ React.createElement(Check, { size: 13, style: { marginLeft: "auto" } })
  ))));
}
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
    return /* @__PURE__ */ React.createElement("div", { style: {
      position: "relative",
      display: "inline-flex",
      borderRadius: 6,
      overflow: "hidden",
      border: "1px solid " + C.border,
      width: size === "sm" ? 44 : 80,
      height: size === "sm" ? 44 : 60,
      flexShrink: 0
    } }, /* @__PURE__ */ React.createElement("img", { src: image.url, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onImageChange(null),
        style: {
          position: "absolute",
          top: 2,
          right: 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.6)",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1
        }
      },
      "\xD7"
    ));
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", onChange: handleFile, style: { display: "none" } }), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => fileRef.current?.click(),
      title: "Th\xEAm \u1EA3nh",
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size === "sm" ? 28 : 32,
        height: size === "sm" ? 28 : 32,
        borderRadius: 6,
        border: "1px solid " + C.border,
        background: "transparent",
        color: "#888",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all .12s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = C.primaryBg;
        e.currentTarget.style.color = C.primary;
        e.currentTarget.style.borderColor = C.primary;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#888";
        e.currentTarget.style.borderColor = C.border;
      }
    },
    /* @__PURE__ */ React.createElement(ImagePlus, { size: size === "sm" ? 13 : 15 })
  ));
}
function RichTextEditor({ value, onChange, placeholder = "Nh\u1EADp n\u1ED9i dung...", minHeight = 80, hasError = false }) {
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
    const img = '<img src="' + url + '" alt="" style="max-width:100%;max-height:200px;border-radius:6px;margin:4px 0;display:block;"/>';
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
  const toolbarBtn = (cmd, children, title, val = null) => /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title,
      onMouseDown: (e) => {
        e.preventDefault();
        exec(cmd, val);
      },
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: "#888",
        cursor: "pointer",
        transition: "all .1s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = C.surfaceHover;
        e.currentTarget.style.color = C.text;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#888";
      }
    },
    children
  );
  return /* @__PURE__ */ React.createElement("div", { style: {
    border: "1.5px solid " + (hasError ? C.error : isFocused ? C.primary : C.border),
    borderRadius: 6,
    overflow: "hidden",
    transition: "border-color .15s",
    background: "#fff"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "6px 10px",
    borderBottom: "1px solid " + C.border,
    background: C.surfaceHover,
    flexWrap: "wrap"
  } }, toolbarBtn("bold", /* @__PURE__ */ React.createElement(Bold, { size: 13 }), "In \u0111\u1EADm"), toolbarBtn("italic", /* @__PURE__ */ React.createElement(Italic, { size: 13 }), "In nghi\xEAng"), toolbarBtn("underline", /* @__PURE__ */ React.createElement(Underline, { size: 13 }), "G\u1EA1ch ch\xE2n"), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 18, background: C.border, margin: "0 4px" } }), toolbarBtn("justifyLeft", /* @__PURE__ */ React.createElement(AlignLeftIcon, { size: 13 }), "C\u0103n tr\xE1i"), toolbarBtn("justifyCenter", /* @__PURE__ */ React.createElement(AlignCenter, { size: 13 }), "C\u0103n gi\u1EEFa"), toolbarBtn("justifyRight", /* @__PURE__ */ React.createElement(AlignRight, { size: 13 }), "C\u0103n ph\u1EA3i"), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 18, background: C.border, margin: "0 4px" } }), toolbarBtn("insertUnorderedList", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700 } }, "\u2022\u2014"), "Danh s\xE1ch"), toolbarBtn("insertOrderedList", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700 } }, "1."), "Danh s\xE1ch s\u1ED1"), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 18, background: C.border, margin: "0 4px" } }), /* @__PURE__ */ React.createElement(
    "select",
    {
      onChange: (e) => {
        exec("formatBlock", e.target.value);
        e.target.value = "p";
      },
      defaultValue: "p",
      style: {
        background: "#fff",
        border: "1px solid " + C.border,
        borderRadius: 6,
        color: C.textSub,
        fontSize: 11,
        padding: "2px 4px",
        cursor: "pointer",
        fontFamily: C.font,
        outline: "none"
      }
    },
    /* @__PURE__ */ React.createElement("option", { value: "p" }, "\u0110o\u1EA1n v\u0103n"),
    /* @__PURE__ */ React.createElement("option", { value: "h1" }, "Ti\xEAu \u0111\u1EC1 1"),
    /* @__PURE__ */ React.createElement("option", { value: "h2" }, "Ti\xEAu \u0111\u1EC1 2"),
    /* @__PURE__ */ React.createElement("option", { value: "h3" }, "Ti\xEAu \u0111\u1EC1 3")
  ), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 18, background: C.border, margin: "0 4px" } }), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: imageInputRef,
      type: "file",
      accept: "image/*",
      style: { display: "none" },
      onChange: (e) => {
        const f = e.target.files?.[0];
        if (f) insertImageInEditor(f);
        e.target.value = "";
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "Ch\xE8n \u1EA3nh",
      onMouseDown: (e) => {
        e.preventDefault();
        imageInputRef.current?.click();
      },
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: "#888",
        cursor: "pointer",
        transition: "all .1s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = C.primaryBg;
        e.currentTarget.style.color = C.primary;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#888";
      }
    },
    /* @__PURE__ */ React.createElement(ImagePlus, { size: 13 })
  ), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", fontSize: 10, color: C.textDim } }, "Ctrl+B \xB7 I \xB7 U")), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, isEmpty && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "10px 14px",
    fontSize: 14,
    color: C.textDim,
    pointerEvents: "none",
    userSelect: "none"
  } }, placeholder), /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: editorRef,
      contentEditable: true,
      suppressContentEditableWarning: true,
      onInput: handleInput,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      onPaste: handlePaste,
      style: {
        minHeight,
        padding: "10px 14px",
        color: C.text,
        fontSize: 14,
        fontFamily: C.font,
        outline: "none",
        lineHeight: 1.6,
        wordBreak: "break-word"
      }
    }
  )));
}
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
    return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", borderRadius: 6, overflow: "hidden", border: "1px solid " + C.border, maxWidth: 300 } }, /* @__PURE__ */ React.createElement("img", { src: image.url, alt: image.name, style: { width: "100%", maxHeight: 180, objectFit: "cover", display: "block" } }), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0)",
          transition: "background .15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        },
        onMouseEnter: (e) => e.currentTarget.style.background = "rgba(0,0,0,0.4)",
        onMouseLeave: (e) => e.currentTarget.style.background = "rgba(0,0,0,0)"
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => fileRef.current?.click(),
          style: {
            padding: "5px 10px",
            background: "rgba(0,0,0,0.7)",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: C.font,
            opacity: 0,
            transition: "opacity .15s"
          },
          onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
          onMouseLeave: (e) => e.currentTarget.style.opacity = "0"
        },
        "Thay \u1EA3nh"
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => onImageChange(null),
          style: {
            padding: "5px 10px",
            background: "rgba(180,30,30,0.8)",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: C.font,
            opacity: 0,
            transition: "opacity .15s"
          },
          onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
          onMouseLeave: (e) => e.currentTarget.style.opacity = "0"
        },
        "X\xF3a \u1EA3nh"
      )
    ), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", onChange: handleFile, style: { display: "none" } }), /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 10px", fontSize: 11, color: C.textDim, background: C.surfaceHover } }, image.name, /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, color: C.primary, fontSize: 10 } }, "UI only \xB7 ch\u01B0a g\u1EEDi server")));
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", onChange: handleFile, style: { display: "none" } }), /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => fileRef.current?.click(),
      onDragOver: (e) => e.preventDefault(),
      onDrop: handleDrop,
      style: {
        border: "1.5px dashed " + C.border,
        borderRadius: 6,
        padding: "14px 20px",
        textAlign: "center",
        cursor: "pointer",
        color: C.textDim,
        fontSize: 12,
        transition: "border-color .15s, background .15s",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        gap: 10
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.borderColor = C.primary;
        e.currentTarget.style.background = C.primaryBg;
        e.currentTarget.style.color = C.primary;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = C.textDim;
      }
    },
    /* @__PURE__ */ React.createElement(ImagePlus, { size: 16 }),
    /* @__PURE__ */ React.createElement("span", null, "Th\xEAm \u1EA3nh cho c\xE2u h\u1ECFi \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: C.textDim, fontSize: 11 } }, "UI only"))
  ));
}
function OptionRow({ opt, questionId, index, qType, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(opt.label ?? "");
  const [value, setValue] = useState(opt.value ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [optImage, setOptImage] = useState(null);
  const startEdit = () => {
    setLabel(opt.label ?? "");
    setValue(opt.value ?? "");
    setEditing(true);
  };
  const saveEdit = async () => {
    const trimLabel = label.trim();
    const trimValue = value.trim();
    if (!trimLabel || !trimValue) {
      setEditing(false);
      return;
    }
    if (trimLabel === opt.label && trimValue === opt.value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(opt.id, questionId, { label: trimLabel, value: trimValue });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  const handleDel = async () => {
    setDeleting(true);
    try {
      await onDelete(opt.id, questionId);
    } finally {
      setDeleting(false);
    }
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
    if (qType === "MULTIPLE_CHOICE") return /* @__PURE__ */ React.createElement("div", { style: { width: 16, height: 16, borderRadius: 3, border: "1.5px solid " + C.border, flexShrink: 0 } });
    if (qType === "DROPDOWN") return /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textSub, minWidth: 20, flexShrink: 0 } }, index + 1, ".");
    return /* @__PURE__ */ React.createElement("div", { style: { width: 16, height: 16, borderRadius: "50%", border: "1.5px solid " + C.border, flexShrink: 0 } });
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "7px 0",
    borderBottom: "1px solid " + C.border
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(GripVertical, { size: 13, color: "#888", style: { flexShrink: 0, cursor: "grab" } }), /* @__PURE__ */ React.createElement(Marker, null), editing ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flex: 1 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      autoFocus: true,
      value: label,
      onChange: (e) => setLabel(e.target.value),
      placeholder: "Label (hi\u1EC3n th\u1ECB)",
      onKeyDown: (e) => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") setEditing(false);
      },
      style: { ...inp(false), flex: 1, padding: "5px 10px", fontSize: 13 }
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      value,
      onChange: (e) => setValue(e.target.value),
      placeholder: "Value (l\u01B0u DB)",
      onKeyDown: (e) => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") setEditing(false);
      },
      style: { ...inp(false), flex: 1, padding: "5px 10px", fontSize: 13, color: C.textSub }
    }
  )) : /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 8 } }, optImage && /* @__PURE__ */ React.createElement("img", { src: optImage.url, alt: "", style: { width: 32, height: 32, objectFit: "cover", borderRadius: 6, border: "1px solid " + C.border } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: C.text } }, opt.label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textDim, background: C.surfaceHover, padding: "1px 7px", borderRadius: 4, border: "1px solid " + C.border } }, opt.value)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", onChange: handleOptImageFile, style: { display: "none" } }), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "Th\xEAm \u1EA3nh l\u1EF1a ch\u1ECDn (UI only)",
      onClick: () => fileRef.current?.click(),
      style: iconBtn(optImage ? C.primary : "#888"),
      onMouseEnter: (e) => e.currentTarget.style.background = C.primaryBg,
      onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
    },
    /* @__PURE__ */ React.createElement(ImagePlus, { size: 11 })
  ), editing ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: saveEdit,
      disabled: saving,
      style: iconBtn("#16a34a", "#bbf7d0", "#f0fdf4"),
      onMouseEnter: (e) => e.currentTarget.style.background = "#dcfce7",
      onMouseLeave: (e) => e.currentTarget.style.background = "#f0fdf4"
    },
    saving ? /* @__PURE__ */ React.createElement(Loader2, { size: 11, style: { animation: "spin 1s linear infinite" } }) : /* @__PURE__ */ React.createElement(Check, { size: 11 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setEditing(false),
      style: iconBtn(C.textSub),
      onMouseEnter: (e) => e.currentTarget.style.background = C.surfaceHover,
      onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
    },
    /* @__PURE__ */ React.createElement(X, { size: 11 })
  )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: startEdit,
      style: iconBtn(C.primary, C.primary),
      title: "S\u1EEDa",
      onMouseEnter: (e) => e.currentTarget.style.background = C.primaryBg,
      onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
    },
    /* @__PURE__ */ React.createElement(Pencil, { size: 11 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleDel,
      disabled: deleting,
      style: iconBtn(C.error, C.errorBorder, C.errorBg),
      title: "X\xF3a",
      onMouseEnter: (e) => e.currentTarget.style.background = "#fee2e2",
      onMouseLeave: (e) => e.currentTarget.style.background = C.errorBg
    },
    deleting ? /* @__PURE__ */ React.createElement(Loader2, { size: 11, style: { animation: "spin 1s linear infinite" } }) : /* @__PURE__ */ React.createElement(X, { size: 11 })
  )))), optImage && !editing && /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 56, display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("img", { src: optImage.url, alt: "", style: { maxWidth: 120, maxHeight: 80, objectFit: "cover", borderRadius: 6, border: "1px solid " + C.border } }), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setOptImage(null),
      style: { fontSize: 10, color: C.error, background: "none", border: "none", cursor: "pointer", fontFamily: C.font }
    },
    "\xD7 X\xF3a \u1EA3nh"
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: C.textDim } }, "UI only")));
}
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
    const autoValue = labelVal.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    onChange(optionRows.map(
      (row, idx) => idx === i ? { ...row, label: labelVal, value: autoValue } : row
    ));
  };
  const updateRow = (i, field, val) => {
    onChange(optionRows.map(
      (row, idx) => idx === i ? { ...row, [field]: val } : row
    ));
  };
  const handleOptImage = (i, imageObj) => {
    onChange(optionRows.map(
      (row, idx) => idx === i ? { ...row, image: imageObj } : row
    ));
  };
  const Marker = ({ index }) => {
    if (qType === "MULTIPLE_CHOICE") return /* @__PURE__ */ React.createElement("div", { style: { width: 16, height: 16, borderRadius: 3, border: "1.5px solid " + C.border, flexShrink: 0, marginTop: 2 } });
    if (qType === "DROPDOWN") return /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textSub, minWidth: 20, flexShrink: 0, textAlign: "right", marginTop: 2 } }, index + 1, ".");
    return /* @__PURE__ */ React.createElement("div", { style: { width: 16, height: 16, borderRadius: "50%", border: "1.5px solid " + C.border, flexShrink: 0, marginTop: 2 } });
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: lbl }, "C\xE1c l\u1EF1a ch\u1ECDn", " ", /* @__PURE__ */ React.createElement("span", { style: { color: C.textDim, fontWeight: 400, textTransform: "none", letterSpacing: 0 } }, "(label + value)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 4, paddingLeft: 56 } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" } }, "Label (hi\u1EC3n th\u1ECB)"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" } }, "Value (l\u01B0u DB)"), /* @__PURE__ */ React.createElement("div", { style: { width: 58 } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, optionRows.map((row, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(GripVertical, { size: 12, color: "#888", style: { flexShrink: 0 } }), /* @__PURE__ */ React.createElement(Marker, { index: i }), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: (el) => labelRefs.current[i] = el,
      value: row.label,
      placeholder: "Label " + (i + 1),
      onChange: (e) => handleLabelChange(i, e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addRow(i);
        }
        if (e.key === "Backspace" && !row.label && !row.value && optionRows.length > 1) {
          e.preventDefault();
          removeRow(i);
        }
      },
      style: {
        flex: 1,
        padding: "6px 10px",
        background: "#fff",
        border: "1px solid " + C.border,
        borderRadius: 7,
        color: C.text,
        fontSize: 13,
        fontFamily: C.font,
        outline: "none"
      },
      onFocus: (e) => {
        e.target.style.borderColor = C.primary;
      },
      onBlur: (e) => {
        e.target.style.borderColor = C.border;
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: row.value,
      placeholder: "value_" + (i + 1),
      onChange: (e) => updateRow(i, "value", e.target.value),
      style: {
        flex: 1,
        padding: "6px 10px",
        background: C.surfaceHover,
        border: "1px solid " + C.border,
        borderRadius: 7,
        color: C.textSub,
        fontSize: 12,
        fontFamily: "monospace",
        outline: "none"
      },
      onFocus: (e) => {
        e.target.style.borderColor = C.primary;
      },
      onBlur: (e) => {
        e.target.style.borderColor = C.border;
      }
    }
  ), /* @__PURE__ */ React.createElement(ImageUploadButton, { image: row.image, onImageChange: (img) => handleOptImage(i, img), size: "sm" }), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => removeRow(i),
      disabled: optionRows.length <= 1,
      style: {
        width: 22,
        height: 22,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        cursor: optionRows.length <= 1 ? "not-allowed" : "pointer",
        color: "#888",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      },
      onMouseEnter: (e) => {
        if (optionRows.length > 1) {
          e.currentTarget.style.color = C.error;
          e.currentTarget.style.background = C.errorBg;
        }
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.color = "#888";
        e.currentTarget.style.background = "transparent";
      }
    },
    "\xD7"
  )), row.image && /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 52, display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: row.image.url,
      alt: "",
      style: { maxWidth: 100, maxHeight: 64, objectFit: "cover", borderRadius: 6, border: "1px solid " + C.border }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: C.textDim } }, "UI only \xB7 ch\u01B0a g\u1EEDi server"))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, paddingTop: 10, paddingLeft: 28 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => addRow(optionRows.length - 1),
      style: {
        background: "none",
        border: "none",
        color: C.primary,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: C.font,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: 0
      }
    },
    /* @__PURE__ */ React.createElement(PlusCircle, { size: 14 }),
    " Th\xEAm l\u1EF1a ch\u1ECDn"
  )), optionRows.some((o) => o.label.trim()) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 } }, optionRows.filter((o) => o.label.trim()).map((o, i) => /* @__PURE__ */ React.createElement("span", { key: i, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px",
    borderRadius: 20,
    background: C.primaryLight,
    border: "1px solid " + C.primaryLight,
    fontSize: 12,
    color: C.primary,
    fontWeight: 500
  } }, o.image && /* @__PURE__ */ React.createElement("img", { src: o.image.url, alt: "", style: { width: 14, height: 14, objectFit: "cover", borderRadius: 3 } }), /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: C.primary, flexShrink: 0 } }), o.label, o.value && /* @__PURE__ */ React.createElement("span", { style: { color: C.textSub, fontSize: 10 } }, "(", o.value, ")")))));
}
function SettingsEditor({ type, settings, onChange }) {
  if (type === "TEXT" || type === "PARAGRAPH") {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: lbl }, "Gi\u1EDBi h\u1EA1n k\xFD t\u1EF1"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "T\u1ED1i thi\u1EC3u"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: settings?.min_chars ?? "",
        placeholder: "Kh\xF4ng gi\u1EDBi h\u1EA1n",
        onChange: (e) => onChange({ ...settings, min_chars: e.target.value !== "" ? Number(e.target.value) : void 0 }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 13 }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "T\u1ED1i \u0111a"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: settings?.max_chars ?? "",
        placeholder: "Kh\xF4ng gi\u1EDBi h\u1EA1n",
        onChange: (e) => onChange({ ...settings, max_chars: e.target.value !== "" ? Number(e.target.value) : void 0 }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 13 }
      }
    ))));
  }
  if (type === "NUMBER") {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: lbl }, "Gi\u1EDBi h\u1EA1n s\u1ED1"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Min"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: settings?.min ?? "",
        placeholder: "Kh\xF4ng gi\u1EDBi h\u1EA1n",
        onChange: (e) => onChange({ ...settings, min: e.target.value !== "" ? Number(e.target.value) : void 0 }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 13 }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Max"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: settings?.max ?? "",
        placeholder: "Kh\xF4ng gi\u1EDBi h\u1EA1n",
        onChange: (e) => onChange({ ...settings, max: e.target.value !== "" ? Number(e.target.value) : void 0 }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 13 }
      }
    ))));
  }
  if (type === "LINEAR_SCALE") {
    const min = settings?.min ?? 1;
    const max = settings?.max ?? 5;
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: lbl }, "Ph\u1EA1m vi tuy\u1EBFn t\xEDnh"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Min"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: min,
        onChange: (e) => onChange({ ...settings, min: Number(e.target.value) }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 13 }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Max"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: max,
        onChange: (e) => onChange({ ...settings, max: Number(e.target.value) }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 13 }
      }
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Nh\xE3n min"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: settings?.min_label ?? "",
        placeholder: "V\xED d\u1EE5: Kh\xF4ng h\xE0i l\xF2ng",
        onChange: (e) => onChange({ ...settings, min_label: e.target.value || void 0 }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 12 }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Nh\xE3n max"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: settings?.max_label ?? "",
        placeholder: "V\xED d\u1EE5: R\u1EA5t h\xE0i l\xF2ng",
        onChange: (e) => onChange({ ...settings, max_label: e.target.value || void 0 }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 12 }
      }
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 12, padding: "8px 12px", background: C.surfaceHover, borderRadius: 10, gap: 4 } }, [...Array(max - min + 1)].map((_, i) => {
      const val = min + i;
      return /* @__PURE__ */ React.createElement("div", { key: val, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.primary } }, val), /* @__PURE__ */ React.createElement("div", { style: { width: "100%", height: 6, background: C.primary, borderRadius: 3 } }));
    })));
  }
  if (type === "RATING") {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: lbl }, "Ph\u1EA1m vi \u0111\xE1nh gi\xE1"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Min"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: settings?.min ?? 1,
        onChange: (e) => onChange({ ...settings, min: Number(e.target.value) }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 13 }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Max"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: settings?.max ?? 5,
        onChange: (e) => onChange({ ...settings, max: Number(e.target.value) }),
        style: { ...inp(false), padding: "7px 10px", fontSize: 13 }
      }
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 10 } }, Array.from({ length: (settings?.max ?? 5) - (settings?.min ?? 1) + 1 }, (_, i) => i + (settings?.min ?? 1)).map((i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub } }, i), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: { fontSize: 20, color: C.textDim, cursor: "pointer" },
        onMouseEnter: (e) => e.currentTarget.style.color = "#f59e0b",
        onMouseLeave: (e) => e.currentTarget.style.color = C.textDim
      },
      "\u2606"
    )))));
  }
  return null;
}
function QuestionBody({ q, type }) {
  const opts = q.options ?? q.option ?? [];
  if (type === "TEXT") return /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px dashed " + C.border, padding: "10px 0", fontSize: 13, color: C.textDim, width: "60%" } }, "V\u0103n b\u1EA3n c\xE2u tr\u1EA3 l\u1EDDi ng\u1EAFn");
  if (type === "PARAGRAPH") return /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px dashed " + C.border, padding: "10px 0", fontSize: 13, color: C.textDim, width: "100%" } }, "V\u0103n b\u1EA3n c\xE2u tr\u1EA3 l\u1EDDi d\xE0i");
  if (type === "NUMBER") return /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px dashed " + C.border, padding: "10px 0", fontSize: 13, color: C.textDim, width: "40%" } }, "Nh\u1EADp s\u1ED1");
  if (type === "DATE") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", color: C.textDim, fontSize: 13 } }, /* @__PURE__ */ React.createElement(Calendar, { size: 16 }), " Ng\xE0y / Th\xE1ng / N\u0103m");
  if (type === "TIME") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", color: C.textDim, fontSize: 13 } }, /* @__PURE__ */ React.createElement(Clock, { size: 16 }), " Gi\u1EDD : Ph\xFAt");
  if (CHOICE_TYPES.includes(type)) return /* @__PURE__ */ React.createElement("div", null, opts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.textDim, padding: "8px 0", fontStyle: "italic" } }, "Ch\u01B0a c\xF3 l\u1EF1a ch\u1ECDn n\xE0o.") : opts.map((opt, i) => /* @__PURE__ */ React.createElement("div", { key: opt.id ?? i, style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 0",
    borderBottom: "1px solid " + C.border
  } }, type === "MULTIPLE_CHOICE" ? /* @__PURE__ */ React.createElement("div", { style: { width: 15, height: 15, borderRadius: 3, border: "1.5px solid " + C.border, flexShrink: 0 } }) : type === "DROPDOWN" ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textSub, minWidth: 18 } }, i + 1, ".") : /* @__PURE__ */ React.createElement("div", { style: { width: 15, height: 15, borderRadius: "50%", border: "1.5px solid " + C.border, flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: C.text, flex: 1 } }, opt.label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textDim, background: C.surfaceHover, padding: "1px 7px", borderRadius: 4, border: "1px solid " + C.border } }, opt.value))));
  if (type === "RATING") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 4, padding: "8px 0" } }, [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub } }, i), /* @__PURE__ */ React.createElement(
    "span",
    {
      style: { fontSize: 22, color: C.textDim, cursor: "pointer" },
      onMouseEnter: (e) => e.currentTarget.style.color = "#f59e0b",
      onMouseLeave: (e) => e.currentTarget.style.color = C.textDim
    },
    "\u2606"
  ))));
  if (type === "FILE_UPLOAD") return /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 0", color: C.textDim, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", { style: { border: "1.5px dashed " + C.border, borderRadius: 10, padding: "16px 20px", textAlign: "center" } }, /* @__PURE__ */ React.createElement(FileUp, { size: 20, style: { marginBottom: 6, opacity: 0.5 } }), /* @__PURE__ */ React.createElement("div", null, "Ng\u01B0\u1EDDi d\xF9ng c\xF3 th\u1EC3 t\u1EA3i t\u1EC7p l\xEAn t\u1EA1i \u0111\xE2y")));
  return null;
}
const OPERATORS = [
  { value: "equals", label: "b\u1EB1ng", types: ["TEXT", "PARAGRAPH", "EMAIL", "NUMBER", "SINGLE_CHOICE", "DROPDOWN", "LINEAR_SCALE"] },
  { value: "not_equals", label: "kh\xF4ng b\u1EB1ng", types: ["TEXT", "PARAGRAPH", "EMAIL", "NUMBER", "SINGLE_CHOICE", "DROPDOWN", "LINEAR_SCALE"] },
  { value: "contains", label: "ch\u1EE9a", types: ["TEXT", "PARAGRAPH", "EMAIL"] },
  { value: "not_contains", label: "kh\xF4ng ch\u1EE9a", types: ["TEXT", "PARAGRAPH", "EMAIL"] },
  { value: "greater", label: "l\u1EDBn h\u01A1n", types: ["NUMBER", "LINEAR_SCALE", "RATING"] },
  { value: "less", label: "nh\u1ECF h\u01A1n", types: ["NUMBER", "LINEAR_SCALE", "RATING"] },
  { value: "answered", label: "\u0111\xE3 tr\u1EA3 l\u1EDDi", types: ["TEXT", "PARAGRAPH", "EMAIL", "NUMBER", "DATE", "TIME", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN", "RATING", "LINEAR_SCALE"] },
  { value: "not_answered", label: "ch\u01B0a tr\u1EA3 l\u1EDDi", types: ["TEXT", "PARAGRAPH", "EMAIL", "NUMBER", "DATE", "TIME", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN", "RATING", "LINEAR_SCALE"] }
];
function ConditionEditor({ questions, currentQId, value, onChange }) {
  const [open, setOpen] = useState(false);
  const sourceId = value?.source_question_id ?? "";
  const operator = value?.operator ?? "";
  const condValue = value?.value ?? "";
  const sourceQ = questions.find((q) => q.id === sourceId);
  const srcFEType = sourceQ ? toFEType(sourceQ.type) : "";
  const availableOps = OPERATORS.filter((op) => !srcFEType || op.types.includes(srcFEType));
  const hasCondition = !!sourceId && !!operator;
  const getValueInput = () => {
    if (!sourceId || operator === "answered" || operator === "not_answered") return null;
    const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(srcFEType);
    if (isChoice) {
      const opts = sourceQ?.options ?? sourceQ?.option ?? [];
      return /* @__PURE__ */ React.createElement(
        "select",
        {
          value: condValue,
          onChange: (e) => onChange({ source_question_id: sourceId, operator, value: e.target.value }),
          style: { ...inp(false), padding: "5px 8px", fontSize: 12, flex: 1 }
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 Ch\u1ECDn \u0111\xE1p \xE1n \u2014"),
        opts.map((o, i) => /* @__PURE__ */ React.createElement("option", { key: i, value: typeof o === "string" ? o : o.value ?? o.label ?? "" }, typeof o === "string" ? o : o.label ?? o.value ?? ""))
      );
    }
    if (["NUMBER", "LINEAR_SCALE", "RATING"].includes(srcFEType)) {
      return /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          value: condValue,
          onChange: (e) => onChange({ source_question_id: sourceId, operator, value: e.target.value }),
          placeholder: "Gi\xE1 tr\u1ECB...",
          style: { ...inp(false), padding: "5px 8px", fontSize: 12, flex: 1 }
        }
      );
    }
    return /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: condValue,
        onChange: (e) => onChange({ source_question_id: sourceId, operator, value: e.target.value }),
        placeholder: "Gi\xE1 tr\u1ECB...",
        style: { ...inp(false), padding: "5px 8px", fontSize: 12, flex: 1 }
      }
    );
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { ...lbl, marginBottom: 0 } }, "\u0110i\u1EC1u ki\u1EC7n hi\u1EC3n th\u1ECB (Skip logic)"), /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen((v) => !v), style: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 7,
    border: "none",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: C.font,
    background: hasCondition ? C.primary : C.surfaceHover,
    color: hasCondition ? "#fff" : C.textSub,
    transition: "all .12s"
  } }, hasCondition ? "\u2713 C\xF3 \u0111i\u1EC1u ki\u1EC7n" : "+ Th\xEAm \u0111i\u1EC1u ki\u1EC7n")), open && /* @__PURE__ */ React.createElement("div", { style: {
    background: C.surfaceHover,
    border: "1px solid " + C.border,
    borderRadius: 10,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 6
  } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: C.textSub, margin: 0, lineHeight: 1.4 } }, "C\xE2u h\u1ECFi n\xE0y ch\u1EC9 hi\u1EC3n th\u1ECB khi \u0111i\u1EC1u ki\u1EC7n b\xEAn d\u01B0\u1EDBi \u0111\u01B0\u1EE3c th\u1ECFa m\xE3n."), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "C\xE2u h\u1ECFi ngu\u1ED3n"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: sourceId,
      onChange: (e) => onChange({ source_question_id: e.target.value, operator: "", value: "" }),
      style: { ...inp(false), padding: "6px 10px", fontSize: 12, background: "#fff" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 Ch\u1ECDn c\xE2u h\u1ECFi \u2014"),
    questions.filter((q) => q.id !== currentQId).map((q) => /* @__PURE__ */ React.createElement("option", { key: q.id, value: q.id }, String(q.order_index ?? questions.indexOf(q) + 1), ". ", getPlainText(q.content ?? "").slice(0, 40)))
  )), sourceId && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "\u0110i\u1EC1u ki\u1EC7n"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: operator,
      onChange: (e) => onChange({ source_question_id: sourceId, operator: e.target.value, value: "" }),
      style: { ...inp(false), padding: "6px 10px", fontSize: 12, background: "#fff" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 Ch\u1ECDn \u0111i\u1EC1u ki\u1EC7n \u2014"),
    availableOps.map((op) => /* @__PURE__ */ React.createElement("option", { key: op.value, value: op.value }, op.label))
  )), sourceId && operator && !["answered", "not_answered"].includes(operator) && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 } }, "Gi\xE1 tr\u1ECB"), getValueInput()), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        onChange(null);
        setOpen(false);
      },
      style: { padding: "5px 12px", borderRadius: 7, border: "1px solid " + C.border, background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 600, color: C.textSub, fontFamily: C.font }
    },
    "X\xF3a \u0111i\u1EC1u ki\u1EC7n"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setOpen(false),
      style: { padding: "5px 12px", borderRadius: 7, border: "none", background: C.primary, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#fff", fontFamily: C.font }
    },
    "Xong"
  ))));
}
function QuestionCard({ q, index, isActive, onActivate, onSave, onCancel, onDelete, onDuplicate, deletingId, sections, questions, surveyId }) {
  const [contentHtml, setContentHtml] = useState(q.content ?? "");
  const [type, setType] = useState(toFEType(q.type));
  const [sectionId, setSectionId] = useState(q.section_id ?? null);
  const [required, setRequired] = useState(q.required ?? true);
  const [description, setDescription] = useState(q.description ?? "");
  const [placeholder, setPlaceholder] = useState(q.placeholder ?? "");
  const [mediaUrl, setMediaUrl] = useState(q.media_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [condition, setCondition] = useState(q.condition ?? null);
  const existingOptions = q.options ?? q.option ?? [];
  const [optionRows, setOptionRows] = useState(
    existingOptions.length > 0 ? existingOptions.map(
      (o) => typeof o === "string" ? { label: o, value: o, order_index: 0, is_other: false, image: null } : {
        label: o.label ?? "",
        value: o.value ?? "",
        order_index: o.order_index ?? 0,
        is_other: o.is_other ?? false,
        image: o.image_url ? { url: o.image_url } : null
      }
    ) : [newOptionRow()]
  );
  const [settings, setSettings] = useState(q.settings ?? null);
  const [saving, setSaving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isChoice = CHOICE_TYPES.includes(type);
  const hasSettings = SETTINGS_TYPES.includes(type);
  const isDeleting = deletingId === q.id;
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
      const rowsWithFiles = optionRows.filter((r) => r.image?.url?.startsWith("blob:"));
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
      content: contentHtml,
      type: toBEType(type),
      required,
      settings: hasSettings ? settings : void 0,
      description: description.trim() || null,
      placeholder: placeholder.trim() || null,
      media_url: finalMediaUrl,
      section_id: sectionId || null,
      condition: condition || null
    };
    if (isChoice) payload.options = buildBEOptions(finalOptionRows);
    try {
      await onSave(q.id, surveyId, payload);
    } finally {
      setSaving(false);
    }
  };
  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!MEDIA_TYPES.includes(file.type)) {
      alert("Ch\u1EC9 h\u1ED7 tr\u1EE3 \u1EA3nh JPG, PNG, GIF, WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File qu\xE1 l\u1EDBn. T\u1ED1i \u0111a 5MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await surveyService.uploadQuestionMedia(formData);
      const data = res?.data ?? res;
      setMediaUrl(data?.url || data?.data?.url || "");
    } catch (err) {
      console.error(err);
      alert("Upload th\u1EA5t b\u1EA1i: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };
  if (!isActive) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        onClick: () => onActivate(q.id),
        style: {
          background: C.surface,
          border: "1px solid " + C.border,
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
          position: "relative",
          transition: "all .18s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { opacity: hovered ? 1 : 0, transition: "opacity .15s", flexShrink: 0, display: "flex" } }, /* @__PURE__ */ React.createElement(GripVertical, { size: 16, color: "#888", style: { cursor: "grab" } })),
      /* @__PURE__ */ React.createElement("span", { style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: C.primaryLight,
        color: C.primary,
        fontSize: 11,
        fontWeight: 600,
        flexShrink: 0
      } }, index + 1),
      /* @__PURE__ */ React.createElement(
        "p",
        {
          style: { flex: 1, margin: 0, fontSize: 14, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
          dangerouslySetInnerHTML: {
            __html: q.content ? q.content : '<em style="color:' + C.textDim + ';font-weight:400">C\xE2u h\u1ECFi ch\u01B0a c\xF3 ti\xEAu \u0111\u1EC1</em>'
          }
        }
      ),
      /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 12,
        fontWeight: 500,
        flexShrink: 0,
        background: C.primaryBg,
        color: C.primary,
        padding: "2px 10px",
        borderRadius: 999
      } }, Q_TYPES.find((t) => t.value === toFEType(q.type))?.label),
      sections?.length > 0 && /* @__PURE__ */ React.createElement(
        "select",
        {
          value: q.section_id || "",
          onClick: (e) => e.stopPropagation(),
          onChange: async (e) => {
            e.stopPropagation();
            await onSave(q.id, surveyId, {
              content: q.content,
              type: q.type,
              required: q.required,
              options: q.options,
              settings: q.settings,
              description: q.description,
              placeholder: q.placeholder,
              media_url: q.media_url,
              condition: q.condition,
              section_id: e.target.value || null
            });
          },
          style: {
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 6,
            border: "1px solid " + C.border,
            background: C.surface,
            color: C.textSub,
            cursor: "pointer",
            fontFamily: C.font,
            outline: "none",
            maxWidth: 130,
            flexShrink: 0
          }
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "Ch\u01B0a ph\xE2n trang"),
        sections.map((s) => /* @__PURE__ */ React.createElement("option", { key: s.id, value: s.id }, s.title?.slice(0, 14)))
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            onDelete(q.id);
          },
          disabled: isDeleting,
          style: { ...iconBtn("#CCC"), flexShrink: 0 },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = C.errorBg;
            e.currentTarget.style.color = C.error;
            e.currentTarget.style.borderColor = C.errorBorder;
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#CCC";
            e.currentTarget.style.borderColor = "transparent";
          }
        },
        isDeleting ? /* @__PURE__ */ React.createElement(Loader2, { size: 12, style: { animation: "spin 1s linear infinite" } }) : /* @__PURE__ */ React.createElement(Trash2, { size: 12 })
      )
    );
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: C.surface,
    border: "1px solid " + C.primary,
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "8px 0", borderBottom: "1px solid " + C.border } }, /* @__PURE__ */ React.createElement(GripVertical, { size: 16, color: "#888", style: { cursor: "grab" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { ...lbl, marginBottom: 6 } }, "N\u1ED9i dung c\xE2u h\u1ECFi"), /* @__PURE__ */ React.createElement(
    RichTextEditor,
    {
      value: contentHtml,
      onChange: setContentHtml,
      placeholder: "C\xE2u h\u1ECFi kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1",
      minHeight: 56
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 22, minWidth: 200 } }, /* @__PURE__ */ React.createElement(QuestionTypeDropdown, { value: type, onChange: handleTypeChange }))), /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 20px 0", paddingLeft: 36, display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { ...lbl, marginBottom: 4 } }, "M\xF4 t\u1EA3 c\xE2u h\u1ECFi (t\xF9y ch\u1ECDn)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: description,
      onChange: (e) => setDescription(e.target.value),
      placeholder: "Th\xEAm g\u1EE3i \xFD ho\u1EB7c m\xF4 t\u1EA3 cho c\xE2u h\u1ECFi...",
      style: { ...inp(false), padding: "7px 10px", fontSize: 12 }
    }
  )), ["TEXT", "PARAGRAPH", "EMAIL", "DATE", "NUMBER", "TIME"].includes(type) && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { ...lbl, marginBottom: 4 } }, "Placeholder (t\xF9y ch\u1ECDn)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: placeholder,
      onChange: (e) => setPlaceholder(e.target.value),
      placeholder: "V\u0103n b\u1EA3n g\u1EE3i \xFD trong \xF4 nh\u1EADp li\u1EC7u...",
      style: { ...inp(false), padding: "7px 10px", fontSize: 12 }
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 20px 0", paddingLeft: 36 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { ...lbl, marginBottom: 4 } }, "H\xECnh \u1EA3nh / Video (URL t\xF9y ch\u1ECDn)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "url",
      value: mediaUrl,
      onChange: (e) => setMediaUrl(e.target.value),
      placeholder: "https://example.com/image.jpg",
      style: { ...inp(false), padding: "7px 10px", fontSize: 12, flex: 1 }
    }
  ), /* @__PURE__ */ React.createElement(
    "label",
    {
      style: { display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 12px", border: "1px solid " + C.border, borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#888", background: C.surfaceHover, transition: "all .12s" },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = C.primaryBg;
        e.currentTarget.style.color = C.primary;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = C.surfaceHover;
        e.currentTarget.style.color = "#888";
      }
    },
    uploading ? /* @__PURE__ */ React.createElement(Loader2, { size: 13, style: { animation: "spin 1s linear infinite" } }) : /* @__PURE__ */ React.createElement(ImagePlus, { size: 13 }),
    /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", onChange: handleMediaUpload, style: { display: "none" } })
  )), mediaUrl && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement("img", { src: mediaUrl, alt: "Preview", style: { maxWidth: 120, maxHeight: 80, borderRadius: 6, objectFit: "cover", border: "1px solid " + C.border } })))), /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 20px 0", paddingLeft: 36 } }, /* @__PURE__ */ React.createElement("span", { style: { ...lbl, marginBottom: 4 } }, "Trang / Ph\u1EA7n"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: sectionId || "",
      onChange: (e) => setSectionId(e.target.value || null),
      style: {
        width: "100%",
        padding: "7px 10px",
        border: "1px solid " + C.border,
        borderRadius: 6,
        fontSize: 12,
        fontFamily: C.font,
        color: C.text,
        background: "#fff",
        outline: "none",
        cursor: "pointer"
      }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 Kh\xF4ng thu\u1ED9c trang n\xE0o \u2014"),
    sections.map((s) => /* @__PURE__ */ React.createElement("option", { key: s.id, value: s.id }, s.title || "Kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1"))
  )), /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 20px 0", paddingLeft: 36 } }, /* @__PURE__ */ React.createElement(
    ConditionEditor,
    {
      questions,
      currentQId: q.id,
      value: condition,
      onChange: setCondition
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 20px 0", paddingLeft: 36, display: "flex", flexDirection: "column", gap: 16 } }, isChoice && /* @__PURE__ */ React.createElement(InlineOptionBuilder, { qType: type, optionRows, onChange: setOptionRows }), hasSettings && /* @__PURE__ */ React.createElement(SettingsEditor, { type, settings, onChange: setSettings }), !isChoice && !hasSettings && /* @__PURE__ */ React.createElement(QuestionBody, { q, type })), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    padding: "12px 20px 14px",
    borderTop: "1px solid " + C.border,
    marginTop: 12
  } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onDuplicate(q),
      title: "Nh\xE2n \u0111\xF4i",
      style: iconBtn("#888"),
      onMouseEnter: (e) => e.currentTarget.style.background = C.surfaceHover,
      onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
    },
    /* @__PURE__ */ React.createElement(Copy, { size: 14 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onDelete(q.id),
      disabled: isDeleting,
      title: "X\xF3a",
      style: iconBtn(C.error, C.errorBorder, C.errorBg),
      onMouseEnter: (e) => e.currentTarget.style.background = "#fee2e2",
      onMouseLeave: (e) => e.currentTarget.style.background = C.errorBg
    },
    isDeleting ? /* @__PURE__ */ React.createElement(Loader2, { size: 14, style: { animation: "spin 1s linear infinite" } }) : /* @__PURE__ */ React.createElement(Trash2, { size: 14 })
  ), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 24, background: C.border, margin: "0 8px" } }), /* @__PURE__ */ React.createElement(Toggle, { checked: required, onChange: setRequired }), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 24, background: C.border, margin: "0 8px" } }), /* @__PURE__ */ React.createElement("button", { onClick: handleSave, disabled: saving, style: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 18px",
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: saving ? "not-allowed" : "pointer",
    fontFamily: C.font
  } }, saving && /* @__PURE__ */ React.createElement(Loader2, { size: 12, style: { animation: "spin 1s linear infinite" } }), "L\u01B0u"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onCancel,
      style: {
        padding: "8px 14px",
        background: "#fff",
        border: "1px solid " + C.primary,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: C.primary,
        cursor: "pointer",
        fontFamily: C.font,
        transition: "background .12s"
      },
      onMouseEnter: (e) => e.currentTarget.style.background = C.primaryBg,
      onMouseLeave: (e) => e.currentTarget.style.background = "#fff"
    },
    "\u0110\xF3ng"
  )));
}
function Sidebar({ onAddQuestion }) {
  const items = [
    { icon: /* @__PURE__ */ React.createElement(Plus, { size: 18 }), title: "Th\xEAm c\xE2u h\u1ECFi", action: onAddQuestion },
    { icon: /* @__PURE__ */ React.createElement(FileText, { size: 18 }), title: "Import c\xE2u h\u1ECFi", action: () => {
    } },
    { icon: /* @__PURE__ */ React.createElement(Type, { size: 18 }), title: "Th\xEAm ti\xEAu \u0111\u1EC1", action: () => {
    } },
    { icon: /* @__PURE__ */ React.createElement(Image, { size: 18 }), title: "Th\xEAm h\xECnh \u1EA3nh", action: () => {
    } },
    { icon: /* @__PURE__ */ React.createElement(Video, { size: 18 }), title: "Th\xEAm video", action: () => {
    } },
    { icon: /* @__PURE__ */ React.createElement(Minus, { size: 18 }), title: "Th\xEAm ph\u1EA7n m\u1EDBi", action: () => {
    } }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "sticky",
    top: 24,
    alignSelf: "flex-start",
    background: C.surface,
    border: "1px solid " + C.border,
    borderRadius: 12,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
  } }, items.map((item, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: i,
      onClick: item.action,
      title: item.title,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "#888",
        transition: "all .12s",
        borderBottom: i < items.length - 1 ? "1px solid " + C.border : "none"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = C.primaryBg;
        e.currentTarget.style.color = C.primary;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#888";
      }
    },
    item.icon
  )));
}
function SurveyHeroCard({ loading, title, description, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [localErr, setLocalErr] = useState("");
  const cardBase = {
    background: C.surface,
    border: "1px solid " + C.border,
    borderRadius: 12,
    padding: "22px 26px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
  };
  const inp2 = (tall) => ({
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    border: "1px solid " + C.border,
    borderRadius: 8,
    color: C.text,
    fontSize: tall ? 14 : 17,
    fontWeight: tall ? 500 : 600,
    fontFamily: C.font,
    outline: "none",
    padding: tall ? "10px 12px" : "11px 14px",
    resize: tall ? "vertical" : void 0,
    minHeight: tall ? 88 : void 0,
    lineHeight: 1.45
  });
  const startEdit = () => {
    setDraftTitle(title);
    setDraftDesc(description || "");
    setLocalErr("");
    setEditing(true);
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { style: { ...cardBase, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 } }, /* @__PURE__ */ React.createElement(Loader2, { size: 24, color: C.primary, style: { animation: "spin 1s linear infinite" } }));
  }
  return /* @__PURE__ */ React.createElement("div", { style: cardBase }, !editing ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.textDim, textTransform: "uppercase" } }, "Kh\u1EA3o s\xE1t c\u1EE7a b\u1EA1n"), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22, fontWeight: 600, color: C.text, margin: "8px 0 10px", lineHeight: 1.25 } }, title?.trim() ? title : "Ch\u01B0a \u0111\u1EB7t ti\xEAu \u0111\u1EC1"), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.55, whiteSpace: "pre-wrap" } }, description?.trim() ? description : "Ch\u01B0a c\xF3 m\xF4 t\u1EA3 cho kh\u1EA3o s\xE1t n\xE0y.")), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: startEdit,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 16px",
        background: "#fff",
        border: "1px solid " + C.primary,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: C.primary,
        cursor: "pointer",
        fontFamily: C.font,
        flexShrink: 0
      }
    },
    /* @__PURE__ */ React.createElement(Pencil, { size: 15 }),
    "Ch\u1EC9nh s\u1EEDa"
  )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { ...lbl, marginBottom: 6, display: "block" } }, "Ti\xEAu \u0111\u1EC1"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: draftTitle,
      onChange: (e) => {
        setDraftTitle(e.target.value);
        setLocalErr("");
      },
      placeholder: "T\xEAn kh\u1EA3o s\xE1t",
      style: inp2(false)
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { ...lbl, marginBottom: 6, display: "block" } }, "M\xF4 t\u1EA3"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: draftDesc,
      onChange: (e) => {
        setDraftDesc(e.target.value);
        setLocalErr("");
      },
      placeholder: "M\xF4 t\u1EA3 ng\u1EAFn (tu\u1EF3 ch\u1ECDn)",
      rows: 3,
      style: inp2(true)
    }
  ))), localErr && /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    fontSize: 13,
    color: C.error,
    background: C.errorBg,
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid " + C.errorBorder
  } }, /* @__PURE__ */ React.createElement(AlertCircle, { size: 14 }), localErr), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setEditing(false);
        setLocalErr("");
      },
      style: {
        padding: "9px 16px",
        background: "#fff",
        border: "1px solid " + C.primary,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: C.primary,
        cursor: "pointer",
        fontFamily: C.font
      }
    },
    "Hu\u1EF7"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: saving,
      onClick: async () => {
        const t = draftTitle.trim();
        if (!t) {
          setLocalErr("Ti\xEAu \u0111\u1EC1 kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
          return;
        }
        try {
          await onSave(t, draftDesc.trim());
          setEditing(false);
        } catch {
        }
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 18px",
        background: C.primary,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: saving ? "not-allowed" : "pointer",
        fontFamily: C.font
      }
    },
    saving && /* @__PURE__ */ React.createElement(Loader2, { size: 13, style: { animation: "spin 1s linear infinite" } }),
    saving ? "\u0110ang l\u01B0u\u2026" : "L\u01B0u th\xF4ng tin"
  ))));
}
export default function QuestionPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { updateSurvey } = useSurvey();
  const {
    questions,
    loading,
    createQuestion,
    fetchQuestionsBySurvey,
    updateQuestion,
    deleteQuestion,
    bulkCreateQuestions
  } = useQuestion();
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [surveyMetaLoading, setSurveyMetaLoading] = useState(true);
  const [metaSaving, setMetaSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [contentHtml, setContentHtml] = useState("");
  const [type, setType] = useState("TEXT");
  const [required, setRequired] = useState(true);
  const [description, setDescription] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [optionRows, setOptionRows] = useState([newOptionRow()]);
  const [settings, setSettings] = useState(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [qImage, setQImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const pendingIdRef = useRef(null);
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [addingSection, setAddingSection] = useState(false);
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
        order_index: sections.length
      });
      const created = res?.data?.section ?? res?.data?.data ?? res?.data;
      if (created) {
        setSections((prev) => [...prev, created]);
        setNewSectionTitle("");
        setAddingSection(false);
      }
    } catch {
    }
  };
  const handleDeleteSection = async (sectionId) => {
    try {
      await surveyService.deleteSection(sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      if (activeSectionId === sectionId) setActiveSectionId(null);
    } catch {
    }
  };
  const questionsBySection = useCallback(() => {
    const grouped = {};
    grouped["__none__"] = questions.filter((q) => !q.section_id);
    sections.forEach((s) => {
      grouped[s.id] = questions.filter((q) => q.section_id === s.id);
    });
    return grouped;
  }, [questions, sections]);
  const displayedQuestions = activeSectionId ? questions.filter((q) => q.section_id === activeSectionId) : questions;
  const sectionCount = sections.length;
  const noSectionCount = questions.filter((q) => !q.section_id).length;
  useEffect(() => {
    if (surveyId) fetchQuestionsBySurvey(surveyId);
  }, [surveyId]);
  useEffect(() => {
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
    return () => {
      cancelled = true;
    };
  }, [surveyId]);
  useEffect(() => {
    if (!pendingIdRef.current) return;
    const found = questions.find((q) => q.id === pendingIdRef.current);
    if (found) {
      setActiveId(found.id);
      pendingIdRef.current = null;
    }
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
      setFormError("N\u1ED9i dung c\xE2u h\u1ECFi kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      return;
    }
    const isChoice2 = CHOICE_TYPES.includes(type);
    const hasSettings2 = SETTINGS_TYPES.includes(type);
    if (isChoice2) {
      const valid = buildBEOptions(optionRows);
      if (valid.length < 2) {
        setFormError("C\u1EA7n \xEDt nh\u1EA5t 2 l\u1EF1a ch\u1ECDn h\u1EE3p l\u1EC7 (label v\xE0 value kh\xF4ng \u0111\u01B0\u1EE3c r\u1ED7ng).");
        return;
      }
    }
    if (type === "NUMBER" && settings?.min !== void 0 && settings?.max !== void 0) {
      if (settings.min > settings.max) {
        setFormError("Min ph\u1EA3i nh\u1ECF h\u01A1n ho\u1EB7c b\u1EB1ng Max.");
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
        toast.error("Upload \u1EA3nh th\u1EA5t b\u1EA1i. C\xE2u h\u1ECFi s\u1EBD \u0111\u01B0\u1EE3c t\u1EA1o kh\xF4ng c\xF3 \u1EA3nh.");
      }
    }
    let finalOptionRows = optionRows;
    if (isChoice2) {
      const rowsWithImages = optionRows.filter((r) => r.image?.file);
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
      content: contentHtml,
      type: toBEType(type),
      required,
      order_index: questions.length,
      settings: hasSettings2 ? settings : void 0,
      description: description.trim() || null,
      placeholder: placeholder.trim() || null,
      media_url: finalMediaUrl,
      section_id: activeSectionId || null
    };
    if (isChoice2) {
      payload.options = buildBEOptions(finalOptionRows);
    }
    setShowForm(false);
    resetForm();
    setFormLoading(true);
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingIdRef.current = created.id;
    } catch {
    } finally {
      setFormLoading(false);
    }
  };
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteQuestion(id, surveyId);
      if (activeId === id) setActiveId(null);
    } finally {
      setDeletingId(null);
    }
  };
  const handleDuplicate = useCallback(async (q) => {
    const opts = q.options ?? q.option ?? [];
    const payload = {
      content: q.content + " (b\u1EA3n sao)",
      type: toBEType(toFEType(q.type)),
      required: q.required,
      order_index: questions.length,
      settings: q.settings ?? void 0,
      description: q.description ?? null,
      placeholder: q.placeholder ?? null,
      media_url: q.media_url ?? null,
      section_id: q.section_id ?? null
    };
    const feType = toFEType(q.type);
    if (CHOICE_TYPES.includes(feType) && opts.length > 0) {
      payload.options = opts.map((o, i) => ({
        label: typeof o === "string" ? o : o.label ?? "",
        value: typeof o === "string" ? o : o.value ?? "",
        order_index: i,
        is_other: typeof o === "object" ? o.is_other ?? false : false
      })).filter((o) => o.label && o.value);
    }
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingIdRef.current = created.id;
    } catch {
    }
  }, [questions, surveyId, createQuestion, fetchQuestionsBySurvey]);
  const handleUpdate = useCallback(async (id, sid, payload) => {
    const mappedPayload = {
      ...payload,
      type: payload.type ? toBEType(toFEType(payload.type)) : void 0
    };
    delete mappedPayload.option;
    if (Array.isArray(mappedPayload.options)) {
      mappedPayload.options = mappedPayload.options.map(
        (o, i) => typeof o === "string" ? { label: o, value: o, order_index: i, is_other: false } : o
      ).filter((o) => o.label && o.value);
    }
    await updateQuestion(id, sid, mappedPayload);
    setActiveId(null);
  }, [updateQuestion]);
  const triggerAdd = () => {
    setShowForm((v) => !v);
    setFormError("");
    setActiveId(null);
    if (showForm) resetForm();
  };
  const handleSaveSurveyMeta = async (title, description2) => {
    setMetaSaving(true);
    try {
      const updated = await updateSurvey(surveyId, {
        title,
        description: description2 || void 0
      });
      if (updated) {
        setSurveyTitle(updated.title);
        setSurveyDescription(updated.description || "");
      }
    } finally {
      setMetaSaving(false);
    }
  };
  const isChoice = CHOICE_TYPES.includes(type);
  const hasSettings = SETTINGS_TYPES.includes(type);
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: C.bg, padding: 0, fontFamily: C.font, position: "relative", overflowX: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative", zIndex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "4px 24px 32px",
    display: "flex",
    gap: 16,
    alignItems: "flex-start"
  } }, /* @__PURE__ */ React.createElement("div", { style: { width: 220, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
    SectionPanel,
    {
      sections,
      activeSectionId,
      onSelect: setActiveSectionId,
      onDelete: handleDeleteSection,
      onAdd: handleCreateSection
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14
  } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => navigate(ROUTERS.USER.MY_SURVEYS),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "#fff",
        border: "1px solid " + C.primary,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: C.primary,
        cursor: "pointer",
        fontFamily: C.font,
        height: 36
      }
    },
    /* @__PURE__ */ React.createElement(ChevronLeft, { size: 18, strokeWidth: 2.25 }),
    "Danh s\xE1ch kh\u1EA3o s\xE1t"
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } }, formLoading && /* @__PURE__ */ React.createElement(Loader2, { size: 14, color: C.primary, style: { animation: "spin 1s linear infinite" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: C.textSub, fontWeight: 500 } }, questions.length, " c\xE2u h\u1ECFi"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setAiOpen(true);
        setShowForm(false);
        setActiveId(null);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "transparent",
        color: C.primary,
        border: "1px solid " + C.primary,
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: C.font,
        height: 36
      }
    },
    /* @__PURE__ */ React.createElement(Sparkles, { size: 16 }),
    "AI"
  ), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: triggerAdd, style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: C.font,
    height: 36
  } }, showForm ? /* @__PURE__ */ React.createElement(X, { size: 16 }) : /* @__PURE__ */ React.createElement(Plus, { size: 16 }), showForm ? "Hu\u1EF7" : "C\xE2u h\u1ECFi m\u1EDBi"))), /* @__PURE__ */ React.createElement(
    SurveyHeroCard,
    {
      loading: surveyMetaLoading,
      title: surveyTitle,
      description: surveyDescription,
      saving: metaSaving,
      onSave: handleSaveSurveyMeta
    }
  ), showForm && /* @__PURE__ */ React.createElement("div", { style: {
    background: C.surface,
    border: "1px solid " + C.primary,
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 16, fontWeight: 600, color: C.text, margin: "0 0 16px" } }, "C\xE2u h\u1ECFi m\u1EDBi"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleAdd }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: lbl }, "N\u1ED9i dung c\xE2u h\u1ECFi *"), /* @__PURE__ */ React.createElement(
    RichTextEditor,
    {
      value: contentHtml,
      onChange: (html) => {
        setContentHtml(html);
        setFormError("");
      },
      placeholder: "Nh\u1EADp n\u1ED9i dung c\xE2u h\u1ECFi...",
      minHeight: 72,
      hasError: !!formError && !getPlainText(contentHtml).trim()
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 200 } }, /* @__PURE__ */ React.createElement("span", { style: lbl }, "Lo\u1EA1i c\xE2u h\u1ECFi"), /* @__PURE__ */ React.createElement(QuestionTypeDropdown, { value: type, onChange: handleFormTypeChange }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: lbl }, "M\xF4 t\u1EA3 c\xE2u h\u1ECFi (t\xF9y ch\u1ECDn)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: description,
      onChange: (e) => setDescription(e.target.value),
      placeholder: "Th\xEAm g\u1EE3i \xFD ho\u1EB7c m\xF4 t\u1EA3...",
      style: { ...inp(false), padding: "7px 10px", fontSize: 12 }
    }
  )), ["TEXT", "PARAGRAPH", "EMAIL", "DATE", "NUMBER", "TIME"].includes(type) && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: lbl }, "Placeholder (t\xF9y ch\u1ECDn)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: placeholder,
      onChange: (e) => setPlaceholder(e.target.value),
      placeholder: "V\u0103n b\u1EA3n g\u1EE3i \xFD trong \xF4 nh\u1EADp li\u1EC7u...",
      style: { ...inp(false), padding: "7px 10px", fontSize: 12 }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: lbl }, "H\xECnh \u1EA3nh / Video (t\xF9y ch\u1ECDn)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      accept: "image/*",
      onChange: async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File qu\xE1 l\u1EDBn. T\u1ED1i \u0111a 5MB.");
          return;
        }
        setQImage({ file, url: URL.createObjectURL(file) });
        e.target.value = "";
      },
      style: { display: "none" },
      id: "q-image-upload"
    }
  ), /* @__PURE__ */ React.createElement("label", { htmlFor: "q-image-upload", style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    border: "1px solid " + C.border,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    color: "#888",
    background: C.surfaceHover,
    transition: "all .12s"
  } }, /* @__PURE__ */ React.createElement(ImagePlus, { size: 14 }), " Ch\u1ECDn \u1EA3nh"), qImage && /* @__PURE__ */ React.createElement("img", { src: qImage.url, alt: "Preview", style: { maxWidth: 80, maxHeight: 50, borderRadius: 6, objectFit: "cover", border: "1px solid " + C.border } }), qImage && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setQImage(null);
      },
      style: { padding: "4px 8px", border: "none", borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#dc2626", cursor: "pointer", fontSize: 11, fontWeight: 600 }
    },
    "X\xF3a \u1EA3nh"
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "url",
      value: mediaUrl,
      onChange: (e) => {
        setMediaUrl(e.target.value);
        setQImage(null);
      },
      placeholder: "Ho\u1EB7c d\xE1n URL \u1EA3nh...",
      style: { ...inp(false), padding: "7px 10px", fontSize: 12, flex: 1, maxWidth: 200 }
    }
  )))), /* @__PURE__ */ React.createElement(Toggle, { checked: required, onChange: setRequired }), isChoice && /* @__PURE__ */ React.createElement(
    InlineOptionBuilder,
    {
      qType: type,
      optionRows,
      onChange: (rows) => {
        setOptionRows(rows);
        setFormError("");
      }
    }
  ), hasSettings && /* @__PURE__ */ React.createElement(SettingsEditor, { type, settings, onChange: setSettings }), formError && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.error, background: C.errorBg, padding: "8px 12px", borderRadius: 8, border: "1px solid " + C.errorBorder } }, /* @__PURE__ */ React.createElement(AlertCircle, { size: 14 }), formError), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 10 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setShowForm(false);
        resetForm();
      },
      style: {
        padding: "9px 16px",
        background: "#fff",
        border: "1px solid " + C.primary,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: C.primary,
        cursor: "pointer",
        fontFamily: C.font,
        transition: "background .12s"
      },
      onMouseEnter: (e) => e.currentTarget.style.background = C.primaryBg,
      onMouseLeave: (e) => e.currentTarget.style.background = "#fff"
    },
    "Hu\u1EF7"
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: formLoading, style: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    background: formLoading ? C.surfaceHover : C.primary,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: formLoading ? "not-allowed" : "pointer",
    fontFamily: C.font
  } }, formLoading ? /* @__PURE__ */ React.createElement(Loader2, { size: 13, style: { animation: "spin 1s linear infinite" } }) : /* @__PURE__ */ React.createElement(Plus, { size: 13 }), formLoading ? "\u0110ang th\xEAm..." : "Th\xEAm c\xE2u h\u1ECFi"))))), loading && questions.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "4rem 0" } }, /* @__PURE__ */ React.createElement(Loader2, { size: 28, color: C.primary, style: { animation: "spin 1s linear infinite" } })) : questions.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "5rem 0",
    gap: 14,
    background: C.surface,
    borderRadius: 12,
    border: "1px solid " + C.border,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement(Inbox, { size: 54, strokeWidth: 1.2, color: C.textDim }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, margin: 0, color: C.text, fontWeight: 600 } }, "Ch\u01B0a c\xF3 c\xE2u h\u1ECFi n\xE0o"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, margin: 0, color: C.textSub } }, "H\xE3y t\u1EA1o c\xE2u h\u1ECFi \u0111\u1EA7u ti\xEAn ho\u1EB7c nh\u1EDD AI g\u1EE3i \xFD"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setShowForm(true), style: {
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    background: C.primary,
    border: "none",
    cursor: "pointer",
    borderRadius: 8,
    padding: "9px 18px",
    fontFamily: C.font
  } }, "Th\xEAm c\xE2u h\u1ECFi \u0111\u1EA7u ti\xEAn"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setAiOpen(true), style: {
    fontSize: 13,
    fontWeight: 600,
    color: C.primary,
    background: "#fff",
    border: "1px solid " + C.primary,
    cursor: "pointer",
    borderRadius: 8,
    padding: "9px 18px",
    fontFamily: C.font,
    display: "flex",
    alignItems: "center",
    gap: 8
  } }, /* @__PURE__ */ React.createElement(Sparkles, { size: 16 }), " Tr\u1EE3 l\xFD AI"))) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, activeSectionId && (() => {
    const sec = sections.find((s) => s.id === activeSectionId);
    return sec ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: C.primaryBg, borderRadius: 8, border: "1px solid " + C.primaryLight } }, /* @__PURE__ */ React.createElement(Layout, { size: 16, color: C.primary }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: C.primary } }, sec.title), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textSub, marginLeft: "auto" } }, displayedQuestions.length, " c\xE2u h\u1ECFi")) : null;
  })(), displayedQuestions.map((q, index) => /* @__PURE__ */ React.createElement(
    QuestionCard,
    {
      key: q.id,
      q,
      index,
      isActive: activeId === q.id,
      onActivate: (id) => {
        setActiveId(id);
        setShowForm(false);
      },
      onSave: handleUpdate,
      onCancel: () => setActiveId(null),
      onDelete: handleDelete,
      onDuplicate: handleDuplicate,
      deletingId,
      sections,
      questions,
      surveyId
    }
  )))), /* @__PURE__ */ React.createElement(Sidebar, { onAddQuestion: triggerAdd })), /* @__PURE__ */ React.createElement(
    AiQuestionAssistant,
    {
      open: aiOpen,
      onClose: () => setAiOpen(false),
      surveyId,
      surveyTitle,
      surveyDescription,
      existingCount: questions.length,
      C,
      onApplied: (payload) => bulkCreateQuestions(surveyId, payload)
    }
  ), /* @__PURE__ */ React.createElement("style", null, `@keyframes spin{to{transform:rotate(360deg);}}`)));
}

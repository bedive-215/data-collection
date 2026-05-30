/**
 * QuestionPage.jsx — React Native
 *
 * Chuyển từ web (React + lucide-react + react-router-dom + CSS-in-JS)
 * sang React Native thuần.
 *
 * Thay thế chính:
 *  - CSS inline / className         → StyleSheet
 *  - div / p / h2 / input / select  → View / Text / TextInput / Picker / Modal
 *  - contentEditable RichTextEditor → TextInput multiline (RN không có DOM)
 *  - document.execCommand           → bỏ hoàn toàn (không có trên RN)
 *  - react-router-dom useParams     → props.route.params (React Navigation)
 *  - navigate()                     → navigation.goBack()
 *  - URL.createObjectURL            → uri trực tiếp từ react-native-image-picker
 *  - lucide-react icons             → @expo/vector-icons (Feather / MaterialIcons)
 *  - window.confirm / window.alert  → Alert.alert
 *  - FormData + file input          → react-native-image-picker + FormData RN
 *
 * Cài thêm:
 *   npm install @react-native-picker/picker react-native-image-picker
 *   expo install @expo/vector-icons   (nếu dùng Expo)
 */

import React, {
  useEffect, useState, useRef, useCallback,
} from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Modal, FlatList,
  KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import {
  launchImageLibrary,
} from "react-native-image-picker";
import { Sparkles } from "lucide-react-native";

import { useQuestion }  from "../../providers/Questionprovider";
import { useSurvey }    from "../../providers/SurveyProvider";
import surveyService    from "../../services/surveyService";
import AiQuestionAssistant from "../../components/survey/AiQuestionAssistant";

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:            "#f0f4ff",
  surface:       "#ffffff",
  surfaceHigh:   "#f8fafc",
  border:        "#dbe2ea",
  primary:       "#4f46e5",
  primaryDim:    "rgba(79,110,247,0.09)",
  primaryBorder: "#c7d2fe",
  text:          "#111827",
  textSub:       "#64748b",
  textDim:       "#94a3b8",
  error:         "#ef4444",
  errorBg:       "#fef2f2",
  errorBorder:   "#fecaca",
};

/* ─── Type helpers ───────────────────────────────────────────────── */
const BE_TO_FE_TYPE = {
  text:"TEXT", paragraph:"PARAGRAPH", email:"EMAIL", date:"DATE",
  number:"NUMBER", rating:"RATING", single_choice:"SINGLE_CHOICE",
  multiple_choice:"MULTIPLE_CHOICE", dropdown:"DROPDOWN",
  linear_scale:"LINEAR_SCALE", time:"TIME", file_upload:"FILE_UPLOAD",
  TEXT:"TEXT", PARAGRAPH:"PARAGRAPH", EMAIL:"EMAIL", DATE:"DATE",
  NUMBER:"NUMBER", RATING:"RATING", SINGLE_CHOICE:"SINGLE_CHOICE",
  MULTIPLE_CHOICE:"MULTIPLE_CHOICE", DROPDOWN:"DROPDOWN",
  LINEAR_SCALE:"LINEAR_SCALE", TIME:"TIME", FILE_UPLOAD:"FILE_UPLOAD",
};
const toFEType = (t) => BE_TO_FE_TYPE[t] ?? "TEXT";
const toBEType = (t) => t;

const CHOICE_TYPES   = ["SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN"];
const SETTINGS_TYPES = ["NUMBER","RATING","DATE","TEXT","PARAGRAPH","LINEAR_SCALE"];
const PLACEHOLDER_TYPES = ["TEXT","PARAGRAPH","EMAIL","DATE","NUMBER","TIME"];

const Q_TYPES = [
  { value:"TEXT",            label:"Trả lời ngắn"      },
  { value:"PARAGRAPH",       label:"Đoạn văn"           },
  { value:"SINGLE_CHOICE",   label:"Trắc nghiệm"        },
  { value:"MULTIPLE_CHOICE", label:"Hộp kiểm"           },
  { value:"DROPDOWN",        label:"Menu thả xuống"     },
  { value:"LINEAR_SCALE",    label:"Phạm vi tuyến tính" },
  { value:"RATING",          label:"Xếp hạng"           },
  { value:"NUMBER",          label:"Số"                 },
  { value:"DATE",            label:"Ngày"               },
  { value:"TIME",            label:"Giờ"                },
  { value:"EMAIL",           label:"Email"              },
  { value:"FILE_UPLOAD",     label:"Tải tệp lên"        },
];

const newOptionRow = () => ({ label:"", value:"", order_index:0, is_other:false, imageUri:null });

const buildBEOptions = (rows) =>
  rows
    .filter(r => r.label.trim() && r.value.trim())
    .map((r,i) => ({ label:r.label.trim(), value:r.value.trim(), order_index:i, is_other:r.is_other??false }));

/* ─── Toast helper ───────────────────────────────────────────────── */
const toast = (msg, type = "info") => {
  // Dùng Alert đơn giản; thay bằng react-native-toast-message nếu muốn
  if (type === "error") Alert.alert("Lỗi", msg);
  // success/info: không block UI, chỉ log
  else console.log("[Toast]", msg);
};

/* ═══════════════════════════════════════════════════════════════════
 * TOGGLE
 * ═══════════════════════════════════════════════════════════════════ */
function Toggle({ checked, onChange }) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!checked)}
      style={s.toggleRow}
      activeOpacity={0.7}
    >
      <Text style={s.toggleLabel}>Bắt buộc</Text>
      <View style={[s.toggleTrack, { backgroundColor: checked ? C.primary : C.border }]}>
        <View style={[s.toggleThumb, { left: checked ? 22 : 3 }]} />
      </View>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * QUESTION TYPE DROPDOWN  (Modal picker)
 * ═══════════════════════════════════════════════════════════════════ */
function QuestionTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = Q_TYPES.find(t => t.value === value) ?? Q_TYPES[0];

  return (
    <>
      <TouchableOpacity
        style={s.typeBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={s.typeBtnText}>{current.label}</Text>
        <Text style={{ color: C.textDim, fontSize: 12 }}>▼</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Loại câu hỏi</Text>
            <ScrollView>
              {Q_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[s.modalOption, t.value === value && s.modalOptionActive]}
                  onPress={() => { onChange(t.value); setOpen(false); }}
                >
                  <Text style={[s.modalOptionText, t.value === value && { color: C.primary, fontWeight:"700" }]}>
                    {t.label}
                  </Text>
                  {t.value === value && <Text style={{ color: C.primary }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.modalCancel} onPress={() => setOpen(false)}>
              <Text style={{ color: C.textSub, fontWeight:"600", fontSize:14 }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * SETTINGS EDITOR
 * ═══════════════════════════════════════════════════════════════════ */
function SettingsEditor({ type, settings, onChange }) {
  const set = settings ?? {};

  if (type === "TEXT" || type === "PARAGRAPH") {
    return (
      <View>
        <Text style={s.lbl}>Giới hạn ký tự</Text>
        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <Text style={s.sublbl}>Tối thiểu</Text>
            <TextInput
              style={s.inp}
              keyboardType="numeric"
              placeholder="Không giới hạn"
              placeholderTextColor={C.textDim}
              value={set.min_chars != null ? String(set.min_chars) : ""}
              onChangeText={v => onChange({ ...set, min_chars: v ? Number(v) : undefined })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sublbl}>Tối đa</Text>
            <TextInput
              style={s.inp}
              keyboardType="numeric"
              placeholder="Không giới hạn"
              placeholderTextColor={C.textDim}
              value={set.max_chars != null ? String(set.max_chars) : ""}
              onChangeText={v => onChange({ ...set, max_chars: v ? Number(v) : undefined })}
            />
          </View>
        </View>
      </View>
    );
  }

  if (type === "NUMBER") {
    return (
      <View>
        <Text style={s.lbl}>Giới hạn số</Text>
        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <Text style={s.sublbl}>Min</Text>
            <TextInput
              style={s.inp} keyboardType="numeric"
              placeholder="Không giới hạn" placeholderTextColor={C.textDim}
              value={set.min != null ? String(set.min) : ""}
              onChangeText={v => onChange({ ...set, min: v ? Number(v) : undefined })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sublbl}>Max</Text>
            <TextInput
              style={s.inp} keyboardType="numeric"
              placeholder="Không giới hạn" placeholderTextColor={C.textDim}
              value={set.max != null ? String(set.max) : ""}
              onChangeText={v => onChange({ ...set, max: v ? Number(v) : undefined })}
            />
          </View>
        </View>
      </View>
    );
  }

  if (type === "LINEAR_SCALE" || type === "RATING") {
    const min = set.min ?? 1;
    const max = set.max ?? 5;
    const label = type === "LINEAR_SCALE" ? "Phạm vi tuyến tính" : "Phạm vi đánh giá";
    return (
      <View style={{ gap: 10 }}>
        <Text style={s.lbl}>{label}</Text>
        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <Text style={s.sublbl}>Min</Text>
            <TextInput
              style={s.inp} keyboardType="numeric"
              value={String(min)}
              onChangeText={v => onChange({ ...set, min: Number(v) || 1 })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sublbl}>Max</Text>
            <TextInput
              style={s.inp} keyboardType="numeric"
              value={String(max)}
              onChangeText={v => onChange({ ...set, max: Number(v) || 5 })}
            />
          </View>
        </View>
        {type === "LINEAR_SCALE" && (
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Text style={s.sublbl}>Nhãn min</Text>
              <TextInput
                style={s.inp} placeholder="Không hài lòng" placeholderTextColor={C.textDim}
                value={set.min_label ?? ""}
                onChangeText={v => onChange({ ...set, min_label: v || undefined })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sublbl}>Nhãn max</Text>
              <TextInput
                style={s.inp} placeholder="Rất hài lòng" placeholderTextColor={C.textDim}
                value={set.max_label ?? ""}
                onChangeText={v => onChange({ ...set, max_label: v || undefined })}
              />
            </View>
          </View>
        )}
        {/* Scale preview */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection:"row", gap:6, paddingVertical:6 }}>
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => (
              <View key={n} style={s.scaleItem}>
                <Text style={{ fontSize:13, fontWeight:"700", color:C.primary }}>{n}</Text>
                {type === "RATING" && <Text style={{ fontSize:18, color:C.textDim }}>☆</Text>}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════
 * INLINE OPTION BUILDER
 * ═══════════════════════════════════════════════════════════════════ */
function InlineOptionBuilder({ qType, optionRows, onChange }) {
  const autoValue = (label) =>
    label.trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");

  const addRow = (afterIndex) => {
    const next = [...optionRows];
    next.splice(afterIndex + 1, 0, newOptionRow());
    onChange(next);
  };

  const removeRow = (i) => {
    if (optionRows.length <= 1) return;
    const next = [...optionRows];
    next.splice(i, 1);
    onChange(next);
  };

  const handleLabelChange = (i, labelVal) => {
    onChange(optionRows.map((row, idx) =>
      idx === i ? { ...row, label: labelVal, value: autoValue(labelVal) } : row
    ));
  };

  const handleValueChange = (i, val) => {
    onChange(optionRows.map((row, idx) => idx === i ? { ...row, value: val } : row));
  };

  const Marker = ({ index }) => {
    if (qType === "MULTIPLE_CHOICE")
      return <View style={s.checkboxMarker} />;
    if (qType === "DROPDOWN")
      return <Text style={s.dropdownMarker}>{index + 1}.</Text>;
    return <View style={s.radioMarker} />;
  };

  return (
    <View>
      <Text style={s.lbl}>Các lựa chọn</Text>
      {optionRows.map((row, i) => (
        <View key={i} style={s.optionRow}>
          <Marker index={i} />
          <View style={{ flex: 1, gap: 6 }}>
            <TextInput
              style={s.inp}
              placeholder={`Label ${i + 1}`}
              placeholderTextColor={C.textDim}
              value={row.label}
              onChangeText={v => handleLabelChange(i, v)}
              returnKeyType="next"
            />
            <TextInput
              style={[s.inp, { color: C.textSub, fontSize: 12 }]}
              placeholder={`value_${i + 1}`}
              placeholderTextColor={C.textDim}
              value={row.value}
              onChangeText={v => handleValueChange(i, v)}
            />
          </View>
          <TouchableOpacity
            onPress={() => removeRow(i)}
            disabled={optionRows.length <= 1}
            style={s.optionDelBtn}
          >
            <Text style={{ color: optionRows.length <= 1 ? C.textDim : C.error, fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={s.addOptionBtn} onPress={() => addRow(optionRows.length - 1)}>
        <Text style={{ color: C.primary, fontWeight:"600", fontSize:13 }}>＋ Thêm lựa chọn</Text>
      </TouchableOpacity>

      {/* Preview tags */}
      {optionRows.some(o => o.label.trim()) && (
        <View style={s.tagWrap}>
          {optionRows.filter(o => o.label.trim()).map((o,i) => (
            <View key={i} style={s.tag}>
              <Text style={s.tagText}>{o.label}</Text>
              {o.value ? <Text style={s.tagVal}>({o.value})</Text> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION PANEL  (sidebar left)
 * ═══════════════════════════════════════════════════════════════════ */
function SectionPanel({ sections, activeSectionId, onSelect, onDelete, onAdd }) {
  const [draft,   setDraft]   = useState("");
  const [adding,  setAdding]  = useState(false);

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft("");
    setAdding(false);
  };

  return (
    <View style={s.sectionPanel}>
      {/* Header */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionHeaderText}>Trang / Phần</Text>
        <TouchableOpacity onPress={() => setAdding(v => !v)} style={s.sectionAddBtn}>
          <Text style={{ color: C.primary, fontSize: 16, lineHeight: 18 }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Add new section input */}
      {adding && (
        <View style={s.sectionAddForm}>
          <TextInput
            autoFocus
            style={s.inp}
            placeholder="Tên trang mới..."
            placeholderTextColor={C.textDim}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            returnKeyType="done"
          />
          <View style={s.row2}>
            <TouchableOpacity style={[s.btn, { flex:1 }]} onPress={submit}>
              <Text style={s.btnText}>Thêm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnOutline, { flex:1 }]} onPress={() => { setAdding(false); setDraft(""); }}>
              <Text style={s.btnOutlineText}>Huỷ</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* "All questions" row */}
      <TouchableOpacity
        style={[s.sectionRow, activeSectionId === null && s.sectionRowActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[s.sectionRowText, activeSectionId === null && { color: C.primary }]}>
          📋 Tất cả câu hỏi
        </Text>
      </TouchableOpacity>

      {/* Section list */}
      {sections.map(sec => (
        <View key={sec.id} style={[s.sectionRow, activeSectionId === sec.id && s.sectionRowActive]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => onSelect(sec.id)}>
            <Text
              style={[s.sectionRowText, activeSectionId === sec.id && { color: C.primary }]}
              numberOfLines={1}
            >
              ▶ {sec.title || "Không có tiêu đề"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert("Xóa trang", `Xóa trang "${sec.title}"?`, [
              { text: "Hủy", style:"cancel" },
              { text:"Xóa", style:"destructive", onPress: () => onDelete(sec.id) },
            ]);
          }}>
            <Text style={{ color: C.error, fontSize: 14 }}>🗑</Text>
          </TouchableOpacity>
        </View>
      ))}

      {sections.length === 0 && !adding && (
        <Text style={s.emptyHint}>Chưa có trang nào.{"\n"}Nhấn + để thêm.</Text>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * CONDITION EDITOR  (skip logic)
 * ═══════════════════════════════════════════════════════════════════ */
const OPERATORS = [
  { value:"equals",       label:"bằng",          types:["TEXT","PARAGRAPH","EMAIL","NUMBER","SINGLE_CHOICE","DROPDOWN","LINEAR_SCALE"] },
  { value:"not_equals",   label:"không bằng",    types:["TEXT","PARAGRAPH","EMAIL","NUMBER","SINGLE_CHOICE","DROPDOWN","LINEAR_SCALE"] },
  { value:"contains",     label:"chứa",           types:["TEXT","PARAGRAPH","EMAIL"] },
  { value:"not_contains", label:"không chứa",    types:["TEXT","PARAGRAPH","EMAIL"] },
  { value:"greater",      label:"lớn hơn",        types:["NUMBER","LINEAR_SCALE","RATING"] },
  { value:"less",         label:"nhỏ hơn",        types:["NUMBER","LINEAR_SCALE","RATING"] },
  { value:"answered",     label:"đã trả lời",     types:["TEXT","PARAGRAPH","EMAIL","NUMBER","DATE","TIME","SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN","RATING","LINEAR_SCALE"] },
  { value:"not_answered", label:"chưa trả lời",   types:["TEXT","PARAGRAPH","EMAIL","NUMBER","DATE","TIME","SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN","RATING","LINEAR_SCALE"] },
];

function ConditionEditor({ questions, currentQId, value, onChange }) {
  const [open,      setOpen]      = useState(false);
  const sourceId   = value?.source_question_id ?? "";
  const operator   = value?.operator ?? "";
  const condValue  = value?.value ?? "";

  const sourceQ    = questions.find(q => q.id === sourceId);
  const srcFEType  = sourceQ ? toFEType(sourceQ.type) : "";
  const availOps   = OPERATORS.filter(op => !srcFEType || op.types.includes(srcFEType));
  const hasCondition = !!sourceId && !!operator;

  const needsValue = sourceId && operator && !["answered","not_answered"].includes(operator);
  const isChoice   = ["SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN"].includes(srcFEType);

  return (
    <View>
      <View style={s.condRow}>
        <Text style={s.lbl}>Điều kiện hiển thị (Skip logic)</Text>
        <TouchableOpacity
          style={[s.condToggleBtn, hasCondition && { backgroundColor: C.primary }]}
          onPress={() => setOpen(v => !v)}
        >
          <Text style={{ color: hasCondition ? "#fff" : C.textSub, fontSize: 11, fontWeight:"600" }}>
            {hasCondition ? "✓ Có điều kiện" : "+ Thêm điều kiện"}
          </Text>
        </TouchableOpacity>
      </View>

      {open && (
        <View style={s.condBox}>
          <Text style={{ fontSize:11, color:C.textSub, marginBottom:8 }}>
            Câu hỏi này chỉ hiển thị khi điều kiện được thỏa mãn.
          </Text>

          {/* Source question picker */}
          <Text style={s.sublbl}>Câu hỏi nguồn</Text>
          <View style={s.pickerWrap}>
            <Picker
              selectedValue={sourceId}
              onValueChange={v => onChange({ source_question_id:v, operator:"", value:"" })}
              style={{ color: C.text }}
            >
              <Picker.Item label="— Chọn câu hỏi —" value="" />
              {questions.filter(q => q.id !== currentQId).map(q => (
                <Picker.Item
                  key={q.id}
                  value={q.id}
                  label={`${q.order_index ?? ""}. ${(q.content ?? "").slice(0,40)}`}
                />
              ))}
            </Picker>
          </View>

          {/* Operator picker */}
          {sourceId && (
            <>
              <Text style={[s.sublbl, { marginTop:8 }]}>Điều kiện</Text>
              <View style={s.pickerWrap}>
                <Picker
                  selectedValue={operator}
                  onValueChange={v => onChange({ source_question_id:sourceId, operator:v, value:"" })}
                  style={{ color: C.text }}
                >
                  <Picker.Item label="— Chọn điều kiện —" value="" />
                  {availOps.map(op => (
                    <Picker.Item key={op.value} label={op.label} value={op.value} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {/* Value input */}
          {needsValue && (
            <>
              <Text style={[s.sublbl, { marginTop:8 }]}>Giá trị</Text>
              {isChoice ? (
                <View style={s.pickerWrap}>
                  <Picker
                    selectedValue={condValue}
                    onValueChange={v => onChange({ source_question_id:sourceId, operator, value:v })}
                    style={{ color: C.text }}
                  >
                    <Picker.Item label="— Chọn đáp án —" value="" />
                    {(sourceQ?.options ?? []).map((o,i) => (
                      <Picker.Item key={i} label={o.label ?? o} value={o.value ?? o} />
                    ))}
                  </Picker>
                </View>
              ) : (
                <TextInput
                  style={s.inp}
                  placeholder="Giá trị..."
                  placeholderTextColor={C.textDim}
                  keyboardType={["NUMBER","LINEAR_SCALE","RATING"].includes(srcFEType) ? "numeric" : "default"}
                  value={condValue}
                  onChangeText={v => onChange({ source_question_id:sourceId, operator, value:v })}
                />
              )}
            </>
          )}

          <View style={[s.row2, { marginTop:12 }]}>
            <TouchableOpacity
              style={s.btnOutline}
              onPress={() => { onChange(null); setOpen(false); }}
            >
              <Text style={s.btnOutlineText}>Xóa điều kiện</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={() => setOpen(false)}>
              <Text style={s.btnText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * QUESTION BODY PREVIEW  (collapsed view)
 * ═══════════════════════════════════════════════════════════════════ */
function QuestionBodyPreview({ q, type }) {
  const opts = q.options ?? [];

  if (type === "TEXT")
    return <Text style={s.previewHint}>Văn bản trả lời ngắn</Text>;
  if (type === "PARAGRAPH")
    return <Text style={s.previewHint}>Văn bản trả lời dài</Text>;
  if (type === "NUMBER")
    return <Text style={s.previewHint}>Nhập số</Text>;
  if (type === "DATE")
    return <Text style={s.previewHint}>📅 Ngày / Tháng / Năm</Text>;
  if (type === "TIME")
    return <Text style={s.previewHint}>🕐 Giờ : Phút</Text>;
  if (type === "EMAIL")
    return <Text style={s.previewHint}>✉ Email</Text>;
  if (type === "FILE_UPLOAD")
    return <Text style={s.previewHint}>📎 Tải tệp lên</Text>;

  if (CHOICE_TYPES.includes(type)) {
    if (opts.length === 0) return <Text style={s.previewHint}>Chưa có lựa chọn nào.</Text>;
    return (
      <View style={{ marginTop:4, gap:4 }}>
        {opts.slice(0,3).map((opt,i) => (
          <Text key={i} style={{ fontSize:13, color:C.textSub }}>
            {type === "MULTIPLE_CHOICE" ? "☐" : type === "DROPDOWN" ? `${i+1}.` : "○"} {opt.label}
          </Text>
        ))}
        {opts.length > 3 && <Text style={{ fontSize:12, color:C.textDim }}>... +{opts.length-3} lựa chọn khác</Text>}
      </View>
    );
  }

  if (type === "RATING") {
    return (
      <View style={{ flexDirection:"row", gap:6, marginTop:4 }}>
        {[1,2,3,4,5].map(i => (
          <Text key={i} style={{ fontSize:20, color:C.textDim }}>☆</Text>
        ))}
      </View>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════
 * QUESTION CARD
 * ═══════════════════════════════════════════════════════════════════ */
function QuestionCard({
  q, index, isActive, onActivate, onSave, onCancel,
  onDelete, onDuplicate, deletingId, sections, questions, surveyId,
}) {
  const [content,     setContent]     = useState(q.content ?? "");
  const [type,        setType]        = useState(toFEType(q.type));
  const [sectionId,   setSectionId]   = useState(q.section_id ?? null);
  const [required,    setRequired]    = useState(q.required ?? true);
  const [description, setDescription] = useState(q.description ?? "");
  const [placeholder, setPlaceholder] = useState(q.placeholder ?? "");
  const [mediaUrl,    setMediaUrl]    = useState(q.media_url ?? "");
  const [condition,   setCondition]   = useState(q.condition ?? null);
  const [uploading,   setUploading]   = useState(false);

  const existingOptions = q.options ?? [];
  const [optionRows, setOptionRows] = useState(
    existingOptions.length > 0
      ? existingOptions.map(o =>
          typeof o === "string"
            ? { label:o, value:o, order_index:0, is_other:false, imageUri:null }
            : { label:o.label??"", value:o.value??"", order_index:o.order_index??0, is_other:o.is_other??false, imageUri:null }
        )
      : [newOptionRow()]
  );
  const [settings, setSettings] = useState(q.settings ?? null);
  const [saving,   setSaving]   = useState(false);

  const isChoice    = CHOICE_TYPES.includes(type);
  const hasSettings = SETTINGS_TYPES.includes(type);
  const isDeleting  = deletingId === q.id;

  const handleTypeChange = (newType) => {
    setType(newType);
    if (CHOICE_TYPES.includes(newType) && !CHOICE_TYPES.includes(type)) setOptionRows([newOptionRow()]);
    if (!SETTINGS_TYPES.includes(newType)) setSettings(null);
    if (newType === "RATING")        setSettings({ min:1, max:5 });
    if (newType === "LINEAR_SCALE")  setSettings({ min:1, max:5 });
  };

  const handleSave = async () => {
    const plain = content.trim();
    if (!plain) { toast("Nội dung câu hỏi không được để trống", "error"); return; }
    if (isChoice) {
      const valid = buildBEOptions(optionRows);
      if (valid.length < 2) { toast("Cần ít nhất 2 lựa chọn hợp lệ", "error"); return; }
    }
    setSaving(true);
    const payload = {
      content: plain, type: toBEType(type), required,
      settings: hasSettings ? settings : undefined,
      description: description.trim() || null,
      placeholder: placeholder.trim() || null,
      media_url:   mediaUrl.trim() || null,
      section_id:  sectionId || null,
      condition:   condition || null,
    };
    if (isChoice) payload.options = buildBEOptions(optionRows);
    try { await onSave(q.id, surveyId, payload); }
    finally { setSaving(false); }
  };

  const handleMediaUpload = async () => {
    launchImageLibrary({ mediaType:"photo", quality:0.8 }, async (res) => {
      if (res.didCancel || res.errorCode) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", {
          uri:  asset.uri,
          type: asset.type ?? "image/jpeg",
          name: asset.fileName ?? "photo.jpg",
        });
        const uploadRes = await surveyService.uploadQuestionMedia(formData);
        const data = uploadRes?.data ?? uploadRes;
        setMediaUrl(data?.url || data?.data?.url || "");
      } catch (err) {
        toast("Upload thất bại: " + (err?.response?.data?.message || err.message), "error");
      } finally { setUploading(false); }
    });
  };

  /* ── Collapsed card ── */
  if (!isActive) {
    return (
      <View style={[s.cardCollapsed, { padding: 0, paddingRight: 14 }]}>
        <Pressable 
          style={({ pressed }) => [{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }, pressed && { opacity: 0.85 }]} 
          onPress={() => onActivate(q.id)}
        >
          <Text style={s.cardIndex}>{String(index + 1).padStart(2,"0")}</Text>
          <View style={{ flex:1 }}>
            <Text style={s.cardTitle} numberOfLines={2}>
              {content || "Câu hỏi chưa có tiêu đề"}
            </Text>
            <Text style={s.cardTypeBadge}>
              {Q_TYPES.find(t => t.value === toFEType(q.type))?.label}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert("Xóa câu hỏi", "Bạn có chắc muốn xóa câu hỏi này?", [
              { text:"Hủy", style:"cancel" },
              { text:"Xóa", style:"destructive", onPress: () => onDelete(q.id) },
            ]);
          }}
          disabled={isDeleting}
          style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
        >
          {isDeleting
            ? <ActivityIndicator size="small" color={C.error} />
            : <Text style={{ color:C.error, fontSize:15 }}>🗑</Text>}
        </Pressable>
      </View>
    );
  }

  /* ── Expanded card ── */
  return (
    <View style={s.cardActive}>
      {/* Content */}
      <Text style={s.lbl}>Nội dung câu hỏi *</Text>
      <TextInput
        style={[s.inp, s.inpMulti]}
        multiline
        placeholder="Câu hỏi không có tiêu đề"
        placeholderTextColor={C.textDim}
        value={content}
        onChangeText={setContent}
      />

      {/* Type dropdown */}
      <Text style={[s.lbl, { marginTop:10 }]}>Loại câu hỏi</Text>
      <QuestionTypeDropdown value={type} onChange={handleTypeChange} />

      {/* Description */}
      <Text style={[s.lbl, { marginTop:10 }]}>Mô tả (tùy chọn)</Text>
      <TextInput
        style={s.inp} placeholder="Thêm gợi ý hoặc mô tả..."
        placeholderTextColor={C.textDim}
        value={description} onChangeText={setDescription}
      />

      {/* Placeholder */}
      {PLACEHOLDER_TYPES.includes(type) && (
        <>
          <Text style={[s.lbl, { marginTop:10 }]}>Placeholder (tùy chọn)</Text>
          <TextInput
            style={s.inp} placeholder="Văn bản gợi ý trong ô nhập..."
            placeholderTextColor={C.textDim}
            value={placeholder} onChangeText={setPlaceholder}
          />
        </>
      )}

      {/* Media URL */}
      <Text style={[s.lbl, { marginTop:10 }]}>Hình ảnh URL (tùy chọn)</Text>
      <View style={s.row2}>
        <TextInput
          style={[s.inp, { flex:1 }]}
          placeholder="https://example.com/image.jpg"
          placeholderTextColor={C.textDim}
          value={mediaUrl} onChangeText={setMediaUrl}
          autoCapitalize="none" keyboardType="url"
        />
        <TouchableOpacity style={s.uploadBtn} onPress={handleMediaUpload} disabled={uploading}>
          {uploading
            ? <ActivityIndicator size="small" color={C.primary} />
            : <Text style={{ fontSize:18 }}>🖼</Text>}
        </TouchableOpacity>
      </View>

      {/* Section / Page selector */}
      {sections.length > 0 && (
        <>
          <Text style={[s.lbl, { marginTop:10 }]}>Trang / Phần</Text>
          <View style={s.pickerWrap}>
            <Picker
              selectedValue={sectionId ?? ""}
              onValueChange={v => setSectionId(v || null)}
              style={{ color: C.text }}
            >
              <Picker.Item label="— Không thuộc trang nào —" value="" />
              {sections.map(sec => (
                <Picker.Item key={sec.id} label={sec.title || "Không có tiêu đề"} value={sec.id} />
              ))}
            </Picker>
          </View>
        </>
      )}

      {/* Skip logic */}
      <View style={{ marginTop:10 }}>
        <ConditionEditor
          questions={questions}
          currentQId={q.id}
          value={condition}
          onChange={setCondition}
        />
      </View>

      {/* Options / Settings */}
      {isChoice && (
        <View style={{ marginTop:14 }}>
          <InlineOptionBuilder qType={type} optionRows={optionRows} onChange={setOptionRows} />
        </View>
      )}
      {hasSettings && (
        <View style={{ marginTop:14 }}>
          <SettingsEditor type={type} settings={settings} onChange={setSettings} />
        </View>
      )}
      {!isChoice && !hasSettings && (
        <View style={{ marginTop:12 }}>
          <QuestionBodyPreview q={q} type={type} />
        </View>
      )}

      {/* Footer actions */}
      <View style={s.cardFooter}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => onDuplicate(q)}
          title="Nhân đôi"
        >
          <Text style={{ fontSize:16 }}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => {
            Alert.alert("Xóa câu hỏi", "Bạn có chắc muốn xóa câu hỏi này?", [
              { text:"Hủy", style:"cancel" },
              { text:"Xóa", style:"destructive", onPress: () => onDelete(q.id) },
            ]);
          }}
          disabled={isDeleting}
        >
          {isDeleting
            ? <ActivityIndicator size="small" color={C.error} />
            : <Text style={{ fontSize:16, color:C.error }}>🗑</Text>}
        </TouchableOpacity>

        <View style={s.dividerV} />
        <Toggle checked={required} onChange={setRequired} />
        <View style={s.dividerV} />

        <TouchableOpacity style={s.btnOutline} onPress={onCancel}>
          <Text style={s.btnOutlineText}>Đóng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.btnText}>Lưu</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * SURVEY HERO CARD  (title / description edit)
 * ═══════════════════════════════════════════════════════════════════ */
function SurveyHeroCard({ loading, title, description, onSave, saving }) {
  const [editing,    setEditing]    = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc,  setDraftDesc]  = useState("");
  const [localErr,   setLocalErr]   = useState("");

  const startEdit = () => {
    setDraftTitle(title);
    setDraftDesc(description || "");
    setLocalErr("");
    setEditing(true);
  };

  if (loading) {
    return (
      <View style={[s.heroCard, { alignItems:"center", justifyContent:"center", minHeight:100 }]}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  return (
    <View style={s.heroCard}>
      {!editing ? (
        <View style={{ flexDirection:"row", gap:12, alignItems:"flex-start" }}>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:11, fontWeight:"700", color:C.textDim, letterSpacing:1.2, textTransform:"uppercase" }}>
              Khảo sát của bạn
            </Text>
            <Text style={s.heroTitle}>{title?.trim() ? title : "Chưa đặt tiêu đề"}</Text>
            <Text style={s.heroDesc}>{description?.trim() ? description : "Chưa có mô tả."}</Text>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={startEdit}>
            <Text style={{ color:C.primary, fontWeight:"700", fontSize:13 }}>✏ Sửa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap:12 }}>
          <View>
            <Text style={s.lbl}>Tiêu đề</Text>
            <TextInput
              style={s.inp} placeholder="Tên khảo sát"
              placeholderTextColor={C.textDim}
              value={draftTitle}
              onChangeText={v => { setDraftTitle(v); setLocalErr(""); }}
            />
          </View>
          <View>
            <Text style={s.lbl}>Mô tả</Text>
            <TextInput
              style={[s.inp, s.inpMulti]}
              multiline placeholder="Mô tả ngắn (tuỳ chọn)"
              placeholderTextColor={C.textDim}
              value={draftDesc}
              onChangeText={v => { setDraftDesc(v); setLocalErr(""); }}
            />
          </View>
          {localErr ? (
            <Text style={{ color:C.error, fontSize:13 }}>⚠ {localErr}</Text>
          ) : null}
          <View style={s.row2}>
            <TouchableOpacity style={s.btnOutline} onPress={() => { setEditing(false); setLocalErr(""); }}>
              <Text style={s.btnOutlineText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, saving && s.btnDisabled]}
              disabled={saving}
              onPress={async () => {
                const t = draftTitle.trim();
                if (!t) { setLocalErr("Tiêu đề không được để trống."); return; }
                try { await onSave(t, draftDesc.trim()); setEditing(false); } catch { /* handled */ }
              }}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.btnText}>Lưu thông tin</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * NEW QUESTION FORM
 * ═══════════════════════════════════════════════════════════════════ */
function NewQuestionForm({ surveyId, questions, activeSectionId, onCreate, onCancel }) {
  const [content,     setContent]     = useState("");
  const [type,        setType]        = useState("TEXT");
  const [required,    setRequired]    = useState(true);
  const [description, setDescription] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [mediaUrl,    setMediaUrl]    = useState("");
  const [optionRows,  setOptionRows]  = useState([newOptionRow()]);
  const [settings,    setSettings]    = useState(null);
  const [formError,   setFormError]   = useState("");
  const [loading,     setLoading]     = useState(false);

  const isChoice    = CHOICE_TYPES.includes(type);
  const hasSettings = SETTINGS_TYPES.includes(type);

  const handleTypeChange = (v) => {
    setType(v);
    setFormError("");
    if (!CHOICE_TYPES.includes(v)) setOptionRows([newOptionRow()]);
    if (!SETTINGS_TYPES.includes(v)) setSettings(null);
    if (v === "RATING")       setSettings({ min:1, max:5 });
    if (v === "LINEAR_SCALE") setSettings({ min:1, max:5 });
  };

  const handleSubmit = async () => {
    const plain = content.trim();
    if (!plain) { setFormError("Nội dung câu hỏi không được để trống."); return; }
    if (isChoice) {
      const valid = buildBEOptions(optionRows);
      if (valid.length < 2) { setFormError("Cần ít nhất 2 lựa chọn hợp lệ."); return; }
    }
    if (type === "NUMBER" && settings?.min != null && settings?.max != null && settings.min > settings.max) {
      setFormError("Min phải nhỏ hơn hoặc bằng Max.");
      return;
    }
    setFormError("");
    const payload = {
      content: plain, type: toBEType(type), required,
      order_index: questions.length,
      settings: hasSettings ? settings : undefined,
      description: description.trim() || null,
      placeholder: placeholder.trim() || null,
      media_url:   mediaUrl.trim() || null,
      section_id:  activeSectionId || null,
    };
    if (isChoice) payload.options = buildBEOptions(optionRows);
    setLoading(true);
    try { await onCreate(payload); } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.newQForm}>
        <Text style={{ fontSize:15, fontWeight:"700", color:C.text, marginBottom:12 }}>Câu hỏi mới</Text>

        <Text style={s.lbl}>Nội dung câu hỏi *</Text>
        <TextInput
          style={[s.inp, s.inpMulti]}
          multiline placeholder="Nhập nội dung câu hỏi..."
          placeholderTextColor={C.textDim}
          value={content}
          onChangeText={v => { setContent(v); setFormError(""); }}
        />

        <Text style={[s.lbl, { marginTop:10 }]}>Loại câu hỏi</Text>
        <QuestionTypeDropdown value={type} onChange={handleTypeChange} />

        <Text style={[s.lbl, { marginTop:10 }]}>Mô tả (tùy chọn)</Text>
        <TextInput
          style={s.inp} placeholder="Thêm gợi ý hoặc mô tả..."
          placeholderTextColor={C.textDim}
          value={description} onChangeText={setDescription}
        />

        {PLACEHOLDER_TYPES.includes(type) && (
          <>
            <Text style={[s.lbl, { marginTop:10 }]}>Placeholder (tùy chọn)</Text>
            <TextInput
              style={s.inp} placeholder="Văn bản gợi ý trong ô nhập..."
              placeholderTextColor={C.textDim}
              value={placeholder} onChangeText={setPlaceholder}
            />
          </>
        )}

        <Text style={[s.lbl, { marginTop:10 }]}>Hình ảnh URL (tùy chọn)</Text>
        <TextInput
          style={s.inp} placeholder="https://example.com/image.jpg"
          placeholderTextColor={C.textDim}
          value={mediaUrl} onChangeText={setMediaUrl}
          autoCapitalize="none" keyboardType="url"
        />

        <View style={{ marginTop:12 }}>
          <Toggle checked={required} onChange={setRequired} />
        </View>

        {isChoice && (
          <View style={{ marginTop:14 }}>
            <InlineOptionBuilder qType={type} optionRows={optionRows} onChange={rows => { setOptionRows(rows); setFormError(""); }} />
          </View>
        )}
        {hasSettings && (
          <View style={{ marginTop:14 }}>
            <SettingsEditor type={type} settings={settings} onChange={setSettings} />
          </View>
        )}

        {formError ? (
          <Text style={s.formError}>⚠ {formError}</Text>
        ) : null}

        <View style={[s.row2, { marginTop:16 }]}>
          <TouchableOpacity style={s.btnOutline} onPress={onCancel}>
            <Text style={s.btnOutlineText}>Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.btnText}>+ Thêm câu hỏi</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * QUESTION PAGE  (main screen)
 *
 * Props (React Navigation):
 *   route.params.surveyId
 *   navigation
 * ═══════════════════════════════════════════════════════════════════ */
export default function QuestionPage({ route, navigation }) {
  const surveyId = route?.params?.surveyId;
  const { updateSurvey } = useSurvey();
  const {
    questions, loading,
    createQuestion, fetchQuestionsBySurvey,
    updateQuestion, deleteQuestion, bulkCreateQuestions,
  } = useQuestion();

  const [surveyTitle,       setSurveyTitle]       = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [surveyMetaLoading, setSurveyMetaLoading] = useState(true);
  const [metaSaving,        setMetaSaving]        = useState(false);

  const [activeId,    setActiveId]    = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [showAi,      setShowAi]      = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const pendingIdRef = useRef(null);

  /* ── AI Assistant ── */
  const handleAiApplied = async (payload) => {
    await bulkCreateQuestions(surveyId, payload);
    await fetchQuestionsBySurvey(surveyId);
  };

  /* ── Sections ── */
  const [sections,       setSections]       = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);

  const fetchSections = useCallback(async (sid) => {
    if (!sid) return;
    try {
      const res  = await surveyService.getSections(sid);
      const data = res?.data?.sections ?? res?.data?.data ?? res?.data ?? [];
      setSections(Array.isArray(data) ? data : []);
    } catch { setSections([]); }
  }, []);

  useEffect(() => {
    if (surveyId) { fetchSections(surveyId); setActiveSectionId(null); }
  }, [surveyId, fetchSections]);

  /* ── Survey meta ── */
  useEffect(() => {
    let cancelled = false;
    if (!surveyId) return;
    (async () => {
      setSurveyMetaLoading(true);
      try {
        const res  = await surveyService.getSurveyById(surveyId);
        const body = res?.data;
        const s    = body?.data ?? body?.survey ?? (body?.id != null ? body : null);
        if (!cancelled && s) { setSurveyTitle(s.title || ""); setSurveyDescription(s.description || ""); }
      } catch {
        if (!cancelled) { setSurveyTitle(""); setSurveyDescription(""); }
      } finally { if (!cancelled) setSurveyMetaLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [surveyId]);

  /* ── Questions ── */
  useEffect(() => { if (surveyId) fetchQuestionsBySurvey(surveyId); }, [surveyId]);

  useEffect(() => {
    if (!pendingIdRef.current) return;
    const found = questions.find(q => q.id === pendingIdRef.current);
    if (found) { setActiveId(found.id); pendingIdRef.current = null; }
  }, [questions]);

  const displayedQuestions = activeSectionId
    ? questions.filter(q => q.section_id === activeSectionId)
    : questions;

  /* ── Handlers ── */
  const handleCreate = async (payload) => {
    setShowForm(false);
    setFormLoading(true);
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingIdRef.current = created.id;
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteQuestion(id, surveyId); if (activeId === id) setActiveId(null); }
    finally { setDeletingId(null); }
  };

  const handleDuplicate = useCallback(async (q) => {
    const opts    = q.options ?? [];
    const feType  = toFEType(q.type);
    const payload = {
      content:     (q.content || "") + " (bản sao)",
      type:        toBEType(feType),
      required:    q.required,
      order_index: questions.length,
      settings:    q.settings ?? undefined,
      description: q.description ?? null,
      placeholder: q.placeholder ?? null,
      media_url:   q.media_url ?? null,
      section_id:  q.section_id ?? null,
    };
    if (CHOICE_TYPES.includes(feType) && opts.length > 0) {
      payload.options = opts
        .map((o,i) => ({
          label:       typeof o === "string" ? o : (o.label ?? ""),
          value:       typeof o === "string" ? o : (o.value ?? ""),
          order_index: i, is_other: typeof o === "object" ? (o.is_other ?? false) : false,
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
    const mapped = {
      ...payload,
      type: payload.type ? toBEType(toFEType(payload.type)) : undefined,
    };
    delete mapped.option;
    if (Array.isArray(mapped.options)) {
      mapped.options = mapped.options
        .map((o,i) => typeof o === "string"
          ? { label:o, value:o, order_index:i, is_other:false }
          : o
        )
        .filter(o => o.label && o.value);
    }
    await updateQuestion(id, sid, mapped);
    setActiveId(null);
  }, [updateQuestion]);

  const handleSaveSurveyMeta = async (title, description) => {
    setMetaSaving(true);
    try {
      const updated = await updateSurvey(surveyId, { title, description: description || undefined });
      if (updated) { setSurveyTitle(updated.title); setSurveyDescription(updated.description || ""); }
    } finally { setMetaSaving(false); }
  };

  const handleCreateSection = async (title) => {
    try {
      const res     = await surveyService.createSection(surveyId, { title, order_index: sections.length });
      const created = res?.data?.section ?? res?.data?.data ?? res?.data;
      if (created) setSections(prev => [...prev, created]);
    } catch { }
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      await surveyService.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      if (activeSectionId === sectionId) setActiveSectionId(null);
    } catch { }
  };

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <SafeAreaView style={s.safeArea}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>‹ Danh sách</Text>
        </TouchableOpacity>
        <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
          {formLoading && <ActivityIndicator size="small" color={C.primary} />}
          <TouchableOpacity
            style={[s.aiBtn, showAi && s.aiBtnActive]}
            onPress={() => setShowAi(v => !v)}
          >
            <Sparkles size={13} color={showAi ? "#fff" : C.primary} />
            <Text style={[s.aiBtnText, showAi && s.aiBtnTextActive]}>AI</Text>
          </TouchableOpacity>
          <Text style={{ fontSize:13, color:C.textSub }}>{questions.length} câu hỏi</Text>
          <TouchableOpacity
            style={[s.btn, showForm && s.btnOutline]}
            onPress={() => { setShowForm(v => !v); setActiveId(null); }}
          >
            <Text style={showForm ? s.btnOutlineText : s.btnText}>
              {showForm ? "Huỷ" : "+ Câu hỏi mới"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Section panel — horizontal scroll on top (replaces left sidebar) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionScroll}>
          <SectionPanel
            sections={sections}
            activeSectionId={activeSectionId}
            onSelect={setActiveSectionId}
            onDelete={handleDeleteSection}
            onAdd={handleCreateSection}
          />
        </ScrollView>

        {/* Survey hero */}
        <SurveyHeroCard
          loading={surveyMetaLoading}
          title={surveyTitle}
          description={surveyDescription}
          saving={metaSaving}
          onSave={handleSaveSurveyMeta}
        />

        {/* New question form */}
        {showForm && (
          <NewQuestionForm
            surveyId={surveyId}
            questions={questions}
            activeSectionId={activeSectionId}
            onCreate={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Question list */}
        {loading && questions.length === 0 ? (
          <View style={s.emptyState}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : displayedQuestions.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={{ fontSize:40, marginBottom:10 }}>📭</Text>
            <Text style={s.emptyTitle}>Chưa có câu hỏi nào</Text>
            <Text style={s.emptySubtitle}>Hãy tạo câu hỏi đầu tiên</Text>
            <TouchableOpacity style={[s.btn, { marginTop:16 }]} onPress={() => setShowForm(true)}>
              <Text style={s.btnText}>Thêm câu hỏi đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap:12, marginTop:12 }}>
            {/* Section filter header */}
            {activeSectionId && (() => {
              const sec = sections.find(s => s.id === activeSectionId);
              return sec ? (
                <View style={s.sectionFilterBanner}>
                  <Text style={{ color:C.primary, fontWeight:"600", fontSize:13 }}>
                    📄 {sec.title} — {displayedQuestions.length} câu hỏi
                  </Text>
                </View>
              ) : null;
            })()}

            {displayedQuestions.map((q, index) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={index}
                isActive={activeId === q.id}
                onActivate={id => { setActiveId(id); setShowForm(false); }}
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
          </View>
        )}
      </ScrollView>

      {/* AI Assistant Modal */}
      <AiQuestionAssistant
        open={showAi}
        onClose={() => setShowAi(false)}
        surveyId={surveyId}
        surveyTitle={surveyTitle}
        surveyDescription={surveyDescription}
        existingCount={questions.length}
        onApplied={handleAiApplied}
        C={C}
      />
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * STYLES
 * ═══════════════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  safeArea:   { flex:1, backgroundColor: C.bg },
  scrollView: { flex:1, paddingHorizontal:16 },

  /* Header */
  header: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    paddingHorizontal:16, paddingVertical:12,
    backgroundColor:"#fff",
    borderBottomWidth:1, borderBottomColor: C.border,
  },
  backBtn:     { padding:6 },
  backBtnText: { fontSize:14, fontWeight:"600", color:C.primary },

  /* Buttons */
  btn: {
    paddingHorizontal:16, paddingVertical:9,
    backgroundColor: C.primary, borderRadius:10,
    alignItems:"center", justifyContent:"center",
  },
  btnDisabled: { backgroundColor: C.surfaceHigh },
  btnText:     { color:"#fff", fontWeight:"700", fontSize:13 },
  btnOutline: {
    paddingHorizontal:14, paddingVertical:9,
    borderRadius:10, borderWidth:1, borderColor: C.border,
    alignItems:"center", justifyContent:"center",
  },
  btnOutlineText: { color: C.textSub, fontWeight:"600", fontSize:13 },

  /* AI Button */
  aiBtn: {
    flexDirection:"row", alignItems:"center", gap:5,
    paddingHorizontal:10, paddingVertical:7,
    borderRadius:9, borderWidth:1, borderColor: C.primaryBorder,
    backgroundColor: C.primaryDim,
  },
  aiBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  aiBtnText: {
    fontSize:12, fontWeight:"700", color: C.primary,
  },
  aiBtnTextActive: {
    color: "#fff",
  },

  /* Row helpers */
  row2: { flexDirection:"row", gap:10, alignItems:"flex-start" },
  dividerV: { width:1, height:24, backgroundColor: C.border, marginHorizontal:6 },

  /* Input */
  inp: {
    backgroundColor:"#fff", borderWidth:1, borderColor: C.border,
    borderRadius:8, paddingHorizontal:12, paddingVertical:9,
    fontSize:14, color: C.text,
  },
  inpMulti: { minHeight:72, textAlignVertical:"top" },

  /* Labels */
  lbl: {
    fontSize:11, fontWeight:"700", letterSpacing:0.8,
    textTransform:"uppercase", color: C.textSub, marginBottom:6,
  },
  sublbl: { fontSize:11, color: C.textSub, marginBottom:4 },

  /* Toggle */
  toggleRow:  { flexDirection:"row", alignItems:"center", gap:8 },
  toggleLabel:{ fontSize:12, fontWeight:"600", color: C.textSub },
  toggleTrack:{ width:44, height:24, borderRadius:999, position:"relative" },
  toggleThumb:{
    position:"absolute", top:4, width:16, height:16, borderRadius:8,
    backgroundColor:"#fff",
    shadowColor:"#000", shadowOpacity:0.15, shadowRadius:2, elevation:2,
    shadowOffset:{ width:0, height:1 },
  },

  /* Type dropdown */
  typeBtn: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    paddingHorizontal:12, paddingVertical:10,
    backgroundColor:"#fff", borderRadius:10, borderWidth:1, borderColor: C.border,
  },
  typeBtnText:  { fontSize:13, color: C.text, fontWeight:"500" },
  modalOverlay: { flex:1, backgroundColor:"rgba(0,0,0,0.45)", justifyContent:"flex-end" },
  modalSheet: {
    backgroundColor:"#fff", borderTopLeftRadius:20, borderTopRightRadius:20,
    paddingTop:16, paddingHorizontal:16, maxHeight:"70%",
  },
  modalTitle:       { fontSize:16, fontWeight:"700", color: C.text, marginBottom:12 },
  modalOption: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    paddingVertical:13, borderBottomWidth:1, borderBottomColor: C.border,
  },
  modalOptionActive: { backgroundColor: C.primaryDim },
  modalOptionText:  { fontSize:14, color: C.text },
  modalCancel: {
    paddingVertical:14, alignItems:"center",
    borderTopWidth:1, borderTopColor: C.border, marginTop:4,
  },

  /* Option builder */
  optionRow: {
    flexDirection:"row", alignItems:"flex-start",
    gap:10, paddingVertical:6,
    borderBottomWidth:1, borderBottomColor: C.border,
  },
  checkboxMarker: { width:16, height:16, borderRadius:3, borderWidth:1.5, borderColor: C.border, marginTop:10 },
  radioMarker:    { width:16, height:16, borderRadius:8, borderWidth:1.5, borderColor: C.border, marginTop:10 },
  dropdownMarker: { fontSize:12, color: C.textSub, minWidth:20, marginTop:10 },
  optionDelBtn:   { padding:6, alignItems:"center", justifyContent:"center" },
  addOptionBtn:   { paddingVertical:10, paddingLeft:26 },

  /* Tags preview */
  tagWrap:  { flexDirection:"row", flexWrap:"wrap", gap:6, marginTop:10 },
  tag: {
    flexDirection:"row", alignItems:"center", gap:4,
    paddingHorizontal:10, paddingVertical:4, borderRadius:20,
    backgroundColor: C.primaryDim, borderWidth:1, borderColor: C.primaryBorder,
  },
  tagText: { fontSize:12, color: C.primary, fontWeight:"500" },
  tagVal:  { fontSize:10, color: C.textSub },

  /* Section panel */
  sectionScroll: { marginVertical:12 },
  sectionPanel: {
    backgroundColor:"#fff", borderRadius:14, borderWidth:1, borderColor: C.border,
    overflow:"hidden", minWidth:220,
  },
  sectionHeader: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    paddingHorizontal:12, paddingVertical:8,
    borderBottomWidth:1, borderBottomColor: C.border,
  },
  sectionHeaderText: { fontSize:11, fontWeight:"700", color: C.textSub, textTransform:"uppercase", letterSpacing:1 },
  sectionAddBtn: {
    width:24, height:24, borderRadius:6,
    backgroundColor: C.primaryDim, alignItems:"center", justifyContent:"center",
  },
  sectionAddForm: { padding:10, borderBottomWidth:1, borderBottomColor: C.border, gap:8 },
  sectionRow: {
    flexDirection:"row", alignItems:"center",
    paddingHorizontal:12, paddingVertical:10,
    borderBottomWidth:1, borderBottomColor: C.border,
  },
  sectionRowActive: { backgroundColor: C.primaryDim },
  sectionRowText:   { flex:1, fontSize:13, color: C.text },
  emptyHint: { fontSize:12, color: C.textDim, textAlign:"center", padding:16 },

  /* Section filter banner */
  sectionFilterBanner: {
    padding:10, borderRadius:10,
    backgroundColor: C.primaryDim, borderWidth:1, borderColor: C.primaryBorder,
  },

  /* Condition editor */
  condRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:6 },
  condToggleBtn: {
    paddingHorizontal:10, paddingVertical:5, borderRadius:7,
    backgroundColor: C.surfaceHigh, borderWidth:1, borderColor: C.border,
  },
  condBox: {
    backgroundColor: C.surfaceHigh, borderRadius:10,
    borderWidth:1, borderColor: C.border, padding:12, marginTop:6,
  },
  pickerWrap: {
    borderWidth:1, borderColor: C.border, borderRadius:8,
    backgroundColor:"#fff", overflow:"hidden",
  },

  /* Settings editor */
  scaleItem: { alignItems:"center", minWidth:36, gap:2 },

  /* Hero card */
  heroCard: {
    backgroundColor:"#fff", borderRadius:16, padding:20, marginVertical:8,
    borderTopWidth:5, borderTopColor: C.primary,
    shadowColor:"#000", shadowOpacity:0.06, shadowRadius:10, elevation:2,
    shadowOffset:{ width:0, height:4 },
  },
  heroTitle: { fontSize:20, fontWeight:"800", color: C.text, marginVertical:6, letterSpacing:-0.5 },
  heroDesc:  { fontSize:14, color: C.textSub, lineHeight:20 },
  editBtn: {
    paddingHorizontal:12, paddingVertical:7,
    backgroundColor: C.primaryDim, borderRadius:10,
    borderWidth:1, borderColor: C.primaryBorder,
  },

  /* New question form */
  newQForm: {
    backgroundColor:"#fff", borderRadius:14, padding:16, marginVertical:8,
    borderLeftWidth:4, borderLeftColor: C.primary,
    shadowColor:"#000", shadowOpacity:0.06, shadowRadius:8, elevation:2,
    shadowOffset:{ width:0, height:3 },
  },
  formError: {
    fontSize:13, color: C.error,
    backgroundColor: C.errorBg, padding:10, borderRadius:8,
    borderWidth:1, borderColor: C.errorBorder, marginTop:10,
  },

  /* Question cards */
  cardCollapsed: {
    backgroundColor:"#fff", borderRadius:14, padding:14,
    flexDirection:"row", alignItems:"center", gap:12,
    borderLeftWidth:3, borderLeftColor: C.primaryBorder,
    shadowColor:"#000", shadowOpacity:0.04, shadowRadius:6, elevation:1,
    shadowOffset:{ width:0, height:2 },
  },
  cardActive: {
    backgroundColor:"#fff", borderRadius:14, padding:16,
    borderLeftWidth:4, borderLeftColor: C.primary,
    shadowColor: C.primary, shadowOpacity:0.12, shadowRadius:12, elevation:3,
    shadowOffset:{ width:0, height:6 },
  },
  cardIndex:    { fontSize:11, fontWeight:"700", color: C.textDim, minWidth:24 },
  cardTitle:    { fontSize:14, fontWeight:"600", color: C.text, flex:1 },
  cardTypeBadge:{ fontSize:11, color: C.textDim, marginTop:3 },
  cardFooter: {
    flexDirection:"row", alignItems:"center", flexWrap:"wrap",
    gap:8, paddingTop:14, marginTop:10,
    borderTopWidth:1, borderTopColor: C.border,
  },
  iconBtn: {
    width:34, height:34, borderRadius:8,
    borderWidth:1, borderColor: C.border,
    alignItems:"center", justifyContent:"center",
  },
  uploadBtn: {
    width:42, height:42, borderRadius:8,
    borderWidth:1, borderColor: C.border,
    alignItems:"center", justifyContent:"center",
  },

  /* Empty state */
  emptyState: {
    alignItems:"center", justifyContent:"center",
    paddingVertical:60, backgroundColor:"#fff",
    borderRadius:20, marginTop:12,
  },
  emptyTitle:    { fontSize:16, fontWeight:"700", color: C.text },
  emptySubtitle: { fontSize:13, color: C.textSub, marginTop:6 },

  /* Preview hint */
  previewHint: {
    fontSize:13, color: C.textDim, paddingVertical:10,
    borderBottomWidth:1, borderBottomColor: C.border, borderStyle:"dashed",
  },
});
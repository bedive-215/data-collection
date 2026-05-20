/**
 * CreateSurveyComposer — React Native
 *
 * Deps (standard RN project + community):
 *   react-native                (core)
 *   @react-navigation/native    (useNavigation)
 *   react-native-toast-message  (Toast)
 *   lucide-react-native         (icons)
 *
 * Props:
 *   onCancel  () => void
 *   onSuccess (result) => void
 *
 * Hooks / providers used (same as web):
 *   useSurvey()  →  { createSurveyFlow }
 *   ROUTERS.MY_SURVEY_DETAIL  (string with :surveyId)
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

// ─── swap these for your actual project imports ───────────────────────────────
import { useSurvey } from "../../providers/SurveyProvider";
import { ROUTERS } from "../../utils/constants";
// Lucide React Native icons
import {
  Loader2,
  Link2,
  Copy,
  Check,
  Globe,
  X,
  FileQuestion,
  Plus,
  Trash2,
  Mail,
  Users,
  ListChecks,
  ChevronDown,
} from "lucide-react-native";
// Toast — custom provider
import { useToast } from "../../components/common/Toast";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#f1f5f9",
  surface: "#ffffffd4",
  surfaceSoft: "#ffffff8c",
  primary: "#4f46e5",
  primarySoft: "#4f46e51f",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  border: "#ffffff8c",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  success: "#059669",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];

const QUESTION_TYPES = [
  { value: "TEXT", label: "Trả lời ngắn" },
  { value: "PARAGRAPH", label: "Đoạn văn" },
  { value: "EMAIL", label: "Email" },
  { value: "DATE", label: "Ngày" },
  { value: "NUMBER", label: "Số" },
  { value: "RATING", label: "Đánh giá (sao)" },
  { value: "SINGLE_CHOICE", label: "Một lựa chọn" },
  { value: "MULTIPLE_CHOICE", label: "Nhiều lựa chọn" },
  { value: "DROPDOWN", label: "Danh sách thả xuống" },
];

const ROLES = [
  { value: "viewer", label: "Viewer", desc: "Chỉ xem" },
  { value: "respondent", label: "Người trả lời", desc: "Điền form" },
  { value: "editor", label: "Editor", desc: "Sửa form" },
];

const PROGRESS_LABEL = {
  create: "Đang tạo khảo sát…",
  questions: "Đang thêm câu hỏi…",
  invite: "Đang gửi lời mời…",
  publish: "Đang công khai…",
  share: "Đang tạo link chia sẻ…",
  done: "",
};

function parseEmails(text) {
  return [...new Set(String(text).split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean))];
}

function newQuestionId() {
  return `dq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultOptions() {
  return [
    { label: "Tùy chọn 1", value: `opt_${Date.now()}_a` },
    { label: "Tùy chọn 2", value: `opt_${Date.now()}_b` },
  ];
}

function emptyDraft() {
  return {
    id: newQuestionId(),
    content: "",
    type: "TEXT",
    required: false,
    settings: null,
    options: defaultOptions(),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

/** Simple picker replacement using horizontal scroll buttons */
function TypePicker({ value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
      {QUESTION_TYPES.map((qt) => (
        <TouchableOpacity
          key={qt.value}
          onPress={() => onChange(qt.value)}
          style={[
            styles.typeChip,
            value === qt.value && styles.typeChipActive,
          ]}
        >
          <Text style={[styles.typeChipText, value === qt.value && styles.typeChipTextActive]}>
            {qt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function QuestionCard({ draft, idx, totalCount, onUpdate, onSetType, onRemove, onAddOption, onRemoveOption, onUpdateOption }) {
  const isChoice = CHOICE_TYPES.includes(draft.type);
  return (
    <Card style={styles.questionCard}>
      {/* Header */}
      <View style={styles.row}>
        <Text style={styles.questionIndex}>Câu {idx + 1}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => onUpdate(draft.id, { required: !draft.required })}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, draft.required && styles.checkboxActive]}>
              {draft.required && <Check size={10} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Bắt buộc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={totalCount <= 1}
            onPress={() => onRemove(draft.id)}
            style={[styles.iconBtn, totalCount <= 1 && { opacity: 0.3 }]}
          >
            <Trash2 size={15} color={C.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Type picker */}
      <Text style={styles.fieldLabel}>Loại</Text>
      <TypePicker value={draft.type} onChange={(t) => onSetType(draft.id, t)} />

      {/* Content */}
      <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Nội dung câu hỏi</Text>
      <TextInput
        value={draft.content}
        onChangeText={(v) => onUpdate(draft.id, { content: v })}
        placeholder="Nhập câu hỏi…"
        placeholderTextColor={C.textDim}
        style={styles.input}
      />

      {/* NUMBER settings */}
      {draft.type === "NUMBER" && (
        <View style={[styles.row, { gap: 10, marginTop: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Min</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.settings?.min ?? "")}
              onChangeText={(v) => onUpdate(draft.id, { settings: { ...draft.settings, min: v } })}
              style={styles.input}
              placeholder="–"
              placeholderTextColor={C.textDim}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Max</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.settings?.max ?? "")}
              onChangeText={(v) => onUpdate(draft.id, { settings: { ...draft.settings, max: v } })}
              style={styles.input}
              placeholder="–"
              placeholderTextColor={C.textDim}
            />
          </View>
        </View>
      )}

      {/* RATING settings */}
      {draft.type === "RATING" && (
        <View style={[styles.row, { gap: 10, marginTop: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Từ</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.settings?.min ?? 1)}
              onChangeText={(v) => onUpdate(draft.id, { settings: { ...draft.settings, min: v } })}
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Đến</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.settings?.max ?? 5)}
              onChangeText={(v) => onUpdate(draft.id, { settings: { ...draft.settings, max: v } })}
              style={styles.input}
            />
          </View>
        </View>
      )}

      {/* Choice options */}
      {isChoice && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.fieldLabel}>Lựa chọn (ít nhất 2, value không trùng)</Text>
          {(draft.options || []).map((opt, oi) => (
            <View key={`${draft.id}-opt-${oi}`} style={[styles.row, { marginBottom: 8 }]}>
              <TextInput
                value={opt.label}
                onChangeText={(v) => onUpdateOption(draft.id, oi, "label", v)}
                placeholder="Nhãn"
                placeholderTextColor={C.textDim}
                style={[styles.input, { flex: 1, marginRight: 6 }]}
              />
              <TextInput
                value={opt.value}
                onChangeText={(v) => onUpdateOption(draft.id, oi, "value", v)}
                placeholder="Giá trị"
                placeholderTextColor={C.textDim}
                style={[styles.input, { width: 100, marginRight: 6 }]}
              />
              <TouchableOpacity
                disabled={(draft.options || []).length <= 2}
                onPress={() => onRemoveOption(draft.id, oi)}
                style={[styles.iconBtn, (draft.options || []).length <= 2 && { opacity: 0.3 }]}
              >
                <Trash2 size={14} color={C.textSub} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={() => onAddOption(draft.id)} style={styles.dashedBtn}>
            <Text style={styles.dashedBtnText}>+ Thêm lựa chọn</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateSurveyComposer({ onCancel, onSuccess }) {
  const navigation = useNavigation();
  const { createSurveyFlow } = useSurvey();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState(null);   // Date | null
  const [endAt, setEndAt]   = useState(null);     // Date | null
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker,   setShowEndPicker]   = useState(false);
  const [drafts, setDrafts] = useState([emptyDraft()]);
  const [emailsRaw, setEmailsRaw] = useState("");
  const [inviteRole, setInviteRole] = useState("respondent");
  const [publishNow, setPublishNow] = useState(false);
  const [createShareLink, setCreateShareLink] = useState(false);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [done, setDone] = useState(null);
  const [copied, setCopied] = useState(false);

  const emailList = useMemo(() => parseEmails(emailsRaw), [emailsRaw]);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartAt(null);
    setEndAt(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
    setDrafts([emptyDraft()]);
    setEmailsRaw("");
    setInviteRole("respondent");
    setPublishNow(false);
    setCreateShareLink(false);
    setDone(null);
    setCopied(false);
  }, []);

  // ── Draft mutators ──────────────────────────────────────────────────────────
  const updateDraft = (id, patch) =>
    setDrafts((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const setDraftType = (id, type) =>
    setDrafts((list) =>
      list.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, type };
        if (CHOICE_TYPES.includes(type) && (!d.options || d.options.length < 2))
          next.options = defaultOptions();
        if (type === "NUMBER") next.settings = { min: "", max: "" };
        else if (type === "RATING") next.settings = { min: 1, max: 5 };
        else next.settings = null;
        return next;
      })
    );

  const addDraft = () => setDrafts((list) => [...list, emptyDraft()]);
  const removeDraft = (id) =>
    setDrafts((list) => (list.length <= 1 ? list : list.filter((d) => d.id !== id)));

  const updateOption = (draftId, optIndex, key, val) =>
    setDrafts((list) =>
      list.map((d) => {
        if (d.id !== draftId) return d;
        const options = (d.options || []).map((o, i) =>
          i === optIndex ? { ...o, [key]: val } : o
        );
        return { ...d, options };
      })
    );

  const addOption = (draftId) =>
    setDrafts((list) =>
      list.map((d) => {
        if (d.id !== draftId) return d;
        const n = (d.options?.length || 0) + 1;
        return {
          ...d,
          options: [
            ...(d.options || []),
            { label: `Tùy chọn ${n}`, value: `opt_${Date.now()}_${n}` },
          ],
        };
      })
    );

  const removeOption = (draftId, optIndex) =>
    setDrafts((list) =>
      list.map((d) => {
        if (d.id !== draftId) return d;
        const opts = (d.options || []).filter((_, i) => i !== optIndex);
        return { ...d, options: opts.length >= 2 ? opts : d.options };
      })
    );

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateDrafts = (filled) => {
    for (const q of filled) {
      if (CHOICE_TYPES.includes(q.type)) {
        const opts = (q.options || [])
          .map((o) => ({ label: String(o.label || "").trim(), value: String(o.value || "").trim() }))
          .filter((o) => o.label && o.value);
        const values = new Set(opts.map((o) => o.value));
        if (opts.length < 2 || values.size < opts.length) {
          toast.error(`Câu "${(q.content || "").slice(0, 40)}…" cần ít nhất 2 lựa chọn (value không trùng).`);
          return false;
        }
      }
      if (q.type === "NUMBER" && q.settings) {
        const { min, max } = q.settings;
        if (min !== "" && max !== "" && Number(min) > Number(max)) {
          toast.error("Câu số: min phải ≤ max.");
          return false;
        }
      }
      if (q.type === "RATING" && q.settings) {
        const min = Number(q.settings.min ?? 1);
        const max = Number(q.settings.max ?? 5);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
          toast.error("Thang đánh giá: min phải < max.");
          return false;
        }
      }
    }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const t = title.trim();
    if (!t) {
      toast.error("Nhập tiêu đề khảo sát.");
      return;
    }
    const toISO = (d) => {
      if (!d || isNaN(d.getTime())) return null;
      try { return d.toISOString(); } catch { return null; }
    };

    if (startAt && endAt && endAt <= startAt) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    const filled = drafts
      .map((d) => ({
        content: d.content.trim(),
        type: d.type,
        required: d.required,
        settings: d.settings,
        options: d.options,
      }))
      .filter((d) => d.content);

    if (!validateDrafts(filled)) return;

    const payload = { title: t, description: description.trim() || null };
    const s = toISO(startAt);
    const e = toISO(endAt);
    if (s) payload.start_at = s;
    if (e) payload.end_at = e;

    const extras = {
      draftQuestions: filled,
      inviteEmails: emailList,
      inviteRole,
      publishNow,
      createShareLink,
    };

    setBusy(true);
    setProgress(PROGRESS_LABEL.create);
    try {
      const result = await createSurveyFlow(payload, extras, (step) => {
        setProgress(PROGRESS_LABEL[step] || "");
      });
      setDone(result);
    } catch (_) {
      // provider handles error toasts
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  // ── Copy share link ─────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!done?.shareUrl) return;
    try {
      // Use Clipboard from @react-native-clipboard/clipboard if available
      const { default: Clipboard } = await import("@react-native-clipboard/clipboard");
      Clipboard.setString(done.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      toast.info("Không thể copy tự động. Hãy copy thủ công.");
    }
  };

  const handleFinish = () => {
    onSuccess?.(done);
    resetForm();
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Done screen
  // ────────────────────────────────────────────────────────────────────────────
  if (done?.survey) {
    const editRoute = ROUTERS.MY_SURVEY_DETAIL.replace(":surveyId", done.survey.id);
    return (
      <Card style={styles.doneCard}>
        <View style={[styles.row, { marginBottom: 12 }]}>
          <Check size={20} color={C.success} />
          <Text style={styles.doneTitle}>Đã tạo xong</Text>
        </View>
        <Text style={styles.doneSurveyName}>{done.survey.title}</Text>

        {done.shareUrl && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.fieldLabel}>Link chia sẻ</Text>
            <View style={[styles.row, { marginTop: 6 }]}>
              <TextInput
                value={done.shareUrl}
                editable={false}
                style={[styles.input, { flex: 1, fontSize: 11, marginRight: 8 }]}
              />
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                {copied ? <Check size={16} color={C.success} /> : <Copy size={16} color={C.primary} />}
                <Text style={[styles.copyBtnText, { color: copied ? C.success : C.primary }]}>
                  {copied ? "Đã copy" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.row, { justifyContent: "flex-end", gap: 10 }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate(editRoute)}
            style={styles.outlineBtn}
          >
            <FileQuestion size={14} color={C.primary} />
            <Text style={styles.outlineBtnText}>Chỉnh sửa chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFinish} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Xong</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Main form
  // ────────────────────────────────────────────────────────────────────────────
  const canSubmit = !busy && !!title.trim();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.row, { alignItems: "flex-start", marginBottom: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Tạo khảo sát mới</Text>
            <Text style={styles.pageSubtitle}>
              Điền thông tin → thêm câu hỏi → mời người → bấm <Text style={{ fontWeight: "700" }}>Lưu &amp; áp dụng</Text>.
            </Text>
          </View>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <X size={16} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {/* ── Thông tin ── */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel text="THÔNG TIN" />
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Tiêu đề khảo sát *"
            placeholderTextColor={C.textDim}
            style={[styles.input, { fontSize: 16, fontWeight: "700", marginBottom: 10 }]}
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả (tuỳ chọn)"
            placeholderTextColor={C.textDim}
            multiline
            numberOfLines={3}
            style={[styles.input, { minHeight: 64, textAlignVertical: "top", marginBottom: 12 }]}
          />
          <View style={[styles.row, { gap: 10 }]}>
            {/* Start date */}
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Bắt đầu</Text>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                style={[styles.input, { justifyContent: "center" }]}
              >
                <Text style={[
                  styles.pickerText,
                  !startAt && { color: C.textDim },
                ]}>
                  {startAt
                    ? `${String(startAt.getDate()).padStart(2,"0")}/${String(startAt.getMonth()+1).padStart(2,"0")}/${startAt.getFullYear()} ${String(startAt.getHours()).padStart(2,"0")}:${String(startAt.getMinutes()).padStart(2,"0")}`
                    : "Chọn ngày giờ"}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startAt || new Date()}
                  mode="datetime"
                  display="default"
                  onChange={(_, date) => {
                    setShowStartPicker(false);
                    if (date) setStartAt(date);
                  }}
                />
              )}
            </View>
            {/* End date */}
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Kết thúc</Text>
              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                style={[styles.input, { justifyContent: "center" }]}
              >
                <Text style={[
                  styles.pickerText,
                  !endAt && { color: C.textDim },
                ]}>
                  {endAt
                    ? `${String(endAt.getDate()).padStart(2,"0")}/${String(endAt.getMonth()+1).padStart(2,"0")}/${endAt.getFullYear()} ${String(endAt.getHours()).padStart(2,"0")}:${String(endAt.getMinutes()).padStart(2,"0")}`
                    : "Chọn ngày giờ"}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endAt || new Date()}
                  mode="datetime"
                  display="default"
                  onChange={(_, date) => {
                    setShowEndPicker(false);
                    if (date) setEndAt(date);
                  }}
                />
              )}
            </View>
          </View>
        </Card>

        {/* ── Câu hỏi ── */}
        <Card style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
          {/* Fixed header */}
          <View style={styles.questionHeader}>
            <View style={styles.row}>
              <ListChecks size={18} color={C.primary} />
              <Text style={styles.questionHeaderTitle}>Câu hỏi</Text>
              <Text style={styles.questionCount}>{drafts.length}</Text>
            </View>
            <TouchableOpacity onPress={addDraft} style={styles.addQuestionBtn}>
              <Plus size={14} color="#fff" />
              <Text style={styles.addQuestionBtnText}>Thêm câu</Text>
            </TouchableOpacity>
          </View>

          {/* Questions list — NOT nested ScrollView; renders inline */}
          <View style={{ padding: 14, gap: 12 }}>
            {drafts.map((d, idx) => (
              <QuestionCard
                key={d.id}
                draft={d}
                idx={idx}
                totalCount={drafts.length}
                onUpdate={updateDraft}
                onSetType={setDraftType}
                onRemove={removeDraft}
                onAddOption={addOption}
                onRemoveOption={removeOption}
                onUpdateOption={updateOption}
              />
            ))}
          </View>
        </Card>

        {/* ── Mời qua email ── */}
        <Card style={{ marginBottom: 14 }}>
          <View style={[styles.row, { marginBottom: 10 }]}>
            <Mail size={17} color={C.primary} />
            <Text style={styles.cardTitle}>Mời qua email</Text>
            {emailList.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{emailList.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.hintText}>
            Nhập email, cách nhau bằng dấu phẩy hoặc xuống dòng.
          </Text>
          <TextInput
            value={emailsRaw}
            onChangeText={setEmailsRaw}
            placeholder={"email@domain.com\nanother@domain.com"}
            placeholderTextColor={C.textDim}
            multiline
            numberOfLines={4}
            style={[styles.input, { minHeight: 80, textAlignVertical: "top", marginTop: 8 }]}
          />

          <Text style={[styles.fieldLabel, { marginTop: 12, marginBottom: 6 }]}>Vai trò</Text>
          <View style={styles.row}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setInviteRole(r.value)}
                style={[
                  styles.roleChip,
                  inviteRole === r.value && styles.roleChipActive,
                ]}
              >
                <Text style={[styles.roleChipLabel, inviteRole === r.value && { color: C.primary }]}>
                  {r.label}
                </Text>
                <Text style={styles.roleChipDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Sau khi tạo ── */}
        <Card style={{ marginBottom: 14 }}>
          <View style={[styles.row, { marginBottom: 12 }]}>
            <Users size={17} color={C.primary} />
            <Text style={styles.cardTitle}>Sau khi tạo</Text>
          </View>

          <TouchableOpacity
            onPress={() => setPublishNow((v) => !v)}
            style={[styles.row, { marginBottom: 10 }]}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, publishNow && styles.checkboxActive]}>
              {publishNow && <Check size={10} color="#fff" />}
            </View>
            <Globe size={16} color={C.textSub} style={{ marginHorizontal: 8 }} />
            <Text style={styles.checkboxLabel}>Công khai khảo sát</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCreateShareLink((v) => !v)}
            style={styles.row}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, createShareLink && styles.checkboxActive]}>
              {createShareLink && <Check size={10} color="#fff" />}
            </View>
            <Link2 size={16} color={C.textSub} style={{ marginHorizontal: 8 }} />
            <Text style={styles.checkboxLabel}>Tạo link chia sẻ có token</Text>
          </TouchableOpacity>
        </Card>

        {/* Progress indicator */}
        {busy && !!progress && (
          <View style={styles.progressBar}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.row, { justifyContent: "flex-end", gap: 10, paddingBottom: 32 }]}>
          <TouchableOpacity
            onPress={onCancel}
            disabled={busy}
            style={[styles.outlineBtn, busy && { opacity: 0.5 }]}
          >
            <Text style={styles.outlineBtnText}>Huỷ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
          >
            {busy ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>Đang xử lý…</Text>
              </>
            ) : (
              <>
                <FileQuestion size={15} color={canSubmit ? "#fff" : C.textDim} />
                <Text style={[styles.primaryBtnText, !canSubmit && { color: C.textDim }]}>
                  Lưu &amp; áp dụng
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16 },

  card: {
    backgroundColor: "#ffffffd4",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ffffff8c",
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textSub,
    letterSpacing: 1,
    marginBottom: 12,
  },

  input: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    fontSize: 13,
    color: C.text,
    backgroundColor: "rgba(255,255,255,0.72)",
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textSub,
    marginBottom: 4,
  },

  pickerText: {
    fontSize: 13,
    color: C.text,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    color: C.textSub,
    lineHeight: 18,
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: C.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  // Questions block
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: "rgba(255,255,255,0.92)",
    gap: 10,
  },
  questionHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.text,
    marginLeft: 6,
  },
  questionCount: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textDim,
    marginLeft: 4,
    backgroundColor: C.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  addQuestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  addQuestionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  questionCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.15)",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  questionIndex: {
    fontSize: 11,
    fontWeight: "800",
    color: C.primary,
    flex: 1,
  },

  // Type chips
  typeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(255,255,255,0.6)",
    marginRight: 6,
  },
  typeChipActive: {
    borderColor: C.primary,
    backgroundColor: C.primarySoft,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textSub,
  },
  typeChipTextActive: {
    color: C.primary,
    fontWeight: "700",
  },

  // Checkbox
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  checkboxLabel: {
    fontSize: 12,
    color: C.text,
  },

  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  dashedBtn: {
    padding: "6px 10px",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(79,70,229,0.35)",
    alignSelf: "flex-start",
  },
  dashedBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.primary,
  },

  // Email / invite
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.text,
  },
  hintText: {
    fontSize: 11,
    color: C.textSub,
    lineHeight: 16,
  },
  badge: {
    marginLeft: "auto",
    backgroundColor: C.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.primary,
  },

  // Role chips
  roleChip: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
  },
  roleChipActive: {
    borderColor: "rgba(79,70,229,0.45)",
    backgroundColor: C.primarySoft,
  },
  roleChipLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.text,
  },
  roleChipDesc: {
    fontSize: 9,
    color: C.textDim,
    marginTop: 2,
  },

  // Progress
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.surfaceSoft,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.primary,
  },

  // Buttons
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 11,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: "rgba(0,0,0,0.08)",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "transparent",
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },

  // Done screen
  doneCard: {
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
  },
  doneTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
    marginLeft: 8,
  },
  doneSurveyName: {
    fontSize: 13,
    color: C.text,
    fontWeight: "700",
    marginBottom: 14,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
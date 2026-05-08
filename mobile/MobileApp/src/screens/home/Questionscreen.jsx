/**
 * Questionscreen.jsx  —  src/screens/home/Questionscreen.jsx
 *
 * FIX LOG:
 *  1. Dùng useQuestion() thật từ provider thay vì mock
 *  2. Đọc surveyId từ route.params.id  (MySurveysScreen navigate với { id: survey.id })
 *  3. Đọc surveyTitle / surveyDescription từ route.params để hiển thị đúng tên survey
 *  4. Xoá toàn bộ mock data
 *  5. Tất cả CRUD đều gọi API thật
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// ✅ Provider thật — đảm bảo QuestionProvider đã wrap Navigator trong App
import { useQuestion } from '../../providers/Questionprovider';

/* ─────────────────────────────────────────────
 * DESIGN TOKENS
 * ───────────────────────────────────────────── */
const C = {
  bg:            '#f5f7fb',
  surface:       '#ffffff',
  surfaceHigh:   '#f8fafc',
  border:        '#dbe2ea',
  borderFocus:   '#c7d2fe',
  primary:       '#4f6ef7',
  primaryDim:    'rgba(79,110,247,0.08)',
  primaryBorder: '#c7d2fe',
  text:          '#111827',
  textSub:       '#64748b',
  textDim:       '#94a3b8',
  error:         '#ef4444',
  errorBg:       '#fef2f2',
  errorBorder:   '#fecaca',
};

/* ─────────────────────────────────────────────
 * TYPE MAPPING
 * ───────────────────────────────────────────── */
const BE_TO_FE = {
  text: 'TEXT', paragraph: 'PARAGRAPH', email: 'EMAIL',
  date: 'DATE', number: 'NUMBER', rating: 'RATING',
  single_choice: 'SINGLE_CHOICE', multiple_choice: 'MULTIPLE_CHOICE',
  dropdown: 'DROPDOWN',
  TEXT: 'TEXT', PARAGRAPH: 'PARAGRAPH', EMAIL: 'EMAIL',
  DATE: 'DATE', NUMBER: 'NUMBER', RATING: 'RATING',
  SINGLE_CHOICE: 'SINGLE_CHOICE', MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  DROPDOWN: 'DROPDOWN',
};
const toFE = (t) => BE_TO_FE[t] ?? 'TEXT';
const toBE = (t) => t;  // backend nhận nguyên FE string

const Q_TYPES = [
  { value: 'TEXT',            label: 'Trả lời ngắn'   },
  { value: 'PARAGRAPH',       label: 'Đoạn văn'        },
  { value: 'SINGLE_CHOICE',   label: 'Trắc nghiệm'     },
  { value: 'MULTIPLE_CHOICE', label: 'Hộp kiểm'        },
  { value: 'DROPDOWN',        label: 'Menu thả xuống'  },
  { value: 'RATING',          label: 'Xếp hạng'        },
  { value: 'NUMBER',          label: 'Số'              },
  { value: 'DATE',            label: 'Ngày'             },
  { value: 'TIME',            label: 'Giờ'              },
  { value: 'FILE_UPLOAD',     label: 'Tải tệp lên'     },
];

const CHOICE_TYPES   = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'];
const SETTINGS_TYPES = ['NUMBER', 'RATING'];

const newOptRow = () => ({ label: '', value: '', order_index: 0, is_other: false });

const buildOptions = (rows) =>
  rows
    .filter(r => r.label.trim() && r.value.trim())
    .map((r, i) => ({
      label:       r.label.trim(),
      value:       r.value.trim(),
      order_index: i,
      is_other:    r.is_other ?? false,
    }));

/* ─────────────────────────────────────────────
 * TOGGLE
 * ───────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <TouchableOpacity onPress={() => onChange(!checked)} style={st.toggleRow} activeOpacity={0.7}>
      <Text style={st.toggleLabel}>Bắt buộc</Text>
      <View style={[st.toggleTrack, checked && st.toggleTrackOn]}>
        <View style={[st.toggleThumb, checked && st.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────
 * TYPE PICKER MODAL  (bottom-sheet)
 * ───────────────────────────────────────────── */


/* ─────────────────────────────────────────────
 * INLINE OPTION BUILDER
 * ───────────────────────────────────────────── */
function OptionBuilder({ qType, rows, onChange }) {
  const add = (after) => {
    const next = [...rows];
    next.splice(after + 1, 0, newOptRow());
    onChange(next);
  };
  const remove = (i) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, idx) => idx !== i));
  };
  const handleLabel = (i, val) => {
    const auto = val.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    onChange(rows.map((r, idx) => idx === i ? { ...r, label: val, value: auto } : r));
  };
  const handleValue = (i, val) => {
    onChange(rows.map((r, idx) => idx === i ? { ...r, value: val } : r));
  };

  const Marker = ({ i }) => {
    if (qType === 'MULTIPLE_CHOICE') return <View style={st.checkMarker} />;
    if (qType === 'DROPDOWN') return <Text style={st.numMarker}>{i + 1}.</Text>;
    return <View style={st.radioMarker} />;
  };

  return (
    <View>
      <Text style={st.sLabel}>Các lựa chọn</Text>
      <View style={st.optHeaderRow}>
        <View style={{ width: 20 }} />
        <Text style={[st.optColHead, { flex: 1 }]}>Label (hiển thị)</Text>
        <Text style={[st.optColHead, { flex: 1 }]}>Value (lưu DB)</Text>
        <View style={{ width: 24 }} />
      </View>
      {rows.map((row, i) => (
        <View key={i} style={st.optRow}>
          <Marker i={i} />
          <TextInput
            value={row.label}
            onChangeText={v => handleLabel(i, v)}
            placeholder={`Label ${i + 1}`}
            placeholderTextColor={C.textDim}
            style={st.optLabelInput}
          />
          <TextInput
            value={row.value}
            onChangeText={v => handleValue(i, v)}
            placeholder={`value_${i + 1}`}
            placeholderTextColor={C.textDim}
            style={st.optValueInput}
          />
          <TouchableOpacity onPress={() => remove(i)} disabled={rows.length <= 1} style={st.optRemove}>
            <Text style={{ color: rows.length <= 1 ? C.textDim : C.error, fontSize: 18, lineHeight: 22 }}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={() => add(rows.length - 1)} style={st.addOptBtn}>
        <Text style={st.addOptText}>+ Thêm lựa chọn</Text>
      </TouchableOpacity>
      {/* Preview chips */}
      {rows.some(r => r.label.trim()) && (
        <View style={st.chipWrap}>
          {rows.filter(r => r.label.trim()).map((r, i) => (
            <View key={i} style={st.chip}>
              <View style={st.chipDot} />
              <Text style={st.chipLabel}>{r.label}</Text>
              {r.value ? <Text style={st.chipValue}> ({r.value})</Text> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────
 * SETTINGS EDITOR
 * ───────────────────────────────────────────── */
function SettingsEditor({ type, settings, onChange }) {
  if (type === 'NUMBER') return (
    <View>
      <Text style={st.sLabel}>Giới hạn số</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {['min', 'max'].map(k => (
          <View key={k} style={{ flex: 1 }}>
            <Text style={st.subLabel}>{k === 'min' ? 'Min' : 'Max'}</Text>
            <TextInput
              keyboardType="numeric"
              value={settings?.[k] !== undefined ? String(settings[k]) : ''}
              onChangeText={v => onChange({ ...settings, [k]: v !== '' ? Number(v) : undefined })}
              placeholder="Không giới hạn"
              placeholderTextColor={C.textDim}
              style={st.settingsInput}
            />
          </View>
        ))}
      </View>
    </View>
  );

  if (type === 'RATING') {
    const min = settings?.min ?? 1;
    const max = settings?.max ?? 5;
    return (
      <View>
        <Text style={st.sLabel}>Phạm vi đánh giá</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          {[['min', min], ['max', max]].map(([k, v]) => (
            <View key={k} style={{ flex: 1 }}>
              <Text style={st.subLabel}>{k === 'min' ? 'Min' : 'Max'}</Text>
              <TextInput
                keyboardType="numeric"
                value={String(v)}
                onChangeText={val => onChange({ ...settings, [k]: Number(val) })}
                style={st.settingsInput}
              />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(i => (
            <View key={i} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: C.textSub }}>{i}</Text>
              <Text style={{ fontSize: 22, color: C.textDim }}>☆</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }
  return null;
}

/* ─────────────────────────────────────────────
 * QUESTION BODY PREVIEW  (collapsed)
 * ───────────────────────────────────────────── */
function QuestionBodyPreview({ q }) {
  const type = toFE(q.type);
  const opts = q.options ?? q.option ?? [];

  if (type === 'TEXT') return (
    <View style={st.previewLine}><Text style={st.previewPH}>Trả lời ngắn...</Text></View>
  );
  if (type === 'PARAGRAPH') return (
    <View style={[st.previewLine, { minHeight: 48 }]}><Text style={st.previewPH}>Đoạn văn dài...</Text></View>
  );
  if (type === 'NUMBER') return (
    <View style={st.previewLine}><Text style={st.previewPH}>Nhập số...</Text></View>
  );
  if (type === 'DATE') return (
    <View style={st.previewRow}><Text style={st.previewPH}>📅  Ngày / Tháng / Năm</Text></View>
  );
  if (type === 'TIME') return (
    <View style={st.previewRow}><Text style={st.previewPH}>🕐  Giờ : Phút</Text></View>
  );
  if (CHOICE_TYPES.includes(type)) {
    if (!opts.length) return <Text style={st.previewPH}>Chưa có lựa chọn nào.</Text>;
    return (
      <View style={{ marginTop: 4 }}>
        {opts.map((o, i) => (
          <View key={o.id ?? i} style={st.optPreviewRow}>
            {type === 'MULTIPLE_CHOICE' ? <View style={st.checkMarker} />
              : type === 'DROPDOWN' ? <Text style={st.numMarker}>{i + 1}.</Text>
              : <View style={st.radioMarker} />}
            <Text style={st.optPreviewLabel}>{o.label}</Text>
            <View style={st.optPreviewBadge}><Text style={st.optPreviewVal}>{o.value}</Text></View>
          </View>
        ))}
      </View>
    );
  }
  if (type === 'RATING') return (
    <View style={{ flexDirection: 'row', gap: 8, paddingTop: 6 }}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 9, color: C.textSub }}>{i}</Text>
          <Text style={{ fontSize: 20, color: C.textDim }}>☆</Text>
        </View>
      ))}
    </View>
  );
  if (type === 'FILE_UPLOAD') return (
    <View style={st.filePreview}>
      <Text style={{ fontSize: 13, color: C.textDim }}>↑  Người dùng có thể tải tệp lên</Text>
    </View>
  );
  return null;
}

/* ─────────────────────────────────────────────
 * QUESTION CARD
 * ───────────────────────────────────────────── */
function QuestionCard({ q, index, isActive, onActivate, onSave, onCancel, onDelete, onDuplicate, deletingId }) {
  const [content,   setContent]   = useState(q.content ?? '');
  const [type,      setType]      = useState(toFE(q.type));
  const [required,  setRequired]  = useState(q.required ?? true);
  const [typeModal, setTypeModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const existingOpts = q.options ?? q.option ?? [];
  const [optRows, setOptRows] = useState(
    existingOpts.length > 0
      ? existingOpts.map(o =>
          typeof o === 'string'
            ? { label: o, value: o, order_index: 0, is_other: false }
            : { label: o.label ?? '', value: o.value ?? '', order_index: o.order_index ?? 0, is_other: o.is_other ?? false }
        )
      : [newOptRow()]
  );
  const [settings, setSettings] = useState(q.settings ?? null);

  const isChoice   = CHOICE_TYPES.includes(type);
  const hasSetting = SETTINGS_TYPES.includes(type);
  const isDeleting = deletingId === q.id;

  const changeType = (v) => {
    setType(v);
    if (CHOICE_TYPES.includes(v) && !CHOICE_TYPES.includes(type)) setOptRows([newOptRow()]);
    if (!SETTINGS_TYPES.includes(v)) setSettings(null);
    if (v === 'RATING') setSettings({ min: 1, max: 5 });
  };

  const handleSave = async () => {
    if (!content.trim()) { Alert.alert('Lỗi', 'Nội dung câu hỏi không được để trống.'); return; }
    if (isChoice && buildOptions(optRows).length < 2) { Alert.alert('Lỗi', 'Cần ít nhất 2 lựa chọn hợp lệ.'); return; }
    setSaving(true);
    const payload = {
      content:  content.trim(),
      type:     toBE(type),
      required,
      settings: hasSetting ? settings : undefined,
    };
    if (isChoice) payload.options = buildOptions(optRows);
    try { await onSave(q.id, q.survey_id, payload); }
    finally { setSaving(false); }
  };

  /* ── Collapsed ── */
  if (!isActive) {
    return (
      <TouchableOpacity onPress={() => onActivate(q.id)} style={st.collapsed} activeOpacity={0.85}>
        <Text style={st.collapsedIdx}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={{ flex: 1 }}>
          <Text style={st.collapsedContent} numberOfLines={2}>
            {q.content || <Text style={{ fontStyle: 'italic', color: C.textDim }}>Câu hỏi chưa có tiêu đề</Text>}
          </Text>
          <View style={st.collapsedTypeBadge}>
            <Text style={st.collapsedTypeText}>{Q_TYPES.find(t => t.value === toFE(q.type))?.label}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(q.id)}
          disabled={isDeleting}
          style={st.collapsedDel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDeleting
            ? <ActivityIndicator size="small" color={C.error} />
            : <Text style={{ fontSize: 16, color: C.textDim }}>🗑</Text>
          }
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  /* ── Expanded ── */
  return (
    <View style={st.activeCard}>
      {/* Drag handle */}
      <View style={st.dragHandle}>
        <Text style={{ color: C.textDim, fontSize: 14 }}>⠿  Câu {index + 1}</Text>
      </View>

      <View style={st.activeBody}>
        {/* Content */}
        <Text style={st.sLabel}>Nội dung câu hỏi *</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Câu hỏi không có tiêu đề"
          placeholderTextColor={C.textDim}
          multiline
          style={st.contentInput}
        />

        {/* Type selector */}
        <Text style={[st.sLabel, { marginTop: 14 }]}>Loại câu hỏi</Text>
        <TouchableOpacity
  activeOpacity={0.8}
  onPress={() => setShowTypes(!showTypes)}
  style={st.typeSelector}
>
  <Text style={st.typeSelectorText}>
    {Q_TYPES.find(t => t.value === type)?.label}
  </Text>

  <Text style={st.typeArrow}>
    {showTypes ? '▲' : '▼'}
  </Text>
</TouchableOpacity>

{showTypes && (
  <View style={st.typeDropdown}>
    {Q_TYPES.map((t) => {
      const active = t.value === type;

      return (
        <TouchableOpacity
          key={t.value}
          activeOpacity={0.7}
          onPress={() => {
            changeType(t.value);
            setShowTypes(false);
          }}
          style={[
            st.typeDropdownItem,
            active && st.typeDropdownItemActive,
          ]}
        >
          <Text
            style={[
              st.typeDropdownText,
              active && st.typeDropdownTextActive,
            ]}
          >
            {t.label}
          </Text>

          {active && (
            <Text style={{ color: C.primary }}>✓</Text>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
)}

        {/* Choice options */}
        {isChoice && (
          <View style={{ marginTop: 14 }}>
            <OptionBuilder qType={type} rows={optRows} onChange={setOptRows} />
          </View>
        )}

        {/* Settings */}
        {hasSetting && (
          <View style={{ marginTop: 14 }}>
            <SettingsEditor type={type} settings={settings} onChange={setSettings} />
          </View>
        )}

        {/* Preview for non-choice */}
        {!isChoice && !hasSetting && (
          <View style={{ marginTop: 10 }}>
            <QuestionBodyPreview q={{ ...q, type }} />
          </View>
        )}

        {/* Action bar */}
        <View style={st.actionBar}>
          <TouchableOpacity onPress={() => onDuplicate(q)} style={st.iconBtn}>
            <Text style={{ fontSize: 14 }}>⧉</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(q.id)} disabled={isDeleting} style={[st.iconBtn, st.iconBtnDanger]}>
            {isDeleting ? <ActivityIndicator size="small" color={C.error} /> : <Text style={{ fontSize: 14 }}>🗑</Text>}
          </TouchableOpacity>

          <View style={st.actionDivider} />
          <Toggle checked={required} onChange={setRequired} />
          <View style={st.actionDivider} />

          <TouchableOpacity onPress={onCancel} style={st.cancelBtn}>
            <Text style={st.cancelBtnText}>Đóng</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[st.saveBtn, saving && st.saveBtnOff]}>
            {saving && <ActivityIndicator size="small" color={C.textSub} style={{ marginRight: 4 }} />}
            <Text style={[st.saveBtnText, saving && { color: C.textSub }]}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
 * NEW QUESTION FORM
 * ───────────────────────────────────────────── */
function NewQuestionForm({ surveyId, questionsCount, onCreate, onCancel }) {
  const [content,   setContent]   = useState('');
  const [type,      setType]      = useState('TEXT');
  const [required,  setRequired]  = useState(true);
  const [typeModal, setTypeModal] = useState(false);
  const [optRows,   setOptRows]   = useState([newOptRow()]);
  const [settings,  setSettings]  = useState(null);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const isChoice   = CHOICE_TYPES.includes(type);
  const hasSetting = SETTINGS_TYPES.includes(type);

  const changeType = (v) => {
    setType(v); setError('');
    if (!CHOICE_TYPES.includes(v)) setOptRows([newOptRow()]);
    if (!SETTINGS_TYPES.includes(v)) setSettings(null);
    if (v === 'RATING') setSettings({ min: 1, max: 5 });
  };

  const handleSubmit = async () => {
    if (!content.trim()) { setError('Nội dung câu hỏi không được để trống.'); return; }
    if (isChoice && buildOptions(optRows).length < 2) { setError('Cần ít nhất 2 lựa chọn hợp lệ.'); return; }
    if (type === 'NUMBER' && settings?.min !== undefined && settings?.max !== undefined && settings.min > settings.max) {
      setError('Min phải nhỏ hơn hoặc bằng Max.'); return;
    }
    setError(''); setLoading(true);
    const payload = {
      content:     content.trim(),
      type:        toBE(type),
      required,
      order_index: questionsCount,
      settings:    hasSetting ? settings : undefined,
    };
    if (isChoice) payload.options = buildOptions(optRows);
    try { await onCreate(payload); }
    finally { setLoading(false); }
  };

  return (
    <View style={st.newForm}>
      <Text style={st.newFormTitle}>Câu hỏi mới</Text>

      <Text style={st.sLabel}>Nội dung câu hỏi *</Text>
      <TextInput
        value={content}
        onChangeText={v => { setContent(v); setError(''); }}
        placeholder="Nhập nội dung câu hỏi..."
        placeholderTextColor={C.textDim}
        multiline
        style={[st.contentInput, error && !content.trim() && st.contentInputErr]}
      />

      <Text style={[st.sLabel, { marginTop: 12 }]}>Loại câu hỏi</Text>
     <TouchableOpacity
  activeOpacity={0.8}
  onPress={() => setShowTypes(!showTypes)}
  style={st.typeSelector}
>
  <Text style={st.typeSelectorText}>
    {Q_TYPES.find(t => t.value === type)?.label}
  </Text>

  <Text style={st.typeArrow}>
    {showTypes ? '▲' : '▼'}
  </Text>
</TouchableOpacity>

{showTypes && (
  <View style={st.typeDropdown}>
    {Q_TYPES.map((t) => {
      const active = t.value === type;

      return (
        <TouchableOpacity
          key={t.value}
          activeOpacity={0.7}
          onPress={() => {
            changeType(t.value);
            setShowTypes(false);
          }}
          style={[
            st.typeDropdownItem,
            active && st.typeDropdownItemActive,
          ]}
        >
          <Text
            style={[
              st.typeDropdownText,
              active && st.typeDropdownTextActive,
            ]}
          >
            {t.label}
          </Text>

          {active && (
            <Text style={{ color: C.primary }}>✓</Text>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
)}



      <View style={{ marginTop: 12 }}>
        <Toggle checked={required} onChange={setRequired} />
      </View>

      {isChoice && (
        <View style={{ marginTop: 14 }}>
          <OptionBuilder qType={type} rows={optRows} onChange={r => { setOptRows(r); setError(''); }} />
        </View>
      )}

      {hasSetting && (
        <View style={{ marginTop: 14 }}>
          <SettingsEditor type={type} settings={settings} onChange={setSettings} />
        </View>
      )}

      {error ? (
        <View style={st.errorBox}>
          <Text style={st.errorText}>⚠  {error}</Text>
        </View>
      ) : null}

      <View style={st.formActions}>
        <TouchableOpacity onPress={onCancel} style={st.cancelBtn}>
          <Text style={st.cancelBtnText}>Huỷ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[st.saveBtn, loading && st.saveBtnOff]}>
          {loading && <ActivityIndicator size="small" color={C.textSub} style={{ marginRight: 4 }} />}
          <Text style={[st.saveBtnText, loading && { color: C.textSub }]}>
            {loading ? 'Đang thêm...' : '+ Thêm câu hỏi'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
 * MAIN SCREEN  ← đây là component export chính
 * ───────────────────────────────────────────── */
export default function QuestionScreen() {
  const navigation = useNavigation();

  // ✅ FIX 1: Đọc đúng params từ MySurveysScreen
  // MySurveysScreen navigate: navigation.navigate("QuestionScreen", { id: survey.id })
  // → params.id  là surveyId
  // → params.title / params.description để hiển thị tên survey (tuỳ chọn)
  const route    = useRoute();
  const surveyId = route.params?.id ?? route.params?.surveyId;
  const surveyTitle = route.params?.title ?? 'Khảo sát';
  const surveyDesc  = route.params?.description ?? '';

  // ✅ FIX 2: Dùng provider thật
  const {
    questions,
    loading,
    fetchQuestionsBySurvey,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  } = useQuestion();

  const [activeId,    setActiveId]    = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const pendingRef = useRef(null);

  // ✅ FIX 3: Fetch khi màn hình mount với surveyId thật
  useEffect(() => {
    if (surveyId) fetchQuestionsBySurvey(surveyId);
  }, [surveyId]);

  // Auto-activate newly created question
  useEffect(() => {
    if (!pendingRef.current) return;
    const found = questions.find(q => q.id === pendingRef.current);
    if (found) { setActiveId(found.id); pendingRef.current = null; }
  }, [questions]);

  /* ── CRUD handlers ── */
  const handleCreate = async (payload) => {
    setShowForm(false);
    setFormLoading(true);
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingRef.current = created.id;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Xóa câu hỏi', 'Bạn có chắc chắn muốn xóa câu hỏi này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteQuestion(id);
            if (activeId === id) setActiveId(null);
          } finally { setDeletingId(null); }
        },
      },
    ]);
  };

  const handleDuplicate = useCallback(async (q) => {
    const opts = q.options ?? q.option ?? [];
    const payload = {
      content:     q.content + ' (bản sao)',
      type:        toBE(toFE(q.type)),
      required:    q.required,
      order_index: questions.length,
      settings:    q.settings ?? undefined,
    };
    if (CHOICE_TYPES.includes(toFE(q.type)) && opts.length > 0) {
      payload.options = opts
        .map((o, i) => ({
          label:       typeof o === 'string' ? o : (o.label ?? ''),
          value:       typeof o === 'string' ? o : (o.value ?? ''),
          order_index: i,
          is_other:    typeof o === 'object' ? (o.is_other ?? false) : false,
        }))
        .filter(o => o.label && o.value);
    }
    try {
      const created = await createQuestion(surveyId, payload);
      await fetchQuestionsBySurvey(surveyId);
      if (created?.id) pendingRef.current = created.id;
    } catch {}
  }, [questions, surveyId, createQuestion, fetchQuestionsBySurvey]);

  const handleUpdate = useCallback(async (id, sid, payload) => {
    const mapped = {
      ...payload,
      type: payload.type ? toBE(toFE(payload.type)) : undefined,
    };
    delete mapped.option;
    if (Array.isArray(mapped.options)) {
      mapped.options = mapped.options
        .map((o, i) => typeof o === 'string'
          ? { label: o, value: o, order_index: i, is_other: false }
          : o)
        .filter(o => o.label && o.value);
    }
    await updateQuestion(id, sid, mapped);
    setActiveId(null);
    await fetchQuestionsBySurvey(surveyId);
  }, [updateQuestion, fetchQuestionsBySurvey, surveyId]);

  const triggerAdd = () => {
    setShowForm(v => !v);
    setActiveId(null);
  };

  /* ── Render ── */
  return (
    <View style={st.screen}>
      {/* ── HEADER ── */}
      <View style={st.header}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 20, color: C.primary }}>‹</Text>
        </TouchableOpacity>

        <View style={st.headerIconBox}>
          <Text style={{ fontSize: 18 }}>📄</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.headerSub}>KHẢO SÁT</Text>
          <Text style={st.headerTitle} numberOfLines={1}>Quản lý câu hỏi</Text>
        </View>
        {formLoading && <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 8 }} />}
        <Text style={st.headerCount}>{questions.length} câu</Text>
        <TouchableOpacity onPress={triggerAdd} style={[st.addBtn, showForm && st.addBtnCancel]}>
          <Text style={[st.addBtnText, showForm && st.addBtnCancelText]}>
            {showForm ? '× Huỷ' : '+ Câu hỏi mới'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── BODY ── */}
      <ScrollView
        style={st.body}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Survey header card */}
        <View style={st.surveyCard}>
          <TextInput
            defaultValue={surveyTitle}
            style={st.surveyTitleInput}
            placeholderTextColor={C.textDim}
          />
          <TextInput
            defaultValue={surveyDesc}
            placeholder="Mô tả biểu mẫu"
            placeholderTextColor={C.textDim}
            style={st.surveyDescInput}
          />
        </View>

        {/* New question form */}
        {showForm && (
          <NewQuestionForm
            surveyId={surveyId}
            questionsCount={questions.length}
            onCreate={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Loading */}
        {loading && questions.length === 0 && (
          <View style={st.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ color: C.textSub, marginTop: 12, fontSize: 13 }}>Đang tải câu hỏi...</Text>
          </View>
        )}

        {/* Empty */}
        {!loading && questions.length === 0 && !showForm && (
          <View style={st.emptyState}>
            <Text style={{ fontSize: 52 }}>📭</Text>
            <Text style={st.emptyTitle}>Chưa có câu hỏi nào</Text>
            <Text style={st.emptySub}>Bấm "+ Câu hỏi mới" để bắt đầu</Text>
            <TouchableOpacity onPress={() => setShowForm(true)} style={st.saveBtn}>
              <Text style={st.saveBtnText}>+ Thêm câu hỏi đầu tiên</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Question list */}
        {questions.length > 0 && (
          <View style={{ gap: 10 }}>
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={idx}
                isActive={activeId === q.id}
                onActivate={(id) => { setActiveId(id); setShowForm(false); }}
                onSave={handleUpdate}
                onCancel={() => setActiveId(null)}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                deletingId={deletingId}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────────
 * STYLES
 * ───────────────────────────────────────────── */
const st = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  backBtn:     { paddingRight: 4 },
  headerIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primaryDim,
    alignItems: 'center', justifyContent: 'center',
  },
  headerSub:   { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: C.textDim, textTransform: 'uppercase' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  headerCount: { fontSize: 12, color: C.textSub },
  addBtn:      { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: C.primary, borderRadius: 12 },
  addBtnCancel:{ backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border },
  addBtnText:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  addBtnCancelText: { color: C.textSub },

  /* Body */
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },

  /* Survey header card */
  surveyCard: {
    backgroundColor: C.surface, borderRadius: 16,
    borderTopWidth: 6, borderTopColor: C.primary,
    borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 12,
  },
  typeSelector: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  borderWidth: 1,
  borderColor: C.border,
  borderRadius: 10,

  backgroundColor: '#fff',

  paddingVertical: 12,
  paddingHorizontal: 14,
},

typeSelectorText: {
  fontSize: 14,
  color: C.text,
},

typeArrow: {
  fontSize: 11,
  color: C.textSub,
},

typeDropdown: {
  marginTop: 8,

  borderWidth: 1,
  borderColor: C.border,

  borderRadius: 10,
  overflow: 'hidden',

  backgroundColor: '#fff',
},

typeDropdownItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',

  paddingVertical: 12,
  paddingHorizontal: 14,

  borderBottomWidth: 1,
  borderBottomColor: '#eef2f7',
},

typeDropdownItemActive: {
  backgroundColor: 'rgba(79,110,247,0.08)',
},

typeDropdownText: {
  fontSize: 14,
  color: C.text,
},

typeDropdownTextActive: {
  color: C.primary,
  fontWeight: '700',
},
  surveyTitleInput: {
    fontSize: 18, fontWeight: '800', color: C.text,
    borderBottomWidth: 2, borderBottomColor: C.border,
    paddingBottom: 8, marginBottom: 8,
  },
  surveyDescInput: {
    fontSize: 13, color: C.textSub,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingBottom: 5,
  },

  /* New question form */
  newForm: {
    backgroundColor: C.surface, borderRadius: 14,
    borderLeftWidth: 4, borderLeftColor: C.primary,
    borderWidth: 1, borderColor: C.borderFocus,
    padding: 16, marginBottom: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  newFormTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },

  /* Collapsed card */
  collapsed: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  collapsedIdx:  { fontSize: 11, fontWeight: '700', color: C.textDim, minWidth: 22 },
  collapsedContent: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 4 },
  collapsedTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.surfaceHigh, borderRadius: 5,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  collapsedTypeText: { fontSize: 10, color: C.textSub },
  collapsedDel:  { padding: 4 },

  /* Active card */
  activeCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderLeftWidth: 4, borderLeftColor: C.primary,
    borderWidth: 1, borderColor: C.borderFocus,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 5,
    overflow: 'hidden',
  },
  dragHandle: {
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.surfaceHigh,
  },
  activeBody: { padding: 16 },

  /* Section label */
  sLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.7,
    textTransform: 'uppercase', color: C.textSub, marginBottom: 6,
  },
  subLabel: { fontSize: 11, color: C.textSub, marginBottom: 4 },

  /* Content input */
  contentInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    padding: 10, color: C.text, fontSize: 14,
    minHeight: 70, textAlignVertical: 'top', backgroundColor: '#fff',
  },
  contentInputErr: { borderColor: C.error },

  /* Type button */
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    padding: 10, backgroundColor: '#fff',
  },
  typeBtnText: { fontSize: 13, color: C.text },

  /* Sheet / Modal */
  sheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: '72%', paddingBottom: 30,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 15, fontWeight: '700', color: C.text,
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sheetItemActive:    { backgroundColor: C.primaryDim },
  sheetItemText:      { fontSize: 14, color: C.text },
  sheetItemTextActive:{ color: C.primary, fontWeight: '600' },

  /* Toggle */
  toggleRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel:  { fontSize: 12, fontWeight: '600', color: C.textSub },
  toggleTrack:  {
    width: 44, height: 24, borderRadius: 999,
    backgroundColor: C.border, justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleTrackOn:  { backgroundColor: C.primary },
  toggleThumb:  {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  /* Option builder */
  optHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  optColHead:   { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: C.textDim },
  optRow:       { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  optLabelInput:{
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 7,
    paddingVertical: 6, paddingHorizontal: 10,
    fontSize: 13, color: C.text, backgroundColor: '#fff',
  },
  optValueInput:{
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 7,
    paddingVertical: 6, paddingHorizontal: 10,
    fontSize: 12, color: C.textSub, backgroundColor: C.surfaceHigh,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  optRemove:    { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  addOptBtn:    { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 },
  addOptText:   { fontSize: 13, fontWeight: '600', color: C.primary },
  chipWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip:         {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20,
    backgroundColor: C.primaryDim, borderWidth: 1, borderColor: C.primaryBorder,
  },
  chipDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary },
  chipLabel: { fontSize: 12, color: C.primary, fontWeight: '500' },
  chipValue: { fontSize: 10, color: C.textSub },

  /* Markers */
  radioMarker:  { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: C.border },
  checkMarker:  { width: 15, height: 15, borderRadius: 3, borderWidth: 1.5, borderColor: C.border },
  numMarker:    { fontSize: 12, color: C.textSub, minWidth: 18, textAlign: 'right' },

  /* Settings */
  settingsInput:{
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 10,
    fontSize: 13, color: C.text, backgroundColor: '#fff',
  },

  /* Preview */
  previewLine:  { borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 8, marginTop: 6 },
  previewRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginTop: 6 },
  previewPH:    { fontSize: 13, color: C.textDim },
  optPreviewRow:{
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  optPreviewLabel: { flex: 1, fontSize: 13, color: C.text },
  optPreviewBadge: {
    backgroundColor: C.surfaceHigh, borderRadius: 4,
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 2, paddingHorizontal: 7,
  },
  optPreviewVal: { fontSize: 11, color: C.textDim },
  filePreview:{
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 8,
  },

  /* Error */
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder,
    borderRadius: 8, padding: 10, marginTop: 10,
  },
  errorText: { fontSize: 13, color: C.error },

  /* Action bar */
  actionBar:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.border,
    flexWrap: 'wrap',
  },
  actionDivider: { width: 1, height: 22, backgroundColor: C.border },
  iconBtn:    {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDanger: { backgroundColor: C.errorBg, borderColor: C.errorBorder },

  /* Form actions */
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },

  /* Buttons */
  cancelBtn:    {
    paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
    backgroundColor: 'transparent',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: C.textSub },
  saveBtn:      {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 18,
    borderRadius: 10, backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  saveBtnOff:   {
    backgroundColor: C.surfaceHigh, shadowOpacity: 0, elevation: 0,
    borderWidth: 1, borderColor: C.border,
  },
  saveBtnText:  { fontSize: 13, fontWeight: '700', color: '#fff' },

  /* Center / Empty */
  center:     { paddingVertical: 60, alignItems: 'center' },
  emptyState: {
    alignItems: 'center', paddingVertical: 60,
    backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, gap: 10, marginTop: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 13, color: C.textSub, marginBottom: 6 },
});
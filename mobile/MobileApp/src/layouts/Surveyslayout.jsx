// ─── SurveysLayout.native.jsx ────────────────────────────────────
// React Native version of SurveysLayout.jsx
// Dependencies: @react-navigation/native

import React, {
  useEffect, useState, useRef, useMemo, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Modal, ActivityIndicator, FlatList,
  StatusBar, Platform, Dimensions,
  KeyboardAvoidingView, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurvey }   from '../providers/Surveyprovider';
import { useResponse } from '../providers/Responseprovider';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  bg:            '#f7f8fc',
  surface:       '#ffffff',
  surfaceHigh:   '#f4f5f9',
  border:        'rgba(0,0,0,0.07)',
  borderMed:     'rgba(0,0,0,0.12)',
  primary:       '#4361ee',
  primaryLight:  '#eef0fd',
  primaryBorder: '#c5cdfb',
  text:          '#0f1117',
  textSub:       '#6b7280',
  textDim:       '#9ca3af',
  error:         '#ef4444',
  errorBg:       '#fef2f2',
  errorBorder:   '#fecaca',
  success:       '#10b981',
  successBg:     '#ecfdf5',
  successBorder: '#a7f3d0',
  warning:       '#f59e0b',
  warningBg:     '#fffbeb',
  warningBorder: '#fde68a',
};

const THUMB_COLORS = [
  ['#e0e7ff', '#c7d2fe'],
  ['#d1fae5', '#a7f3d0'],
  ['#fce7f3', '#fbcfe8'],
  ['#e0f2fe', '#bae6fd'],
  ['#fef3c7', '#fde68a'],
  ['#f3e8ff', '#e9d5ff'],
];

const STATUS_MAP = {
  ACTIVE:    { label: 'Đang mở',  color: '#059669', bg: '#d1fae5' },
  DRAFT:     { label: 'Nháp',     color: C.textSub, bg: '#f3f4f6' },
  EXPIRED:   { label: 'Hết hạn',  color: '#dc2626', bg: '#fee2e2' },
  SCHEDULED: { label: 'Lên lịch', color: '#d97706', bg: '#fef3c7' },
  CLOSED:    { label: 'Đã đóng',  color: '#6b7280', bg: '#f3f4f6' },
};

const TYPE_META = {
  SINGLE_CHOICE:   { label: 'Một lựa chọn',   color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb' },
  MULTIPLE_CHOICE: { label: 'Nhiều lựa chọn', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', accent: '#7c3aed' },
  TEXT:            { label: 'Văn bản',         color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2' },
};
function typeMeta(type) {
  return TYPE_META[type] ?? { label: type, color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', accent: '#9ca3af' };
}

const MY_SURVEYS_PREVIEW = 4;

// ─────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <View style={[sb.badge, { backgroundColor: s.bg }]}>
      <Text style={[sb.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  text:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});

// ─────────────────────────────────────────────────────────────
// BottomSheetModal
// ─────────────────────────────────────────────────────────────
function BottomSheet({ visible, onClose, title, children, tall = false }) {
  if (!visible) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={bss.backdrop} onPress={onClose}>
        <Pressable style={[bss.sheet, tall && bss.sheetTall]} onPress={() => {}}>
          <View style={bss.handle} />
          <View style={bss.header}>
            <Text style={bss.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={bss.closeBtn}>
              <Text style={bss.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={bss.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const bss = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(15,17,23,0.5)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', paddingBottom: 32 },
  sheetTall: { maxHeight: '90%' },
  handle:    { width: 36, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)' },
  title:     { fontSize: 15, fontWeight: '700', color: C.text },
  closeBtn:  { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 12, color: C.textSub },
  body:      { padding: 16 },
});

// ─────────────────────────────────────────────────────────────
// ShareLinkModal
// ─────────────────────────────────────────────────────────────
function ShareLinkModal({ visible, onClose, survey, onShare }) {
  const [shareUrl,   setShareUrl]   = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!visible || !survey) return;
    let cancelled = false;
    const generate = async () => {
      setGenerating(true); setShareUrl(null); setError(''); setCopied(false);
      try {
        const result = await onShare(survey.id);
        if (cancelled) return;
        const url = typeof result === 'string' ? result : result?.url || result?.data?.url || null;
        if (url) setShareUrl(url);
        else setError('Không lấy được link.');
      } catch {
        if (!cancelled) setError('Tạo link thất bại.');
      } finally {
        if (!cancelled) setGenerating(false);
      }
    };
    generate();
    return () => { cancelled = true; };
  }, [visible, survey?.id]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    // Clipboard.setString(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Chia sẻ khảo sát">
      {generating && (
        <View style={ss.centered}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={ss.loadingText}>Đang tạo link...</Text>
        </View>
      )}
      {!generating && error ? (
        <View style={ss.errorBox}>
          <Text style={ss.errorBoxText}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(''); setGenerating(true); }}>
            <Text style={ss.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {!generating && shareUrl && !error && (
        <View style={ss.linkContainer}>
          <View style={ss.linkBox}>
            <Text style={ss.linkText} numberOfLines={1}>{shareUrl}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCopy}
            style={[ss.copyBtn, copied && ss.copyBtnSuccess]}
          >
            <Text style={[ss.copyBtnText, copied && ss.copyBtnTextSuccess]}>
              {copied ? '✓ Đã sao chép!' : '⎘ Sao chép link'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────
// InviteModal
// ─────────────────────────────────────────────────────────────
function InviteModal({ visible, onClose, survey, onInvite }) {
  const [emails,    setEmails]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error,     setError]     = useState('');

  const handleSubmit = async () => {
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (list.length === 0) { setError('Vui lòng nhập ít nhất 1 email.'); return; }
    setLoading(true); setError(''); setSuccess(false);
    try {
      await Promise.all(list.map(email => onInvite(survey.id, { email, role: 'viewer' })));
      setSentCount(list.length); setSuccess(true); setEmails('');
    } catch { setError('Mời không thành công.'); }
    finally { setLoading(false); }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Mời người tham gia">
      {success && (
        <View style={[ss.successBox, { marginBottom: 12 }]}>
          <Text style={ss.successText}>✓ Đã gửi lời mời đến {sentCount} địa chỉ email.</Text>
        </View>
      )}
      <Text style={ss.fieldLabel}>Địa chỉ email</Text>
      <TextInput
        value={emails}
        onChangeText={t => { setEmails(t); setError(''); }}
        placeholder={"example@email.com\nuser2@email.com"}
        placeholderTextColor={C.textDim}
        multiline
        numberOfLines={4}
        style={ss.textarea}
      />
      {error ? <Text style={ss.errorText}>{error}</Text> : null}
      <View style={ss.actionRow}>
        <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
          <Text style={ss.cancelBtnText}>Đóng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[ss.primaryBtn, loading && ss.primaryBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={ss.primaryBtnText}>✈ Gửi lời mời</Text>
          }
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────
// BulkInviteModal
// ─────────────────────────────────────────────────────────────
function BulkInviteModal({ visible, onClose, survey, onBulkInvite }) {
  const [emails,  setEmails]  = useState('');
  const [role,    setRole]    = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState('');

  const parseEmails = () => emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
  const emailCount  = parseEmails().length;

  const handleSubmit = async () => {
    const list = parseEmails();
    if (list.length === 0) { setError('Vui lòng nhập ít nhất 1 email.'); return; }
    setLoading(true); setError('');
    try {
      const res = await onBulkInvite(survey.id, { emails: list, role });
      setSuccess({ sent: res?.sent ?? list.length, failed: res?.failed ?? 0 });
      setEmails('');
    } catch { setError('Bulk invite thất bại, vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  const ROLES = [
    { value: 'viewer',     label: '👁 Viewer',    desc: 'Chỉ xem' },
    { value: 'respondent', label: '✏ Respondent', desc: 'Trả lời' },
    { value: 'editor',     label: '🛠 Editor',     desc: 'Chỉnh sửa' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Mời hàng loạt" tall>
      {success && (
        <View style={[ss.successBox, { marginBottom: 12 }]}>
          <Text style={ss.successText}>✓ Đã gửi hàng loạt! Thành công: {success.sent}{success.failed > 0 ? ` · Thất bại: ${success.failed}` : ''}</Text>
        </View>
      )}
      <Text style={ss.fieldLabel}>Vai trò</Text>
      <View style={ss.roleRow}>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r.value}
            onPress={() => setRole(r.value)}
            style={[ss.roleBtn, role === r.value && ss.roleBtnActive]}
          >
            <Text style={[ss.roleBtnLabel, role === r.value && ss.roleBtnLabelActive]}>{r.label}</Text>
            <Text style={ss.roleBtnDesc}>{r.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={ss.fieldLabel}>Danh sách email</Text>
      <TextInput
        value={emails}
        onChangeText={t => { setEmails(t); setError(''); }}
        placeholder={"user1@email.com\nuser2@email.com, user3@email.com"}
        placeholderTextColor={C.textDim}
        multiline
        numberOfLines={6}
        style={[ss.textarea, { height: 120 }]}
      />
      {emailCount > 0 && (
        <Text style={ss.emailCountText}>{emailCount} email</Text>
      )}
      {error ? <Text style={ss.errorText}>{error}</Text> : null}
      <View style={ss.actionRow}>
        <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
          <Text style={ss.cancelBtnText}>Đóng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || emailCount === 0}
          style={[ss.primaryBtn, (loading || emailCount === 0) && ss.primaryBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={ss.primaryBtnText}>+ Mời {emailCount > 0 ? `${emailCount} người` : 'hàng loạt'}</Text>
          }
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────
// ParticipantsModal
// FIX: Chỉ có 1 useEffect duy nhất, không duplicate
// ─────────────────────────────────────────────────────────────
function ParticipantsModal({ visible, open, onClose, survey, onGetParticipants, onDeleteParticipant }) {
  const isVisible = visible ?? open ?? false;

  const [participants, setParticipants] = useState([]);
  const [count,        setCount]        = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [deleting,     setDeleting]     = useState(null);
  const [confirmId,    setConfirmId]    = useState(null);
  const [search,       setSearch]       = useState('');
  const [error,        setError]        = useState('');

  const cancelRef = useRef(false);

const load = useCallback(async () => {
  cancelRef.current = false;
  setLoading(true);
  setError('');
  
  try {
    const res = await onGetParticipants(survey.id);
    if (cancelRef.current) return;
    
    const list = Array.isArray(res?.participants) ? res.participants : [];
    setParticipants(list);
    setCount(res?.count || 0);
  } catch(e) {
    if (!cancelRef.current) setError('Lỗi tải dữ liệu');
  } finally {
    if (!cancelRef.current) setLoading(false);
  }
}, [survey?.id, onGetParticipants]);

useEffect(() => {
  if (!isVisible) {
    cancelRef.current = true;  // cancel bất kỳ load đang chạy
    return;
  }
  setSearch('');
  setConfirmId(null);
  load();
}, [isVisible, survey?.id]);

  const handleDelete = useCallback(async (participantId) => {
    setDeleting(participantId);
    try {
      await onDeleteParticipant(survey.id, participantId);
      setParticipants(prev => prev.filter(p => p.participant_id !== participantId));
      setCount(prev => Math.max(0, prev - 1));
      setConfirmId(null);
    } catch {
      Alert.alert('Lỗi', 'Không thể xoá người tham gia, vui lòng thử lại.');
    } finally {
      setDeleting(null);
    }
  }, [survey?.id, onDeleteParticipant]);

  const filtered = useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase();
    return participants.filter(p =>
      p.email?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q)
    );
  }, [participants, search]);

  const AVATAR_PALETTE = [
    { bg: '#E6F1FB', color: '#185FA5' },
    { bg: '#EAF3DE', color: '#3B6D11' },
    { bg: '#FBEAF0', color: '#993556' },
    { bg: '#FAEEDA', color: '#854F0B' },
    { bg: '#EEEDFE', color: '#534AB7' },
    { bg: '#E1F5EE', color: '#0F6E56' },
  ];

  const ROLE_COLORS = {
    editor:     { bg: '#E6F1FB', color: '#185FA5' },
    respondent: { bg: '#EAF3DE', color: '#3B6D11' },
    viewer:     { bg: '#F1EFE8', color: '#5F5E5A' },
  };

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (email || '?')[0].toUpperCase();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={pm.backdrop} onPress={onClose}>
        <Pressable style={pm.sheet} onPress={() => {}}>
          <View style={pm.handle} />

          {/* Header */}
          <View style={pm.header}>
            <View style={pm.headerLeft}>
              <Text style={pm.headerTitle}>Người tham gia</Text>
              {!loading && (
                <View style={pm.countBadge}>
                  <Text style={pm.countBadgeText}>{count}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={pm.closeBtn}>
              <Text style={pm.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stat + Reload */}
          <View style={pm.statRow}>
            <View style={pm.statCard}>
              <View style={pm.statIcon}>
                <Text style={{ fontSize: 18 }}>👥</Text>
              </View>
              <View>
                <Text style={pm.statNum}>{loading ? '—' : count}</Text>
                <Text style={pm.statLabel}>Tổng participants</Text>
              </View>
            </View>
            <TouchableOpacity onPress={load} disabled={loading} style={pm.reloadBtn}>
              <Text style={pm.reloadBtnText}>⟳ Tải lại</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={pm.searchRow}>
            <Text style={pm.searchIcon}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm theo tên hoặc email..."
              placeholderTextColor="#9ca3af"
              style={pm.searchInput}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* List body */}
          <ScrollView
            style={pm.listScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!!error && (
              <View style={pm.errorBox}>
                <Text style={pm.errorText}>{error}</Text>
                <TouchableOpacity onPress={load}>
                  <Text style={pm.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}

            {loading && (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#4361ee" size="large" />
                <Text style={{ fontSize: 13, color: '#6b7280' }}>Đang tải...</Text>
              </View>
            )}

            {!loading && !error && filtered.length === 0 && (
              <View style={{ paddingVertical: 48, alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 36 }}>👤</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {search ? `Không tìm thấy "${search}"` : 'Chưa có người tham gia'}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  {search ? 'Thử tìm với từ khoá khác' : 'Mời người dùng để họ xuất hiện ở đây'}
                </Text>
              </View>
            )}

            {!loading && !error && filtered.map((p, i) => {
              const av        = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
              const roleMeta  = ROLE_COLORS[p.role] || ROLE_COLORS.viewer;
              const initials  = getInitials(p.name, p.email);
              const pid       = p.participant_id ?? p.id;
              const isConfirm = confirmId === pid;
              const isDel     = deleting  === pid;

              return (
                <View
                  key={pid ?? i}
                  style={[
                    pm.row,
                    i < filtered.length - 1 && pm.rowBorder,
                    isConfirm && pm.rowDanger,
                  ]}
                >
                  <View style={[pm.avatar, { backgroundColor: av.bg }]}>
                    <Text style={[pm.avatarText, { color: av.color }]}>{initials}</Text>
                  </View>

                  <View style={pm.info}>
                    <Text style={pm.name} numberOfLines={1}>
  {p.name || p.email || 'Unknown'}
</Text>
{p.name && p.email ? (  // chỉ hiện email riêng nếu đã có name hiển thị
  <Text style={pm.emailText}>{p.email}</Text>
) : null}
                  </View>

                  {p.role ? (
                    <View style={[pm.rolePill, { backgroundColor: roleMeta.bg }]}>
                      <Text style={[pm.rolePillText, { color: roleMeta.color }]}>{p.role}</Text>
                    </View>
                  ) : null}

                  {isConfirm ? (
                    <View style={pm.confirmBtns}>
                      <TouchableOpacity onPress={() => setConfirmId(null)} style={pm.cancelSmallBtn}>
                        <Text style={pm.cancelSmallText}>Huỷ</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(pid)}
                        disabled={isDel}
                        style={pm.deleteSmallBtn}
                      >
                        {isDel
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={pm.deleteSmallText}>🗑 Xoá</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setConfirmId(pid)} style={pm.delIconBtn}>
                      <Text style={{ fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {!loading && filtered.length > 0 && search.trim() && (
              <Text style={pm.hint}>Hiển thị {filtered.length} / {participants.length} người</Text>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={pm.footer}>
            <TouchableOpacity onPress={onClose} style={pm.closeFooterBtn}>
              <Text style={pm.closeFooterText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pm = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(15,17,23,0.55)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '90%', paddingBottom: 0 },
  handle:         { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)' },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:    { fontSize: 16, fontWeight: '700', color: '#111827' },
  countBadge:     { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999, backgroundColor: '#eef0fd', borderWidth: 1, borderColor: '#c5cdfb' },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#4361ee' },
  closeBtn:       { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:   { fontSize: 12, color: '#6b7280' },
  statRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 0 },
  statCard:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', padding: 12 },
  statIcon:       { width: 36, height: 36, borderRadius: 9, backgroundColor: '#eef0fd', alignItems: 'center', justifyContent: 'center' },
  statNum:        { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel:      { fontSize: 11, color: '#6b7280' },
  reloadBtn:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#fff' },
  reloadBtnText:  { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  searchRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 14, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  searchIcon:     { fontSize: 14 },
  searchInput:    { flex: 1, fontSize: 13, color: '#111827', paddingVertical: 0 },
  listScroll:     { flex: 1, paddingHorizontal: 14 },
  row:            { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  rowBorder:      { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  rowDanger:      { backgroundColor: '#fef2f2', borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8 },
  avatar:         { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:     { fontSize: 13, fontWeight: '700' },
  info:           { flex: 1, minWidth: 0 },
  name:           { fontSize: 13, fontWeight: '600', color: '#111827' },
  emailText:      { fontSize: 11, color: '#6b7280', marginTop: 1 },
  rolePill:       { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, flexShrink: 0 },
  rolePillText:   { fontSize: 10, fontWeight: '700' },
  confirmBtns:    { flexDirection: 'row', gap: 6 },
  cancelSmallBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  cancelSmallText:{ fontSize: 11, fontWeight: '600', color: '#6b7280' },
  deleteSmallBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, backgroundColor: '#ef4444', minWidth: 60, alignItems: 'center' },
  deleteSmallText:{ fontSize: 11, fontWeight: '700', color: '#fff' },
  delIconBtn:     { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  errorBox:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginVertical: 8 },
  errorText:      { fontSize: 12, color: '#ef4444', flex: 1 },
  retryText:      { fontSize: 12, fontWeight: '700', color: '#ef4444', marginLeft: 8 },
  hint:           { fontSize: 11, color: '#9ca3af', textAlign: 'center', paddingVertical: 10 },
  footer:         { padding: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)' },
  closeFooterBtn: { width: '100%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' },
  closeFooterText:{ fontSize: 14, fontWeight: '600', color: '#6b7280' },
});

// ─────────────────────────────────────────────────────────────
// PublishModal
// ─────────────────────────────────────────────────────────────
function PublishModal({ visible, onClose, survey, onPublish }) {
  const [loading, setLoading] = useState(false);
  const isPublished = survey?.is_published;
  const handleConfirm = async () => {
    setLoading(true);
    try { await onPublish(survey.id, { is_published: !isPublished }); onClose(); }
    finally { setLoading(false); }
  };
  return (
    <BottomSheet visible={visible} onClose={onClose} title={isPublished ? 'Ẩn khảo sát' : 'Publish khảo sát'}>
      <View style={ss.confirmBox}>
        <Text style={ss.confirmEmoji}>{isPublished ? '🔒' : '🌐'}</Text>
        <Text style={ss.confirmText}>
          {isPublished
            ? 'Khảo sát sẽ bị ẩn và không còn nhận câu trả lời mới.'
            : 'Khảo sát sẽ được công khai và có thể nhận câu trả lời.'}
        </Text>
      </View>
      <View style={ss.actionRow}>
        <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
          <Text style={ss.cancelBtnText}>Huỷ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={loading}
          style={[ss.primaryBtn, loading && ss.primaryBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={ss.primaryBtnText}>{isPublished ? '🔒 Ẩn survey' : '🌐 Publish'}</Text>
          }
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────
// CloseModal
// ─────────────────────────────────────────────────────────────
function CloseModal({ visible, onClose, survey, onCloseSurvey }) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try { await onCloseSurvey(survey.id); onClose(); }
    finally { setLoading(false); }
  };
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Đóng khảo sát">
      <View style={[ss.confirmBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
        <Text style={ss.confirmEmoji}>⛔</Text>
        <Text style={ss.confirmText}>Sau khi đóng, survey sẽ không nhận thêm câu trả lời.</Text>
        <Text style={[ss.confirmText, { color: C.textSub, fontSize: 12, marginTop: 4 }]}>Hành động này không thể hoàn tác.</Text>
      </View>
      <View style={ss.actionRow}>
        <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
          <Text style={ss.cancelBtnText}>Huỷ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={loading}
          style={[ss.primaryBtn, { backgroundColor: C.error }, loading && ss.primaryBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={ss.primaryBtnText}>⏼ Đóng survey</Text>
          }
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────
// ContextMenuSheet
// ─────────────────────────────────────────────────────────────
function ContextMenuSheet({ visible, onClose, items }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Tùy chọn">
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => { 
            onClose(); 
            setTimeout(() => item.action(), 150); // ← thêm dòng này
          }}
          style={[cms.item, i < items.length - 1 && cms.itemBorder]}
        >
          <Text style={cms.itemIcon}>{item.emoji}</Text>
          <Text style={[cms.itemLabel, item.danger && { color: C.error }]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </BottomSheet>
  );
}
const cms = StyleSheet.create({
  item:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  itemIcon:   { fontSize: 16, width: 24, textAlign: 'center' },
  itemLabel:  { fontSize: 14, fontWeight: '500', color: C.text },
});

// ─────────────────────────────────────────────────────────────
// MySurveyCard
// ─────────────────────────────────────────────────────────────
function MySurveyCard({
  survey, index, navigation,
  onDelete, onUpdate, onShare, onInvite, onPublish, onCloseSurvey,
  onBulkInvite, onGetParticipants, onDeleteParticipant,
}) {
  const thumb = THUMB_COLORS[index % THUMB_COLORS.length];
  const isClosed    = survey.status === 'CLOSED';
  const isPublished = survey.is_published;

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [title,        setTitle]        = useState(survey.title);
  const [description,  setDescription]  = useState(survey.description || '');
  const [saving,       setSaving]       = useState(false);

  const [shareOpen,        setShareOpen]        = useState(false);
  const [inviteOpen,       setInviteOpen]        = useState(false);
  const [publishOpen,      setPublishOpen]       = useState(false);
  const [closeOpen,        setCloseOpen]         = useState(false);
  const [bulkInviteOpen,   setBulkInviteOpen]    = useState(false);
  const [participantsOpen, setParticipantsOpen]  = useState(false);

  const handleSave = async () => {
    try { setSaving(true); await onUpdate(survey.id, { title, description }); setEditing(false); }
    catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const menuItems = [
    { emoji: '✏️', label: 'Chỉnh sửa',       action: () => setEditing(true) },
    { emoji: '🔗', label: 'Tạo link chia sẻ', action: () => setShareOpen(true) },
    { emoji: '✉️', label: 'Mời người dùng',   action: () => setInviteOpen(true) },
    { emoji: '👥', label: 'Mời hàng loạt',    action: () => setBulkInviteOpen(true) },
    { emoji: '👤', label: 'Xem participants',  action: () => setParticipantsOpen(true) },
    { emoji: isPublished ? '🔒' : '🌐', label: isPublished ? 'Ẩn survey' : 'Publish', action: () => setPublishOpen(true) },
    !isClosed && { emoji: '⏼', label: 'Đóng survey', action: () => setCloseOpen(true) },
    { emoji: '🗑️', label: 'Xóa', action: () => {
      Alert.alert('Xoá survey', 'Bạn có chắc muốn xoá survey này?', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: () => onDelete(survey.id) },
      ]);
    }, danger: true },
  ].filter(Boolean);

  return (
    <View>
      <TouchableOpacity
        onPress={() => !editing && navigation?.navigate('QuestionScreen', { surveyId: survey.id })}
        activeOpacity={0.85}
        style={[msc.card, isClosed && { opacity: 0.75 }]}
      >
        {/* Thumbnail */}
        <View style={[msc.thumb, { backgroundColor: isClosed ? '#e2e8f0' : thumb[0] }]}>
          <Text style={msc.thumbIcon}>📄</Text>
          <View style={msc.thumbBadges}>
            <StatusBadge status={survey.status} />
            {isPublished && (
              <View style={msc.liveBadge}>
                <Text style={msc.liveBadgeText}>🌐 Live</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={msc.menuBtn}>
            <Text style={msc.menuBtnText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={msc.body}>
          {editing ? (
            <View style={msc.editForm}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Tiêu đề survey"
                placeholderTextColor={C.textDim}
                style={msc.editInput}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả"
                placeholderTextColor={C.textDim}
                multiline
                numberOfLines={2}
                style={[msc.editInput, { height: 60 }]}
              />
              <View style={msc.editActions}>
                <TouchableOpacity onPress={() => setEditing(false)} style={ss.cancelBtn}>
                  <Text style={ss.cancelBtnText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={[ss.primaryBtn, saving && ss.primaryBtnDisabled, { paddingVertical: 7, paddingHorizontal: 14 }]}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={ss.primaryBtnText}>✓ Lưu</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={msc.cardTitle} numberOfLines={1}>{survey.title}</Text>
              <Text style={msc.cardDesc} numberOfLines={2}>{survey.description || 'Không có mô tả'}</Text>
              <Text style={msc.cardDate}>
                📅 {survey.created_at ? new Date(survey.created_at).toLocaleDateString('vi-VN') : ''}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Context Menu */}
      <ContextMenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} />

      {/* Modals */}
      <ShareLinkModal    visible={shareOpen}        onClose={() => setShareOpen(false)}        survey={survey} onShare={onShare} />
      <InviteModal       visible={inviteOpen}        onClose={() => setInviteOpen(false)}       survey={survey} onInvite={onInvite} />
      <PublishModal      visible={publishOpen}       onClose={() => setPublishOpen(false)}      survey={survey} onPublish={onPublish} />
      <CloseModal        visible={closeOpen}         onClose={() => setCloseOpen(false)}        survey={survey} onCloseSurvey={onCloseSurvey} />
      <BulkInviteModal   visible={bulkInviteOpen}    onClose={() => setBulkInviteOpen(false)}   survey={survey} onBulkInvite={onBulkInvite} />
      <ParticipantsModal visible={participantsOpen}  onClose={() => setParticipantsOpen(false)} survey={survey} onGetParticipants={onGetParticipants} onDeleteParticipant={onDeleteParticipant} />
    </View>
  );
}

const msc = StyleSheet.create({
  card:      { backgroundColor: C.surface, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  thumb:     { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  thumbIcon: { fontSize: 36, opacity: 0.2 },
  thumbBadges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 },
  liveBadge:   { backgroundColor: 'rgba(67,97,238,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  liveBadgeText: { fontSize: 10, fontWeight: '700', color: C.primary },
  menuBtn:   { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  menuBtnText: { fontSize: 16, color: C.textSub },
  body:      { padding: 14 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 4 },
  cardDesc:  { fontSize: 12, color: C.textSub, lineHeight: 18, marginBottom: 10 },
  cardDate:  { fontSize: 11, color: C.textDim },
  editForm:  { gap: 8 },
  editInput: { borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 9, fontSize: 12, color: C.text, backgroundColor: '#fff' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 7, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────
// SubmissionModal
// ─────────────────────────────────────────────────────────────
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await getMySubmission(surveyId);
        if (cancelled) return;
        setAnswers((res?.data ?? res ?? []).flatMap(r => r.answers ?? []));
      } catch {
        if (!cancelled) setError('Không thể tải câu trả lời.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch_();
    return () => { cancelled = true; };
  }, [surveyId]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f8fc' }}>
        <View style={smm.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={smm.closeText}>← Đóng</Text>
          </TouchableOpacity>
          <Text style={smm.brand}>InsightFlow</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={smm.badgeRow}>
          <View style={smm.badge}>
            <Text style={smm.badgeText}>✓ Đã hoàn thành</Text>
          </View>
        </View>
        <Text style={smm.title}>{surveyTitle}</Text>
        {!loading && <Text style={smm.subtitle}>{answers.length} câu trả lời</Text>}

        {loading && (
          <View style={ss.centered}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={ss.loadingText}>Đang tải...</Text>
          </View>
        )}
        {!loading && error && (
          <View style={ss.centered}>
            <Text style={ss.emptyText}>{error}</Text>
          </View>
        )}
        {!loading && !error && answers.length === 0 && (
          <View style={ss.centered}>
            <Text style={ss.emptyText}>Không có câu trả lời.</Text>
          </View>
        )}
        {!loading && !error && answers.length > 0 && (
          <FlatList
            data={answers}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item, index }) => {
              const meta = typeMeta(item.type);
              const isText     = item.type === 'TEXT';
              const isMultiple = item.type === 'MULTIPLE_CHOICE';
              const selectedSet = isMultiple
                ? new Set(Array.isArray(item.answer) ? item.answer : String(item.answer ?? '').split(',').map(s => s.trim()))
                : new Set([String(item.answer ?? '')]);
              return (
                <View style={[smm.answerCard, { borderTopColor: meta.accent }]}>
                  <View style={smm.answerCardHeader}>
                    <Text style={smm.questionText}>{index + 1}. {item.question}</Text>
                    <View style={[smm.typeBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                      <Text style={[smm.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>
                  {isText ? (
                    <View style={smm.textBox}>
                      <Text style={smm.textBoxContent}>{item.answer || 'Không có dữ liệu'}</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 6 }}>
                      {(item.options ?? []).map((opt, oi) => {
                        const label = opt?.label ?? opt?.value ?? opt?.content ?? '';
                        const isSel = selectedSet.has(label) || selectedSet.has(String(opt.id));
                        return (
                          <View key={oi} style={[smm.optRow, isSel && smm.optRowSel]}>
                            <View style={[isMultiple ? smm.checkbox : smm.radio, isSel && (isMultiple ? smm.checkboxSel : smm.radioSel)]}>
                              {isSel && <Text style={smm.checkmark}>{isMultiple ? '✓' : ''}</Text>}
                              {isSel && !isMultiple && <View style={smm.radioDot} />}
                            </View>
                            <Text style={[smm.optLabel, isSel && smm.optLabelSel]}>{label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const smm = StyleSheet.create({
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)' },
  closeText:       { fontSize: 14, fontWeight: '600', color: C.textSub },
  brand:           { fontSize: 13, fontWeight: '700', color: C.textSub },
  badgeRow:        { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  badge:           { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  badgeText:       { fontSize: 11, fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.5 },
  title:           { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center', paddingHorizontal: 20, marginBottom: 4 },
  subtitle:        { fontSize: 13, color: C.textSub, textAlign: 'center', marginBottom: 12 },
  answerCard:      { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', borderTopWidth: 3, marginBottom: 12, padding: 14 },
  answerCardHeader:{ marginBottom: 10 },
  questionText:    { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8, lineHeight: 20 },
  typeBadge:       { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  typeBadgeText:   { fontSize: 10, fontWeight: '700' },
  textBox:         { padding: 12, backgroundColor: '#f8faff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  textBoxContent:  { fontSize: 13, color: '#374151', lineHeight: 20 },
  optRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 9, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fafafa', marginBottom: 4 },
  optRowSel:       { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  checkbox:        { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSel:     { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  radio:           { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioSel:        { borderColor: '#2563eb' },
  radioDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb' },
  checkmark:       { fontSize: 10, color: '#fff', fontWeight: '700' },
  optLabel:        { fontSize: 12, color: '#6b7280', flex: 1 },
  optLabelSel:     { fontWeight: '600', color: '#1e40af' },
});

// ─────────────────────────────────────────────────────────────
// PublicSurveyCard
// ─────────────────────────────────────────────────────────────
function PublicSurveyCard({ survey, done, onStart, onViewSubmission }) {
  const createdDate = survey?.created_at ? new Date(survey.created_at).toLocaleDateString('vi-VN') : '';
  return (
    <TouchableOpacity
      onPress={() => done && onViewSubmission(survey.id, survey.title)}
      activeOpacity={done ? 0.7 : 1}
      style={[psc.card, done && psc.cardDone]}
    >
      {done && <View style={psc.topLine} />}
      <View style={psc.topRow}>
        <View style={[psc.icon, done ? psc.iconDone : psc.iconPending]}>
          <Text style={{ fontSize: 18 }}>{done ? '✓' : '📄'}</Text>
        </View>
        <View style={[psc.badge, done ? psc.badgeDone : psc.badgePending]}>
          <Text style={[psc.badgeText, done ? psc.badgeTextDone : psc.badgeTextPending]}>
            {done ? 'Đã hoàn thành' : 'Survey'}
          </Text>
        </View>
      </View>
      <Text style={psc.title} numberOfLines={2}>{survey.title}</Text>
      <Text style={psc.desc} numberOfLines={2}>{survey.description}</Text>
      <View style={psc.footer}>
        <Text style={psc.date}>🕐 {createdDate}</Text>
        {done
          ? <View style={psc.viewBtn}><Text style={psc.viewBtnText}>Xem kết quả →</Text></View>
          : <TouchableOpacity style={psc.startBtn} onPress={() => onStart(survey.id)}>
              <Text style={psc.startBtnText}>Bắt đầu →</Text>
            </TouchableOpacity>
        }
      </View>
    </TouchableOpacity>
  );
}

const psc = StyleSheet.create({
  card:          { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, overflow: 'hidden' },
  cardDone:      { borderColor: 'rgba(16,185,129,0.2)' },
  topLine:       { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#10b981' },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  icon:          { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  iconDone:      { backgroundColor: '#ecfdf5' },
  iconPending:   { backgroundColor: '#eef0fd' },
  badge:         { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  badgeDone:     { backgroundColor: '#dcfce7', borderColor: '#a7f3d0' },
  badgePending:  { backgroundColor: '#f4f5f9', borderColor: 'rgba(0,0,0,0.07)' },
  badgeText:     { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  badgeTextDone: { color: '#059669' },
  badgeTextPending: { color: C.textDim },
  title:         { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6, lineHeight: 20 },
  desc:          { fontSize: 12, color: C.textSub, lineHeight: 18, marginBottom: 14 },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date:          { fontSize: 11, color: C.textDim },
  viewBtn:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#a7f3d0' },
  viewBtnText:   { fontSize: 11, fontWeight: '700', color: '#059669' },
  startBtn:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: C.primary },
  startBtnText:  { fontSize: 11, fontWeight: '700', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────
// CreateSurveyForm
// ─────────────────────────────────────────────────────────────
function CreateSurveyForm({ onSubmit, onCancel, submitting }) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  return (
    <View style={csf.wrap}>
      <Text style={csf.heading}>✨ Tạo survey mới</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Tiêu đề survey *"
        placeholderTextColor={C.textDim}
        style={csf.input}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Mô tả (tuỳ chọn)"
        placeholderTextColor={C.textDim}
        multiline
        numberOfLines={2}
        style={[csf.input, { height: 60 }]}
      />
      <View style={csf.actions}>
        <TouchableOpacity onPress={onCancel} style={ss.cancelBtn}>
          <Text style={ss.cancelBtnText}>Huỷ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSubmit({ title, description })}
          disabled={submitting || !title.trim()}
          style={[ss.primaryBtn, (submitting || !title.trim()) && ss.primaryBtnDisabled]}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={ss.primaryBtnText}>+ Tạo Survey</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}
const csf = StyleSheet.create({
  wrap:    { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(67,97,238,0.3)', padding: 16, marginBottom: 14 },
  heading: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12 },
  input:   { borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 9, fontSize: 12, color: C.text, marginBottom: 8, backgroundColor: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────
// MAIN: SurveysLayout
// ─────────────────────────────────────────────────────────────
export default function SurveysLayout({ navigation }) {
  const {
    mySurveys, publicSurveys: providerPublicSurveys,
    loading: myLoading,
    createSurvey, fetchMySurveys, updateSurvey, deleteSurvey,
    closeSurvey, publishSurvey, shareLink, inviteSurvey, fetchPublicSurveys,
    bulkInviteSurvey, getParticipants, deleteParticipant,
  } = useSurvey();
  const { getAllMyResponses } = useResponse();

  const [mySearch,       setMySearch]       = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [myExpanded,     setMyExpanded]     = useState(false);

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError,   setPublicError]   = useState(null);
  const [modalSurvey,   setModalSurvey]   = useState(null);
  const [publicSearch,  setPublicSearch]  = useState('');
  const [activeTab,     setActiveTab]     = useState('all');
  const [sortBy,        setSortBy]        = useState('newest');
  const [viewMode,      setViewMode]      = useState('grid');
  const [showFilter,    setShowFilter]    = useState(false);

  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => { fetchMySurveys(1, 20); }, []);

  const fetchPublicData = useCallback(async () => {
    try {
      setPublicLoading(true); setPublicError(null);
      const [, respResult] = await Promise.allSettled([
        fetchPublicSurveys(),
        getAllMyResponses().catch(() => null),
      ]);
      const resp = respResult.status === 'fulfilled' ? respResult.value : null;
      const ids  = new Set((resp?.data ?? resp ?? []).map(r => r.survey_id ?? r.surveyId));
      setDoneSurveyIds(ids);
    } catch {
      setPublicError('Không thể tải danh sách khảo sát.');
    } finally {
      setPublicLoading(false);
    }
  }, []);

  useEffect(() => { fetchPublicData(); }, []);

  const handleGlobalSearch = (text) => {
    setGlobalSearch(text);
    setMySearch(text);
    setPublicSearch(text);
  };

  const handleSubmitCreate = async (formData) => {
    try {
      setSubmitting(true);
      await createSurvey({ title: formData.title, description: formData.description || null });
      setShowCreateForm(false);
      setMyExpanded(true);
      fetchMySurveys(1, 20);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const myFiltered    = mySurveys.filter(s => s.title?.toLowerCase().includes(mySearch.toLowerCase()));
  const publicSurveys = providerPublicSurveys;

  const displayed = useMemo(() => {
    let list = [...publicSurveys];
    if (activeTab === 'pending') list = list.filter(s => !doneSurveyIds.has(s.id));
    if (activeTab === 'done')    list = list.filter(s =>  doneSurveyIds.has(s.id));
    if (publicSearch.trim()) {
      const q = publicSearch.toLowerCase();
      list = list.filter(s => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (sortBy === 'newest') list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === 'oldest') list.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === 'name')   list.sort((a,b) => (a.title ?? '').localeCompare(b.title ?? ''));
    return list;
  }, [publicSurveys, doneSurveyIds, activeTab, publicSearch, sortBy]);

  const totalCount   = publicSurveys.length;
  const doneCount    = publicSurveys.filter(s =>  doneSurveyIds.has(s.id)).length;
  const pendingCount = publicSurveys.filter(s => !doneSurveyIds.has(s.id)).length;

  const visibleMySurveys = (myExpanded || showCreateForm) ? myFiltered : myFiltered.slice(0, MY_SURVEYS_PREVIEW);
  const hasMoreMySurveys = myFiltered.length > MY_SURVEYS_PREVIEW;

  const PUBLIC_TABS = [
    { key: 'all',     label: 'Tất cả',        count: totalCount },
    { key: 'pending', label: 'Chưa làm',      count: pendingCount },
    { key: 'done',    label: 'Đã hoàn thành', count: doneCount },
  ];

  return (
    <SafeAreaView style={ls.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* TOP BAR */}
      <View style={ls.topBar}>
        <View style={ls.topBarLeft}>
          <Text style={ls.appIcon}>📄</Text>
          <View>
            <Text style={ls.appTitle}>Surveys</Text>
            <Text style={ls.appSubtitle}>Quản lý và tham gia khảo sát</Text>
          </View>
        </View>
        <View style={ls.topBarStats}>
          <Text style={ls.statText}><Text style={ls.statNum}>{mySurveys.length}</Text> của tôi</Text>
          <Text style={ls.statDot}>·</Text>
          <Text style={ls.statText}><Text style={ls.statNum}>{totalCount}</Text> công khai</Text>
        </View>
      </View>

      {/* GLOBAL SEARCH */}
      <View style={ls.globalSearch}>
        <Text style={ls.searchIcon}>🔍</Text>
        <TextInput
          value={globalSearch}
          onChangeText={handleGlobalSearch}
          placeholder="Tìm survey..."
          placeholderTextColor={C.textDim}
          style={ls.searchInput}
        />
        {globalSearch ? (
          <TouchableOpacity onPress={() => handleGlobalSearch('')}>
            <Text style={{ color: C.textDim }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView style={ls.scroll} contentContainerStyle={ls.scrollContent} showsVerticalScrollIndicator={false}>

        {/* MY SURVEYS */}
        <View style={ls.sectionHeader}>
          <View style={ls.sectionHeaderLeft}>
            <Text style={ls.sectionTitle}>My Surveys</Text>
            <View style={ls.sectionBadge}>
              <Text style={ls.sectionBadgeText}>{myFiltered.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateForm(v => !v)}
            style={[ls.createBtn, showCreateForm && ls.createBtnActive]}
          >
            <Text style={[ls.createBtnText, showCreateForm && ls.createBtnTextActive]}>
              {showCreateForm ? '✕ Huỷ' : '+ Tạo mới'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[ls.searchMini, { marginBottom: 12 }]}>
          <TextInput
            value={mySearch}
            onChangeText={setMySearch}
            placeholder="Tìm survey của tôi..."
            placeholderTextColor={C.textDim}
            style={ls.searchMiniInput}
          />
        </View>

        {myLoading ? (
          <View style={ss.centered}>
            <ActivityIndicator color={C.primary} size="large" />
          </View>
        ) : (
          <>
            {showCreateForm && (
              <CreateSurveyForm
                onSubmit={handleSubmitCreate}
                onCancel={() => setShowCreateForm(false)}
                submitting={submitting}
              />
            )}
            {myFiltered.length === 0 ? (
              <View style={ss.centered}>
                <Text style={ss.emptyEmoji}>📭</Text>
                <Text style={ss.emptyTitle}>{mySearch ? `Không tìm thấy "${mySearch}"` : 'Chưa có survey nào'}</Text>
              </View>
            ) : (
              <>
                {visibleMySurveys.map((survey, index) => (
                  <MySurveyCard
                    key={survey.id}
                    survey={survey}
                    index={index}
                    navigation={navigation}
                    onDelete={deleteSurvey}
                    onUpdate={updateSurvey}
                    onShare={shareLink}
                    onInvite={inviteSurvey}
                    onPublish={publishSurvey}
                    onCloseSurvey={closeSurvey}
                    onBulkInvite={bulkInviteSurvey}
                    onGetParticipants={getParticipants}
                    onDeleteParticipant={deleteParticipant}
                  />
                ))}
                {hasMoreMySurveys && !showCreateForm && (
                  <TouchableOpacity
                    onPress={() => setMyExpanded(v => !v)}
                    style={ls.expandBtn}
                  >
                    <Text style={ls.expandBtnText}>
                      {myExpanded
                        ? '▲ Thu gọn'
                        : `▼ Xem thêm ${myFiltered.length - MY_SURVEYS_PREVIEW} survey`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}

        {/* Divider */}
        <View style={ls.divider}>
          <View style={ls.dividerLine} />
          <View style={ls.dividerBadge}>
            <Text style={ls.dividerText}>🌐 Khảo sát công khai</Text>
          </View>
          <View style={ls.dividerLine} />
        </View>

        {/* PUBLIC SURVEYS */}
        <View style={ls.sectionHeader}>
          <View style={ls.sectionHeaderLeft}>
            <Text style={ls.sectionTitle}>Khảo Sát</Text>
            {!publicLoading && (
              <View style={[ls.sectionBadge, { backgroundColor: '#dcfce7', borderColor: '#a7f3d0' }]}>
                <Text style={[ls.sectionBadgeText, { color: '#059669' }]}>{totalCount}</Text>
              </View>
            )}
          </View>
          <View style={ls.sectionHeaderRight}>
            <TouchableOpacity
              onPress={() => setShowFilter(v => !v)}
              style={[ls.filterBtn, showFilter && ls.filterBtnActive]}
            >
              <Text style={[ls.filterBtnText, showFilter && ls.filterBtnTextActive]}>⚙ Lọc</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchPublicData} style={ls.refreshBtn2}>
              <Text style={ls.refreshBtn2Text}>⟳</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Public tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={ls.tabsRow}>
            {PUBLIC_TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[ls.pubTab, isActive && ls.pubTabActive]}
                >
                  <Text style={[ls.pubTabText, isActive && ls.pubTabTextActive]}>{tab.label}</Text>
                  {!publicLoading && (
                    <Text style={[ls.pubTabCount, isActive && ls.pubTabCountActive]}>{tab.count}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={ls.searchMini}>
          <TextInput
            value={publicSearch}
            onChangeText={setPublicSearch}
            placeholder="Tìm khảo sát..."
            placeholderTextColor={C.textDim}
            style={ls.searchMiniInput}
          />
        </View>

        <View style={[ls.viewToggle, { marginTop: 10 }]}>
          <TouchableOpacity onPress={() => setViewMode('grid')} style={[ls.viewToggleBtn, viewMode === 'grid' && ls.viewToggleBtnActive]}>
            <Text style={viewMode === 'grid' ? ls.viewToggleBtnTextActive : ls.viewToggleBtnText}>⊞</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('list')} style={[ls.viewToggleBtn, viewMode === 'list' && ls.viewToggleBtnActive]}>
            <Text style={viewMode === 'list' ? ls.viewToggleBtnTextActive : ls.viewToggleBtnText}>☰</Text>
          </TouchableOpacity>
        </View>

        {showFilter && (
          <View style={ls.filterPanel}>
            <Text style={ls.filterPanelLabel}>Sắp xếp theo</Text>
            <View style={ls.sortRow}>
              {[{ key: 'newest', label: 'Mới nhất' }, { key: 'oldest', label: 'Cũ nhất' }, { key: 'name', label: 'Tên A-Z' }].map(item => (
                <TouchableOpacity key={item.key} onPress={() => setSortBy(item.key)} style={[ls.sortBtn, sortBy === item.key && ls.sortBtnActive]}>
                  <Text style={[ls.sortBtnText, sortBy === item.key && ls.sortBtnTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => { setPublicSearch(''); setSortBy('newest'); setActiveTab('all'); setShowFilter(false); }} style={ls.resetBtn}>
              <Text style={ls.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        {modalSurvey && (
          <SubmissionModal
            surveyId={modalSurvey.id}
            surveyTitle={modalSurvey.title}
            onClose={() => setModalSurvey(null)}
          />
        )}

        {publicLoading ? (
          Array(4).fill(0).map((_, i) => (
            <View key={i} style={[psc.card, { height: 140 }]}>
              <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, height: 12, width: '70%', marginBottom: 8 }} />
              <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, height: 10, width: '100%' }} />
            </View>
          ))
        ) : publicError ? (
          <View style={ss.centered}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>⚠️</Text>
            <Text style={ss.emptyText}>{publicError}</Text>
            <TouchableOpacity onPress={fetchPublicData} style={{ marginTop: 8 }}>
              <Text style={{ color: C.primary, fontWeight: '700' }}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : displayed.length === 0 ? (
          <View style={ss.centered}>
            <Text style={ss.emptyEmoji}>📭</Text>
            <Text style={ss.emptyTitle}>{publicSearch ? `Không tìm thấy "${publicSearch}"` : 'Không có khảo sát nào'}</Text>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={ls.publicGrid}>
            {displayed.map(survey => (
              <View key={survey.id} style={{ width: '48%' }}>
                <PublicSurveyCard
                  survey={survey}
                  done={doneSurveyIds.has(survey.id)}
                  onStart={id => navigation?.navigate('SurveyTake', { surveyId: id })}
                  onViewSubmission={(id, title) => setModalSurvey({ id, title })}
                />
              </View>
            ))}
          </View>
        ) : (
          displayed.map(survey => (
            <PublicSurveyCard
              key={survey.id}
              survey={survey}
              done={doneSurveyIds.has(survey.id)}
              onStart={id => navigation?.navigate('SurveyTake', { surveyId: id })}
              onViewSubmission={(id, title) => setModalSurvey({ id, title })}
            />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  centered:           { alignItems: 'center', paddingVertical: 40, gap: 8 },
  loadingText:        { fontSize: 13, color: C.primary, fontWeight: '600', marginTop: 6 },
  emptyText:          { fontSize: 13, color: C.textSub },
  emptyEmoji:         { fontSize: 40, marginBottom: 6 },
  emptyTitle:         { fontSize: 15, fontWeight: '700', color: C.text },
  errorText:          { fontSize: 12, color: C.error },
  errorBox:           { backgroundColor: C.errorBg, padding: 12, borderRadius: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorBoxText:       { fontSize: 12, color: C.error, flex: 1 },
  retryText:          { fontSize: 12, color: C.error, fontWeight: '700', marginLeft: 8 },
  successBox:         { backgroundColor: C.successBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.successBorder },
  successText:        { fontSize: 12, fontWeight: '600', color: '#059669' },
  fieldLabel:         { fontSize: 11, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7, marginTop: 4 },
  textarea:           { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, fontSize: 12, color: C.text, height: 100, textAlignVertical: 'top' },
  actionRow:          { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  cancelBtn:          { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: C.border },
  cancelBtnText:      { fontSize: 12, fontWeight: '600', color: C.textSub },
  primaryBtn:         { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 9, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', gap: 5 },
  primaryBtnDisabled: { backgroundColor: C.surfaceHigh },
  primaryBtnText:     { fontSize: 12, fontWeight: '700', color: '#fff' },
  emailCountText:     { fontSize: 11, color: C.primary, fontWeight: '700', marginBottom: 4 },
  confirmBox:         { alignItems: 'center', padding: 20, borderRadius: 12, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder, marginBottom: 14 },
  confirmEmoji:       { fontSize: 32, marginBottom: 8 },
  confirmText:        { fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'center' },
  roleRow:            { flexDirection: 'row', gap: 7, marginBottom: 12 },
  roleBtn:            { flex: 1, padding: 8, borderRadius: 9, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center' },
  roleBtnActive:      { borderColor: C.primary, backgroundColor: C.primaryLight },
  roleBtnLabel:       { fontSize: 12, fontWeight: '700', color: C.text },
  roleBtnLabelActive: { color: C.primary },
  roleBtnDesc:        { fontSize: 10, color: C.textDim, marginTop: 2 },
  linkContainer:      { gap: 10 },
  linkBox:            { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: C.surfaceHigh, borderRadius: 10, borderWidth: 1, borderColor: C.primaryBorder },
  linkText:           { flex: 1, fontSize: 12, color: C.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  copyBtn:            { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.primaryBorder, backgroundColor: C.primaryLight, alignItems: 'center' },
  copyBtnSuccess:     { borderColor: C.successBorder, backgroundColor: C.successBg },
  copyBtnText:        { fontSize: 13, fontWeight: '700', color: C.primary },
  copyBtnTextSuccess: { color: C.success },
});

// ─────────────────────────────────────────────────────────────
// LAYOUT STYLES
// ─────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: C.bg },
  topBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  topBarLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appIcon:          { fontSize: 20 },
  appTitle:         { fontSize: 15, fontWeight: '800', color: C.text },
  appSubtitle:      { fontSize: 10, color: C.textSub },
  topBarStats:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText:         { fontSize: 11, color: C.textSub },
  statNum:          { fontWeight: '700', color: C.text },
  statDot:          { color: C.textDim },
  globalSearch:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceHigh, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  searchIcon:       { fontSize: 14 },
  searchInput:      { flex: 1, fontSize: 13, color: C.text, padding: 0 },
  scroll:           { flex: 1 },
  scrollContent:    { padding: 16, paddingBottom: 60 },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:     { fontSize: 16, fontWeight: '800', color: C.text },
  sectionBadge:     { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },
  createBtn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  createBtnActive:  { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, shadowColor: 'transparent', elevation: 0 },
  createBtnText:    { fontSize: 12, fontWeight: '700', color: '#fff' },
  createBtnTextActive: { color: C.textSub },
  searchMini:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, height: 36, marginBottom: 6 },
  searchMiniInput:  { flex: 1, fontSize: 12, color: C.text, padding: 0 },
  expandBtn:        { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', marginTop: 8, marginBottom: 4 },
  expandBtnText:    { fontSize: 12, fontWeight: '600', color: C.textSub },
  divider:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine:      { flex: 1, height: 1, backgroundColor: C.border },
  dividerBadge:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff' },
  dividerText:      { fontSize: 10, fontWeight: '700', color: C.textDim },
  tabsRow:          { flexDirection: 'row', gap: 4, backgroundColor: C.surfaceHigh, padding: 4, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  pubTab:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7, gap: 5 },
  pubTabActive:     { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  pubTabText:       { fontSize: 12, fontWeight: '600', color: C.textSub },
  pubTabTextActive: { color: C.primary },
  pubTabCount:      { fontSize: 10, color: C.textDim },
  pubTabCountActive:{ color: C.primary },
  filterBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff' },
  filterBtnActive:  { borderColor: C.primary, backgroundColor: C.primaryLight },
  filterBtnText:    { fontSize: 11, fontWeight: '600', color: C.textSub },
  filterBtnTextActive: { color: C.primary },
  refreshBtn2:      { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  refreshBtn2Text:  { fontSize: 16, color: C.textSub },
  viewToggle:       { flexDirection: 'row', alignSelf: 'flex-end', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10 },
  viewToggleBtn:    { paddingHorizontal: 10, paddingVertical: 7 },
  viewToggleBtnActive: { backgroundColor: C.primaryLight },
  viewToggleBtnText: { fontSize: 16, color: C.textSub },
  viewToggleBtnTextActive: { color: C.primary },
  filterPanel:      { backgroundColor: '#fff', borderRadius: 11, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  filterPanelLabel: { fontSize: 10, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  sortRow:          { flexDirection: 'row', gap: 6, marginBottom: 10 },
  sortBtn:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7, borderWidth: 1, borderColor: C.border },
  sortBtnActive:    { borderColor: C.primary, backgroundColor: C.primaryLight },
  sortBtnText:      { fontSize: 11, fontWeight: '600', color: C.textSub },
  sortBtnTextActive:{ color: C.primary },
  resetBtn:         { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7, borderWidth: 1, borderColor: C.border },
  resetBtnText:     { fontSize: 11, fontWeight: '600', color: C.textSub },
  publicGrid:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
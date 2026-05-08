// ─── MySurveysPage.native.jsx ──────────────────────────────────────
// React Native version – full feature parity with web MySurveysPage
// Requires:
//   npm install @react-navigation/native react-native-screens
//                react-native-safe-area-context
//   lucide-react-native  (icons)
//   @react-native-clipboard/clipboard  (copy to clipboard)
// ─────────────────────────────────────────────────────────────────────

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useSurvey } from '../../providers/Surveyprovider';
// hoặc đường dẫn tương ứng trong project của bạn
// ── Icon shims ── replace with lucide-react-native if installed
// import { Plus, X, FileText, ... } from "lucide-react-native";
// For portability, we use simple text-symbol fallbacks below.
// To swap in real icons just replace <Icon name="..." /> with the lucide component.
const Icon = ({ name, size = 16, color = "#64748b" }) => {
  const MAP = {
    plus: "+", x: "✕", "file-text": "📄", calendar: "📅",
    loader: "⟳", inbox: "📥", search: "🔍", "more-vertical": "⋮",
    trash2: "🗑", pencil: "✏️", check: "✓", share2: "↗",
    mail: "✉", lock: "🔒", globe: "🌐", copy: "⎘",
    "external-link": "↗", power: "⏻", "power-off": "⏼",
    users: "👥", "chevron-right": "›", link: "🔗", send: "➤",
    "user-plus": "👤+", "user-minus": "👤−", "chevron-down": "⌄",
    "refresh-cw": "↻",
  };
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>
      {MAP[name] || "•"}
    </Text>
  );
};

// ────────────────────────────────────────────────────────────────
// COLORS
// ────────────────────────────────────────────────────────────────
const C = {
  bg:            "#f5f7fb",
  surface:       "#ffffff",
  surfaceHigh:   "#f8fafc",
  border:        "#dbe2ea",
  borderHover:   "#c7d2fe",
  primary:       "#4f6ef7",
  primaryDim:    "rgba(79,110,247,0.08)",
  primaryBorder: "#c7d2fe",
  text:          "#111827",
  textSub:       "#64748b",
  textDim:       "#94a3b8",
  error:         "#ef4444",
  errorBg:       "#fef2f2",
  errorBorder:   "#fecaca",
  success:       "#22c55e",
  successBg:     "#f0fdf4",
  successBorder: "#bbf7d0",
  warning:       "#f59e0b",
  warningBg:     "#fffbeb",
  warningBorder: "#fde68a",
  thumbColors: [
    ["#dbeafe", "#c7d2fe"],
    ["#dcfce7", "#bbf7d0"],
    ["#fee2e2", "#fecaca"],
    ["#e0f2fe", "#bae6fd"],
    ["#f3e8ff", "#e9d5ff"],
  ],
};

const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fce7f3", color: "#be185d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#ede9fe", color: "#6d28d9" },
];

// ────────────────────────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",  color: C.success, bg: "rgba(34,197,94,.12)" },
  DRAFT:     { label: "Nháp",     color: C.textSub, bg: "rgba(100,116,139,.12)" },
  EXPIRED:   { label: "Hết hạn",  color: C.error,   bg: "rgba(239,68,68,.12)" },
  SCHEDULED: { label: "Lên lịch", color: C.warning, bg: "rgba(245,158,11,.12)" },
  CLOSED:    { label: "Đã đóng",  color: "#6b7280",  bg: "rgba(107,114,128,.12)" },
};

function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color: s.color }}>{s.label}</Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────
// MODAL BASE
// ────────────────────────────────────────────────────────────────
function ModalBase({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={s.modalOverlay} onPress={onClose}>
          <Pressable style={s.modalBox} onPress={() => {}}>
            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={s.modalClose}>
                <Icon name="x" size={15} color={C.textSub} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>{children}</View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────
// SHARE LINK MODAL
// ────────────────────────────────────────────────────────────────
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const [loading,  setLoading]  = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied,   setCopied]   = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const url = await onShare(survey.id);
      if (url) setShareUrl(url);
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    Clipboard.setString(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!open) { setShareUrl(null); setCopied(false); }
  }, [open]);

  return (
    <ModalBase open={open} onClose={onClose} title="Chia sẻ khảo sát">
      <View style={{ gap: 16 }}>
        {/* Survey info */}
        <View style={[s.infoRow, { backgroundColor: C.surfaceHigh }]}>
          <View style={[s.iconCircle, { backgroundColor: C.primaryDim }]}>
            <Icon name="share2" size={18} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.infoTitle}>{survey?.title}</Text>
            <Text style={s.infoSub}>Tạo link để chia sẻ survey với mọi người</Text>
          </View>
        </View>

        {shareUrl ? (
          <View style={{ gap: 10 }}>
            <Text style={s.label}>LINK CHIA SẺ</Text>
            <View style={[s.linkRow, { borderColor: C.border }]}>
              <Icon name="link" size={14} color={C.textDim} />
              <Text style={s.linkText} numberOfLines={1}>{shareUrl}</Text>
              <TouchableOpacity
                onPress={handleCopy}
                style={[s.copyBtn, copied && { backgroundColor: C.successBg, borderColor: C.successBorder }]}
              >
                <Icon name={copied ? "check" : "copy"} size={12} color={copied ? C.success : C.textSub} />
                <Text style={[s.copyBtnText, { color: copied ? C.success : C.textSub }]}>
                  {copied ? "Đã sao chép" : "Sao chép"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert("Mở link", shareUrl)}
              style={[s.outlineBtn, { borderColor: C.primaryBorder, backgroundColor: C.primaryDim }]}
            >
              <Icon name="external-link" size={13} color={C.primary} />
              <Text style={{ color: C.primary, fontWeight: "600", fontSize: 13, marginLeft: 6 }}>Mở link</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={loading}
            style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
          >
            {loading
              ? <ActivityIndicator size="small" color={C.textSub} />
              : <Icon name="link" size={16} color="#fff" />
            }
            <Text style={[s.primaryBtnText, loading && { color: C.textSub }]}>
              {loading ? " Đang tạo link..." : " Tạo link chia sẻ"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ModalBase>
  );
}

// ────────────────────────────────────────────────────────────────
// INVITE MODAL (single)
// ────────────────────────────────────────────────────────────────
function InviteModal({ open, onClose, survey, onInvite }) {
  const [emails,  setEmails]  = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(false); setError(""); }
  }, [open]);

  const handleSubmit = async () => {
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (list.length === 0) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      await Promise.all(list.map(email => onInvite(survey.id, { email, role: "viewer" })));
      setSuccess(true); setEmails("");
    } catch { setError("Mời không thành công, vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  return (
    <ModalBase open={open} onClose={onClose} title="Mời người tham gia">
      <View style={{ gap: 16 }}>
        <View style={[s.infoRow, { backgroundColor: C.surfaceHigh }]}>
          <Icon name="users" size={16} color={C.primary} />
          <Text style={[s.infoSub, { marginLeft: 8 }]}>
            Mời người dùng tham gia survey{" "}
            <Text style={{ color: C.text, fontWeight: "700" }}>{survey?.title}</Text>
          </Text>
        </View>

        {success && (
          <View style={[s.alertBox, { backgroundColor: C.successBg, borderColor: C.successBorder }]}>
            <Icon name="check" size={14} color={C.success} />
            <Text style={[s.alertText, { color: C.success, marginLeft: 6 }]}>Đã gửi lời mời thành công!</Text>
          </View>
        )}

        <View>
          <Text style={s.label}>ĐỊA CHỈ EMAIL</Text>
          <TextInput
            multiline
            numberOfLines={4}
            value={emails}
            onChangeText={t => { setEmails(t); setError(""); }}
            placeholder={"example@email.com\nuser2@email.com\n(mỗi dòng hoặc dấu phẩy)"}
            placeholderTextColor={C.textDim}
            style={[s.textarea, error && { borderColor: C.error }]}
          />
        </View>

        {error ? (
          <View style={[s.alertBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
            <Icon name="x" size={13} color={C.error} />
            <Text style={[s.alertText, { color: C.error, marginLeft: 6 }]}>{error}</Text>
          </View>
        ) : null}

        <View style={s.rowEnd}>
          <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
            <Text style={s.cancelBtnText}>Đóng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[s.primaryBtn, loading && s.primaryBtnDisabled, { paddingHorizontal: 18, paddingVertical: 9 }]}
          >
            {loading
              ? <ActivityIndicator size="small" color={C.textSub} />
              : <Icon name="send" size={13} color="#fff" />
            }
            <Text style={[s.primaryBtnText, loading && { color: C.textSub }]}>
              {loading ? " Đang gửi..." : " Gửi lời mời"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalBase>
  );
}

// ────────────────────────────────────────────────────────────────
// BULK INVITE MODAL
// ────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "viewer",     label: "👁️ Viewer",     desc: "Chỉ xem" },
  { value: "respondent", label: "✏️ Respondent", desc: "Trả lời survey" },
  { value: "editor",     label: "🛠️ Editor",     desc: "Chỉnh sửa" },
];

function BulkInviteModal({ open, onClose, survey, onBulkInvite }) {
  const [emails,  setEmails]  = useState("");
  const [role,    setRole]    = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(null); setError(""); setRole("viewer"); }
  }, [open]);

  const parseEmails = () => emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);

  const handleSubmit = async () => {
    const list = parseEmails();
    if (list.length === 0) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      const res = await onBulkInvite(survey.id, { emails: list, role });
      setSuccess({ sent: res?.sent ?? list.length, failed: res?.failed ?? 0 });
      setEmails("");
    } catch { setError("Bulk invite thất bại, vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  const emailCount = parseEmails().length;

  return (
    <ModalBase open={open} onClose={onClose} title="Mời hàng loạt">
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
        <View style={{ gap: 16 }}>
          {/* Header */}
          <View style={[s.infoRow, {
            backgroundColor: "rgba(79,110,247,0.06)",
            borderColor: C.primaryBorder,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }]}>
            <View style={[s.iconCircle, { backgroundColor: C.primaryDim }]}>
              <Icon name="user-plus" size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>{survey?.title}</Text>
              <Text style={s.infoSub}>Nhập nhiều email cùng lúc để mời hàng loạt</Text>
            </View>
            {emailCount > 0 && (
              <View style={{ backgroundColor: C.primaryDim, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: C.primary, fontWeight: "700", fontSize: 12 }}>{emailCount} email</Text>
              </View>
            )}
          </View>

          {/* Success */}
          {success && (
            <View style={[s.alertBox, { backgroundColor: C.successBg, borderColor: C.successBorder, flexDirection: "column", alignItems: "flex-start" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="check" size={14} color={C.success} />
                <Text style={[s.alertText, { color: C.success }]}>Đã gửi lời mời hàng loạt!</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: C.textSub }}>✅ Thành công: <Text style={{ color: C.success, fontWeight: "700" }}>{success.sent}</Text></Text>
                {success.failed > 0 && (
                  <Text style={{ fontSize: 12, color: C.textSub }}>❌ Thất bại: <Text style={{ color: C.error, fontWeight: "700" }}>{success.failed}</Text></Text>
                )}
              </View>
            </View>
          )}

          {/* Role selector */}
          <View>
            <Text style={s.label}>VAI TRÒ</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setRole(r.value)}
                  style={[
                    s.roleBtn,
                    role === r.value && { borderColor: C.primary, backgroundColor: C.primaryDim },
                  ]}
                >
                  <Text style={[s.roleBtnLabel, { color: role === r.value ? C.primary : C.text }]}>{r.label}</Text>
                  <Text style={s.roleBtnDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Email list */}
          <View>
            <Text style={s.label}>DANH SÁCH EMAIL</Text>
            <TextInput
              multiline
              numberOfLines={6}
              value={emails}
              onChangeText={t => { setEmails(t); setError(""); }}
              placeholder={"user1@email.com\nuser2@email.com, user3@email.com\n(phân cách bằng dấu phẩy, chấm phẩy hoặc xuống dòng)"}
              placeholderTextColor={C.textDim}
              style={[s.textarea, { minHeight: 110 }, error && { borderColor: C.error }]}
            />
          </View>

          {error ? (
            <View style={[s.alertBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
              <Icon name="x" size={13} color={C.error} />
              <Text style={[s.alertText, { color: C.error, marginLeft: 6 }]}>{error}</Text>
            </View>
          ) : null}

          <View style={s.rowEnd}>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
              <Text style={s.cancelBtnText}>Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || emailCount === 0}
              style={[s.primaryBtn, (loading || emailCount === 0) && s.primaryBtnDisabled, { paddingHorizontal: 18, paddingVertical: 9 }]}
            >
              {loading
                ? <ActivityIndicator size="small" color={C.textSub} />
                : <Icon name="user-plus" size={13} color={(loading || emailCount === 0) ? C.textSub : "#fff"} />
              }
              <Text style={[s.primaryBtnText, (loading || emailCount === 0) && { color: C.textSub }]}>
                {loading ? " Đang gửi..." : ` Mời ${emailCount > 0 ? `${emailCount} người` : "hàng loạt"}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ModalBase>
  );
}

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

  // ✅ FIX: dùng participant_id để xoá (đúng với backend)
  const handleDelete = useCallback(async (participantId) => {
    setDeleting(participantId);
    try {
      await onDeleteParticipant(survey.id, participantId);
      // filter bằng participant_id
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
            {/* Error */}
            {!!error && (
              <View style={pm.errorBox}>
                <Text style={pm.errorText}>{error}</Text>
                <TouchableOpacity onPress={load}>
                  <Text style={pm.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#4361ee" size="large" />
                <Text style={{ fontSize: 13, color: '#6b7280' }}>Đang tải...</Text>
              </View>
            )}

            {/* Empty */}
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

            {/* ✅ List — dùng participant_id làm key và để xoá */}
            {!loading && !error && filtered.map((p, i) => {
              const av        = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
              const roleMeta  = ROLE_COLORS[p.role] || ROLE_COLORS.viewer;
              const initials  = getInitials(p.name, p.email);
              // ✅ participant_id để xoá, id là user id
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
                    {/* Nếu không có name, hiện email */}
                    <Text style={pm.name} numberOfLines={1}>
  {p.name || p.email || 'Unknown'}
</Text>
{p.name && p.email ? (  // chỉ hiện email riêng nếu đã có name hiển thị
  <Text style={pm.emailText}>{p.email}</Text>
) : null}
                    {/* participant_id nhỏ để debug nếu cần */}
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

// ── Styles cho ParticipantsModal ──
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
  email:          { fontSize: 11, color: '#6b7280', marginTop: 1 },
  joinDate:       { fontSize: 10, color: '#9ca3af', marginTop: 1 },

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

// ────────────────────────────────────────────────────────────────
// PUBLISH CONFIRM MODAL
// ────────────────────────────────────────────────────────────────
function PublishModal({ open, onClose, survey, onPublish }) {
  const [loading, setLoading] = useState(false);
  const isPublished = survey?.is_published;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onPublish(survey.id, { is_published: !isPublished });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <ModalBase open={open} onClose={onClose} title={isPublished ? "Ẩn khảo sát" : "Publish khảo sát"}>
      <View style={{ gap: 16 }}>
        <View style={[s.confirmBox, { backgroundColor: isPublished ? C.warningBg : C.primaryDim, borderColor: isPublished ? C.warningBorder : C.primaryBorder }]}>
          <Text style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>{isPublished ? "🔒" : "🌐"}</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, textAlign: "center" }}>
            {isPublished
              ? "Khảo sát sẽ bị ẩn và không còn nhận được câu trả lời mới."
              : "Khảo sát sẽ được công khai và có thể nhận câu trả lời."}
          </Text>
        </View>
        <View style={s.rowEnd}>
          <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
            <Text style={s.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading}
            style={[
              s.primaryBtn,
              loading && s.primaryBtnDisabled,
              !loading && isPublished && { backgroundColor: C.warning },
              { paddingHorizontal: 18, paddingVertical: 9 },
            ]}
          >
            {loading
              ? <ActivityIndicator size="small" color={C.textSub} />
              : <Icon name={isPublished ? "power-off" : "globe"} size={13} color={loading ? C.textSub : "#fff"} />
            }
            <Text style={[s.primaryBtnText, loading && { color: C.textSub }]}>
              {loading ? " Đang xử lý..." : isPublished ? " Ẩn survey" : " Publish"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalBase>
  );
}

// ────────────────────────────────────────────────────────────────
// CLOSE CONFIRM MODAL
// ────────────────────────────────────────────────────────────────
function CloseModal({ open, onClose, survey, onCloseSurvey }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onCloseSurvey(survey.id);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <ModalBase open={open} onClose={onClose} title="Đóng khảo sát">
      <View style={{ gap: 16 }}>
        <View style={[s.confirmBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
          <Text style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>⛔</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, textAlign: "center" }}>
            Sau khi đóng, survey sẽ không nhận thêm câu trả lời.
          </Text>
          <Text style={{ fontSize: 12, color: C.textSub, textAlign: "center", marginTop: 6 }}>
            Hành động này không thể hoàn tác.
          </Text>
        </View>
        <View style={s.rowEnd}>
          <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
            <Text style={s.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading}
            style={[s.deleteBtn, loading && s.primaryBtnDisabled, { paddingHorizontal: 18, paddingVertical: 9 }]}
          >
            {loading
              ? <ActivityIndicator size="small" color={C.textSub} />
              : <Icon name="power-off" size={13} color={loading ? C.textSub : "#fff"} />
            }
            <Text style={[s.deleteBtnText, loading && { color: C.textSub }]}>
              {loading ? " Đang đóng..." : " Đóng survey"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalBase>
  );
}

// ────────────────────────────────────────────────────────────────
// SURVEY CARD
// ────────────────────────────────────────────────────────────────
function SurveyCard({
  survey, index,
  onDelete, onUpdate, onShare, onInvite, onPublish, onCloseSurvey,
  onBulkInvite, onGetParticipants, onDeleteParticipant,
}) {
  const navigation = useNavigation();
  const thumb      = C.thumbColors[index % C.thumbColors.length];

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [title,       setTitle]       = useState(survey.title);
  const [description, setDescription] = useState(survey.description || "");
  const [startAt,     setStartAt]     = useState(survey.start_at ? survey.start_at.slice(0, 16) : "");
  const [endAt,       setEndAt]       = useState(survey.end_at   ? survey.end_at.slice(0, 16)   : "");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const [shareOpen,        setShareOpen]        = useState(false);
  const [inviteOpen,       setInviteOpen]       = useState(false);
  const [bulkInviteOpen,   setBulkInviteOpen]   = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [publishOpen,      setPublishOpen]      = useState(false);
  const [closeOpen,        setCloseOpen]        = useState(false);

  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(survey.id, { title, description, start_at: startAt || null, end_at: endAt || null });
      setEditing(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert("Xoá survey", "Bạn có chắc chắn muốn xoá survey này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá", style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try { await onDelete(survey.id); }
          finally { setDeleting(false); }
        },
      },
    ]);
  };

  const isClosed    = survey.status === "CLOSED";
  const isPublished = survey.is_published;

  const menuItems = [
    { icon: "pencil",    label: "Chỉnh sửa",     action: () => { setEditing(true); setMenuOpen(false); } },
    { icon: "share2",    label: "Tạo link chia sẻ", action: () => { setShareOpen(true); setMenuOpen(false); } },
    { icon: "mail",      label: "Mời người dùng", action: () => { setInviteOpen(true); setMenuOpen(false); } },
    { icon: "user-plus", label: "Mời hàng loạt",  action: () => { setBulkInviteOpen(true); setMenuOpen(false); }, color: C.primary },
    // Thêm log vào nút mở modal
{ emoji: '👤', label: 'Xem participants', action: () => {
  console.log('=== OPEN PARTICIPANTS ===');
  console.log('participantsOpen before:', participantsOpen);
  setParticipantsOpen(true);
  console.log('setParticipantsOpen(true) called');
}},
    {
      icon:  isPublished ? "lock" : "globe",
      label: isPublished ? "Ẩn survey" : "Publish",
      action: () => { setPublishOpen(true); setMenuOpen(false); },
      color: isPublished ? C.warning : C.primary,
    },
    ...(!isClosed ? [{
      icon:  "power-off",
      label: "Đóng survey",
      action: () => { setCloseOpen(true); setMenuOpen(false); },
      color: "#6b7280",
    }] : []),
    { icon: "trash2", label: "Xóa", action: handleDelete, color: C.error },
  ];

  return (
    <>
      <Animated.View style={{ transform: [{ scale }], marginBottom: 16 }}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => !editing && navigation.navigate("QuestionScreen", { id: survey.id })}
          style={s.card}
        >
          {/* THUMB */}
          <View style={[s.cardThumb, { backgroundColor: thumb[0], opacity: isClosed ? 0.7 : 1 }]}>
            <Icon name="file-text" size={44} color="rgba(79,110,247,.35)" />

            {/* Badges */}
            <View style={s.badgesTopLeft}>
              <StatusBadge status={survey.status} />
              {isPublished && (
                <View style={s.publishedBadge}>
                  <Icon name="globe" size={9} color={C.primary} />
                  <Text style={{ fontSize: 10, fontWeight: "700", color: C.primary, marginLeft: 4 }}>Published</Text>
                </View>
              )}
            </View>

            {/* Quick action buttons on thumb */}
            {!editing && (
              <View style={s.quickBtns}>
                {[
                  { icon: "share2",    action: () => setShareOpen(true),        title: "Chia sẻ" },
                  { icon: "mail",      action: () => setInviteOpen(true),       title: "Mời" },
                  { icon: "user-plus", action: () => setBulkInviteOpen(true),   title: "Mời hàng loạt" },
                  { icon: "users",     action: () => setParticipantsOpen(true), title: "Participants" },
                  { icon: isPublished ? "lock" : "globe", action: () => setPublishOpen(true), title: "Publish" },
                  ...(!isClosed ? [{ icon: "power-off", action: () => setCloseOpen(true), title: "Đóng" }] : []),
                ].map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={btn.action}
                    style={s.quickBtn}
                  >
                    <Icon name={btn.icon} size={13} color={C.textSub} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 3-dot menu button */}
            <View style={s.menuWrapper}>
              <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={s.menuToggle}>
                <Icon name="more-vertical" size={16} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* CONTENT */}
          <View style={s.cardBody}>
            {editing ? (
              <View style={{ gap: 10 }}>
                <TextInput value={title} onChangeText={setTitle} placeholder="Tiêu đề" style={s.input} />
                <TextInput
                  multiline numberOfLines={3}
                  value={description} onChangeText={setDescription}
                  placeholder="Mô tả" style={s.textarea}
                />
                <TextInput value={startAt} onChangeText={setStartAt} placeholder="Bắt đầu (YYYY-MM-DDTHH:MM)" style={s.input} />
                <TextInput value={endAt}   onChangeText={setEndAt}   placeholder="Kết thúc (YYYY-MM-DDTHH:MM)" style={s.input} />
                <View style={s.rowEnd}>
                  <TouchableOpacity onPress={() => setEditing(false)} style={s.cancelBtn}>
                    <Text style={s.cancelBtnText}>Huỷ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={s.saveBtn}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="check" size={14} color="#fff" />}
                    <Text style={s.saveBtnText}> Lưu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={s.cardTitle}>{survey.title}</Text>
                <Text style={s.cardDesc} numberOfLines={3}>
                  {survey.description || "Không có mô tả"}
                </Text>
                <View style={s.cardFooter}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Icon name="calendar" size={14} color={C.textDim} />
                    <Text style={{ fontSize: 12, color: C.textDim }}>
                      {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
                    </Text>
                  </View>
                  {/* Chip buttons */}
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    {[
                      { icon: "link",      action: () => setShareOpen(true) },
                      { icon: "mail",      action: () => setInviteOpen(true) },
                      { icon: "user-plus", action: () => setBulkInviteOpen(true) },
                      { icon: "users",     action: () => setParticipantsOpen(true) },
                    ].map((btn, i) => (
                      <TouchableOpacity key={i} onPress={btn.action} style={s.chipBtn}>
                        <Icon name={btn.icon} size={11} color={C.textDim} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Context Menu (rendered as bottom sheet via Modal) ── */}
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={s.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={s.menuSheet}>
            <View style={s.menuHandle} />
            <Text style={s.menuSurveyTitle}>{survey.title}</Text>
            {menuItems.map((item, i) => (
              <TouchableOpacity key={i} onPress={item.action} style={s.menuItem}>
                <Icon name={item.icon} size={16} color={item.color || C.text} />
                <Text style={[s.menuItemText, { color: item.color || C.text }]}>{item.label}</Text>
                {deleting && item.label === "Xóa" && <ActivityIndicator size="small" color={C.error} style={{ marginLeft: "auto" }} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setMenuOpen(false)} style={[s.cancelBtn, { marginTop: 8, alignSelf: "stretch" }]}>
              <Text style={[s.cancelBtnText, { textAlign: "center" }]}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modals ── */}
      <ShareLinkModal   open={shareOpen}        onClose={() => setShareOpen(false)}        survey={survey} onShare={onShare} />
      <InviteModal      open={inviteOpen}        onClose={() => setInviteOpen(false)}        survey={survey} onInvite={onInvite} />
      <BulkInviteModal  open={bulkInviteOpen}    onClose={() => setBulkInviteOpen(false)}    survey={survey} onBulkInvite={onBulkInvite} />
      <ParticipantsModal
  visible={participantsOpen}
  onClose={() => setParticipantsOpen(false)}
  survey={survey}
  onGetParticipants={onGetParticipants}
  onDeleteParticipant={onDeleteParticipant}
/>
      <PublishModal open={publishOpen} onClose={() => setPublishOpen(false)} survey={survey} onPublish={onPublish} />
      <CloseModal   open={closeOpen}   onClose={() => setCloseOpen(false)}   survey={survey} onCloseSurvey={onCloseSurvey} />
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────────────────────────
export default function MySurveysPage() {
  // Replace with your actual provider hook
  const {
    surveys = [], loading = false,
    createSurvey, fetchMySurveys,
    updateSurvey, deleteSurvey,
    closeSurvey, publishSurvey,
    shareLink, inviteSurvey,
    bulkInviteSurvey,
    getParticipants,
    deleteParticipant,
  } = useSurvey(); // useSurvey();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [search,         setSearch]         = useState("");
  const [formData, setFormData] = useState({ title: "", description: "", start_at: "", end_at: "" });

  useEffect(() => { fetchMySurveys?.(1, 20); }, []);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    setSubmitting(true);
    try {
      await createSurvey?.({
        title:       formData.title,
        description: formData.description || null,
        start_at:    formData.start_at    || null,
        end_at:      formData.end_at      || null,
      });
      setFormData({ title: "", description: "", start_at: "", end_at: "" });
      setShowCreateForm(false);
      await fetchMySurveys?.(1, 20);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const filtered = surveys.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.page}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Surveys</Text>
          <Text style={s.headerSub}>Tạo và quản lý survey của bạn</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateForm(!showCreateForm)}
          style={[s.createBtn, showCreateForm && s.createBtnActive]}
        >
          <Icon name={showCreateForm ? "x" : "plus"} size={16} color={showCreateForm ? C.textSub : "#fff"} />
          <Text style={[s.createBtnText, showCreateForm && { color: C.textSub }]}>
            {showCreateForm ? "Huỷ" : "Survey mới"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={s.searchBar}>
        <Icon name="search" size={15} color={C.textSub} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm survey..."
          placeholderTextColor={C.textDim}
          style={s.searchBarInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Icon name="x" size={14} color={C.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            {/* CREATE FORM */}
            {showCreateForm && (
              <View style={s.createForm}>
                <Text style={s.createFormTitle}>Tạo Survey Mới</Text>
                <View style={{ gap: 12 }}>
                  <TextInput
                    value={formData.title}
                    onChangeText={v => setFormData(p => ({ ...p, title: v }))}
                    placeholder="Tiêu đề survey *"
                    placeholderTextColor={C.textDim}
                    style={s.input}
                  />
                  <TextInput
                    multiline numberOfLines={4}
                    value={formData.description}
                    onChangeText={v => setFormData(p => ({ ...p, description: v }))}
                    placeholder="Mô tả survey"
                    placeholderTextColor={C.textDim}
                    style={s.textarea}
                  />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Bắt đầu</Text>
                      <TextInput
                        value={formData.start_at}
                        onChangeText={v => setFormData(p => ({ ...p, start_at: v }))}
                        placeholder="YYYY-MM-DDTHH:MM"
                        placeholderTextColor={C.textDim}
                        style={s.input}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Kết thúc</Text>
                      <TextInput
                        value={formData.end_at}
                        onChangeText={v => setFormData(p => ({ ...p, end_at: v }))}
                        placeholder="YYYY-MM-DDTHH:MM"
                        placeholderTextColor={C.textDim}
                        style={s.input}
                      />
                    </View>
                  </View>
                  <View style={s.rowEnd}>
                    <TouchableOpacity onPress={() => setShowCreateForm(false)} style={s.cancelBtn}>
                      <Text style={s.cancelBtnText}>Huỷ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={submitting}
                      style={[s.saveBtn, submitting && s.primaryBtnDisabled]}
                    >
                      {submitting
                        ? <ActivityIndicator size="small" color={C.textSub} />
                        : <Icon name="plus" size={15} color="#fff" />
                      }
                      <Text style={[s.saveBtnText, submitting && { color: C.textSub }]}>
                        {submitting ? " Đang tạo..." : " Tạo Survey"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <ActivityIndicator size="large" color={C.primary} />
              </View>
            )}

            {/* Count */}
            {!loading && filtered.length > 0 && (
              <Text style={{ fontSize: 13, color: C.textSub, marginBottom: 12 }}>
                {filtered.length} survey{search ? ` · kết quả cho "${search}"` : ""}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyBox}>
              <Icon name="inbox" size={54} color={C.textDim} />
              <Text style={s.emptyTitle}>
                {search ? `Không tìm thấy "${search}"` : "Chưa có survey nào"}
              </Text>
              <Text style={s.emptySub}>
                {search ? "Thử tìm với từ khóa khác" : "Hãy tạo survey đầu tiên"}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <SurveyCard
            key={item.id}
            survey={item}
            index={index}
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
        )}
      />
    </View>
  );
}

// ────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get("window");

const s = StyleSheet.create({
  page:              { flex: 1, backgroundColor: C.bg },

  // Header
  header:            { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle:       { fontSize: 22, fontWeight: "800", color: C.text },
  headerSub:         { fontSize: 13, color: C.textSub, marginTop: 2 },
  createBtn:         { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: C.primary },
  createBtnActive:   { backgroundColor: "#fff", borderWidth: 1, borderColor: C.border },
  createBtnText:     { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Search
  searchBar:         { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 14, height: 44, backgroundColor: "#fff", borderRadius: 999, borderWidth: 1, borderColor: C.border },
  searchBarInput:    { flex: 1, fontSize: 14, color: C.text },
  searchInput:       { flex: 1, fontSize: 13, color: C.text, paddingVertical: 0, marginHorizontal: 6 },
  searchRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: C.border },

  // Create form
  createForm:        { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  createFormTitle:   { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 16 },

  // Card
  card:              { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardThumb:         { height: 140, alignItems: "center", justifyContent: "center", position: "relative", borderBottomWidth: 1, borderBottomColor: C.border },
  badgesTopLeft:     { position: "absolute", top: 10, left: 10, gap: 4 },
  publishedBadge:    { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(79,110,247,0.12)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  quickBtns:         { position: "absolute", bottom: 10, left: 10, flexDirection: "row", gap: 6 },
  quickBtn:          { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center" },
  menuWrapper:       { position: "absolute", top: 10, right: 10 },
  menuToggle:        { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center" },
  cardBody:          { padding: 16 },
  cardTitle:         { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 8, lineHeight: 22 },
  cardDesc:          { fontSize: 13, color: C.textSub, lineHeight: 20, minHeight: 56 },
  cardFooter:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  chipBtn:           { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },

  // Menu sheet
  menuOverlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  menuSheet:         { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  menuHandle:        { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  menuSurveyTitle:   { fontSize: 13, fontWeight: "600", color: C.textSub, marginBottom: 8, paddingHorizontal: 4 },
  menuItem:          { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  menuItemText:      { fontSize: 14, fontWeight: "600" },

  // Modal
  modalOverlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox:          { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: C.border, width: "100%", maxWidth: 480, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 },
  modalHeader:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle:        { fontSize: 16, fontWeight: "700", color: C.text },
  modalClose:        { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },

  // Info rows
  infoRow:           { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  infoTitle:         { fontSize: 14, fontWeight: "600", color: C.text },
  infoSub:           { fontSize: 12, color: C.textSub, marginTop: 2 },
  iconCircle:        { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },

  // Link row
  linkRow:           { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, backgroundColor: C.surfaceHigh },
  linkText:          { flex: 1, fontSize: 13, color: C.text },
  copyBtn:           { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: C.border },
  copyBtnText:       { fontSize: 12, fontWeight: "600" },

  // Buttons
  primaryBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnText:    { color: "#fff", fontSize: 14, fontWeight: "700" },
  primaryBtnDisabled:{ backgroundColor: C.surfaceHigh, shadowOpacity: 0, elevation: 0 },
  outlineBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  cancelBtn:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: "#fff" },
  cancelBtnText:     { fontSize: 13, fontWeight: "600", color: C.textSub },
  saveBtn:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.primary },
  saveBtnText:       { color: "#fff", fontSize: 13, fontWeight: "600" },
  deleteBtn:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, backgroundColor: C.error },
  deleteBtnText:     { color: "#fff", fontSize: 12, fontWeight: "700" },
  iconBtn:           { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },

  // Form fields
  input:             { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.text, backgroundColor: "#fff", width: "100%" },
  textarea:          { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: C.text, backgroundColor: "#fff", textAlignVertical: "top", width: "100%" },
  label:             { fontSize: 12, fontWeight: "600", color: C.textSub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },

  // Alert
  alertBox:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  alertText:         { fontSize: 13, fontWeight: "600" },

  // Role buttons
  roleBtn:           { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: "center" },
  roleBtnLabel:      { fontSize: 12, fontWeight: "700" },
  roleBtnDesc:       { fontSize: 11, color: C.textDim, marginTop: 2 },

  // Participants
  listBox:           { borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: "hidden" },
  participantRow:    { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#fff" },
  avatar:            { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  participantName:   { fontSize: 13, fontWeight: "600", color: C.text },
  participantEmail:  { fontSize: 12, color: C.textSub },
  statBox:           { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border },

  // Confirm box
  confirmBox:        { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "center" },

  // Utils
  rowEnd:            { flexDirection: "row", justifyContent: "flex-end", gap: 8 },

  // Empty
  emptyBox:          { backgroundColor: "#fff", borderRadius: 28, borderWidth: 1, borderColor: C.border, paddingVertical: 80, paddingHorizontal: 20, alignItems: "center", marginTop: 20 },
  emptyTitle:        { marginTop: 16, color: C.text, fontWeight: "700", fontSize: 18, textAlign: "center" },
  emptySub:          { color: C.textSub, marginTop: 8, textAlign: "center" },
});
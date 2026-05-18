// ─── MySurveysPage.native.jsx ─────────────────────────────────────────────
// React Native version – chạy được trên iOS & Android
// Yêu cầu: react-native, @react-navigation/native, lucide-react-native
// npm install @react-navigation/native lucide-react-native react-native-safe-area-context

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSurvey } from "../../providers/SurveyProvider";
import { SurveyCardHome } from "../../components/survey/SurveyCardHome";

// ─── Lucide icons (thay bằng react-native-vector-icons nếu cần) ────
// Nếu chưa cài lucide-react-native, thay bằng text/emoji placeholder
let IconSet;
try {
  IconSet = require("lucide-react-native");
} catch {
  IconSet = {};
}

const Icon = ({ name, size = 16, color = "#64748b", style }) => {
  const Comp = IconSet[name];
  if (!Comp) return <Text style={[{ fontSize: size * 0.7, color }, style]}>■</Text>;
  return <Comp size={size} color={color} style={style} />;
};

const { width: SW } = Dimensions.get("window");

/* ────────────────────────────────────────────────────────────────
   COLORS
──────────────────────────────────────────────────────────────── */
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
    ["#ff6b6b", "#4ecdc4"],
    ["#a8edea", "#fed6e3"],
    ["#667eea", "#764ba2"],
    ["#f5af19", "#f12711"],
    ["#4facfe", "#00f2fe"],
  ],
};

/* ────────────────────────────────────────────────────────────────
   STATUS
──────────────────────────────────────────────────────────────── */
const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",  color: C.success, bg: "rgba(34,197,94,.12)" },
  DRAFT:     { label: "Nháp",     color: C.textSub, bg: "rgba(100,116,139,.12)" },
  EXPIRED:   { label: "Hết hạn",  color: C.error,   bg: "rgba(239,68,68,.12)" },
  SCHEDULED: { label: "Lên lịch", color: C.warning, bg: "rgba(245,158,11,.12)" },
  CLOSED:    { label: "Đã đóng",  color: "#6b7280",  bg: "rgba(107,114,128,.12)" },
};

/* ────────────────────────────────────────────────────────────────
   MOCK DATA (xoá khi kết nối provider thật)
──────────────────────────────────────────────────────────────── */
const MOCK_SURVEYS = [
  {
    id: "1",
    title: "Khảo sát sự hài lòng khách hàng Q2",
    description: "Đánh giá mức độ hài lòng của khách hàng về sản phẩm và dịch vụ.",
    status: "ACTIVE",
    is_published: true,
    created_at: "2024-05-01T00:00:00Z",
    start_at: null,
    end_at: null,
  },
  {
    id: "2",
    title: "Khảo sát nội bộ nhân viên 2024",
    description: "Thu thập phản hồi từ nhân viên về môi trường làm việc.",
    status: "DRAFT",
    is_published: false,
    created_at: "2024-04-20T00:00:00Z",
    start_at: null,
    end_at: null,
  },
  {
    id: "3",
    title: "Đánh giá chất lượng sản phẩm mới",
    description: null,
    status: "CLOSED",
    is_published: false,
    created_at: "2024-03-10T00:00:00Z",
    start_at: null,
    end_at: null,
  },
];

/* ────────────────────────────────────────────────────────────────
   STATUS BADGE
──────────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <View style={[ss.badge, { backgroundColor: s.bg }]}>
      <Text style={[ss.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────
   BASE MODAL
──────────────────────────────────────────────────────────────── */
function BaseModal({ visible, onClose, title, children, width }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={ss.overlay}>
            <TouchableWithoutFeedback>
              <View style={[ss.modalBox, width ? { maxWidth: width } : {}]}>
                {/* Header */}
                <View style={ss.modalHeader}>
                  <Text style={ss.modalTitle}>{title}</Text>
                  <TouchableOpacity onPress={onClose} style={ss.modalClose}>
                    <Icon name="X" size={15} color={C.textSub} />
                  </TouchableOpacity>
                </View>
                <View style={ss.modalBody}>{children}</View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────
   SHARE LINK MODAL
──────────────────────────────────────────────────────────────── */
function ShareLinkModal({ visible, onClose, survey, onShare }) {
  const [loading,  setLoading]  = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied,   setCopied]   = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const url = await onShare?.(survey.id);
      if (url) setShareUrl(url);
      else setShareUrl(`https://survey.app/s/${survey.id}`); // mock
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    // Clipboard.setString(shareUrl); // thêm @react-native-clipboard/clipboard
    Alert.alert("Đã sao chép", shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!visible) { setShareUrl(null); setCopied(false); }
  }, [visible]);

  return (
    <BaseModal visible={visible} onClose={onClose} title="Chia sẻ khảo sát">
      <View style={ss.row12}>
        <View style={[ss.infoBox, { gap: 10 }]}>
          <View style={ss.iconBox}>
            <Icon name="Share2" size={18} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ss.infoTitle}>{survey?.title}</Text>
            <Text style={ss.infoSub}>Tạo link để chia sẻ survey với mọi người</Text>
          </View>
        </View>

        {shareUrl ? (
          <View style={{ gap: 10 }}>
            <Text style={ss.label}>LINK CHIA SẺ</Text>
            <View style={[ss.inputRow, { padding: 10 }]}>
              <Icon name="Link" size={14} color={C.textDim} />
              <Text style={[ss.flex1, { fontSize: 12, color: C.text, marginHorizontal: 8 }]} numberOfLines={1}>
                {shareUrl}
              </Text>
              <TouchableOpacity
                onPress={handleCopy}
                style={[ss.smallBtn, copied && { borderColor: C.successBorder, backgroundColor: C.successBg }]}
              >
                <Icon name={copied ? "Check" : "Copy"} size={12} color={copied ? C.success : C.textSub} />
                <Text style={[ss.smallBtnText, copied && { color: C.success }]}>
                  {copied ? "Đã sao chép" : "Sao chép"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => Linking.openURL(shareUrl)}
              style={ss.outlineBtn}
            >
              <Icon name="ExternalLink" size={13} color={C.primary} />
              <Text style={[ss.outlineBtnText, { color: C.primary }]}> Mở link</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={loading}
            style={[ss.primaryBtn, loading && ss.disabledBtn]}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="Link" size={16} color="#fff" />
            }
            <Text style={ss.primaryBtnText}>
              {loading ? "Đang tạo link..." : "Tạo link chia sẻ"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </BaseModal>
  );
}

/* ────────────────────────────────────────────────────────────────
   INVITE MODAL
──────────────────────────────────────────────────────────────── */
function InviteModal({ visible, onClose, survey, onInvite }) {
  const [emails,  setEmails]  = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!visible) { setEmails(""); setSuccess(false); setError(""); }
  }, [visible]);

  const handleSubmit = async () => {
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (list.length === 0) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      await Promise.all(list.map(email => onInvite?.(survey.id, { email, role: "viewer" })));
      setSuccess(true); setEmails("");
    } catch { setError("Mời không thành công, vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Mời người tham gia">
      <View style={{ gap: 12 }}>
        <View style={[ss.infoBox, { gap: 10 }]}>
          <Icon name="Users" size={16} color={C.primary} />
          <Text style={ss.infoSub}>
            Mời người dùng tham gia survey{" "}
            <Text style={{ fontWeight: "700", color: C.text }}>{survey?.title}</Text>
          </Text>
        </View>

        {success && (
          <View style={ss.successBox}>
            <Icon name="Check" size={14} color={C.success} />
            <Text style={[ss.successText, { marginLeft: 6 }]}>Đã gửi lời mời thành công!</Text>
          </View>
        )}

        <Text style={ss.label}>ĐỊA CHỈ EMAIL</Text>
        <TextInput
          multiline
          numberOfLines={4}
          value={emails}
          onChangeText={t => { setEmails(t); setError(""); }}
          placeholder={"example@email.com\nuser2@email.com\n(mỗi dòng hoặc dấu phẩy)"}
          placeholderTextColor={C.textDim}
          style={[ss.textarea, error && { borderColor: C.error }]}
          textAlignVertical="top"
        />

        {!!error && (
          <View style={ss.errorBox}>
            <Icon name="X" size={13} color={C.error} />
            <Text style={[ss.errorText, { marginLeft: 6 }]}>{error}</Text>
          </View>
        )}

        <View style={ss.rowEnd}>
          <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
            <Text style={ss.cancelBtnText}>Đóng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[ss.primaryBtn, loading && ss.disabledBtn, { paddingHorizontal: 16 }]}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="Send" size={13} color="#fff" />
            }
            <Text style={ss.primaryBtnText}>{loading ? "Đang gửi..." : "Gửi lời mời"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}

/* ────────────────────────────────────────────────────────────────
   BULK INVITE MODAL
──────────────────────────────────────────────────────────────── */
function BulkInviteModal({ visible, onClose, survey, onBulkInvite }) {
  const [emails,  setEmails]  = useState("");
  const [role,    setRole]    = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState("");

  const ROLES = [
    { value: "viewer",     label: "👁️ Viewer",     desc: "Chỉ xem" },
    { value: "respondent", label: "✏️ Respondent", desc: "Trả lời survey" },
    { value: "editor",     label: "🛠️ Editor",     desc: "Chỉnh sửa" },
  ];

  const parseEmails = () => emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);

  useEffect(() => {
    if (!visible) { setEmails(""); setSuccess(null); setError(""); setRole("viewer"); }
  }, [visible]);

  const handleSubmit = async () => {
    const list = parseEmails();
    if (list.length === 0) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      const res = await onBulkInvite?.(survey.id, { emails: list, role });
      setSuccess({ sent: res?.sent ?? list.length, failed: res?.failed ?? 0 });
      setEmails("");
    } catch { setError("Bulk invite thất bại, vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  const emailCount = parseEmails().length;

  return (
    <BaseModal visible={visible} onClose={onClose} title="Mời hàng loạt" width={520}>
      <View style={{ gap: 12 }}>
        <View style={[ss.infoBox, { backgroundColor: "rgba(79,110,247,0.06)", borderColor: C.primaryBorder, gap: 10 }]}>
          <View style={ss.iconBox}><Icon name="UserPlus" size={18} color={C.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={ss.infoTitle}>{survey?.title}</Text>
            <Text style={ss.infoSub}>Nhập nhiều email cùng lúc để mời hàng loạt</Text>
          </View>
          {emailCount > 0 && (
            <View style={[ss.badge, { backgroundColor: C.primaryDim }]}>
              <Text style={[ss.badgeText, { color: C.primary }]}>{emailCount} email</Text>
            </View>
          )}
        </View>

        {success && (
          <View style={[ss.successBox, { flexDirection: "column", alignItems: "flex-start" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="Check" size={14} color={C.success} />
              <Text style={ss.successText}>Đã gửi lời mời hàng loạt!</Text>
            </View>
            <Text style={{ fontSize: 12, color: C.textSub, marginTop: 6 }}>
              ✅ Thành công: {success.sent}
              {success.failed > 0 ? `   ❌ Thất bại: ${success.failed}` : ""}
            </Text>
          </View>
        )}

        {/* Role selector */}
        <Text style={ss.label}>VAI TRÒ</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.value}
              onPress={() => setRole(r.value)}
              style={[ss.roleBtn, role === r.value && { borderColor: C.primary, backgroundColor: C.primaryDim }]}
            >
              <Text style={[ss.roleBtnLabel, role === r.value && { color: C.primary }]}>{r.label}</Text>
              <Text style={ss.roleBtnDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ss.label}>DANH SÁCH EMAIL</Text>
        <TextInput
          multiline
          numberOfLines={6}
          value={emails}
          onChangeText={t => { setEmails(t); setError(""); }}
          placeholder={"user1@email.com\nuser2@email.com, user3@email.com\n(phân cách bằng phẩy, chấm phẩy hoặc xuống dòng)"}
          placeholderTextColor={C.textDim}
          style={[ss.textarea, { minHeight: 120 }, error && { borderColor: C.error }]}
          textAlignVertical="top"
        />

        {!!error && (
          <View style={ss.errorBox}>
            <Icon name="X" size={13} color={C.error} />
            <Text style={[ss.errorText, { marginLeft: 6 }]}>{error}</Text>
          </View>
        )}

        <View style={ss.rowEnd}>
          <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
            <Text style={ss.cancelBtnText}>Đóng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || emailCount === 0}
            style={[ss.primaryBtn, (loading || emailCount === 0) && ss.disabledBtn, { paddingHorizontal: 16 }]}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="UserPlus" size={13} color="#fff" />
            }
            <Text style={ss.primaryBtnText}>
              {loading ? "Đang gửi..." : `Mời ${emailCount > 0 ? `${emailCount} người` : "hàng loạt"}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}

/* ────────────────────────────────────────────────────────────────
   PARTICIPANTS MODAL
──────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fce7f3", color: "#be185d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#ede9fe", color: "#6d28d9" },
];
const ROLE_STYLE = {
  viewer:     { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  respondent: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  editor:     { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
};

function ParticipantsModal({ visible, onClose, survey, onGetParticipants, onDeleteParticipant }) {
  const [participants, setParticipants] = useState([]);
  const [count,        setCount]        = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [confirmPid,   setConfirmPid]   = useState(null);
  const [deleting,     setDeleting]     = useState(null);
  const [error,        setError]        = useState("");

  const load = useCallback(async () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    try {
      const res = await onGetParticipants?.(survey.id, {});
      const list = res?.participants ?? [
        { participant_id: "p1", id: "u1", email: "user1@example.com", name: "Nguyễn Văn A", role: "viewer" },
        { participant_id: "p2", id: "u2", email: "user2@example.com", name: null, role: "respondent" },
      ];
      setParticipants(list);
      setCount(res?.count ?? list.length);
    } catch { setError("Không thể tải danh sách người tham gia."); }
    finally { setLoading(false); }
  }, [survey?.id, onGetParticipants]);

  useEffect(() => {
    if (visible) { load(); setSearch(""); setConfirmPid(null); }
    else { setParticipants([]); setCount(0); }
  }, [visible, load]);

  const handleDelete = async (pid) => {
    setDeleting(pid);
    try {
      await onDeleteParticipant?.(survey.id, pid);
      setParticipants(prev => prev.filter(p => p.participant_id !== pid));
      setCount(prev => Math.max(0, prev - 1));
      setConfirmPid(null);
    } finally { setDeleting(null); }
  };

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    return p.email?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q);
  });

  const getInitials = (name, email) => {
    if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (email || "?")[0].toUpperCase();
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Quản lý người tham gia" width={560}>
      <View style={{ gap: 12 }}>
        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={[ss.infoBox, { flex: 1 }]}>
            <View style={ss.iconBox}><Icon name="Users" size={16} color={C.primary} /></View>
            <View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>{count}</Text>
              <Text style={{ fontSize: 12, color: C.textSub }}>Tổng participants</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={load}
            disabled={loading}
            style={[ss.cancelBtn, { alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }]}
          >
            {loading
              ? <ActivityIndicator size="small" color={C.textSub} />
              : <Icon name="RefreshCw" size={14} color={C.textSub} />
            }
            <Text style={ss.cancelBtnText}>Tải lại</Text>
          </TouchableOpacity>
        </View>

        {!!error && !loading && (
          <View style={ss.errorBox}>
            <Text style={ss.errorText}>{error}</Text>
            <TouchableOpacity onPress={load} style={[ss.cancelBtn, { marginLeft: "auto" }]}>
              <Text style={[ss.cancelBtnText, { color: C.error }]}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search */}
        <View style={ss.searchBar}>
          <Icon name="Search" size={14} color={C.textDim} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên, email hoặc vai trò..."
            placeholderTextColor={C.textDim}
            style={ss.searchInput}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Icon name="X" size={13} color={C.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <View style={[ss.listBox, { maxHeight: 300 }]}>
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={{ fontSize: 13, color: C.textSub, marginTop: 10 }}>Đang tải danh sách...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Icon name="Users" size={32} color={C.textDim} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, marginTop: 10 }}>
                {search ? `Không tìm thấy "${search}"` : "Chưa có người tham gia"}
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {filtered.map((p, i) => {
                const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const deleteKey = p.participant_id ?? p.id;
                const isConfirming = confirmPid === deleteKey;
                const isDeleting   = deleting === deleteKey;
                const roleStyle    = ROLE_STYLE[p.role?.toLowerCase()] ?? { color: C.primary, bg: C.primaryDim, border: C.primaryBorder };

                return (
                  <View
                    key={deleteKey ?? i}
                    style={[
                      ss.participantRow,
                      i < filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                      isConfirming && { backgroundColor: C.errorBg },
                    ]}
                  >
                    <View style={[ss.avatar, { backgroundColor: av.bg }]}>
                      <Text style={[ss.avatarText, { color: av.color }]}>{getInitials(p.name, p.email)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={ss.participantName} numberOfLines={1}>{p.name || p.email}</Text>
                      {p.name && <Text style={ss.participantEmail} numberOfLines={1}>{p.email}</Text>}
                    </View>
                    {p.role && (
                      <View style={[ss.badge, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border, borderWidth: 1, marginHorizontal: 6 }]}>
                        <Text style={[ss.badgeText, { color: roleStyle.color }]}>{p.role}</Text>
                      </View>
                    )}
                    {isConfirming ? (
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity onPress={() => setConfirmPid(null)} style={ss.cancelBtn}>
                          <Text style={ss.cancelBtnText}>Huỷ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(deleteKey)}
                          disabled={isDeleting}
                          style={[ss.primaryBtn, { backgroundColor: C.error, paddingHorizontal: 10, paddingVertical: 6 }]}
                        >
                          {isDeleting
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Icon name="Trash2" size={11} color="#fff" />
                          }
                          <Text style={ss.primaryBtnText}>Xoá</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setConfirmPid(deleteKey)}
                        style={ss.iconBtn}
                      >
                        <Icon name="UserMinus" size={13} color={C.textDim} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {!loading && filtered.length > 0 && search && (
          <Text style={{ fontSize: 12, color: C.textSub, textAlign: "center" }}>
            Hiển thị {filtered.length} / {participants.length} người
          </Text>
        )}

        <View style={ss.rowEnd}>
          <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
            <Text style={ss.cancelBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}

/* ────────────────────────────────────────────────────────────────
   PUBLISH MODAL
──────────────────────────────────────────────────────────────── */
function PublishModal({ visible, onClose, survey, onPublish }) {
  const [loading, setLoading] = useState(false);
  const isPublished = survey?.is_published;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onPublish?.(survey.id, { is_published: !isPublished });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title={isPublished ? "Ẩn khảo sát" : "Publish khảo sát"}>
      <View style={{ gap: 16 }}>
        <View style={[
          ss.confirmBox,
          isPublished
            ? { backgroundColor: C.warningBg, borderColor: C.warningBorder }
            : { backgroundColor: C.primaryDim, borderColor: C.primaryBorder },
        ]}>
          <Text style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>
            {isPublished ? "🔒" : "🌐"}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, textAlign: "center" }}>
            {isPublished
              ? "Khảo sát sẽ bị ẩn và không còn nhận được câu trả lời mới."
              : "Khảo sát sẽ được công khai và có thể nhận câu trả lời."}
          </Text>
        </View>
        <View style={ss.rowEnd}>
          <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
            <Text style={ss.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading}
            style={[
              ss.primaryBtn,
              { paddingHorizontal: 16 },
              loading && ss.disabledBtn,
              isPublished && !loading && { backgroundColor: C.warning },
            ]}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name={isPublished ? "PowerOff" : "Globe"} size={13} color="#fff" />
            }
            <Text style={ss.primaryBtnText}>
              {loading ? "Đang xử lý..." : isPublished ? "Ẩn survey" : "Publish"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}

/* ────────────────────────────────────────────────────────────────
   CLOSE SURVEY MODAL
──────────────────────────────────────────────────────────────── */
function CloseSurveyModal({ visible, onClose, survey, onCloseSurvey }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onCloseSurvey?.(survey.id);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Đóng khảo sát">
      <View style={{ gap: 16 }}>
        <View style={[ss.confirmBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
          <Text style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>⛔</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, textAlign: "center" }}>
            Sau khi đóng, survey sẽ không nhận thêm câu trả lời.
          </Text>
          <Text style={{ fontSize: 12, color: C.textSub, textAlign: "center", marginTop: 6 }}>
            Hành động này không thể hoàn tác.
          </Text>
        </View>
        <View style={ss.rowEnd}>
          <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
            <Text style={ss.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading}
            style={[ss.primaryBtn, { paddingHorizontal: 16, backgroundColor: loading ? C.surfaceHigh : C.error }]}
          >
            {loading
              ? <ActivityIndicator size="small" color={loading ? C.textSub : "#fff"} />
              : <Icon name="PowerOff" size={13} color="#fff" />
            }
            <Text style={[ss.primaryBtnText, loading && { color: C.textSub }]}>
              {loading ? "Đang đóng..." : "Đóng survey"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}

/* ────────────────────────────────────────────────────────────────
   CONTEXT MENU
──────────────────────────────────────────────────────────────── */
function ContextMenu({ visible, onClose, items }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={ss.overlay}>
          <TouchableWithoutFeedback>
            <View style={ss.contextMenu}>
              {items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { item.action(); onClose(); }}
                  style={[
                    ss.contextItem,
                    i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                  ]}
                >
                  {React.cloneElement(item.icon, { color: item.color || C.text })}
                  <Text style={[ss.contextItemText, item.color && { color: item.color }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────
   SURVEY CARD
──────────────────────────────────────────────────────────────── */
function SurveyCard({
  survey, index,
  onDelete, onUpdate, onShare, onInvite, onPublish, onCloseSurvey,
  onBulkInvite, onGetParticipants, onDeleteParticipant,
  onNavigate,
}) {
  const [menuOpen,         setMenuOpen]         = useState(false);
  const [editing,          setEditing]          = useState(false);
  const [title,            setTitle]            = useState(survey.title);
  const [description,      setDescription]      = useState(survey.description || "");
  const [saving,           setSaving]           = useState(false);
  const [shareOpen,        setShareOpen]        = useState(false);
  const [inviteOpen,       setInviteOpen]       = useState(false);
  const [bulkInviteOpen,   setBulkInviteOpen]   = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [publishOpen,      setPublishOpen]      = useState(false);
  const [closeOpen,        setCloseOpen]        = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const thumbColors = C.thumbColors[index % C.thumbColors.length];
  const isClosed    = survey.status === "CLOSED";
  const isPublished = survey.is_published;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate?.(survey.id, { title, description });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xoá khảo sát",
      `Bạn có chắc muốn xoá "${survey.title}"?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => onDelete?.(survey.id),
        },
      ]
    );
  };

  const menuItems = [
    { icon: <Icon name="Pencil" size={14} />,   label: "Chỉnh sửa",       action: () => setEditing(true) },
    { icon: <Icon name="BarChart3" size={14} />, label: "Phân tích",       action: () => onNavigate?.(`/surveys/${survey.id}/analytics`) },
    { icon: <Icon name="Share2" size={14} />,    label: "Tạo link chia sẻ", action: () => setShareOpen(true) },
    { icon: <Icon name="Mail" size={14} />,       label: "Mời người dùng",  action: () => setInviteOpen(true) },
    { icon: <Icon name="UserPlus" size={14} />,  label: "Mời hàng loạt",   action: () => setBulkInviteOpen(true), color: C.primary },
    { icon: <Icon name="Users" size={14} />,      label: "Xem participants", action: () => setParticipantsOpen(true) },
    {
      icon:   <Icon name={isPublished ? "Lock" : "Globe"} size={14} />,
      label:  isPublished ? "Ẩn survey" : "Publish",
      action: () => setPublishOpen(true),
      color:  isPublished ? C.warning : C.primary,
    },
    !isClosed && {
      icon:   <Icon name="PowerOff" size={14} />,
      label:  "Đóng survey",
      action: () => setCloseOpen(true),
      color:  "#6b7280",
    },
    { icon: <Icon name="Trash2" size={14} />, label: "Xóa", action: handleDelete, color: C.error },
  ].filter(Boolean);

  const dateStr = survey.created_at
    ? new Date(survey.created_at).toLocaleDateString("vi-VN")
    : "";

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={ss.card}>
          {/* Thumbnail */}
          <Pressable
            onPress={() => !editing && onNavigate?.(`QuestionScreen`, { surveyId: survey.id })}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              ss.thumb,
              isClosed
                ? { backgroundColor: "#e2e8f0" }
                : { backgroundColor: thumbColors[0] },
            ]}
          >
            {/* Gradient overlay via opacity View */}
            <View style={[StyleSheet.absoluteFill, { opacity: 0.3, backgroundColor: thumbColors[1] }]} />

            <Icon name="FileText" size={48} color="rgba(255,255,255,0.25)" />

            {/* Badges */}
            <View style={ss.thumbBadges}>
              <StatusBadge status={survey.status} />
              {isPublished && (
                <View style={[ss.badge, { backgroundColor: "rgba(79,110,247,0.15)", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }]}>
                  <Icon name="Globe" size={9} color={C.primary} />
                  <Text style={[ss.badgeText, { color: C.primary }]}>Published</Text>
                </View>
              )}
            </View>

            {/* Quick actions */}
            {!editing && (
              <View style={ss.quickActions}>
                {[
                  { icon: "Share2",  onPress: () => setShareOpen(true) },
                  { icon: "Mail",    onPress: () => setInviteOpen(true) },
                  { icon: "UserPlus", onPress: () => setBulkInviteOpen(true) },
                  { icon: "Users",   onPress: () => setParticipantsOpen(true) },
                ].map((btn, i) => (
                  <Pressable key={i} onPress={(e) => { e.stopPropagation?.(); btn.onPress(); }} style={ss.quickBtn}>
                    <Icon name={btn.icon} size={13} color={C.textSub} />
                  </Pressable>
                ))}
                <Pressable
                  onPress={(e) => { e.stopPropagation?.(); setPublishOpen(true); }}
                  style={[ss.quickBtn, isPublished && { backgroundColor: "rgba(245,158,11,0.85)" }]}
                >
                  <Icon name={isPublished ? "Lock" : "Globe"} size={13} color={isPublished ? "#fff" : C.textSub} />
                </Pressable>
                {!isClosed && (
                  <Pressable onPress={(e) => { e.stopPropagation?.(); setCloseOpen(true); }} style={ss.quickBtn}>
                    <Icon name="PowerOff" size={13} color={C.textSub} />
                  </Pressable>
                )}
              </View>
            )}

            {/* Menu button */}
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); setMenuOpen(true); }}
              style={ss.menuBtn}
            >
              <Icon name="MoreVertical" size={16} color={C.text} />
            </Pressable>
          </Pressable>

          {/* Content */}
          <Pressable
            onPress={() => !editing && onNavigate?.(`QuestionScreen`, { surveyId: survey.id })}
            style={ss.cardContent}
          >
            {editing ? (
              <View style={{ gap: 10 }}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Tiêu đề"
                  style={ss.input}
                  placeholderTextColor={C.textDim}
                />
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Mô tả"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={[ss.input, { minHeight: 70 }]}
                  placeholderTextColor={C.textDim}
                />
                <View style={ss.rowEnd}>
                  <Pressable onPress={(e) => { e.stopPropagation?.(); setEditing(false); }} style={ss.cancelBtn}>
                    <Text style={ss.cancelBtnText}>Huỷ</Text>
                  </Pressable>
                  <Pressable
                    onPress={(e) => { e.stopPropagation?.(); handleSave(); }}
                    disabled={saving}
                    style={[ss.primaryBtn, { paddingHorizontal: 14 }, saving && ss.disabledBtn]}
                  >
                    {saving
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Icon name="Check" size={14} color="#fff" />
                    }
                    <Text style={ss.primaryBtnText}>Lưu</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={ss.cardTitle} numberOfLines={2}>{survey.title}</Text>
                <Text style={ss.cardDesc} numberOfLines={3}>
                  {survey.description || "Không có mô tả"}
                </Text>
                <View style={ss.cardFooter}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Icon name="Calendar" size={13} color={C.textDim} />
                    <Text style={ss.cardDate}>{dateStr}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    {[
                      { icon: "Link",     onPress: () => setShareOpen(true) },
                      { icon: "Mail",     onPress: () => setInviteOpen(true) },
                      { icon: "UserPlus", onPress: () => setBulkInviteOpen(true) },
                      { icon: "Users",    onPress: () => setParticipantsOpen(true) },
                    ].map((btn, i) => (
                      <Pressable key={i} onPress={(e) => { e.stopPropagation?.(); btn.onPress(); }} style={ss.chipBtn}>
                        <Icon name={btn.icon} size={11} color={C.textDim} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>

      {/* Context menu */}
      <ContextMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
      />

      {/* Modals */}
      <ShareLinkModal    visible={shareOpen}        onClose={() => setShareOpen(false)}        survey={survey} onShare={onShare} />
      <InviteModal       visible={inviteOpen}       onClose={() => setInviteOpen(false)}       survey={survey} onInvite={onInvite} />
      <BulkInviteModal   visible={bulkInviteOpen}   onClose={() => setBulkInviteOpen(false)}   survey={survey} onBulkInvite={onBulkInvite} />
      <ParticipantsModal visible={participantsOpen} onClose={() => setParticipantsOpen(false)} survey={survey} onGetParticipants={onGetParticipants} onDeleteParticipant={onDeleteParticipant} />
      <PublishModal      visible={publishOpen}      onClose={() => setPublishOpen(false)}      survey={survey} onPublish={onPublish} />
      <CloseSurveyModal  visible={closeOpen}        onClose={() => setCloseOpen(false)}        survey={survey} onCloseSurvey={onCloseSurvey} />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
   CREATE FORM (bên trong modal)
──────────────────────────────────────────────────────────────── */
function CreateSurveyModal({ visible, onClose, onCreate }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    if (!visible) { setTitle(""); setDescription(""); }
  }, [visible]);

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert("Lỗi", "Vui lòng nhập tiêu đề survey."); return; }
    setSubmitting(true);
    try {
      await onCreate({ title, description: description || null });
      onClose();
    } finally { setSubmitting(false); }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Tạo Survey Mới">
      <View style={{ gap: 14 }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Tiêu đề survey"
          placeholderTextColor={C.textDim}
          style={ss.input}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả survey"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={C.textDim}
          style={[ss.input, { minHeight: 90 }]}
        />
        <View style={ss.rowEnd}>
          <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
            <Text style={ss.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[ss.primaryBtn, { paddingHorizontal: 18 }, submitting && ss.disabledBtn]}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="Plus" size={15} color="#fff" />
            }
            <Text style={ss.primaryBtnText}>{submitting ? "Đang tạo..." : "Tạo Survey"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}

/* ────────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────────── */
export default function MySurveysPage() {
  const {
    mySurveys,
    loading,
    createSurveyFlow,
    fetchMySurveys,
    deleteSurvey,
    updateSurvey,
    publishSurvey,
    closeSurvey,
    shareLink,
    inviteSurvey,
    bulkInviteSurvey,
    getParticipants,
    deleteParticipant,
  } = useSurvey();
  const navigation = useNavigation();

  const [search,      setSearch]      = useState("");
  const [createOpen,  setCreateOpen]  = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchMySurveys();
    }, [fetchMySurveys])
  );

  const handleCreate = async (data) => {
    await createSurveyFlow(data);
  };

  const handleDelete = async (id) => {
    await deleteSurvey(id);
  };

  const handleUpdate = async (id, data) => {
    await updateSurvey(id, data);
  };

  const handlePublish = async (id, data) => {
    await publishSurvey(id, data);
  };

  const handleClose = async (id) => {
    await closeSurvey(id);
  };

  const handleShare = async (surveyId) => {
    try { await shareLink(surveyId); } catch (err) { console.error(err); }
  };

  const filtered = (mySurveys || []).filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNavigate = (surveyId) => {
    navigation.navigate("SurveyStudio", { surveyId });
  };

  return (
    <SafeAreaView style={ss.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={ss.header}>
        <View style={{ flex: 1 }}>
          <Text style={ss.headerTitle}>My Surveys</Text>
          <Text style={ss.headerSub}>Tạo và quản lý survey của bạn</Text>
        </View>
        <TouchableOpacity onPress={() => setCreateOpen(true)} style={ss.createBtn}>
          <Icon name="Plus" size={16} color="#fff" />
          <Text style={ss.createBtnText}>Mới</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={ss.searchContainer}>
        <View style={ss.searchBar}>
          <Icon name="Search" size={15} color={C.textSub} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm survey..."
            placeholderTextColor={C.textDim}
            style={ss.searchInput}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Icon name="X" size={14} color={C.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* COUNT */}
      {!loading && filtered.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ fontSize: 13, color: C.textSub }}>
            {filtered.length} survey{search ? ` · kết quả cho "${search}"` : ""}
          </Text>
        </View>
      )}

      {/* LIST */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={ss.emptyState}>
          <Icon name="Inbox" size={54} color={C.textDim} />
          <Text style={ss.emptyTitle}>
            {search ? `Không tìm thấy "${search}"` : "Chưa có survey nào"}
          </Text>
          <Text style={ss.emptySub}>
            {search ? "Thử tìm với từ khóa khác" : "Hãy tạo survey đầu tiên"}
          </Text>
          {!search && (
            <TouchableOpacity onPress={() => setCreateOpen(true)} style={[ss.primaryBtn, { marginTop: 16, paddingHorizontal: 20 }]}>
              <Icon name="Plus" size={15} color="#fff" />
              <Text style={ss.primaryBtnText}>Tạo survey ngay</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 14, paddingBottom: 40, gap: 10 }}>
          {filtered.map((survey, index) => (
            <SurveyCardHome
              key={survey.id}
              survey={survey}
              index={index}
              onClick={() => handleNavigate(survey.id)}
              type="my"
              onShare={handleShare}
              onLock={handleClose}
            />
          ))}
        </View>
      )}

      {/* Create modal */}
      <CreateSurveyModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────────
   STYLES
──────────────────────────────────────────────────────────────── */
const ss = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.primary,
  },
  headerSub: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: C.surfaceHigh,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingVertical: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginTop: 14,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: C.textSub,
    marginTop: 6,
    textAlign: "center",
  },

  // CARD
  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  thumb: {
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  thumbBadges: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  quickActions: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    gap: 6,
  },
  quickBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    marginBottom: 6,
    lineHeight: 21,
  },
  cardDesc: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 19,
    marginBottom: 12,
    minHeight: 55,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDate: {
    fontSize: 12,
    color: C.textDim,
  },
  chipBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // BADGE
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // MODAL
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    width: "100%",
    maxWidth: 480,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 18,
  },

  // INFO BOX
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
  },
  infoSub: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },

  // INPUTS
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: C.text,
    backgroundColor: "#fff",
    width: "100%",
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: C.text,
    backgroundColor: "#fff",
    minHeight: 90,
    width: "100%",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textSub,
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  // BUTTONS
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: C.primary,
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  disabledBtn: {
    backgroundColor: C.surfaceHigh,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#fff",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSub,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    backgroundColor: C.primaryDim,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#fff",
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSub,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // STATES
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: C.successBg,
    borderWidth: 1,
    borderColor: C.successBorder,
  },
  successText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.success,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
  },
  errorText: {
    fontSize: 13,
    color: C.error,
    flex: 1,
  },
  confirmBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  // LAYOUT
  row12: { gap: 12 },
  rowEnd: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  flex1: { flex: 1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceHigh,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  // ROLE BTN
  roleBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  roleBtnLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.text,
  },
  roleBtnDesc: {
    fontSize: 10,
    color: C.textDim,
    marginTop: 2,
  },

  // PARTICIPANTS
  listBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
  },
  participantName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },
  participantEmail: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },

  // CONTEXT MENU
  contextMenu: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    width: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  contextItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
  },
  contextItemText: {
    fontSize: 14,
    color: C.text,
  },
});
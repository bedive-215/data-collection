/**
 * SurveysLayout.native.jsx
 * React Native — full conversion of SurveysLayout.jsx
 * No mock data. All logic preserved from the web version.
 *
 * Dependencies:
 *   npm install @react-navigation/native
 *   @react-native-async-storage/async-storage
 *
 * Providers (same interface as web):
 *   useSurvey, useResponse
 *
 * Sub-component (you must also port or stub):
 *   CreateSurveyComposer  →  @/components/survey/CreateSurveyComposer
 */

import React, {
  useEffect, useState, useRef, useMemo, useCallback,
} from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  FlatList, Modal, StyleSheet, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, Animated, Dimensions,
  Alert, RefreshControl, Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useSurvey }   from "../providers/SurveyProvider";
import { useResponse } from "../providers/ResponseProvider";
import CreateSurveyComposer from "../components/survey/CreateSurveyComposer";
import { SurveyCardHome } from "../components/survey/SurveyCardHome";

const { width: SW } = Dimensions.get("window");

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════════════════════ */
const C = {
  bg:           "#eef2ff",
  surface:      "rgba(255,255,255,0.90)",
  glassBorder:  "rgba(255,255,255,0.55)",
  border:       "rgba(99,102,241,0.1)",
  primary:      "#4f46e5",
  primaryLight: "rgba(79,70,229,0.14)",
  primaryBorder:"rgba(79,70,229,0.35)",
  text:         "#0f172a",
  textSub:      "#64748b",
  textDim:      "#94a3b8",
  error:        "#ef4444",
  errorBg:      "rgba(239,68,68,0.10)",
  errorBorder:  "rgba(239,68,68,0.25)",
  success:      "#10b981",
  successBg:    "rgba(16,185,129,0.10)",
  successBorder:"rgba(16,185,129,0.25)",
  warning:      "#f59e0b",
  warningBg:    "rgba(245,158,11,0.10)",
  white:        "#ffffff",
  gray100:      "#f3f4f6",
  gray200:      "#e5e7eb",
  gray400:      "#9ca3af",
  gray500:      "#6b7280",
  gray700:      "#374151",
  gray900:      "#111827",

  // Thumb gradient backgrounds (simulated as solid tints in RN)
  thumbColors: [
    "#ffd6d6", "#d6eaff", "#e3d6ff",
    "#fff3d6", "#d6fff0", "#d6f0ff",
  ],
};

const MY_SURVEYS_PREVIEW = 10;

/* ════════════════════════════════════════════════════════════════
   STATUS BADGE
════════════════════════════════════════════════════════════════ */
const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",  color: "#059669", bg: "rgba(16,185,129,0.15)" },
  DRAFT:     { label: "Nháp",     color: C.textSub, bg: "rgba(107,114,128,0.12)" },
  EXPIRED:   { label: "Hết hạn",  color: "#dc2626", bg: "rgba(239,68,68,0.12)" },
  SCHEDULED: { label: "Lên lịch", color: "#d97706", bg: "rgba(245,158,11,0.12)" },
  CLOSED:    { label: "Đã đóng",  color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   GLASS CARD
════════════════════════════════════════════════════════════════ */
function GlassCard({ children, style }) {
  return (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARE LINK MODAL
════════════════════════════════════════════════════════════════ */
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!open) { setShareUrl(null); setCopied(false); setError(""); setLoading(false); }
  }, [open]);

  const parseUrl = (result) =>
    typeof result === "string" ? result : result?.url ?? result?.data?.url ?? null;

  const handleGenerate = async () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    try {
      const result = await onShare(survey.id);
      const url = parseUrl(result);
      if (url) setShareUrl(url);
      else setError("Không lấy được link.");
    } catch { setError("Tạo link thất bại."); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    // Clipboard API — install @react-native-clipboard/clipboard if needed
    try {
      const Clipboard = require("@react-native-clipboard/clipboard").default;
      Clipboard.setString(shareUrl);
    } catch { /* fallback: show alert */ Alert.alert("Link", shareUrl); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={styles.modalBox} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chia sẻ khảo sát</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>{survey?.title}</Text>
              <Text style={styles.infoBoxSub}>Tạo link để chia sẻ survey với mọi người</Text>
            </View>

            {!!error && (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={handleGenerate} disabled={loading}>
                  <Text style={styles.retryBtn}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}

            {shareUrl ? (
              <View style={styles.urlBox}>
                <Text style={styles.urlText} numberOfLines={1}>{shareUrl}</Text>
                <TouchableOpacity
                  style={[styles.copyBtn, copied && styles.copyBtnDone]}
                  onPress={handleCopy}
                >
                  <Text style={[styles.copyBtnText, copied && { color: C.success }]}>
                    {copied ? "✓ Đã sao chép!" : "Sao chép link"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleGenerate}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={styles.primaryBtnText}>🔗 Tạo link chia sẻ</Text>}
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   INVITE MODAL
════════════════════════════════════════════════════════════════ */
function InviteModal({ open, onClose, survey, onInvite }) {
  const [emails, setEmails]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(false); setError(""); setSentCount(0); }
  }, [open]);

  const handleSubmit = async () => {
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (!list.length) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError(""); setSuccess(false);
    try {
      await Promise.all(list.map(email => onInvite(survey.id, { email, role: "viewer" })));
      setSentCount(list.length); setSuccess(true); setEmails("");
    } catch { setError("Mời không thành công."); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={styles.modalBox} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mời người tham gia</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {success && (
              <View style={styles.successRow}>
                <Text style={styles.successText}>✓ Đã gửi lời mời đến {sentCount} địa chỉ email.</Text>
              </View>
            )}
            <Text style={styles.fieldLabel}>Địa chỉ email</Text>
            <TextInput
              style={[styles.textarea, !!error && styles.inputError]}
              value={emails}
              onChangeText={t => { setEmails(t); setError(""); }}
              placeholder={"example@email.com\nuser2@email.com"}
              placeholderTextColor={C.textDim}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSm, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={styles.primaryBtnText}>✉ Gửi lời mời</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   BULK INVITE MODAL
════════════════════════════════════════════════════════════════ */
const ROLES = [
  { value: "viewer",     label: "👁 Viewer",     desc: "Chỉ xem" },
  { value: "respondent", label: "✏️ Respondent", desc: "Trả lời" },
  { value: "editor",     label: "🛠 Editor",     desc: "Chỉnh sửa" },
];

function BulkInviteModal({ open, onClose, survey, onBulkInvite }) {
  const [emails, setEmails]   = useState("");
  const [role, setRole]       = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!open) { setEmails(""); setSuccess(null); setError(""); setRole("viewer"); }
  }, [open]);

  const parseEmails = () => emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
  const emailCount = parseEmails().length;

  const handleSubmit = async () => {
    const list = parseEmails();
    if (!list.length) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError("");
    try {
      const res = await onBulkInvite(survey.id, { emails: list, role });
      setSuccess({ sent: res?.sent ?? list.length, failed: res?.failed ?? 0 });
      setEmails("");
    } catch { setError("Bulk invite thất bại."); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={[styles.modalBox, { maxWidth: 480 }]} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mời hàng loạt</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={[styles.infoBox, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
              <View style={styles.bulkIcon}>
                <Text style={{ fontSize: 18 }}>👥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBoxTitle}>{survey?.title}</Text>
                <Text style={styles.infoBoxSub}>Nhập nhiều email để mời hàng loạt</Text>
              </View>
              {emailCount > 0 && (
                <View style={styles.emailCountBadge}>
                  <Text style={styles.emailCountText}>{emailCount} email</Text>
                </View>
              )}
            </View>

            {success && (
              <View style={styles.successRow}>
                <Text style={styles.successText}>✓ Đã gửi! Thành công: {success.sent}{success.failed > 0 ? ` / Thất bại: ${success.failed}` : ""}</Text>
              </View>
            )}

            {/* Role selector */}
            <Text style={styles.fieldLabel}>Vai trò</Text>
            <View style={styles.roleRow}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
                  onPress={() => setRole(r.value)}
                >
                  <Text style={[styles.roleBtnLabel, role === r.value && styles.roleBtnLabelActive]}>{r.label}</Text>
                  <Text style={styles.roleBtnDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Danh sách email</Text>
            <TextInput
              style={[styles.textarea, { minHeight: 120 }, !!error && styles.inputError]}
              value={emails}
              onChangeText={t => { setEmails(t); setError(""); }}
              placeholder={"user1@email.com\nuser2@email.com, user3@email.com"}
              placeholderTextColor={C.textDim}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSm, (loading || emailCount === 0) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading || emailCount === 0}
              >
                {loading
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={styles.primaryBtnText}>👥 Mời {emailCount > 0 ? `${emailCount} người` : "hàng loạt"}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   PARTICIPANTS MODAL
════════════════════════════════════════════════════════════════ */
const AV_COLORS = [
  { bg: "#e0e7ff", color: "#3730a3" }, { bg: "#d1fae5", color: "#065f46" },
  { bg: "#fce7f3", color: "#9d174d" }, { bg: "#fef3c7", color: "#78350f" },
  { bg: "#f3e8ff", color: "#5b21b6" },
];
const ROLE_STYLE = {
  viewer:     { color: "#1d4ed8", bg: "#eff6ff" },
  respondent: { color: "#059669", bg: "#ecfdf5" },
  editor:     { color: "#7c3aed", bg: "#f5f3ff" },
};

function getInitials(name, email) {
  if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (email || "?")[0].toUpperCase();
}

function ParticipantsModal({ open, onClose, survey, onGetParticipants, onDeleteParticipant }) {
  const [participants, setParticipants] = useState([]);
  const [count, setCount]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [deleting, setDeleting]         = useState(null);
  const [confirmPid, setConfirmPid]     = useState(null);
  const [search, setSearch]             = useState("");
  const [error, setError]               = useState("");

  const load = useCallback(async () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    try {
      const res = await onGetParticipants(survey.id, {});
      setParticipants(res?.participants ?? []);
      setCount(res?.count ?? 0);
    } catch { setError("Không thể tải danh sách."); }
    finally { setLoading(false); }
  }, [survey?.id, onGetParticipants]);

  useEffect(() => {
    if (open) { load(); setSearch(""); setConfirmPid(null); setError(""); }
    else { setParticipants([]); setCount(0); }
  }, [open, load]);

  const handleDelete = async (pid) => {
    setDeleting(pid);
    try {
      await onDeleteParticipant(survey.id, pid);
      setParticipants(p => p.filter(x => x.participant_id !== pid));
      setCount(c => Math.max(0, c - 1));
      setConfirmPid(null);
    } finally { setDeleting(null); }
  };

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    return p.email?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q);
  });

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={[styles.modalBox, { maxWidth: 500, maxHeight: "90%" }]} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quản lý người tham gia</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {/* Count + reload */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <View style={[styles.infoBox, { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }]}>
                <Text style={{ fontSize: 22, fontWeight: "900", color: C.text }}>{count}</Text>
                <Text style={styles.infoBoxSub}>Tổng participants</Text>
              </View>
              <TouchableOpacity onPress={load} disabled={loading} style={styles.reloadBtn}>
                {loading
                  ? <ActivityIndicator size="small" color={C.textSub} />
                  : <Text style={styles.reloadBtnText}>↻ Tải lại</Text>}
              </TouchableOpacity>
            </View>

            {!!error && !loading && (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={load}><Text style={styles.retryBtn}>Thử lại</Text></TouchableOpacity>
              </View>
            )}

            {/* Search */}
            <View style={styles.searchRow}>
              <Text style={{ color: C.textDim, marginRight: 6 }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm theo tên, email..."
                placeholderTextColor={C.textDim}
              />
              {!!search && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Text style={{ color: C.textDim }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <ScrollView style={{ maxHeight: 300, marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <ActivityIndicator color={C.primary} />
                  <Text style={[styles.infoBoxSub, { marginTop: 8 }]}>Đang tải...</Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 36 }}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>👥</Text>
                  <Text style={styles.infoBoxSub}>{search ? `Không tìm thấy "${search}"` : "Chưa có người tham gia"}</Text>
                </View>
              ) : (
                filtered.map((p, i) => {
                  const av = AV_COLORS[i % AV_COLORS.length];
                  const deleteKey = p.participant_id ?? p.id;
                  const isConfirming = confirmPid === deleteKey;
                  const isDeleting = deleting === deleteKey;
                  const rs = ROLE_STYLE[p.role?.toLowerCase()] ?? { color: C.primary, bg: C.primaryLight };
                  return (
                    <View key={p.participant_id ?? p.id ?? i} style={[styles.participantRow, isConfirming && { backgroundColor: C.errorBg }]}>
                      <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                        <Text style={[styles.avatarText, { color: av.color }]}>{getInitials(p.name, p.email)}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.participantName} numberOfLines={1}>{p.name || p.email}</Text>
                        {p.name && <Text style={styles.participantEmail} numberOfLines={1}>{p.email}</Text>}
                      </View>
                      {p.role && (
                        <View style={[styles.rolePill, { backgroundColor: rs.bg }]}>
                          <Text style={[styles.rolePillText, { color: rs.color }]}>{p.role}</Text>
                        </View>
                      )}
                      {isConfirming ? (
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmPid(null)}>
                            <Text style={styles.cancelBtnText}>Huỷ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.primaryBtn, styles.primaryBtnSm, { backgroundColor: C.error }]}
                            onPress={() => handleDelete(deleteKey)}
                            disabled={isDeleting}
                          >
                            {isDeleting
                              ? <ActivityIndicator color={C.white} size="small" />
                              : <Text style={styles.primaryBtnText}>Xoá</Text>}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => setConfirmPid(deleteKey)}
                        >
                          <Text style={{ fontSize: 14, color: C.textDim }}>🗑</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {!loading && !error && filtered.length > 0 && !!search && (
              <Text style={[styles.infoBoxSub, { textAlign: "center", marginTop: 6 }]}>
                {filtered.length} / {participants.length} người
              </Text>
            )}
            <View style={{ alignItems: "flex-end", marginTop: 10 }}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLISH MODAL
════════════════════════════════════════════════════════════════ */
function PublishModal({ open, onClose, survey, onPublish }) {
  const [loading, setLoading] = useState(false);
  const isPublished = survey?.is_published;
  const handleConfirm = async () => {
    setLoading(true);
    try { await onPublish(survey.id, { is_published: !isPublished }); onClose(); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={[styles.modalBox, { maxWidth: 380 }]} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isPublished ? "Ẩn khảo sát" : "Publish khảo sát"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={[styles.confirmBox, { backgroundColor: isPublished ? C.warningBg : C.primaryLight }]}>
              <Text style={styles.confirmEmoji}>{isPublished ? "🔒" : "🌐"}</Text>
              <Text style={styles.confirmText}>
                {isPublished
                  ? "Khảo sát sẽ bị ẩn và không còn nhận câu trả lời mới."
                  : "Khảo sát sẽ được công khai và có thể nhận câu trả lời."}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSm, loading && styles.btnDisabled, isPublished && { backgroundColor: C.warning }]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={styles.primaryBtnText}>{isPublished ? "🔒 Ẩn survey" : "🌐 Publish"}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   CLOSE MODAL
════════════════════════════════════════════════════════════════ */
function CloseModal({ open, onClose, survey, onCloseSurvey }) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try { await onCloseSurvey(survey.id); onClose(); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={[styles.modalBox, { maxWidth: 380 }]} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đóng khảo sát</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={[styles.confirmBox, { backgroundColor: C.errorBg }]}>
              <Text style={styles.confirmEmoji}>⛔</Text>
              <Text style={styles.confirmText}>Sau khi đóng, survey sẽ không nhận thêm câu trả lời. Hành động này không thể hoàn tác.</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSm, { backgroundColor: C.error }, loading && styles.btnDisabled]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={styles.primaryBtnText}>⏹ Đóng survey</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUBMISSION VIEWER MODAL
════════════════════════════════════════════════════════════════ */
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await getMySubmission(surveyId);
        if (cancelled) return;
        const raw = res?.data ?? res ?? [];
        const all = Array.isArray(raw)
          ? raw.flatMap(r => r.answers ?? [])
          : (raw.answers ?? []);
        setAnswers(all);
      } catch { if (!cancelled) setError("Không thể tải câu trả lời."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [surveyId]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.submissionModal}>
        {/* Header */}
        <View style={styles.submissionHeader}>
          <TouchableOpacity onPress={onClose} style={styles.submissionBack}>
            <Text style={styles.submissionBackText}>← Đóng</Text>
          </TouchableOpacity>
          <Text style={styles.submissionBrand}>InsightFlow</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={styles.doneBadge}>
              <Text style={styles.doneBadgeText}>✓ Đã hoàn thành</Text>
            </View>
            <Text style={styles.submissionTitle}>{surveyTitle}</Text>
            {!loading && (
              <Text style={styles.infoBoxSub}>{answers.length} câu hỏi</Text>
            )}
          </View>

          {loading && (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <ActivityIndicator color={C.primary} />
              <Text style={[styles.infoBoxSub, { marginTop: 10 }]}>Đang tải...</Text>
            </View>
          )}
          {!loading && !!error && (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Text style={styles.infoBoxSub}>{error}</Text>
            </View>
          )}
          {!loading && !error && answers.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>📭</Text>
              <Text style={styles.infoBoxSub}>Không có câu trả lời.</Text>
            </View>
          )}
          {!loading && !error && answers.map((item, idx) => (
            <AnswerCard key={item.question_id ?? idx} item={item} index={idx} />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function AnswerCard({ item, index }) {
  const isText = item.type === "TEXT";
  const isMultiple = item.type === "MULTIPLE_CHOICE";

  const getAnswerSet = (answer) => {
    if (answer === null || answer === undefined) return new Set();
    if (Array.isArray(answer)) return new Set(answer.map(s => String(s).trim()).filter(Boolean));
    return new Set(String(answer).split(",").map(s => s.trim()).filter(Boolean));
  };
  const answerSet = getAnswerSet(item.answer);
  const hasAnswer = answerSet.size > 0;
  const options = item.options ?? [];

  return (
    <View style={styles.answerCard}>
      <View style={styles.answerCardHeader}>
        <Text style={styles.answerCardIdx}>Câu {index + 1}</Text>
      </View>
      <Text style={styles.answerCardQ}>{item.question}</Text>
      {isText ? (
        item.answer?.trim()
          ? <View style={styles.answerTextBox}><Text style={styles.answerTextContent}>{item.answer}</Text></View>
          : <Text style={styles.noAnswerText}>Không có câu trả lời</Text>
      ) : (
        options.length > 0 ? options.map((opt, i) => {
          const label = typeof opt === "string" ? opt : (opt.label ?? opt.value ?? opt.content ?? "");
          const isSel = answerSet.has(label) || answerSet.has(String(opt.id ?? ""));
          return <AnswerOption key={i} label={label} selected={isSel} isMultiple={isMultiple} />;
        }) : hasAnswer
          ? [...answerSet].map((label, i) => <AnswerOption key={i} label={label} selected isMultiple={isMultiple} />)
          : <Text style={styles.noAnswerText}>Không có câu trả lời</Text>
      )}
    </View>
  );
}

function AnswerOption({ label, selected, isMultiple }) {
  return (
    <View style={[styles.answerOption, selected && styles.answerOptionSel]}>
      <View style={[
        isMultiple ? styles.checkbox : styles.radio,
        selected && (isMultiple ? styles.checkboxSel : styles.radioSel),
      ]}>
        {selected && <Text style={{ color: C.white, fontSize: isMultiple ? 10 : 8 }}>{isMultiple ? "✓" : "●"}</Text>}
      </View>
      <Text style={[styles.answerOptionText, selected && styles.answerOptionTextSel]}>{label}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   STATS STRIP
════════════════════════════════════════════════════════════════ */
function StatsStrip({ mySurveys, total, done, pending, loading }) {
  const stats = [
    { label: "My Surveys",      value: mySurveys, emoji: "📄", color: "#6366f1" },
    { label: "Đã hoàn thành",   value: done,      emoji: "✅", color: "#10b981" },
    { label: "Chưa làm",        value: pending,   emoji: "⚡", color: "#f59e0b" },
    { label: "Tổng khảo sát",   value: total,     emoji: "📊", color: "#ec4899" },
  ];
  return (
    <View style={styles.statsStrip}>
      {stats.map((s, i) => (
        <GlassCard key={i} style={styles.statCard}>
          <Text style={styles.statEmoji}>{s.emoji}</Text>
          <Text style={[styles.statValue, { color: s.color }]}>{loading ? "—" : s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </GlassCard>
      ))}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC SURVEY CARD SKELETON
════════════════════════════════════════════════════════════════ */
function PublicCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.publicCard, { opacity }]}>
      <View style={[styles.cardThumb, { backgroundColor: C.gray100 }]} />
      <View style={{ padding: 14 }}>
        <View style={[styles.skeletonLine, { width: "70%" }]} />
        <View style={[styles.skeletonLine, { width: "100%", marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: "55%", marginTop: 4 }]} />
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC SURVEY CARD
════════════════════════════════════════════════════════════════ */
function PublicSurveyCard({ survey, done, onStart, onViewSubmission, index }) {
  const thumbColor = C.thumbColors[index % C.thumbColors.length];
  const createdDate = survey?.created_at
    ? new Date(survey.created_at).toLocaleDateString("vi-VN")
    : "";

  return (
    <TouchableOpacity
      style={[styles.publicCard, done && styles.publicCardDone]}
      onPress={done ? () => onViewSubmission(survey.id, survey.title) : undefined}
      activeOpacity={done ? 0.75 : 1}
    >
      {/* Thumb */}
      <View style={[styles.cardThumb, { backgroundColor: done ? "#d1fae5" : thumbColor }]}>
        <Text style={styles.cardThumbIcon}>{done ? "✓" : "📋"}</Text>
        <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", gap: 4 }}>
          {done
            ? <View style={styles.donePill}><Text style={styles.donePillText}>✓ Hoàn thành</Text></View>
            : survey.status && <StatusBadge status={survey.status} />}
        </View>
        {done && <View style={styles.doneBar} />}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{survey.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{survey.description || "Không có mô tả"}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>🕐 {createdDate}</Text>
          {done ? (
            <View style={styles.viewResultBtn}>
              <Text style={styles.viewResultBtnText}>Xem kết quả →</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => onStart(survey.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>Bắt đầu →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEY CARD
════════════════════════════════════════════════════════════════ */
function MySurveyCard({
  survey, index,
  onDelete, onUpdate, onShare, onInvite, onPublish, onCloseSurvey,
  onBulkInvite, onGetParticipants, onDeleteParticipant,
}) {
  const navigation = useNavigation();
  const thumbColor = C.thumbColors[index % C.thumbColors.length];
  const [menuOpen, setMenuOpen]     = useState(false);
  const [editing, setEditing]       = useState(false);
  const [title, setTitle]           = useState(survey.title);
  const [description, setDescription] = useState(survey.description || "");
  const [startAt, setStartAt]       = useState(survey.start_at ? survey.start_at.slice(0, 16) : "");
  const [endAt, setEndAt]           = useState(survey.end_at ? survey.end_at.slice(0, 16) : "");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const [shareOpen, setShareOpen]           = useState(false);
  const [inviteOpen, setInviteOpen]         = useState(false);
  const [publishOpen, setPublishOpen]       = useState(false);
  const [closeOpen, setCloseOpen]           = useState(false);
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const isClosed = survey.status === "CLOSED";
  const isPublished = survey.is_published;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(survey.id, { title, description, start_at: startAt || null, end_at: endAt || null });
      setEditing(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert("Xoá survey", "Bạn chắc chắn muốn xoá?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Xoá", style: "destructive", onPress: async () => {
        setDeleting(true);
        try { await onDelete(survey.id); } finally { setDeleting(false); }
      }},
    ]);
  };

  const menuItems = [
    { label: "✏️ Chỉnh sửa",        action: () => { navigation.navigate("SurveyStudio", { surveyId: survey.id }); setMenuOpen(false); } },
    { label: "📊 Phân tích",         action: () => { navigation.navigate("SurveyAnalytics", { surveyId: survey.id }); setMenuOpen(false); } },
    { label: "🔗 Tạo link chia sẻ", action: () => { setShareOpen(true); setMenuOpen(false); } },
    { label: "✉️ Mời người dùng",   action: () => { setInviteOpen(true); setMenuOpen(false); } },
    { label: "👥 Mời hàng loạt",    action: () => { setBulkInviteOpen(true); setMenuOpen(false); } },
    { label: "👤 Xem participants",  action: () => { setParticipantsOpen(true); setMenuOpen(false); } },
    { label: isPublished ? "🔒 Ẩn survey" : "🌐 Publish", action: () => { setPublishOpen(true); setMenuOpen(false); } },
    !isClosed && { label: "⏹ Đóng survey", action: () => { setCloseOpen(true); setMenuOpen(false); } },
    { label: "🗑 Xóa", action: () => { setMenuOpen(false); handleDelete(); }, danger: true },
  ].filter(Boolean);

  return (
    <>
      <TouchableOpacity
        style={[styles.myCard, isClosed && { opacity: 0.7 }]}
        onPress={() => !editing && navigation.navigate("MySurveyDetail", { surveyId: survey.id })}
        activeOpacity={0.88}
      >
        {/* Thumb */}
        <View style={[styles.cardThumb, { backgroundColor: isClosed ? C.gray100 : thumbColor }]}>
          <Text style={styles.cardThumbIcon}>{isClosed ? "⏹" : "📋"}</Text>
          <View style={{ position: "absolute", top: 8, left: 8 }}>
            <StatusBadge status={survey.status} />
            {isPublished && (
              <View style={[styles.badge, { backgroundColor: "rgba(67,97,238,0.18)", marginTop: 4 }]}>
                <Text style={[styles.badgeText, { color: C.primary }]}>🌐 Live</Text>
              </View>
            )}
          </View>
          {/* Quick action buttons */}
          {!editing && (
            <View style={styles.thumbActions}>
              {[
                { e: "🔗", onPress: () => setShareOpen(true) },
                { e: "✉️", onPress: () => setInviteOpen(true) },
                { e: "👥", onPress: () => setBulkInviteOpen(true) },
                { e: "👤", onPress: () => setParticipantsOpen(true) },
                { e: isPublished ? "🔒" : "🌐", onPress: () => setPublishOpen(true) },
                !isClosed && { e: "⏹", onPress: () => setCloseOpen(true) },
              ].filter(Boolean).map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.thumbActionBtn}
                  onPress={e => { e.stopPropagation?.(); btn.onPress(); }}
                >
                  <Text style={{ fontSize: 12 }}>{btn.e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Menu button */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={e => { e.stopPropagation?.(); setMenuOpen(true); }}
          >
            <Text style={{ fontSize: 16, color: C.textSub }}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          {editing ? (
            <View style={{ gap: 8 }}>
              <TextInput
                style={styles.editInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Tiêu đề"
                placeholderTextColor={C.textDim}
              />
              <TextInput
                style={[styles.editInput, { minHeight: 60 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả"
                placeholderTextColor={C.textDim}
                multiline
                textAlignVertical="top"
              />
              <TextInput
                style={styles.editInput}
                value={startAt}
                onChangeText={setStartAt}
                placeholder="Bắt đầu (YYYY-MM-DDTHH:MM)"
                placeholderTextColor={C.textDim}
              />
              <TextInput
                style={styles.editInput}
                value={endAt}
                onChangeText={setEndAt}
                placeholder="Kết thúc (YYYY-MM-DDTHH:MM)"
                placeholderTextColor={C.textDim}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.primaryBtnSm, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <Text style={styles.primaryBtnText}>✓ Lưu</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.cardTitle} numberOfLines={1}>{survey.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{survey.description || "Không có mô tả"}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  📅 {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
                </Text>
                {deleting && <ActivityIndicator size="small" color={C.error} />}
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Context menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <TouchableOpacity style={[styles.modalBox, { maxWidth: 260, padding: 0, overflow: "hidden" }]} activeOpacity={1}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i > 0 && { borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" }]}
                onPress={item.action}
              >
                <Text style={[styles.menuItemText, item.danger && { color: C.error }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ShareLinkModal open={shareOpen} onClose={() => setShareOpen(false)} survey={survey} onShare={onShare} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} survey={survey} onInvite={onInvite} />
      <PublishModal open={publishOpen} onClose={() => setPublishOpen(false)} survey={survey} onPublish={onPublish} />
      <CloseModal open={closeOpen} onClose={() => setCloseOpen(false)} survey={survey} onCloseSurvey={onCloseSurvey} />
      <BulkInviteModal open={bulkInviteOpen} onClose={() => setBulkInviteOpen(false)} survey={survey} onBulkInvite={onBulkInvite} />
      <ParticipantsModal open={participantsOpen} onClose={() => setParticipantsOpen(false)} survey={survey} onGetParticipants={onGetParticipants} onDeleteParticipant={onDeleteParticipant} />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
const PUBLIC_TABS = [
  { key: "all",     label: "Tất cả" },
  { key: "pending", label: "Chưa làm" },
  { key: "done",    label: "Đã hoàn thành" },
];

export default function SurveysLayout() {
  const navigation = useNavigation();
  const {
    mySurveys, publicSurveys: providerPublicSurveys, loading: myLoading,
    fetchMySurveys, updateSurvey, deleteSurvey,
    closeSurvey, publishSurvey, shareLink, inviteSurvey,
    fetchPublicSurveys, bulkInviteSurvey, getParticipants, deleteParticipant,
  } = useSurvey();
  const { getAllMyResponses } = useResponse();

  const [mySearch, setMySearch]           = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [myExpanded, setMyExpanded]       = useState(false);
  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError]     = useState(null);
  const [modalSurvey, setModalSurvey]     = useState(null);
  const [publicSearch, setPublicSearch]   = useState("");
  const [activeTab, setActiveTab]         = useState("all");
  const [sortBy, setSortBy]               = useState("newest");
  const [viewMode, setViewMode]           = useState("grid");
  const [showFilter, setShowFilter]       = useState(false);
  const [globalSearch, setGlobalSearch]   = useState("");
  const [refreshing, setRefreshing]       = useState(false);
  const [shareModal, setShareModal]       = useState({ open: false, surveyId: null, surveyTitle: "", shareUrl: "", loading: false, error: "" });

  useEffect(() => { fetchMySurveys(1, 20); }, []);

  const handleShare = useCallback((surveyId) => {
    const s = mySurveys.find(x => x.id === surveyId);
    setShareModal({ open: true, surveyId, surveyTitle: s?.title || "", shareUrl: "", loading: false, error: "" });
  }, [mySurveys]);

  const handleGenerateLink = useCallback(async () => {
    setShareModal(p => ({ ...p, loading: true, error: "" }));
    try {
      const result = await shareLink(shareModal.surveyId);
      const url = typeof result === "string" ? result : result?.url ?? result?.data?.url ?? "";
      if (url) {
        setShareModal(p => ({ ...p, shareUrl: url, loading: false }));
      } else {
        setShareModal(p => ({ ...p, loading: false, error: "Không tạo được link. Vui lòng thử lại." }));
      }
    } catch {
      setShareModal(p => ({ ...p, loading: false, error: "Tạo link thất bại. Vui lòng thử lại." }));
    }
  }, [shareModal.surveyId, shareLink]);

  const handleCloseLayout = useCallback(async (surveyId) => {
    try {
      await closeSurvey(surveyId);
      setDoneSurveyIds(prev => { const n = new Set(prev); n.add(surveyId); return n; });
      await fetchMySurveys(1, 20);
    } catch (err) { console.error("Lock error:", err); }
  }, [closeSurvey, fetchMySurveys]);

  const fetchPublicData = useCallback(async () => {
    try {
      setPublicLoading(true); setPublicError(null);
      const [, respResult] = await Promise.allSettled([
        fetchPublicSurveys(),
        getAllMyResponses().catch(() => null),
      ]);
      const resp = respResult.status === "fulfilled" ? respResult.value : null;
      const ids = new Set((resp?.data ?? resp ?? []).map(r => r.survey_id ?? r.surveyId));
      setDoneSurveyIds(ids);
    } catch { setPublicError("Không thể tải danh sách khảo sát."); }
    finally { setPublicLoading(false); }
  }, []);

  useEffect(() => { fetchPublicData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchMySurveys(1, 20), fetchPublicData()]);
    setRefreshing(false);
  };

  const handleGlobalSearch = (v) => {
    setGlobalSearch(v); setMySearch(v); setPublicSearch(v);
  };

  const myFiltered = mySurveys.filter(s =>
    s.title?.toLowerCase().includes(mySearch.toLowerCase())
  );
  const publicSurveys = providerPublicSurveys;

  const displayed = useMemo(() => {
    let list = [...publicSurveys];
    if (activeTab === "pending") list = list.filter(s => !doneSurveyIds.has(s.id));
    if (activeTab === "done")    list = list.filter(s => doneSurveyIds.has(s.id));
    if (publicSearch.trim()) {
      const q = publicSearch.toLowerCase();
      list = list.filter(s => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "name")   list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [publicSurveys, doneSurveyIds, activeTab, publicSearch, sortBy]);

  const totalCount   = publicSurveys.length;
  const doneCount    = publicSurveys.filter(s => doneSurveyIds.has(s.id)).length;
  const pendingCount = publicSurveys.filter(s => !doneSurveyIds.has(s.id)).length;

  const visibleMySurveys = (myExpanded || showCreateForm)
    ? myFiltered
    : myFiltered.slice(0, MY_SURVEYS_PREVIEW);
  const hasMoreMySurveys = myFiltered.length > MY_SURVEYS_PREVIEW;

  const tabCounts = { all: totalCount, pending: pendingCount, done: doneCount };

  const numColumns = viewMode === "grid" ? (SW >= 640 ? 3 : 2) : 1;

  return (
    <View style={styles.screen}>
      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
        />
      )}

      <ShareLinkModal
        open={shareModal.open}
        onClose={() => setShareModal(p => ({ ...p, open: false }))}
        survey={{ id: shareModal.surveyId, title: shareModal.surveyTitle }}
        onShare={async (surveyId) => {
          setShareModal(p => ({ ...p, loading: true, error: "" }));
          try {
            const result = await shareLink(surveyId);
            const url = typeof result === "string" ? result : result?.url ?? result?.data?.url ?? "";
            setShareModal(p => ({ ...p, shareUrl: url, loading: false }));
            return url;
          } catch {
            setShareModal(p => ({ ...p, loading: false, error: "Tạo link thất bại. Vui lòng thử lại." }));
          }
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
          }
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.heroInner}>
              <View style={styles.heroIconRow}>
                <View style={styles.heroIconBox}>
                  <Text style={{ fontSize: 18 }}>🚀</Text>
                </View>
                <Text style={styles.heroLabel}>Survey studio</Text>
              </View>
              <Text style={styles.heroTitle}>Không gian khảo sát</Text>
              <Text style={styles.heroSub}>
                Tìm nhanh, tạo mới và tham gia khảo sát công khai.
              </Text>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{mySurveys.length} của tôi</Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.24)" }]}>
                  <Text style={[styles.heroBadgeText, { color: "#047857" }]}>{totalCount} công khai</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Global search ── */}
          <View style={styles.globalSearchRow}>
            <Text style={{ color: C.primary, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={styles.globalSearchInput}
              value={globalSearch}
              onChangeText={handleGlobalSearch}
              placeholder="Tìm nhanh toàn trang..."
              placeholderTextColor={C.textDim}
              returnKeyType="search"
            />
            {!!globalSearch && (
              <TouchableOpacity onPress={() => handleGlobalSearch("")}>
                <Text style={{ color: C.textDim }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Stats ── */}
          <StatsStrip
            mySurveys={mySurveys.length}
            total={totalCount}
            done={doneCount}
            pending={pendingCount}
            loading={myLoading || publicLoading}
          />

          {/* ════ MY SURVEYS ════ */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.sectionTitle}>My Surveys</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{myFiltered.length}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionChip, showCreateForm && styles.actionChipActive]}
                onPress={() => { setShowCreateForm(v => !v); if (!showCreateForm) setMyExpanded(true); }}
              >
                <Text style={[styles.actionChipText, !showCreateForm && { color: C.white }]}>
                  {showCreateForm ? "✕ Huỷ" : "+ Tạo mới"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* My search */}
          <View style={[styles.globalSearchRow, { marginBottom: 12, marginHorizontal: 16 }]}>
            <Text style={{ color: C.textSub, marginRight: 6 }}>🔍</Text>
            <TextInput
              style={styles.globalSearchInput}
              value={mySearch}
              onChangeText={setMySearch}
              placeholder="Tìm survey của tôi..."
              placeholderTextColor={C.textDim}
            />
            {!!mySearch && (
              <TouchableOpacity onPress={() => setMySearch("")}>
                <Text style={{ color: C.textDim }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {myLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator color={C.primary} size="large" />
            </View>
          ) : (
            <>
              {showCreateForm && (
                <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                  <CreateSurveyComposer
                    onCancel={() => setShowCreateForm(false)}
                    onSuccess={() => { setShowCreateForm(false); setMyExpanded(true); fetchMySurveys(1, 20); }}
                  />
                </View>
              )}

              {myFiltered.length === 0 ? (
                <GlassCard style={{ alignItems: "center", padding: 40, marginHorizontal: 16 }}>
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>📭</Text>
                  <Text style={styles.emptyTitle}>{mySearch ? `Không tìm thấy "${mySearch}"` : "Chưa có survey nào"}</Text>
                  <Text style={styles.infoBoxSub}>{mySearch ? "Thử từ khoá khác" : "Hãy tạo survey đầu tiên"}</Text>
                </GlassCard>
              ) : (
                <>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 14 }}>
                    {visibleMySurveys.map((survey, index) => (
                      <SurveyCardHome
                        key={survey.id}
                        survey={survey}
                        index={index}
                        onClick={() => navigation.navigate("SurveyStudio", { surveyId: survey.id })}
                        type="my"
                        onShare={handleShare}
                        onLock={handleCloseLayout}
                      />
                    ))}
                  </View>

                  {hasMoreMySurveys && !showCreateForm && (
                    <TouchableOpacity
                      style={styles.expandBtn}
                      onPress={() => setMyExpanded(v => !v)}
                    >
                      <Text style={styles.expandBtnText}>
                        {myExpanded ? "△ Thu gọn" : `▽ Xem thêm ${myFiltered.length - MY_SURVEYS_PREVIEW} survey`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}

          {/* ════ DIVIDER ════ */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerPill}>
              <Text style={styles.dividerPillText}>🌐 Khảo sát công khai</Text>
            </View>
            <View style={styles.dividerLine} />
          </View>

          {/* ════ PUBLIC SURVEYS ════ */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.sectionTitle}>Khảo Sát</Text>
              {!publicLoading && (
                <View style={[styles.countBadge, { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.25)" }]}>
                  <Text style={[styles.countBadgeText, { color: C.success }]}>{totalCount}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity
                style={[styles.iconChip, viewMode === "grid" && styles.iconChipActive]}
                onPress={() => setViewMode("grid")}
              >
                <Text style={{ fontSize: 13 }}>⊞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconChip, viewMode === "list" && styles.iconChipActive]}
                onPress={() => setViewMode("list")}
              >
                <Text style={{ fontSize: 13 }}>☰</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconChip, showFilter && styles.iconChipActive]}
                onPress={() => setShowFilter(v => !v)}
              >
                <Text style={{ fontSize: 13 }}>⚙</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconChip} onPress={fetchPublicData}>
                <Text style={{ fontSize: 13 }}>↻</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: 16, marginBottom: 10 }}
          >
            <View style={styles.tabRow}>
              {PUBLIC_TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tab, isActive && styles.tabActive]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                      {tab.label}
                      {!publicLoading && ` (${tabCounts[tab.key]})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Public search */}
          <View style={[styles.globalSearchRow, { marginBottom: 10, marginHorizontal: 16 }]}>
            <Text style={{ color: C.textSub, marginRight: 6 }}>🔍</Text>
            <TextInput
              style={styles.globalSearchInput}
              value={publicSearch}
              onChangeText={setPublicSearch}
              placeholder="Tìm khảo sát..."
              placeholderTextColor={C.textDim}
            />
            {!!publicSearch && (
              <TouchableOpacity onPress={() => setPublicSearch("")}>
                <Text style={{ color: C.textDim }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter panel */}
          {showFilter && (
            <GlassCard style={{ marginHorizontal: 16, marginBottom: 12, padding: 14 }}>
              <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Sắp xếp theo</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {[
                  { key: "newest", label: "Mới nhất" },
                  { key: "oldest", label: "Cũ nhất" },
                  { key: "name",   label: "Tên A-Z" },
                ].map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.sortBtn, sortBy === item.key && styles.sortBtnActive]}
                    onPress={() => setSortBy(item.key)}
                  >
                    <Text style={[styles.sortBtnText, sortBy === item.key && styles.sortBtnTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setPublicSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }}
                >
                  <Text style={styles.cancelBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {/* Public list */}
          {publicLoading ? (
            <View style={[styles.myGrid, { marginHorizontal: 16 }]}>
              {Array(6).fill(0).map((_, i) => <PublicCardSkeleton key={i} />)}
            </View>
          ) : publicError ? (
            <GlassCard style={{ alignItems: "center", padding: 40, marginHorizontal: 16 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>⚠️</Text>
              <Text style={styles.infoBoxSub}>{publicError}</Text>
              <TouchableOpacity onPress={fetchPublicData} style={{ marginTop: 10 }}>
                <Text style={{ color: C.primary, fontWeight: "700" }}>Thử lại</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : displayed.length === 0 ? (
            <GlassCard style={{ alignItems: "center", padding: 40, marginHorizontal: 16 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>📭</Text>
              <Text style={styles.emptyTitle}>{publicSearch ? `Không tìm thấy "${publicSearch}"` : "Không có khảo sát nào"}</Text>
            </GlassCard>
          ) : (
            <>
              <Text style={styles.resultCount}>
                {displayed.length} khảo sát
                {!!publicSearch && ` · "${publicSearch}"`}
                {doneCount > 0 && `  •  ${doneCount} đã hoàn thành`}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 14 }}>
                {displayed.map((survey, i) => (
                  <SurveyCardHome
                    key={survey.id}
                    survey={survey}
                    index={i}
                    overrideStatus={doneSurveyIds.has(survey.id) ? "COMPLETED" : null}
                    onClick={() =>
                      doneSurveyIds.has(survey.id)
                        ? navigation.navigate("PublicSurveyDetail", { surveyId: survey.id, forceResponse: true })
                        : navigation.navigate("SurveyTake", { surveyId: survey.id })
                    }
                    type="public"
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 48 },

  // ── Glass card ────────────────────────────────────────────────
  glassCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  // ── Badge ─────────────────────────────────────────────────────
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "700" },

  // ── Hero ──────────────────────────────────────────────────────
  hero: { margin: 16, borderRadius: 24, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 1, borderColor: C.glassBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  heroInner: { padding: 24 },
  heroIconRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  heroIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" },
  heroLabel: { fontSize: 11, fontWeight: "800", color: C.primary, letterSpacing: 1.5, textTransform: "uppercase" },
  heroTitle: { fontSize: 26, fontWeight: "900", color: C.text, marginBottom: 8 },
  heroSub: { fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 14 },
  heroBadgeRow: { flexDirection: "row", gap: 8 },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(99,102,241,0.12)", borderWidth: 1, borderColor: "rgba(99,102,241,0.28)" },
  heroBadgeText: { fontSize: 11, fontWeight: "700", color: "#4338ca" },

  // ── Global search ─────────────────────────────────────────────
  globalSearchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 999, borderWidth: 1, borderColor: C.glassBorder },
  globalSearchInput: { flex: 1, fontSize: 14, color: C.text },

  // ── Stats ─────────────────────────────────────────────────────
  statsStrip: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginHorizontal: 16, marginBottom: 24 },
  statCard: { flex: 1, minWidth: "44%", padding: 14, alignItems: "flex-start", gap: 4 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 24, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "700", color: C.textSub, letterSpacing: 0.5 },

  // ── Section header ────────────────────────────────────────────
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder },
  countBadgeText: { fontSize: 11, fontWeight: "700", color: C.primary },
  actionChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: C.primary },
  actionChipActive: { backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  actionChipText: { fontSize: 12, fontWeight: "700", color: C.white },

  // ── My survey grid ────────────────────────────────────────────
  myGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginHorizontal: 16, marginBottom: 8 },
  myCard: { flex: 1, minWidth: SW < 640 ? "44%" : "30%", backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 18, borderWidth: 1, borderColor: C.glassBorder, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  publicCard: { flex: 1, minWidth: SW < 640 ? "44%" : "30%", backgroundColor: "rgba(255,255,255,0.84)", borderRadius: 18, borderWidth: 1, borderColor: C.glassBorder, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  publicCardDone: { borderColor: "rgba(16,185,129,0.28)" },

  cardThumb: { height: 110, alignItems: "center", justifyContent: "center", position: "relative" },
  cardThumbIcon: { fontSize: 36, opacity: 0.25 },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 4, lineHeight: 18 },
  cardDesc: { fontSize: 12, color: C.textSub, lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardDate: { fontSize: 11, color: C.textDim },

  // ── Thumb actions ─────────────────────────────────────────────
  thumbActions: { position: "absolute", bottom: 6, left: 6, flexDirection: "row", gap: 4, flexWrap: "wrap" },
  thumbActionBtn: { width: 26, height: 26, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  menuBtn: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },

  // ── Done pill / bar ───────────────────────────────────────────
  donePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(220,252,231,0.9)", borderWidth: 1, borderColor: "#a7f3d0" },
  donePillText: { fontSize: 10, fontWeight: "700", color: "#059669" },
  doneBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "#10b981" },

  // ── Start / result buttons ────────────────────────────────────
  startBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  startBtnText: { fontSize: 11, fontWeight: "700", color: C.white },
  viewResultBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(220,252,231,0.9)", borderWidth: 1, borderColor: "#a7f3d0" },
  viewResultBtnText: { fontSize: 11, fontWeight: "700", color: "#059669" },

  // ── Expand button ─────────────────────────────────────────────
  expandBtn: { alignSelf: "center", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", marginTop: 6, marginBottom: 16 },
  expandBtnText: { fontSize: 12, fontWeight: "600", color: C.textSub },

  // ── Divider ───────────────────────────────────────────────────
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginVertical: 28 },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 1 },
  dividerPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.9)", borderWidth: 1, borderColor: "rgba(255,255,255,0.85)" },
  dividerPillText: { fontSize: 10, fontWeight: "800", color: C.text, letterSpacing: 1 },

  // ── Tabs ──────────────────────────────────────────────────────
  tabRow: { flexDirection: "row", gap: 4, backgroundColor: "rgba(255,255,255,0.6)", padding: 3, borderRadius: 11, borderWidth: 1, borderColor: "rgba(0,0,0,0.07)" },
  tab: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  tabActive: { backgroundColor: "rgba(255,255,255,0.95)", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 11, fontWeight: "700", color: C.textSub },
  tabTextActive: { color: C.primary },

  // ── Icon chips ────────────────────────────────────────────────
  iconChip: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  iconChipActive: { backgroundColor: C.primaryLight, borderColor: C.primaryBorder },

  // ── Sort ──────────────────────────────────────────────────────
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", backgroundColor: "rgba(255,255,255,0.7)" },
  sortBtnActive: { borderColor: C.primaryBorder, backgroundColor: C.primaryLight },
  sortBtnText: { fontSize: 11, fontWeight: "600", color: C.textSub },
  sortBtnTextActive: { color: C.primary },

  // ── Result count ──────────────────────────────────────────────
  resultCount: { fontSize: 11, color: C.textSub, marginHorizontal: 16, marginBottom: 10 },

  // ── Skeleton ──────────────────────────────────────────────────
  skeletonLine: { height: 11, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 5 },

  // ── Modal ─────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,17,23,0.55)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox: { width: "100%", maxWidth: 460, backgroundColor: "rgba(255,255,255,0.96)", borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: C.glassBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 10 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  modalTitle: { fontSize: 14, fontWeight: "800", color: C.text },
  modalClose: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" },
  modalCloseText: { fontSize: 13, color: C.textSub },
  modalBody: { padding: 18, gap: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },

  // ── Info box ──────────────────────────────────────────────────
  infoBox: { padding: 12, backgroundColor: "rgba(67,97,238,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(67,97,238,0.2)" },
  infoBoxTitle: { fontSize: 13, fontWeight: "700", color: C.text },
  infoBoxSub: { fontSize: 12, color: C.textSub, marginTop: 2 },

  // ── Error / success rows ──────────────────────────────────────
  errorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, borderRadius: 10, backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder },
  errorText: { fontSize: 12, color: C.error, flex: 1 },
  retryBtn: { fontSize: 11, fontWeight: "700", color: C.error, marginLeft: 8 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder },
  successText: { fontSize: 12, fontWeight: "600", color: "#059669", flex: 1 },

  // ── Inputs ────────────────────────────────────────────────────
  textarea: { width: "100%", padding: 10, backgroundColor: "rgba(255,255,255,0.8)", borderWidth: 1.5, borderColor: "rgba(0,0,0,0.1)", borderRadius: 10, fontSize: 13, color: C.text, minHeight: 90 },
  inputError: { borderColor: C.error },
  editInput: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.8)", borderWidth: 1, borderColor: "rgba(0,0,0,0.1)", borderRadius: 9, fontSize: 12, color: C.text },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: C.textSub, textTransform: "uppercase", letterSpacing: 0.6 },

  // ── Buttons ───────────────────────────────────────────────────
  primaryBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  primaryBtnSm: { paddingVertical: 9, paddingHorizontal: 16 },
  primaryBtnText: { fontSize: 13, fontWeight: "700", color: C.white },
  cancelBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  cancelBtnText: { fontSize: 12, fontWeight: "600", color: C.textSub },
  btnDisabled: { backgroundColor: "rgba(0,0,0,0.07)", shadowOpacity: 0, elevation: 0 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },

  // ── URL box ───────────────────────────────────────────────────
  urlBox: { gap: 8 },
  urlText: { fontSize: 12, color: C.text, padding: 10, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(67,97,238,0.2)", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  copyBtn: { padding: 10, borderRadius: 10, backgroundColor: "rgba(67,97,238,0.08)", borderWidth: 1, borderColor: "rgba(67,97,238,0.3)", alignItems: "center" },
  copyBtnDone: { backgroundColor: C.successBg, borderColor: C.successBorder },
  copyBtnText: { fontSize: 12, fontWeight: "700", color: C.primary },

  // ── Bulk invite ───────────────────────────────────────────────
  bulkIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  emailCountBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: C.primaryLight },
  emailCountText: { fontSize: 11, fontWeight: "700", color: C.primary },
  roleRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  roleBtn: { flex: 1, padding: 9, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.08)", alignItems: "center", backgroundColor: "rgba(255,255,255,0.6)" },
  roleBtnActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  roleBtnLabel: { fontSize: 12, fontWeight: "700", color: C.text },
  roleBtnLabelActive: { color: C.primary },
  roleBtnDesc: { fontSize: 10, color: C.textDim, marginTop: 2 },

  // ── Participants ──────────────────────────────────────────────
  searchRow: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: "rgba(0,0,0,0.07)" },
  searchInput: { flex: 1, fontSize: 12, color: C.text },
  participantRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 12, fontWeight: "700" },
  participantName: { fontSize: 12, fontWeight: "600", color: C.text },
  participantEmail: { fontSize: 11, color: C.textSub },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  rolePillText: { fontSize: 10, fontWeight: "700" },
  reloadBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" },
  reloadBtnText: { fontSize: 12, fontWeight: "600", color: C.textSub },

  // ── Publish/Close confirm ─────────────────────────────────────
  confirmBox: { borderRadius: 14, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  confirmEmoji: { fontSize: 36, marginBottom: 10 },
  confirmText: { fontSize: 13, fontWeight: "600", color: C.text, textAlign: "center", lineHeight: 20 },

  // ── Submission modal ──────────────────────────────────────────
  submissionModal: { flex: 1, backgroundColor: "rgba(245,247,250,0.98)" },
  submissionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, backgroundColor: "rgba(255,255,255,0.9)", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  submissionBack: { paddingHorizontal: 10, paddingVertical: 4 },
  submissionBackText: { fontSize: 13, fontWeight: "600", color: C.textSub },
  submissionBrand: { fontSize: 12, fontWeight: "700", color: C.textSub },
  submissionTitle: { fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 4, textAlign: "center" },
  doneBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(220,252,231,0.9)", borderWidth: 1, borderColor: "#86efac", marginBottom: 10 },
  doneBadgeText: { fontSize: 11, fontWeight: "700", color: "#15803d", letterSpacing: 0.6 },

  // ── Answer card ───────────────────────────────────────────────
  answerCard: { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, borderWidth: 1, borderColor: C.glassBorder, overflow: "hidden", marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  answerCardHeader: { flexDirection: "row", justifyContent: "space-between", padding: 14, paddingBottom: 6 },
  answerCardIdx: { fontSize: 11, color: C.textSub },
  answerCardQ: { fontSize: 13, fontWeight: "700", color: C.text, marginHorizontal: 14, marginBottom: 10, lineHeight: 20 },
  answerTextBox: { margin: 14, marginTop: 0, padding: 11, backgroundColor: "rgba(248,250,255,0.8)", borderWidth: 1, borderColor: C.gray200, borderRadius: 10 },
  answerTextContent: { fontSize: 12, color: C.gray700, lineHeight: 20 },
  noAnswerText: { fontSize: 12, color: C.textDim, fontStyle: "italic", marginHorizontal: 14, marginBottom: 14 },
  answerOption: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 14, marginBottom: 6, padding: 9, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, backgroundColor: "rgba(250,250,250,0.8)" },
  answerOptionSel: { borderColor: "#bfdbfe", backgroundColor: "rgba(239,246,255,0.9)" },
  answerOptionText: { fontSize: 12, color: C.gray500, flex: 1 },
  answerOptionTextSel: { color: "#1e40af", fontWeight: "600" },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.gray200, alignItems: "center", justifyContent: "center" },
  radioSel: { borderColor: "#2563eb" },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: C.gray200, alignItems: "center", justifyContent: "center" },
  checkboxSel: { borderColor: "#2563eb", backgroundColor: "#2563eb" },

  // ── Context menu ──────────────────────────────────────────────
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuItemText: { fontSize: 13, color: C.text },

  // ── Empty ─────────────────────────────────────────────────────
  emptyTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 },
}); 
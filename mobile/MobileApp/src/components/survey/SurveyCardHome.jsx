// src/components/survey/SurveyCardHome.jsx
// Premium mesh gradient card — React Native version, matching web design
import React, { useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ClipboardList, Calendar, Lock, Share, Users,
} from "lucide-react-native";

const { width: SCREEN_W } = Dimensions.get("window");
export const CARD_W = (SCREEN_W - 32 - 10) / 2; // 2-col grid with 16px margin each side + 10px gap
export const CARD_H = 196;

/* ── Design tokens (matching web SC) ──────────────────────────── */
export const SC = {
  surface:    "#ffffff",
  surfaceHigh:"#f8fafc",
  primary:    "#4361ee",
  primaryLight: "#eef0fd",
  primaryBorder: "#c5cdfb",
  text:       "#0f172a",
  textSub:    "#64748b",
  textDim:    "#94a3b8",
  success:    "#10b981",
  font:       "'DM Sans', 'Plus Jakarta Sans', sans-serif",
};

export const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",  color: "#10b981", bg: "#d1fae5" },
  COMPLETED: { label: "Đã xong",   color: "#6366f1", bg: "#ede9fe" },
  DRAFT:     { label: "Nháp",      color: "#6b7280", bg: "#f3f4f6" },
  EXPIRED:   { label: "Hết hạn",   color: "#dc2626", bg: "#fee2e2" },
  CLOSED:    { label: "Đã đóng",   color: "#6b7280", bg: "#f3f4f6" },
  SCHEDULED: { label: "Lên lịch",  color: "#d97706", bg: "#fef3c7" },
};

const STATUS_COLORS = {
  ACTIVE:    { color: "#10b981" },
  COMPLETED: { color: "#6366f1" },
  DRAFT:     { color: "#6b7280" },
  EXPIRED:   { color: "#ef4444" },
  CLOSED:    { color: "#6b7280" },
  SCHEDULED: { color: "#d97706" },
};

const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fce7f3", color: "#be185d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#ede9fe", color: "#6d28d9" },
  { bg: "#ffe4e6", color: "#9f1239" },
  { bg: "#e0f2fe", color: "#0369a1" },
];

function getInitials(name, email) {
  if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (email || "?")[0].toUpperCase();
}

/* ── Time formatter ───────────────────────────────────────────── */
export function formatSurveyTime(survey) {
  if (!survey) return "Không rõ";
  const now = new Date();
  if (survey.end_at) {
    const end = new Date(survey.end_at);
    if (end < now) return `Hết hạn · ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
    return `Còn · ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
  }
  if (survey.start_at) {
    const start = new Date(survey.start_at);
    if (start > now) return `Sắp tới · ${start.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}`;
  }
  return "Không giới hạn";
}

/* ── Participants Avatars ────────────────────────────────────── */
export function ParticipantsAvatars({ participants, max = 3, size = 22 }) {
  if (!participants || participants.length === 0) return null;
  const visible = participants.slice(0, max);
  const extra   = participants.length - max;
  const fontSize = size * 0.38;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ flexDirection: "row" }}>
        {visible.map((p, i) => {
          const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <View
              key={p.id || p.participant_id || i}
              title={p.email || p.name || ""}
              style={{
                width: size, height: size, borderRadius: size / 2,
                borderWidth: 2, borderColor: "#fff",
                backgroundColor: ac.bg,
                alignItems: "center", justifyContent: "center",
                marginLeft: i === 0 ? 0 : -(size * 0.28),
                zIndex: visible.length - i,
                position: "relative",
              }}
            >
              <Text style={{ fontSize, fontWeight: "700", color: ac.color }}>
                {getInitials(p.name, p.email)}
              </Text>
            </View>
          );
        })}
      </View>
      {extra > 0 && (
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 2, borderColor: "#fff",
          backgroundColor: "#f1f5f9",
          alignItems: "center", justifyContent: "center",
          marginLeft: -(size * 0.28), zIndex: 0,
        }}>
          <Text style={{ fontSize, fontWeight: "700", color: SC.textSub }}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ── SurveyCardHome — premium card ────────────────────────────── */
export function SurveyCardHome({
  survey,
  index = 0,
  onClick,
  type = "my",
  overrideStatus = null,
  onShare,
  onLock,
}) {
  const slideAnim   = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(0.75)).current;

  const effectiveStatus = overrideStatus || survey.status;
  const isActive   = effectiveStatus === "ACTIVE";
  const isOwner    = type === "my";
  const statusColor = STATUS_COLORS[effectiveStatus]?.color || "#6b7280";

  React.useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1, duration: 400,
        delay: (0.1 + index * 0.08) * 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 400,
        delay: (0.1 + index * 0.08) * 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation for ACTIVE status
  React.useEffect(() => {
    if (!isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.75, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive]);

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onClick}
        style={cardStyles.root}
      >
        {/* ── Header: Mesh Gradient ── */}
        <View style={cardStyles.header}>
          {/* Status Badge */}
          <View style={cardStyles.statusBadge}>
            {isActive && (
              <Animated.View
                style={[
                  cardStyles.pulseDot,
                  {
                    backgroundColor: statusColor,
                    opacity: pulseAnim,
                    transform: [{ scale: 2 }],
                  },
                ]}
              />
            )}
            <Text style={[cardStyles.statusText, { color: statusColor }]}>
              {STATUS_MAP[effectiveStatus]?.label}
            </Text>
          </View>

          {/* Action Buttons */}
          {isOwner && (
            <View style={cardStyles.actions}>
              {onLock && (
                <TouchableOpacity
                  style={cardStyles.actionBtn}
                  onPress={(e) => { e.stopPropagation(); onLock(survey.id); }}
                  activeOpacity={0.7}
                >
                  <Lock size={11} color="#374151" />
                </TouchableOpacity>
              )}
              {onShare && (
                <TouchableOpacity
                  style={cardStyles.actionBtn}
                  onPress={(e) => { e.stopPropagation(); onShare(survey.id); }}
                  activeOpacity={0.7}
                >
                  <Share size={11} color="#374151" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Central Icon */}
          <View style={cardStyles.centerIcon}>
            <View style={cardStyles.iconInner}>
              <ClipboardList size={18} color="rgba(67,97,238,0.9)" strokeWidth={1.5} />
            </View>
          </View>

          {/* Bottom gradient blur */}
          <View style={cardStyles.gradientFade} />
        </View>

        {/* ── Body ── */}
        <View style={cardStyles.body}>
          <Text style={cardStyles.title} numberOfLines={2}>
            {survey.title}
          </Text>
          <Text style={cardStyles.description} numberOfLines={2}>
            {survey.description || "Không có mô tả"}
          </Text>

          {/* Footer */}
          <View style={cardStyles.footer}>
            <View style={cardStyles.footerLeft}>
              <View style={cardStyles.calendarBox}>
                <Calendar size={12} color={SC.textDim} />
              </View>
              <View>
                <Text style={cardStyles.footerLabel}>Thời gian</Text>
                <Text style={cardStyles.footerValue}>
                  {formatSurveyTime(survey)}
                </Text>
              </View>
            </View>

            {/* Participants */}
            {(survey.participants && survey.participants.length > 0) ? (
              <ParticipantsAvatars participants={survey.participants} />
            ) : (survey.participant_count != null && survey.participant_count > 0) ? (
              <View style={cardStyles.participantBadge}>
                <Users size={10} color="#16a34a" />
                <Text style={cardStyles.participantCount}>
                  {survey.participant_count}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Styles ────────────────────────────────────────────────────── */
const cardStyles = StyleSheet.create({
  root: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: SC.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8ecf0",
  },
  header: {
    height: 96,
    backgroundColor: "#eef2ff",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    zIndex: 10,
  },
  pulseDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    left: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actions: {
    position: "absolute",
    top: 8,
    right: 10,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    zIndex: 5,
  },
  iconInner: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  gradientFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.5)",
  },
  body: {
    backgroundColor: SC.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: SC.text,
    lineHeight: 18,
    letterSpacing: -0.01,
  },
  description: {
    fontSize: 11,
    color: SC.textSub,
    lineHeight: 16,
    opacity: 0.85,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calendarBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e8ecf5",
    alignItems: "center",
    justifyContent: "center",
  },
  footerLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: SC.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.08,
  },
  footerValue: {
    fontSize: 10,
    fontWeight: "600",
    color: SC.textSub,
  },
  participantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  participantCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16a34a",
  },
});

export default SurveyCardHome;

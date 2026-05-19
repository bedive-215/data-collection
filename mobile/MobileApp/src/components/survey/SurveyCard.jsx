// src/components/survey/SurveyCard.jsx
// Shared SurveyCard for both HomeScreen and Surveyspage
// Matches Surveyspage design exactly
import React, { useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from "react-native";
import { COLORS } from "../../utils/constants";

/* ─── Icons ───────────────────────────────────────────────── */
let IconSet = {};
try { IconSet = require("lucide-react-native"); } catch {}
const Icon = ({ name, size = 16, color = "#64748b" }) => {
  const Comp = IconSet[name];
  if (!Comp) return <Text style={{ fontSize: size * 0.75, color }}>■</Text>;
  return <Comp size={size} color={color} />;
};

/* ─── Design tokens (matching Surveyspage) ──────────────── */
const C = {
  bg:           "#f4f5f7",
  surface:      "#ffffff",
  primary:      "#4f6ef7",
  primaryLight: "#eef2ff",
  primaryBorder:"#4f6ef7",
  text:         "#111827",
  textSub:      "#6b7280",
  textDim:      "#9ca3af",
  border:       "#e8ecf5",
  success:      "#16a34a",
  successBg:    "#dcfce7",
  successBorder:"#bbf7d0",
  done:         "#f0fdf4",
  doneBorder:   "#bbf7d0",
};

/* ─── Survey Card ───────────────────────────────────────── */
export function SurveyCard({ survey, done, onStart, onViewSubmission, viewMode = "grid", index = 0 }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const createdDate = survey?.created_at
    ? new Date(survey.created_at).toLocaleDateString("vi-VN")
    : "";
  const isListMode = viewMode === "list";

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={() => done ? onViewSubmission?.(survey.id, survey.title) : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={done ? 0.85 : 1}
        style={[
          ss.card,
          done && { backgroundColor: "#f9fffe", borderColor: C.doneBorder },
          isListMode && { flexDirection: "row", alignItems: "center", gap: 14 },
        ]}
      >
        {/* Icon */}
        <View style={[
          ss.cardIcon,
          done
            ? { backgroundColor: C.successBg }
            : { backgroundColor: C.primaryLight },
          isListMode && { marginBottom: 0, flexShrink: 0 },
        ]}>
          <Icon
            name={done ? "CheckCircle2" : "FileText"}
            size={22}
            color={done ? C.success : C.primary}
          />
        </View>

        {/* Content */}
        <View style={[{ flex: 1 }, !isListMode && { marginTop: 16 }]}>
          <View style={ss.cardTopRow}>
            <View style={[
              ss.statusBadge,
              done
                ? { backgroundColor: C.successBg, borderColor: C.successBorder }
                : { backgroundColor: "#f4f5f7", borderColor: C.border },
            ]}>
              <Text style={[ss.statusBadgeText, done && { color: C.success }]}>
                {done ? "Đã hoàn thành" : "Survey"}
              </Text>
            </View>
          </View>

          <Text style={ss.cardTitle} numberOfLines={2}>{survey.title}</Text>

          {!isListMode && (
            <Text style={ss.cardDesc} numberOfLines={2}>
              {survey.description || "Không có mô tả"}
            </Text>
          )}

          <View style={ss.cardFooter}>
            <View style={ss.cardDateRow}>
              <Icon name="Clock" size={12} color={C.textDim} />
              <Text style={ss.cardDate}>{createdDate}</Text>
            </View>

            {done ? (
              <TouchableOpacity
                onPress={() => onViewSubmission?.(survey.id, survey.title)}
                style={[ss.actionChip, { backgroundColor: C.successBg, borderColor: C.successBorder }]}
              >
                <Text style={[ss.actionChipText, { color: C.success }]}>Xem kết quả →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => onStart(survey.id)}
                style={ss.startBtn}
                activeOpacity={0.85}
              >
                <Text style={ss.startBtnText}>Bắt đầu →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ss = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10, fontWeight: "700", color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14, fontWeight: "700", color: C.text,
    marginBottom: 6, lineHeight: 20,
  },
  cardDesc: {
    fontSize: 12, color: C.textDim,
    lineHeight: 18, marginBottom: 14,
  },
  cardFooter: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginTop: 8,
  },
  cardDateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardDate: { fontSize: 11, color: C.textDim },
  actionChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  actionChipText: { fontSize: 11, fontWeight: "700" },
  startBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  startBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});

export default SurveyCard;

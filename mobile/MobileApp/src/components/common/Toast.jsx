// src/components/common/Toast.jsx
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

const COLORS = {
  success: { bg: "#dcfce7", border: "#86efac", text: "#166534", icon: "✅" },
  error:   { bg: "#fee2e2", border: "#fecaca", text: "#991b1b", icon: "❌" },
  info:    { bg: "#dbeafe", border: "#bfdbfe", text: "#1e40af", icon: "ℹ️" },
  warning: { bg: "#fef3c7", border: "#fde68a", text: "#92400e", icon: "⚠️" },
};

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

function Toast({ toast, onHide }) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const cfg = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0, friction: 9, tension: 80, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120, duration: 250, useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0, duration: 250, useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, toast.duration || 3000);

    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={styles.toastIcon}>{cfg.icon}</Text>
      <View style={styles.toastContent}>
        {toast.title && (
          <Text style={[styles.toastTitle, { color: cfg.text }]}>{toast.title}</Text>
        )}
        <Text style={[styles.toastMessage, { color: cfg.text }]}>
          {toast.message}
        </Text>
      </View>
      <TouchableOpacity onPress={() => { clearTimeout(timerRef.current); onHide(); }}>
        <Text style={[styles.toastClose, { color: cfg.text }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const hide = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const show = ({ type = "info", title, message, duration = 3000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  };

  const value = {
    show,
    success: (msg, title) => show({ type: "success", title, message: msg }),
    error:   (msg, title) => show({ type: "error",   title, message: msg }),
    info:    (msg, title) => show({ type: "info",    title, message: msg }),
    warning: (msg, title) => show({ type: "warning", title, message: msg }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onHide={() => hide(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  toast: {
    width: "100%",
    maxWidth: SCREEN_W - 32,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 12,
  },
  toastClose: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    opacity: 0.7,
  },
});

export default ToastProvider;

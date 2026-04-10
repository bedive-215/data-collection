import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ImageBackground,
  StatusBar,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../providers/AuthProvider";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

// ================= Validation Schemas =================
const schema = yup.object({
  email: yup.string().required("Email bắt buộc").email("Email không hợp lệ"),
  password: yup.string().required("Mật khẩu bắt buộc").min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

const extraSchema = yup.object({
  phone_number: yup.string().required("Số điện thoại không được bỏ trống"),
  date_of_birth: yup
    .string()
    .required("Ngày sinh không được bỏ trống")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Định dạng phải là YYYY-MM-DD"),
});

// Google SVG Icon component (inline as text workaround)
const GoogleIcon = () => (
  <View style={styles.googleIconWrapper}>
    <Text style={styles.googleIconText}>G</Text>
  </View>
);

export default function Login({ navigation }) {
  const { login, loginWithOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const {
    control: controlExtra,
    handleSubmit: handleSubmitExtra,
    formState: { errors: extraErrors },
  } = useForm({
    resolver: yupResolver(extraSchema),
  });

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "1077684370519-rhcb81r4g6ucog168m3eo2vu5u1cqke7.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []);

  const handleNavigation = (res) => {
    const role = res?.user?.role || res?.role || "user";
    if (role === "admin") {
      navigation.replace("AdminDashboard");
    } else {
      navigation.replace("MainApp");
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await login({ email: data.email, password: data.password });
      handleNavigation(res);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Email hoặc mật khẩu không đúng";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setOauthLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const token = userInfo.idToken || userInfo.data?.idToken;
      if (!token) return;
      setGoogleToken(token);
      const res = await loginWithOAuth({ token });
      if (res?.needsExtraInfo) {
        setShowExtraForm(true);
      } else {
        handleNavigation(res);
      }
    } catch (err) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled");
      } else {
        Alert.alert("Lỗi", err.message || "Đăng nhập Google thất bại");
      }
    } finally {
      setOauthLoading(false);
    }
  };

  const onSubmitExtra = async (data) => {
    try {
      setOauthLoading(true);
      const res = await loginWithOAuth({
        token: googleToken,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
      });
      setShowExtraForm(false);
      handleNavigation(res);
    } catch (err) {
      setErrorMessage("Không thể cập nhật thông tin bổ sung");
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* Ambient glow overlays */}
      <View style={styles.glowTopLeft} pointerEvents="none" />
      <View style={styles.glowBottomRight} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brandName}>Luminous</Text>
        </View>

        {/* Glass Card */}
        <View style={styles.glassCard}>
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroBannerInner}>
              <View style={styles.heroBannerGradient} />
            </View>
            <View style={styles.heroBannerOverlay} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Chào mừng trở lại</Text>

          {/* Email Field */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="example@gmail.com"
                  placeholderTextColor="#555"
                  style={[
                    styles.luminousInput,
                    focusedField === "email" && styles.luminousInputFocused,
                    errors.email && styles.luminousInputError,
                  ]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>
            )}
          />

          {/* Password Field */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldLabel}>MẬT KHẨU</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                    <Text style={styles.forgotLink}>Quên?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="••••••••"
                    placeholderTextColor="#555"
                    secureTextEntry={!showPassword}
                    style={[
                      styles.luminousInput,
                      styles.passwordInput,
                      focusedField === "password" && styles.luminousInputFocused,
                      errors.password && styles.luminousInputError,
                    ]}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁"}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </View>
            )}
          />

          {/* Error message */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            style={styles.primaryButton}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#002c65" />
            ) : (
              <Text style={styles.primaryButtonText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={oauthLoading}
            style={styles.googleButton}
            activeOpacity={0.85}
          >
            {oauthLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconLetter}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerHint}>Chưa có tài khoản?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}> Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
          </View>
          <Text style={styles.footerCopy}>© 2024 LUMINOUS VOID</Text>
        </View>
      </ScrollView>

      {/* Extra Info Modal */}
      <Modal visible={showExtraForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thông tin bổ sung</Text>
            <Text style={styles.modalSubtitle}>
              Vì đây là lần đầu bạn đăng nhập bằng Google, vui lòng hoàn thiện thông tin.
            </Text>

            <Controller
              control={controlExtra}
              name="phone_number"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabelDark}>SỐ ĐIỆN THOẠI</Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="09xx xxx xxx"
                    placeholderTextColor="#aaa"
                    style={styles.modalInput}
                    keyboardType="phone-pad"
                  />
                  {extraErrors.phone_number && (
                    <Text style={styles.errorText}>{extraErrors.phone_number.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={controlExtra}
              name="date_of_birth"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabelDark}>NGÀY SINH (YYYY-MM-DD)</Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="1995-01-01"
                    placeholderTextColor="#aaa"
                    style={styles.modalInput}
                  />
                  {extraErrors.date_of_birth && (
                    <Text style={styles.errorText}>{extraErrors.date_of_birth.message}</Text>
                  )}
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowExtraForm(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitExtra(onSubmitExtra)}
                disabled={oauthLoading}
                style={styles.modalSubmitButton}
              >
                {oauthLoading ? (
                  <ActivityIndicator color="#002c65" />
                ) : (
                  <Text style={styles.modalSubmitText}>Hoàn tất</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ======================== STYLES ========================
const BLUE_PRIMARY = "#85adff";
const BLUE_DARK = "#002c65";
const SURFACE = "#0e0e0e";
const BG = "#050505";
const OUTLINE = "rgba(255,255,255,0.08)";
const TEXT_MUTED = "#adaaaa";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // Ambient glows
  glowTopLeft: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(133,173,255,0.07)",
    zIndex: 0,
  },
  glowBottomRight: {
    position: "absolute",
    bottom: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(96,19,109,0.1)",
    zIndex: 0,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 1,
  },

  // Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    color: BLUE_PRIMARY,
    fontSize: 22,
    fontWeight: "300",
  },
  brandName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: "System",
  },

  // Glass Card
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: OUTLINE,
    borderRadius: 32,
    padding: 28,
    gap: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 20,
  },

  // Hero Banner
  heroBanner: {
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#111",
  },
  heroBannerInner: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  heroBannerGradient: {
    position: "absolute",
    inset: 0,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#1a2a4a",
    opacity: 0.8,
  },
  heroBannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.8,
    marginBottom: 28,
  },

  // Field
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: TEXT_MUTED,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fieldLabelDark: {
    fontSize: 9,
    letterSpacing: 3,
    color: "#888",
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forgotLink: {
    color: "rgba(133,173,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },

  // Input
  luminousInput: {
    borderWidth: 1,
    borderColor: "rgba(133,173,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: "#fff",
  },
  luminousInputFocused: {
    borderColor: "rgba(133,173,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.04)",
    shadowColor: BLUE_PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  luminousInputError: {
    borderColor: "rgba(239,68,68,0.5)",
  },
  passwordWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Error
  errorText: {
    color: "#ef4444",
    fontSize: 11,
    marginTop: 5,
    fontWeight: "500",
  },
  errorBanner: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    color: "#ef4444",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },

  // Primary Button
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    // Gradient workaround: solid color with glow
    backgroundColor: BLUE_PRIMARY,
    shadowColor: BLUE_PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryButtonText: {
    color: BLUE_DARK,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 2,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dividerText: {
    fontSize: 8,
    letterSpacing: 4,
    color: "#777575",
    fontWeight: "700",
  },

  // Google Button
  googleButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconLetter: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4285F4",
  },
  googleButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Register
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerHint: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: "500",
  },
  registerLink: {
    color: BLUE_PRIMARY,
    fontWeight: "700",
    fontSize: 13,
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: "center",
    gap: 8,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerLink: {
    fontSize: 9,
    letterSpacing: 2,
    color: "#777575",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  footerDot: {
    color: "#444",
    fontSize: 10,
  },
  footerCopy: {
    fontSize: 8,
    letterSpacing: 4,
    color: "#444",
    textTransform: "uppercase",
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  modalCard: {
    backgroundColor: "#111",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: OUTLINE,
    padding: 28,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  modalSubtitle: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: OUTLINE,
  },
  modalCancelText: {
    color: TEXT_MUTED,
    fontWeight: "600",
    fontSize: 14,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: BLUE_PRIMARY,
    shadowColor: BLUE_PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  modalSubmitText: {
    color: BLUE_DARK,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
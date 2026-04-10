import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../providers/AuthProvider";

// ================== VALIDATION ==================
const schemaEmail = yup.object({
  email: yup.string().required("Email bắt buộc").email("Email không hợp lệ"),
});

const schemaCode = yup.object({
  code: yup.string().required("Mã bắt buộc").min(4, "Mã không hợp lệ"),
});

const schemaReset = yup.object({
  newPassword: yup.string().required("Mật khẩu bắt buộc").min(6, "Tối thiểu 6 ký tự"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Mật khẩu không khớp"),
});

export default function ForgotPassword({ navigation }) {
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const formEmail = useForm({ resolver: yupResolver(schemaEmail) });
  const formCode = useForm({ resolver: yupResolver(schemaCode) });
  const formReset = useForm({ resolver: yupResolver(schemaReset) });

  // ================= STEP 1 =================
  const handleSendEmail = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await forgotPassword(data);

      setEmail(data.email);
      setSuccessMessage("Email đã được gửi, hãy kiểm tra hộp thư");
      setStep(2);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể gửi email");
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 2 =================
  const handleVerifyCode = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await verifyResetCode({ email, code: data.code });

      setSuccessMessage("Xác minh thành công");
      setStep(3);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Mã không đúng");
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 3 =================
  const handleResetPassword = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await resetPassword({
        email,
        newPassword: data.newPassword,
      });

      setSuccessMessage("Đặt lại mật khẩu thành công");
      setTimeout(() => navigation.navigate("Login"), 1500);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {step === 1 && "Quên mật khẩu"}
          {step === 2 && "Nhập mã xác nhận"}
          {step === 3 && "Đặt mật khẩu mới"}
        </Text>

        <Text style={styles.subtitle}>
          {step === 1 && "Nhập email để nhận mã"}
          {step === 2 && `Mã đã gửi đến: ${email}`}
          {step === 3 && "Tạo mật khẩu mới"}
        </Text>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Controller
              control={formEmail.control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {formEmail.formState.errors.email && (
              <Text style={styles.error}>
                {formEmail.formState.errors.email.message}
              </Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={formEmail.handleSubmit(handleSendEmail)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi mã</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <Controller
              control={formCode.control}
              name="code"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mã xác nhận"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {formCode.formState.errors.code && (
              <Text style={styles.error}>
                {formCode.formState.errors.code.message}
              </Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={formCode.handleSubmit(handleVerifyCode)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác minh</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Controller
              control={formReset.control}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu mới"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Controller
              control={formReset.control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {formReset.formState.errors.confirmPassword && (
              <Text style={styles.error}>
                {formReset.formState.errors.confirmPassword.message}
              </Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={formReset.handleSubmit(handleResetPassword)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>}
            </TouchableOpacity>
          </>
        )}

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#f97316",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginTop: 4,
  },
  success: {
    color: "green",
    marginTop: 6,
    textAlign: "center",
  },
  link: {
    textAlign: "center",
    marginTop: 16,
    color: "#f97316",
    fontWeight: "bold",
  },
});

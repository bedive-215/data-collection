// RegisterScreen.jsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../providers/AuthProvider";

const schemaStep1 = yup.object({
  full_name: yup.string().required("Họ và tên bắt buộc"),
  date_of_birth: yup.string().required("Ngày sinh bắt buộc"),
  phone_number: yup.string().required("Số điện thoại bắt buộc"),
  email: yup.string().required("Email bắt buộc").email("Email không hợp lệ"),
  password: yup.string().required("Mật khẩu bắt buộc").min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export default function RegisterScreen({ navigation }) {
  const { register: registerUser, verifyEmail } = useAuth();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1 = thông tin, Step 2 = OTP
  const [errorMessage, setErrorMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schemaStep1) });

  // ================= STEP 1 =================
  const onSubmitStep1 = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");

      await registerUser({
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        phone_number: data.phone_number,
        email: data.email,
        password: data.password,
      });

      setEmail(data.email);
      setStep(2);
      setOtpMessage("Mã xác minh đã được gửi đến email của bạn.");
    } catch (err) {
      setErrorMessage(err?.message || "Không thể đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 2 =================
  const onSubmitVerify = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      await verifyEmail({ email, otp });
      setOtpMessage("Xác minh thành công!");
      setTimeout(() => navigation.navigate("Login"), 1500);
    } catch (err) {
      setErrorMessage(err?.message || "Mã xác minh không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{step === 1 ? "Đăng ký tài khoản" : "Xác minh email"}</Text>
      <Text style={styles.subtitle}>
        {step === 1
          ? "Tạo tài khoản để sử dụng hệ thống"
          : "Nhập mã OTP gửi đến email để hoàn tất đăng ký"}
      </Text>

      {step === 1 && (
        <>
          {/* FULL NAME */}
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text>Họ và tên</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nhập họ và tên"
                  style={styles.input}
                />
                {errors.full_name && <Text style={styles.error}>{errors.full_name.message}</Text>}
              </View>
            )}
          />

          {/* DATE OF BIRTH */}
          <Controller
            control={control}
            name="date_of_birth"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text>Ngày sinh</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  style={styles.input}
                />
                {errors.date_of_birth && <Text style={styles.error}>{errors.date_of_birth.message}</Text>}
              </View>
            )}
          />

          {/* PHONE */}
          <Controller
            control={control}
            name="phone_number"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text>Số điện thoại</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                {errors.phone_number && <Text style={styles.error}>{errors.phone_number.message}</Text>}
              </View>
            )}
          />

          {/* EMAIL */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text>Email</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nhập email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
                {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
              </View>
            )}
          />

          {/* PASSWORD */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text>Mật khẩu</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Nhập mật khẩu"
                    secureTextEntry={!showPassword}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: 8 }}>
                    <Text>{showPassword ? "Ẩn" : "Hiện"}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
              </View>
            )}
          />

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <TouchableOpacity
            onPress={handleSubmit(onSubmitStep1)}
            disabled={loading}
            style={styles.button}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng ký</Text>}
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text>Mã xác minh đã gửi đến {email}</Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="Nhập OTP"
            keyboardType="number-pad"
            style={styles.input}
          />
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          {otpMessage ? <Text style={styles.success}>{otpMessage}</Text> : null}

          <TouchableOpacity
            onPress={onSubmitVerify}
            disabled={loading}
            style={styles.button}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác minh email</Text>}
          </TouchableOpacity>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        <Text>Bạn đã có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={{ color: '#f97316', fontWeight: 'bold' }}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  inputContainer: { marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginTop: 4 },
  error: { color: 'red', marginTop: 4 },
  success: { color: 'green', marginTop: 4 },
  button: { backgroundColor: '#f97316', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});

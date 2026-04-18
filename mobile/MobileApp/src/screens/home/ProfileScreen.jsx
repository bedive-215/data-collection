import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";

import { useUser } from "../../providers/UserProvider";
import { useAuth } from "../../providers/AuthProvider";

export default function ProfileScreen() {
  const navigation = useNavigation();

  /* ===== CONTEXT ===== */
  const { user, loading, fetchMyInfo, updateMyInfo } = useUser();
  const { logout } = useAuth();

  /* ===== STATE ===== */
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    avatar: null, // asset hoặc null
  });

  /* ===== LOAD USER ===== */
  useEffect(() => {
    console.log("🔥 ProfileScreen mounted, fetching user info...");
    fetchMyInfo()
      .then(() => console.log("✅ User info fetched"))
      .catch((err) => console.error("❌ Error fetching user info:", err));
  }, []);

  /* ===== FILL FORM ===== */
  useEffect(() => {
    if (!user) {
      console.log("⚠️ No user data yet");
      return;
    }

    console.log("✅ User data received:", user);

    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      date_of_birth: user.date_of_birth || "",
      avatar: null,
    });

    setAvatarPreview(user.avatar || null);
  }, [user]);

  /* ===== PICK AVATAR ===== */
  const pickAvatar = async () => {
    console.log("📷 Opening image picker...");
    
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      console.log("⚠️ User cancelled image picker");
      return;
    }

    const asset = result.assets?.[0];
    if (!asset) {
      console.log("⚠️ No asset selected");
      return;
    }

    console.log("✅ Avatar selected:", {
      uri: asset.uri,
      fileName: asset.fileName,
      type: asset.type,
      fileSize: asset.fileSize,
    });

    setAvatarPreview(asset.uri);
    setForm((prev) => ({
      ...prev,
      avatar: asset,
    }));
  };

  /* ===== CANCEL EDIT ===== */
  const handleCancel = () => {
    console.log("🔄 Cancelling edit, resetting form...");
    setIsEditing(false);
    
    // Reset form về giá trị ban đầu từ user
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth || "",
        avatar: null,
      });
      setAvatarPreview(user.avatar || null);
      console.log("✅ Form reset to original values");
    }
  };

  /* ===== SAVE PROFILE ===== */
/* ===== SAVE PROFILE ===== */
/* ===== SAVE PROFILE ===== */
const handleSave = async () => {
  console.log("\n🔥 ========== STARTING SAVE PROFILE ==========");
  console.log("📝 Current form state:", {
    full_name: form.full_name,
    email: form.email,
    phone_number: form.phone_number,
    date_of_birth: form.date_of_birth,
    hasAvatar: !!form.avatar,
  });

  try {
    // 👉 LUÔN GỬI JSON, KHÔNG BAO GIỜ GỬI FORMDATA
    const payload = {
      full_name: form.full_name,
      phone_number: form.phone_number,
      date_of_birth: form.date_of_birth,
    };

    console.log("📦 Payload prepared (JSON):", JSON.stringify(payload, null, 2));

    // Nếu có avatar mới → log nhưng KHÔNG gửi lên
    if (form.avatar) {
      console.log("⚠️ Avatar selected but NOT sending (backend doesn't support):", {
        uri: form.avatar.uri,
        fileName: form.avatar.fileName,
        type: form.avatar.type,
      });
    }

    console.log("⏳ Calling updateMyInfo with JSON payload...");
    const result = await updateMyInfo(payload);
    console.log("✅ updateMyInfo success, result:", result);

    console.log("⏳ Fetching updated user info...");
    await fetchMyInfo();
    console.log("✅ User info refreshed");

    console.log("✅ Exiting edit mode");
    setIsEditing(false);

    console.log("🎉 ========== SAVE PROFILE COMPLETED ==========\n");
  } catch (err) {
    console.error("\n❌ ========== SAVE PROFILE ERROR ==========");
    console.error("❌ Error message:", err?.message);
    console.error("❌ Error response:", err?.response?.data);
    console.error("========== END ERROR LOG ==========\n");

    const errorMessage = err?.response?.data?.message || 
                        err?.message || 
                        "Không thể cập nhật thông tin";
    
    Alert.alert("Lỗi", errorMessage, [{ text: "OK" }]);
  }
};

  /* ===== LOGOUT ===== */
  const handleLogout = () => {
    console.log("🚪 Logout button pressed");
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel",
          onPress: () => console.log("⚠️ Logout cancelled")
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => {
            console.log("✅ User confirmed logout");
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
            console.log("🚪 Navigated to Login screen");
          }
        }
      ]
    );
  };

  /* ===== LOADING ===== */
  if (loading && !user) {
    console.log("⏳ Loading user data...");
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  console.log("🎨 Rendering ProfileScreen");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Thông tin cá nhân</Text>
          <Text style={styles.subTitle}>
            {isEditing ? "Chỉnh sửa thông tin" : "Chế độ chỉ xem"}
          </Text>
        </View>
      </View>

      {/* ===== AVATAR ===== */}
      <View style={styles.avatarWrapper}>
        <Image
          source={
            avatarPreview
              ? { uri: avatarPreview }
              : require("../../assets/default-avatar.png")
          }
          style={styles.avatar}
          onError={(e) => console.error("❌ Avatar load error:", e.nativeEvent.error)}
          onLoad={() => console.log("✅ Avatar loaded")}
        />

        {isEditing && (
          <TouchableOpacity style={styles.cameraBtn} onPress={pickAvatar}>
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ===== FIELDS ===== */}
      <View style={styles.formContainer}>
        <Field
          label="Họ và tên"
          value={form.full_name}
          editable={isEditing}
          onChange={(v) => {
            console.log("📝 Full name changed:", v);
            setForm({ ...form, full_name: v });
          }}
        />

        <Field
          label="Email"
          value={form.email}
          editable={isEditing}
          onChange={(v) => {
            console.log("📝 Email changed:", v);
            setForm({ ...form, email: v });
          }}
          keyboardType="email-address"
        />

        <Field
          label="Số điện thoại"
          value={form.phone_number}
          editable={isEditing}
          onChange={(v) => {
            console.log("📝 Phone changed:", v);
            setForm({ ...form, phone_number: v });
          }}
          keyboardType="phone-pad"
        />

        <Field
          label="Ngày sinh"
          value={form.date_of_birth}
          editable={isEditing}
          onChange={(v) => {
            console.log("📝 Date of birth changed:", v);
            setForm({ ...form, date_of_birth: v });
          }}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {/* ===== BUTTONS ===== */}
      {!isEditing ? (
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              console.log("✏️ Edit button pressed");
              setIsEditing(true);
            }}
          >
            <Text style={styles.btnText}>Chỉnh sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.btnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveBtn, loading && styles.disabledBtn]} 
            onPress={() => {
              console.log("💾 Save button pressed");
              handleSave();
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

/* ===== FIELD COMPONENT ===== */
function Field({ label, value, editable, onChange, keyboardType, placeholder }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={styles.input}
          keyboardType={keyboardType}
          placeholder={placeholder}
        />
      ) : (
        <View style={styles.readonlyWrapper}>
          <Text style={styles.readonly}>{value || "-"}</Text>
        </View>
      )}
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: { 
    padding: 20,
    paddingTop: 40,
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  header: {
    marginBottom: 24,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold",
    color: "#1f2937",
  },
  subTitle: { 
    color: "#6b7280", 
    marginTop: 8,
    fontSize: 14,
  },
  avatarWrapper: { 
    alignItems: "center", 
    marginBottom: 32,
    position: "relative",
  },
  avatar: { 
    width: 128, 
    height: 128, 
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#e5e7eb",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 8,
    right: "35%",
    backgroundColor: "#fff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cameraIcon: {
    fontSize: 18,
  },
  formContainer: {
    marginBottom: 24,
  },
  field: { 
    marginBottom: 20,
  },
  label: { 
    fontWeight: "600", 
    marginBottom: 8,
    fontSize: 14,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  readonlyWrapper: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
  },
  readonly: {
    fontSize: 16,
    color: "#1f2937",
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  editBtn: {
    backgroundColor: "#f97316",
    padding: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    backgroundColor: "#e5e7eb",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#f97316",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
});
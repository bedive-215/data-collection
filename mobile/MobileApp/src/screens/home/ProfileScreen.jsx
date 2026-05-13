// ProfileScreen.jsx - Profile Screen cho Mobile (Đồng bộ với Web)
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert, Modal
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, Pencil, ClipboardList, Compass, Shield,
  LogOut, X, Check, Mail, Phone, Cake, Camera,
  ChevronRight, Loader2
} from 'lucide-react-native';

import { useUser } from '../../providers/UserProvider';
import { useAuth } from '../../providers/AuthProvider';

const C = {
  primary: '#4f46e5',
  primaryLight: '#eef2ff',
  primaryGrad: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #4338ca 100%)',
  surface: '#ffffff',
  surfaceHigh: '#ffffff',
  text: '#0f172a',
  textSub: '#64748b',
  textDim: '#94a3b8',
  success: '#10b981',
  danger: '#ef4444',
  border: '#e2e8f0',
  bg: '#f7f8fc',
};

function Field({ label, value, editable, onChange, keyboardType, placeholder }) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={[fieldStyles.input, fieldStyles.inputFocused]}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={C.textDim}
        />
      ) : (
        <View style={fieldStyles.readonlyWrapper}>
          <Text style={fieldStyles.readonly}>{value || '-'}</Text>
        </View>
      )}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 12, fontWeight: '600', color: C.textSub, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: '#f8fafc', color: C.text
  },
  inputFocused: {
    borderColor: C.primary, backgroundColor: '#fff',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3
  },
  readonlyWrapper: {
    backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14
  },
  readonly: { fontSize: 15, color: C.text }
});

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, loading, fetchMyInfo, updateMyInfo } = useUser();
  const { logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    avatar: null,
  });

  useEffect(() => {
    fetchMyInfo();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        avatar: null,
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const pickAvatar = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo', quality: 0.8, selectionLimit: 1,
    });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setAvatarPreview(asset.uri);
    setForm(prev => ({ ...prev, avatar: asset }));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveLoading(true);
    try {
      const payload = {
        full_name: form.full_name,
        phone_number: form.phone_number,
        date_of_birth: form.date_of_birth,
      };
      await updateMyInfo(payload);
      await fetchMyInfo();
      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        avatar: null,
      });
      setAvatarPreview(user.avatar || null);
    }
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive',
        onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      },
    ]);
  };

  const menuCards = [
    {
      key: 'edit', icon: Pencil, title: 'Chỉnh sửa hồ sơ',
      desc: 'Họ tên, số điện thoại, ngày sinh và ảnh đại diện.',
      iconBg: 'rgba(99,102,241,0.12)', iconColor: C.primary,
      onClick: () => setIsEditing(true),
    },
    {
      key: 'mySurveys', icon: ClipboardList, title: 'Khảo sát của tôi',
      desc: 'Tạo và quản lý biểu mẫu khảo sát của bạn.',
      iconBg: 'rgba(16,185,129,0.12)', iconColor: '#059669',
      onClick: () => navigation.navigate('MainApp', { screen: 'OrdersTab', params: { initialTab: 'mySurveys' } }),
    },
    {
      key: 'explore', icon: Compass, title: 'Khảo sát công khai',
      desc: 'Khám phá và tham gia các khảo sát đang mở.',
      iconBg: 'rgba(14,165,233,0.12)', iconColor: '#0284c7',
      onClick: () => navigation.navigate('MainApp', { screen: 'OrdersTab', params: { initialTab: 'public' } }),
    },
    {
      key: 'security', icon: Shield, title: 'Bảo mật tài khoản',
      desc: 'Đặt lại mật khẩu qua email nếu bạn quên mật khẩu.',
      iconBg: 'rgba(244,63,94,0.1)', iconColor: '#e11d48',
      onClick: () => navigation.navigate('ForgotPassword'),
    },
  ];

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <Loader2 size={40} color={C.primary} style={{ transform: [{ rotate: '360deg' }] }} />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarOuter}>
              <Image
                source={avatarPreview ? { uri: avatarPreview } : require('../../assets/default-avatar.png')}
                style={styles.avatar}
              />
              {isEditing && (
                <TouchableOpacity style={styles.cameraBtn} onPress={pickAvatar}>
                  <Camera size={16} color='#fff' />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.userName}>{form.full_name || 'Tài khoản'}</Text>
          <Text style={styles.userEmail}>{form.email || ''}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>InsightFlow · Thành viên</Text>
          </View>
        </View>

        {/* Menu Cards */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.menuGrid}>
            {menuCards.map(card => {
              const Icon = card.icon;
              return (
                <TouchableOpacity key={card.key} style={styles.menuCard} onPress={card.onClick} activeOpacity={0.7}>
                  <View style={[styles.menuIconBox, { backgroundColor: card.iconBg }]}>
                    <Icon size={24} color={card.iconColor} />
                  </View>
                  <Text style={styles.menuTitle}>{card.title}</Text>
                  <Text style={styles.menuDesc}>{card.desc}</Text>
                  <ChevronRight size={18} color={C.textDim} style={styles.menuArrow} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={C.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={isEditing} animationType='slide' transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color={C.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView style={modalStyles.content} showsVerticalScrollIndicator={false}>
              <Field
                label='Họ và tên'
                value={form.full_name}
                editable={true}
                onChange={v => setForm(prev => ({ ...prev, full_name: v }))}
                placeholder='Nguyễn Văn A'
              />

              <View style={fieldStyles.wrapper}>
                <Text style={fieldStyles.label}>Email</Text>
                <View style={[fieldStyles.readonlyWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Mail size={16} color={C.textDim} style={{ marginRight: 8 }} />
                  <Text style={fieldStyles.readonly}>{form.email}</Text>
                </View>
                <Text style={styles.emailNote}>Email dùng để đăng nhập - không thể thay đổi</Text>
              </View>

              <Field
                label='Số điện thoại'
                value={form.phone_number}
                editable={true}
                onChange={v => setForm(prev => ({ ...prev, phone_number: v }))}
                keyboardType='phone-pad'
                placeholder='0901234567'
              />

              <Field
                label='Ngày sinh'
                value={form.date_of_birth}
                editable={true}
                onChange={v => setForm(prev => ({ ...prev, date_of_birth: v }))}
                placeholder='YYYY-MM-DD'
              />

              {saveError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{saveError}</Text>
                </View>
              )}

              <View style={modalStyles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saveLoading && styles.disabledBtn]}
                  onPress={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <Loader2 size={18} color='#fff' />
                  ) : (
                    <>
                      <Check size={18} color='#fff' />
                      <Text style={styles.saveBtnText}>Lưu</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', paddingBottom: 34
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: C.border
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  content: { padding: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: C.textSub, fontWeight: '600' },
  scrollContent: { padding: 16, paddingTop: 60 },
  heroCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 3, marginBottom: 24
  },
  avatarWrapper: { marginBottom: 16 },
  avatarOuter: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#e2e8f0' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4
  },
  userName: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: C.textSub, marginBottom: 12 },
  memberBadge: {
    backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999
  },
  memberText: { fontSize: 12, fontWeight: '600', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textSub, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuGrid: { gap: 12 },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    position: 'relative'
  },
  menuIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  menuDesc: { fontSize: 13, color: C.textSub, lineHeight: 18 },
  menuArrow: { position: 'absolute', top: 16, right: 16 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.danger },
  bottomPadding: { height: 100 },
  errorBox: {
    backgroundColor: '#fef2f2', padding: 14, borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#fecaca'
  },
  errorText: { color: '#dc2626', fontSize: 13 },
  emailNote: { fontSize: 11, color: C.textDim, marginTop: 6 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: C.border
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.textSub },
  saveBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  disabledBtn: { opacity: 0.6 }
});

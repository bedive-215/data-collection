// SurveyResponseScreen.jsx - Xem kết quả câu trả lời khảo sát
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ChevronLeft, CheckCircle2, AlertCircle,
  AlignLeft, FileText, Mail, Calendar, Hash, Star, CheckSquare
} from 'lucide-react-native';
import { useSurvey } from '../../providers/Surveyprovider';
import { useResponse } from '../../providers/Responseprovider';

const TYPE_CONFIG = {
  TEXT: { label: 'Văn bản', Icon: AlignLeft, color: '#4f6ef7', bg: '#eef2ff' },
  PARAGRAPH: { label: 'Đoạn văn', Icon: FileText, color: '#7c3aed', bg: '#f5f3ff' },
  EMAIL: { label: 'Email', Icon: Mail, color: '#0891b2', bg: '#ecfeff' },
  DATE: { label: 'Ngày tháng', Icon: Calendar, color: '#b45309', bg: '#fffbeb' },
  NUMBER: { label: 'Số', Icon: Hash, color: '#059669', bg: '#ecfdf5' },
  RATING: { label: 'Đánh giá', Icon: Star, color: '#d97706', bg: '#fffbeb' },
  SINGLE_CHOICE: { label: 'Một lựa chọn', Icon: CheckSquare, color: '#ea580c', bg: '#fff7ed' },
  MULTIPLE_CHOICE: { label: 'Nhiều lựa chọn', Icon: CheckSquare, color: '#16a34a', bg: '#f0fdf4' },
};

const C = {
  primary: '#4f46e5',
  primaryLight: '#eef2ff',
  text: '#0f172a',
  textSub: '#64748b',
  textDim: '#94a3b8',
  success: '#10b981',
  successBg: '#d1fae5',
  border: '#e2e8f0',
  surface: '#ffffff',
  bg: '#f7f8fc',
};

export default function SurveyResponseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { surveyId } = route.params || {};

  const { fetchSurveyById } = useSurvey();
  const { getMySubmission } = useResponse();

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!surveyId) {
        setError('Không có ID khảo sát');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const surveyRes = await fetchSurveyById(surveyId);
        setSurvey(surveyRes);

        const responseRes = await getMySubmission(surveyId);
        setResponse(responseRes);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [surveyId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={C.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !survey || !response) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={C.text} />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color='#ef4444' />
          <Text style={styles.errorTitle}>Không tải được</Text>
          <Text style={styles.errorText}>{error || 'Không thể tải được câu trả lời của bạn'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Build answers map: questionId -> answer
  const answersMap = {};
  const responseData = Array.isArray(response?.data) ? response.data :
                      Array.isArray(response) ? response : [];
  responseData.forEach(r => {
    if (r.answers) {
      r.answers.forEach(a => {
        answersMap[a.question_id] = a;
      });
    }
  });

  const completedAt = response?.created_at ? new Date(response.created_at) : null;
  const answerCount = Object.keys(answersMap).length;
  const questionCount = survey?.questions?.length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={C.text} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả khảo sát</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={28} color={C.success} />
          </View>
          <View style={styles.successInfo}>
            <Text style={styles.successTitle}>Đã hoàn thành!</Text>
            <Text style={styles.successSub}>
              {completedAt ? completedAt.toLocaleDateString('vi-VN', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Survey Info */}
        <View style={styles.surveyInfo}>
          <Text style={styles.surveyTitle}>{survey.title}</Text>
          <Text style={styles.surveyDesc}>{survey.description}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{answerCount}</Text>
              <Text style={styles.statLabel}>Câu trả lời</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{questionCount}</Text>
              <Text style={styles.statLabel}>Câu hỏi</Text>
            </View>
          </View>
        </View>

        {/* Questions & Answers */}
        <Text style={styles.sectionTitle}>Câu trả lời của bạn</Text>

        {survey.questions && survey.questions.map((question, index) => {
          const answer = answersMap[question.id];
          const config = TYPE_CONFIG[question.type] || TYPE_CONFIG.TEXT;
          const IconComp = config.Icon;

          // Parse answer value
          let answerDisplay = 'Chưa trả lời';
          let selectedOptions = [];

          if (answer) {
            if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
              const rawAnswer = answer.answer;
              const answerIds = Array.isArray(rawAnswer)
                ? rawAnswer
                : String(rawAnswer || '').split(',').map(s => s.trim());

              selectedOptions = question.options.filter(opt =>
                answerIds.includes(String(opt.id)) || answerIds.includes(opt.label)
              );
            } else {
              answerDisplay = String(answer.answer || 'Chưa trả lời');
            }
          }

          return (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={[styles.questionIcon, { backgroundColor: config.bg }]}>
                  <IconComp size={16} color={config.color} />
                </View>
                <View style={styles.questionMeta}>
                  <Text style={styles.questionNum}>Câu {index + 1}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>
                {question.required && (
                  <Text style={styles.requiredBadge}>Bắt buộc</Text>
                )}
              </View>

              <Text style={styles.questionText}>{question.content}</Text>

              <View style={styles.answerSection}>
                {question.type === 'TEXT' || question.type === 'PARAGRAPH' || question.type === 'EMAIL' || question.type === 'NUMBER' ? (
                  <View style={styles.textAnswer}>
                    <Text style={styles.answerText}>{answerDisplay}</Text>
                  </View>
                ) : question.type === 'DATE' ? (
                  <View style={styles.textAnswer}>
                    <Text style={styles.answerText}>
                      {answer?.answer ? new Date(answer.answer).toLocaleDateString('vi-VN') : 'Chưa trả lời'}
                    </Text>
                  </View>
                ) : question.type === 'RATING' ? (
                  <View style={styles.ratingAnswer}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <View
                        key={star}
                        style={[
                          styles.star,
                          star <= (answer?.answer || 0) && styles.starActive
                        ]}
                      >
                        <Star size={24} color={star <= (answer?.answer || 0) ? '#f59e0b' : '#e2e8f0'} />
                      </View>
                    ))}
                    <Text style={styles.ratingValue}>{answer?.answer || 0}/5</Text>
                  </View>
                ) : (
                  // Choices
                  <View style={styles.choicesAnswer}>
                    {(question.options || []).map((opt, optIndex) => {
                      const isSelected = selectedOptions.some(s => s.id === opt.id);
                      return (
                        <View
                          key={opt.id || optIndex}
                          style={[
                            styles.choiceItem,
                            isSelected && styles.choiceItemSelected
                          ]}
                        >
                          <View style={[
                            question.type === 'MULTIPLE_CHOICE' ? styles.checkbox : styles.radio,
                            isSelected && (question.type === 'MULTIPLE_CHOICE' ? styles.checkboxSelected : styles.radioSelected)
                          ]}>
                            {isSelected && (
                              question.type === 'MULTIPLE_CHOICE'
                                ? <Text style={styles.checkmark}>✓</Text>
                                : <View style={styles.radioDot} />
                            )}
                          </View>
                          <Text style={[
                            styles.choiceLabel,
                            isSelected && styles.choiceLabelSelected
                          ]}>
                            {opt.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: C.textSub, fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#ef4444' },
  errorText: { fontSize: 14, color: C.textSub, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.primary, borderRadius: 12 },
  retryText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: C.text },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  headerRight: { width: 60 },

  content: { flex: 1 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: C.successBg, margin: 16, padding: 20, borderRadius: 16
  },
  successIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  successInfo: { flex: 1 },
  successTitle: { fontSize: 20, fontWeight: '800', color: C.success },
  successSub: { fontSize: 13, color: '#059669', marginTop: 4 },

  surveyInfo: { backgroundColor: C.surface, margin: 16, marginTop: 0, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  surveyTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6 },
  surveyDesc: { fontSize: 14, color: C.textSub, lineHeight: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: 12, color: C.textSub, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: C.border },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  questionCard: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  questionIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  questionMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  questionNum: { fontSize: 12, fontWeight: '700', color: C.textSub },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  requiredBadge: { fontSize: 10, fontWeight: '700', color: '#ef4444', backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  questionText: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 14 },

  answerSection: { },
  textAnswer: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  answerText: { fontSize: 14, color: C.text, lineHeight: 20 },
  ratingAnswer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { },
  starActive: { },
  ratingValue: { marginLeft: 12, fontSize: 14, fontWeight: '700', color: '#f59e0b' },
  choicesAnswer: { gap: 8 },
  choiceItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: C.border },
  choiceItemSelected: { backgroundColor: C.primaryLight, borderColor: C.primary },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: C.primary, borderColor: C.primary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  choiceLabel: { flex: 1, fontSize: 14, color: C.textSub },
  choiceLabelSelected: { color: C.primary, fontWeight: '600' },

  bottomPadding: { height: 100 },
});

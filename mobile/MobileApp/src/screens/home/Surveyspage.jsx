// ─── SurveysPage.native.jsx ──────────────────────────────────────
// React Native version of SurveysPage.jsx
// Dependencies: @react-navigation/native, react-native-vector-icons or lucide-react-native

import React, {
  useEffect, useMemo, useState, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Modal, ActivityIndicator, FlatList,
  SafeAreaView, StatusBar, Pressable, Platform,
} from 'react-native';

// ─── REPLACE with your actual providers ───
import { useSurvey } from '@/providers/SurveyProvider';
import { useResponse } from '@/providers/ResponseProvider';

// ─── REPLACE with your navigation setup ───
// import { useNavigation } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  bg:            '#f4f5f7',
  surface:       '#ffffff',
  primary:       '#4f6ef7',
  primaryLight:  '#eef2ff',
  primaryBorder: '#c5cdfb',
  text:          '#111827',
  textSub:       '#6b7280',
  textDim:       '#9ca3af',
  success:       '#16a34a',
  successBg:     '#dcfce7',
  successBorder: '#86efac',
  border:        '#e8ecf5',
  error:         '#ef4444',
  errorBg:       '#fef2f2',
  font:          Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

// ─────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'pending', label: 'Chưa làm' },
  { key: 'done',    label: 'Đã hoàn thành' },
];

// ─────────────────────────────────────────────────────────────
// TYPE META
// ─────────────────────────────────────────────────────────────
const TYPE_META = {
  SINGLE_CHOICE: {
    label: 'Một lựa chọn', color: '#1d4ed8',
    bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb',
  },
  MULTIPLE_CHOICE: {
    label: 'Nhiều lựa chọn', color: '#6d28d9',
    bg: '#f5f3ff', border: '#ddd6fe', accent: '#7c3aed',
  },
  TEXT: {
    label: 'Văn bản', color: '#0e7490',
    bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2',
  },
};

function typeMeta(type) {
  return TYPE_META[type] ?? {
    label: type, color: '#6b7280',
    bg: '#f3f4f6', border: '#e5e7eb', accent: '#9ca3af',
  };
}

// ─────────────────────────────────────────────────────────────
// OptionRow
// ─────────────────────────────────────────────────────────────
function OptionRow({ label, isSelected, isMultiple }) {
  return (
    <View style={[
      styles.optionRow,
      isSelected && styles.optionRowSelected,
    ]}>
      {isMultiple ? (
        <View style={[
          styles.checkbox,
          isSelected && styles.checkboxSelected,
        ]}>
          {isSelected && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      ) : (
        <View style={[
          styles.radio,
          isSelected && styles.radioSelected,
        ]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
      )}
      <Text style={[
        styles.optionLabel,
        isSelected && styles.optionLabelSelected,
      ]}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SubmissionModal
// ─────────────────────────────────────────────────────────────
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchSub = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMySubmission(surveyId);
        if (cancelled) return;
        const raw = res?.data ?? res ?? [];
        setAnswers(raw.flatMap(r => r.answers ?? []));
      } catch {
        if (!cancelled) setError('Không thể tải câu trả lời.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSub();
    return () => { cancelled = true; };
  }, [surveyId]);

  const renderAnswer = ({ item, index }) => {
    const meta = typeMeta(item.type);
    const isText     = item.type === 'TEXT';
    const isMultiple = item.type === 'MULTIPLE_CHOICE';
    const selectedSet = isMultiple
      ? new Set(Array.isArray(item.answer) ? item.answer : String(item.answer ?? '').split(',').map(s => s.trim()))
      : new Set([String(item.answer ?? '')]);

    return (
      <View style={[styles.answerCard, { borderTopColor: meta.accent }]}>
        <View style={styles.answerCardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={styles.questionText}>
          {index + 1}. {item.question}
        </Text>
        {isText ? (
          <View style={styles.textAnswerBox}>
            <Text style={styles.textAnswerText}>
              {item.answer || 'Không có dữ liệu'}
            </Text>
          </View>
        ) : (
          <View style={styles.optionsList}>
            {(item.options ?? []).map((opt, oi) => {
              const label = opt?.label ?? opt?.value ?? opt?.content ?? '';
              const isSel = selectedSet.has(label) || selectedSet.has(String(opt.id));
              return (
                <OptionRow
                  key={oi}
                  label={label}
                  isSelected={isSel}
                  isMultiple={isMultiple}
                />
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>← Đóng</Text>
          </TouchableOpacity>
          <Text style={styles.modalBrand}>InsightFlow</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Body */}
        <View style={styles.modalBadgeRow}>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Đã hoàn thành</Text>
          </View>
        </View>
        <Text style={styles.modalTitle}>{surveyTitle}</Text>
        {!loading && (
          <Text style={styles.modalSubtitle}>{answers.length} câu trả lời</Text>
        )}

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.centered}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && answers.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Không có câu trả lời.</Text>
          </View>
        )}

        {!loading && !error && answers.length > 0 && (
          <FlatList
            data={answers}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderAnswer}
            contentContainerStyle={styles.answerList}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// SurveyCard
// ─────────────────────────────────────────────────────────────
function SurveyCard({ survey, done, onStart, onViewSubmission }) {
  const createdDate = survey?.created_at
    ? new Date(survey.created_at).toLocaleDateString('vi-VN')
    : '';

  return (
    <TouchableOpacity
      onPress={() => done && onViewSubmission(survey.id, survey.title)}
      activeOpacity={done ? 0.7 : 1}
      style={[
        styles.surveyCard,
        done ? styles.surveyCardDone : styles.surveyCardPending,
      ]}
    >
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <View style={[
          styles.cardIcon,
          done ? styles.cardIconDone : styles.cardIconPending,
        ]}>
          <Text style={{ fontSize: 18 }}>{done ? '✓' : '📄'}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          done ? styles.statusBadgeDone : styles.statusBadgePending,
        ]}>
          <Text style={[
            styles.statusBadgeText,
            done ? styles.statusBadgeTextDone : styles.statusBadgeTextPending,
          ]}>
            {done ? 'Đã hoàn thành' : 'Survey'}
          </Text>
        </View>
      </View>

      {/* Body */}
      <Text style={styles.cardTitle} numberOfLines={2}>{survey.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{survey.description}</Text>

      {/* Footer */}
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
          >
            <Text style={styles.startBtnText}>Bắt đầu →</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// CardSkeleton
// ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonTopRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonBadge} />
      </View>
      <View style={[styles.skeletonLine, { width: '75%' }]} />
      <View style={[styles.skeletonLine, { width: '100%' }]} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
      <View style={styles.skeletonFooter}>
        <View style={[styles.skeletonLine, { width: 60 }]} />
        <View style={styles.skeletonBtn} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function SurveysPage({ navigation }) {
  // If using React Navigation, replace with: const navigation = useNavigation();

  const { surveys, loading, error, fetchPublicSurveys } = useSurvey();
  const { getAllMyResponses } = useResponse();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [modalSurvey, setModalSurvey]     = useState(null);
  const [activeTab, setActiveTab]         = useState('all');
  const [search, setSearch]               = useState('');
  const [sortBy, setSortBy]               = useState('newest');
  const [showFilter, setShowFilter]       = useState(false);

  // ── Fetch data
  const fetchData = useCallback(async () => {
    try {
      await fetchPublicSurveys();
      const responseRes = await getAllMyResponses().catch(() => null);
      const ids = new Set(
        (responseRes?.data ?? []).map(r => r.survey_id ?? r.surveyId)
      );
      setDoneSurveyIds(ids);
    } catch (err) {
      console.error(err);
    }
  }, [fetchPublicSurveys, getAllMyResponses]);

  useEffect(() => { fetchData(); }, []);

  // ── Counts
  const totalCount   = surveys.length;
  const doneCount    = surveys.filter(s =>  doneSurveyIds.has(s.id)).length;
  const pendingCount = surveys.filter(s => !doneSurveyIds.has(s.id)).length;

  // ── Filter + sort
  const displayed = useMemo(() => {
    let list = [...surveys];
    if (activeTab === 'pending') list = list.filter(s => !doneSurveyIds.has(s.id));
    if (activeTab === 'done')    list = list.filter(s =>  doneSurveyIds.has(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'newest') list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === 'oldest') list.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === 'name')   list.sort((a,b) => (a.title ?? '').localeCompare(b.title ?? ''));
    return list;
  }, [surveys, doneSurveyIds, activeTab, search, sortBy]);

  const getTabCount = (key) =>
    key === 'all' ? totalCount : key === 'pending' ? pendingCount : doneCount;

  const handleStart = (id) => navigation?.navigate('SurveyTake', { surveyId: id });

  const renderCard = ({ item }) => (
    <SurveyCard
      survey={item}
      done={doneSurveyIds.has(item.id)}
      onStart={handleStart}
      onViewSubmission={(id, title) => setModalSurvey({ id, title })}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Modal */}
      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
        />
      )}

      <FlatList
        data={loading ? [] : displayed}
        keyExtractor={item => String(item.id)}
        renderItem={renderCard}
        numColumns={1}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pageTitle}>Khảo sát</Text>
                <Text style={styles.pageSubtitle}>
                  {loading
                    ? 'Đang tải...'
                    : `${totalCount} khảo sát · ${doneCount} hoàn thành · ${pendingCount} chưa làm`}
                </Text>
              </View>
              <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>⟳ Làm mới</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsContainer}
            >
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                const count = getTabCount(tab.key);
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[styles.tab, isActive && styles.tabActive]}
                  >
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                      {tab.label}
                    </Text>
                    {!loading && (
                      <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                        <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search */}
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Tìm kiếm khảo sát..."
                  placeholderTextColor={C.textDim}
                  style={styles.searchInput}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={styles.clearText}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => setShowFilter(v => !v)}
                style={[styles.filterBtn, showFilter && styles.filterBtnActive]}
              >
                <Text style={[styles.filterBtnText, showFilter && styles.filterBtnTextActive]}>
                  ⚙
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Panel */}
            {showFilter && (
              <View style={styles.filterPanel}>
                <Text style={styles.filterLabel}>Sắp xếp theo</Text>
                <View style={styles.sortRow}>
                  {[
                    { key: 'newest', label: 'Mới nhất' },
                    { key: 'oldest', label: 'Cũ nhất' },
                    { key: 'name',   label: 'Tên A-Z' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setSortBy(item.key)}
                      style={[styles.sortBtn, sortBy === item.key && styles.sortBtnActive]}
                    >
                      <Text style={[styles.sortBtnText, sortBy === item.key && styles.sortBtnTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => { setSearch(''); setSortBy('newest'); setActiveTab('all'); setShowFilter(false); }}
                  style={styles.resetBtn}
                >
                  <Text style={styles.resetBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View>
              {Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchData}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>Không có khảo sát nào</Text>
              <Text style={styles.emptySubtitle}>
                {search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có dữ liệu'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: C.textSub,
  },
  refreshBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignSelf: 'flex-start',
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
  },

  // ── Tabs
  tabsScroll: {
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: C.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabCount: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
  },
  tabCountTextActive: {
    color: '#fff',
  },

  // ── Search
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    padding: 0,
  },
  clearText: {
    fontSize: 13,
    color: C.textDim,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  filterBtnText: {
    fontSize: 18,
    color: C.textSub,
  },
  filterBtnTextActive: {
    color: C.primary,
  },

  // ── Filter Panel
  filterPanel: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  sortBtnActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSub,
  },
  sortBtnTextActive: {
    color: C.primary,
  },
  resetBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSub,
  },

  // ── Survey Card
  surveyCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  surveyCardDone: {
    borderColor: '#bbf7d0',
  },
  surveyCardPending: {
    borderColor: C.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconDone: {
    backgroundColor: '#dcfce7',
  },
  cardIconPending: {
    backgroundColor: '#eef2ff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  statusBadgePending: {
    backgroundColor: '#f4f5f7',
    borderColor: C.border,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadgeTextDone: {
    color: '#16a34a',
  },
  statusBadgeTextPending: {
    color: C.textDim,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 12,
    color: C.textDim,
  },
  viewResultBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  viewResultBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  startBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Skeleton
  skeleton: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  skeletonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  skeletonBadge: {
    width: 80,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  skeletonBtn: {
    width: 90,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },

  // ── States
  centered: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 14,
    color: C.textSub,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.textSub,
  },
  emptyText: {
    fontSize: 14,
    color: C.textSub,
  },

  // ── Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeBtn: {},
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSub,
  },
  modalBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textSub,
  },
  modalBadgeRow: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  completedBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.successBg,
    borderWidth: 1,
    borderColor: C.successBorder,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: C.textSub,
    textAlign: 'center',
    marginBottom: 16,
  },
  answerList: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  answerCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderTopWidth: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  answerCardHeader: {
    padding: 16,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    lineHeight: 20,
    padding: 16,
    paddingTop: 10,
  },
  optionsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
    gap: 12,
    marginBottom: 6,
  },
  optionRowSelected: {
    borderColor: '#bfdbfe',
    backgroundColor: 'rgba(239,246,255,0.7)',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  checkmark: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  optionLabel: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: '600',
    color: '#1e40af',
  },
  textAnswerBox: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
  },
  textAnswerText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
});
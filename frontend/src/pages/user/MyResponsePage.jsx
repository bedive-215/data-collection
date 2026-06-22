// ─── MyResponsePage.jsx ─────────────────────────────────────────────
// View your own survey response — ONLY calls getMySubmission (no fetchSurveyById).
// Works even for expired/closed surveys.
// ─────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useResponse } from "@/providers/ResponseProvider";
import {
  ChevronLeft, CheckCircle2, Loader2, AlertCircle,
  AlignLeft, FileText, Mail, Calendar, Hash, Star, CheckSquare, ChevronDown,
  Home, Clock, Inbox, ArrowLeft} from "lucide-react";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";

const TYPE_CONFIG = {
  TEXT:          { label:"Văn bản ngắn",   Icon: AlignLeft,      color:"#4f46e5", bg:"#eef2ff" },
  PARAGRAPH:     { label:"Đoạn văn",       Icon: FileText,       color:"#7c3aed", bg:"#f5f3ff" },
  EMAIL:         { label:"Email",           Icon: Mail,           color:"#0891b2", bg:"#ecfeff" },
  DATE:          { label:"Ngày tháng",      Icon: Calendar,       color:"#b45309", bg:"#fffbeb" },
  NUMBER:        { label:"Số",              Icon: Hash,           color:"#059669", bg:"#ecfdf5" },
  RATING:        { label:"Đánh giá",        Icon: Star,           color:"#d97706", bg:"#fffbeb" },
  SINGLE_CHOICE: { label:"Một lựa chọn",    Icon: CheckSquare,    color:"#ea580c", bg:"#fff7ed" },
  MULTIPLE_CHOICE:{ label:"Nhiều lựa chọn", Icon: CheckSquare,    color:"#16a34a", bg:"#f0fdf4" },
  DROPDOWN:      { label:"Danh sách thả",   Icon: ChevronDown,    color:"#6d28d9", bg:"#f5f3ff" }};

function fmtDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("vi-VN", { day:"2-digit", month:"short", year:"numeric" });
}

function AnswerCard({ item, index }) {
  const cfg = TYPE_CONFIG[item.question_type?.toUpperCase()] || TYPE_CONFIG.TEXT;
  const { Icon } = cfg;
  const answerRaw = item.answer ?? item.value ?? item.response ?? "—";
  const answerText = Array.isArray(answerRaw) ? answerRaw.join(", ") : String(answerRaw);

  return (
    <div style={{
      background:"#ffffff", borderRadius:16,
      border:"1px solid #e2e8f0",
      padding:"18px 20px",
      display:"flex", gap:14, alignItems:"flex-start"}}>
      {/* Index badge */}
      <div style={{
        width:32, height:32, borderRadius:9,
        background:"#f1f5f9", border:"1px solid #e2e8f0",
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0}}>
        <span style={{ fontSize:12, fontWeight:700, color:"#64748b", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif" }}>
          {index + 1}
        </span>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {/* Question type */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:5,
          padding:"2px 8px", borderRadius:6,
          background:cfg.bg, border:`1px solid ${cfg.color}20`,
          marginBottom:8}}>
          <Icon size={10} color={cfg.color} />
          <span style={{ fontSize:10, fontWeight:700, color:cfg.color, fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.05em" }}>
            {cfg.label}
          </span>
        </div>

        {/* Question */}
        <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:6, fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif" }}>
          {item.question || item.content || item.question_text || "Câu hỏi không có tiêu đề"}
        </div>

        {/* Answer */}
        <div style={{
          padding:"8px 12px", borderRadius:9,
          background:"#f8fafc", border:"1px solid #e2e8f0",
          fontSize:13, color:"#334155", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
          wordBreak:"break-word"}}>
          {answerText}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <main style={{ minHeight:"100vh", background:"#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <Loader2 size={44} style={{ animation:"spin 1s linear infinite", color:"#4f46e5", marginBottom:14 }} />
        <p style={{ color:"#64748b", fontSize:14, fontWeight:600 }}>Đang tải đáp án...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <main style={{ minHeight:"100vh", background:"#F8FAFC", padding:"28px 20px", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif", position:"relative" }}>
      <AnimatedSurveyBackdrop />
      <div style={{ maxWidth:560, margin:"0 auto", position:"relative", zIndex:1 }}>
        <button
          onClick={onBack}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"10px 16px", borderRadius:11,
            background:"rgba(255,255,255,0.9)", border:"1px solid rgba(0,0,0,0.08)",
            cursor:"pointer", marginBottom:20,
            fontSize:13, fontWeight:700, color:"#4f46e5"}}
        >
          <ArrowLeft size={15} /> Quay lại
        </button>

        <div style={{
          background:"rgba(255,255,255,0.9)", borderRadius:18,
          border:"1px solid rgba(0,0,0,0.06)",
          padding:"28px", textAlign:"center",
          backdropFilter:"blur(12px)"}}>
          <div style={{ width:52, height:52, borderRadius:14, background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <AlertCircle size={26} color="#ef4444" />
          </div>
          <h3 style={{ margin:"0 0 8px", color:"#991b1b", fontWeight:800, fontSize:17 }}>Không tải được đáp án</h3>
          <p style={{ margin:0, color:"#64748b", fontSize:13, lineHeight:1.6 }}>{message || "Đã xảy ra lỗi khi tải đáp án của bạn."}</p>
        </div>
      </div>
    </main>
  );
}

function EmptyState({ onBack }) {
  return (
    <main style={{ minHeight:"100vh", background:"#F8FAFC", padding:"28px 20px", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif", position:"relative" }}>
      <AnimatedSurveyBackdrop />
      <div style={{ maxWidth:560, margin:"0 auto", position:"relative", zIndex:1 }}>
        <button
          onClick={onBack}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"10px 16px", borderRadius:11,
            background:"rgba(255,255,255,0.9)", border:"1px solid rgba(0,0,0,0.08)",
            cursor:"pointer", marginBottom:20,
            fontSize:13, fontWeight:700, color:"#4f46e5"}}
        >
          <ArrowLeft size={15} /> Quay lại
        </button>

        <div style={{
          background:"rgba(255,255,255,0.9)", borderRadius:18,
          border:"1px solid rgba(0,0,0,0.06)",
          padding:"40px 28px", textAlign:"center",
          backdropFilter:"blur(12px)"}}>
          <div style={{ width:56, height:56, borderRadius:14, background:"#f8fafc", border:"1.5px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <Inbox size={26} color="#94a3b8" />
          </div>
          <h3 style={{ margin:"0 0 8px", color:"#334155", fontWeight:800, fontSize:16 }}>Chưa có đáp án</h3>
          <p style={{ margin:0, color:"#94a3b8", fontSize:13 }}>Bạn chưa trả lời khảo sát này.</p>
        </div>
      </div>
    </main>
  );
}

export default function MyResponsePage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { getMySubmission } = useResponse();

  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMySubmission(surveyId);
        setResponse(res);
      } catch (err) {
        setError(err?.message || "Không thể tải đáp án.");
      } finally {
        setLoading(false);
      }
    };

    fetchResponse();
  }, [surveyId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onBack={() => navigate("/user/home")} />;

  // Extract answers
  const raw = response?.data ?? response ?? {};
  const answers = Array.isArray(raw)
    ? raw.flatMap((r) => r.answers ?? [])
    : raw.answers ?? [];

  if (answers.length === 0 && !error) return <EmptyState onBack={() => navigate("/user/home")} />;

  // Get survey info from response data
  const surveyTitle = raw.survey?.title || response?.survey?.title || "Khảo sát";
  const surveyDesc  = raw.survey?.description || response?.survey?.description || "";
  const submittedAt = raw.submitted_at || raw.submittedAt || response?.submitted_at || null;
  const status = raw.status || response?.status || "COMPLETED";

  return (
    <main
      style={{
        minHeight:"100vh",
        background:"#F8FAFC",
        fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",
        padding:"20px 16px 60px",
        position:"relative"}}
    >
      <AnimatedSurveyBackdrop />

      <div style={{ maxWidth:720, margin:"0 auto", position:"relative", zIndex:1 }}>

        {/* Back button */}
        <button
          onClick={() => navigate("/user/home")}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"10px 16px", borderRadius:11,
            background:"rgba(255,255,255,0.92)", border:"1px solid rgba(0,0,0,0.08)",
            cursor:"pointer", marginBottom:18,
            fontSize:13, fontWeight:700, color:"#4f46e5",
            backdropFilter:"blur(8px)",
            transition:"transform .15s"}}
        >
          <ArrowLeft size={15} /> Quay lại
        </button>

        {/* Header card */}
        <div style={{
          background:"linear-gradient(135deg, #059669, #10b981)",
          borderRadius:20,
          padding:"24px 28px",
          marginBottom:24,
          position:"relative", overflow:"hidden"}}>
          {/* Decorative circles */}
          <div style={{ position:"absolute", top:-30, right:-20, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.1)" }} />
          <div style={{ position:"absolute", bottom:-20, left:-20, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />

          <div style={{ position:"relative", zIndex:1 }}>
            {/* Status badge */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"4px 12px", borderRadius:999,
              background:"rgba(255,255,255,0.25)", border:"1px solid rgba(255,255,255,0.4)",
              marginBottom:12}}>
              <CheckCircle2 size={13} color="#fff" />
              <span style={{ fontSize:11, fontWeight:800, color:"#fff", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                Đã hoàn thành
              </span>
            </div>

            <h1 style={{ margin:0, fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:"#fff", lineHeight:1.2, marginBottom:surveyDesc ? 6 : 0 }}>
              {surveyTitle}
            </h1>
            {surveyDesc && (
              <p style={{ margin:0, fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.5 }}>
                {surveyDesc}
              </p>
            )}

            {submittedAt && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:12 }}>
                <Clock size={12} color="rgba(255,255,255,0.7)" />
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.8)", fontWeight:600 }}>
                  Nộp lúc {fmtDate(submittedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Answers count */}
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          marginBottom:16}}>
          <div style={{
            padding:"6px 14px", borderRadius:999,
            background:"rgba(5,150,105,0.08)", border:"1px solid rgba(5,150,105,0.2)"}}>
            <span style={{ fontSize:13, fontWeight:800, color:"#059669" }}>
              {answers.length} câu hỏi
            </span>
          </div>
        </div>

        {/* Answers */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {answers.map((item, idx) => (
            <AnswerCard key={item.question_id || idx} item={item} index={idx} />
          ))}
        </div>

        {/* Footer nav */}
        <div style={{ marginTop:32, textAlign:"center" }}>
          <Link
            to="/user/home"
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"11px 24px", borderRadius:12,
              background:"linear-gradient(135deg,#4f46e5,#6366f1)",
              color:"#fff", fontSize:13, fontWeight:700,
              textDecoration:"none"}}
          >
            <Home size={14} /> Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}

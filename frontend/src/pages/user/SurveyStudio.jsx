import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Trash2, ChevronLeft, ChevronRight, ChevronDown, Copy,
  ExternalLink, Link as LinkIcon, CheckCircle2, Users,
  Share2, Mail, UserPlus, Lock, Globe, PowerOff, RefreshCw,
  Search, X, FileText, Eye, EyeOff, Trash,
  Send, LayoutTemplate, BarChart3, Loader2} from "lucide-react";
import MySurveyQuestionsPage from "@/pages/user/MySurveyQuestionsPage";
import UserAnalyticsPage from "@/pages/user/AnalyticsPage";
import { useSurvey } from "@/providers/SurveyProvider";
import surveyService from "@/services/surveyService";

const C = {
  bg: "#F4F3F8",
  card: "#FFFFFF",
  cardBg: "#F4F3F8",
  text: "#111827",
  body: "#374151",
  textSec: "#9CA3AF",
  textTer: "#9CA3AF",
  primary: "#5B4EE8",
  primaryBg: "#EDE9FF",
  primaryBorder: "#D6D0F5",
  border: "#E8E6F0",
  borderLight: "#E8E6F0",
  error: "#D93025",
  errorBg: "#FCE8E6",
  success: "#188038",
  successBg: "#E8F5E9",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  amberBg: "#FFF3CD",
  amberText: "#92600A",
  font: "system-ui"};

const stripHtml = (html) => {
  if (!html) return "";
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || d.innerText || "";
};

const cardStyle = {
  background: C.card,
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  padding: 20};

const badgeStyle = {
  display: "inline-flex",
  fontSize: 12,
  fontWeight: 600,
  padding: "2px 10px",
  borderRadius: 999,
  background: C.primaryBg,
  color: C.primary};

function getTypeLabel(type) {
  const map = {
    TEXT: "Văn bản ngắn", PARAGRAPH: "Đoạn văn", EMAIL: "Email",
    DATE: "Ngày", NUMBER: "Số", RATING: "Xếp hạng",
    SINGLE_CHOICE: "Một lựa chọn", MULTIPLE_CHOICE: "Nhiều lựa chọn",
    DROPDOWN: "Menu thả xuống", LINEAR_SCALE: "Phạm vi tuyến tính",
    TIME: "Giờ", FILE_UPLOAD: "Tải tệp lên"};
  return map[type] || type;
}

function STATUS_MAP(status) {
  const m = {
    ACTIVE: { label: "Đang mở", color: "#188038", bg: "#e8f5e9" },
    DRAFT: { label: "Nháp", color: "#888", bg: "#F0EEF5" },
    EXPIRED: { label: "Hết hạn", color: C.error, bg: C.errorBg },
    SCHEDULED: { label: "Lên lịch", color: C.warning, bg: C.warningBg },
    CLOSED: { label: "Đã đóng", color: "#888", bg: "#F0EEF5" }};
  return m[status] || m.DRAFT;
}

function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 10050,
      background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20}}>
      <div onClick={e => e.stopPropagation()} style={{
        ...cardStyle,
        width: "100%", maxWidth: width, overflow: "hidden"}}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderBottom: `1px solid ${C.border}`}}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8,
            border: "none", background: "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: C.textSec}}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function ShareLinkModal({ open, onClose, survey }) {
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) { setShareUrl(null); setCopied(false); setError(""); setLoading(false); }
  }, [open]);

  const handleGenerate = async () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    try {
      const res = await surveyService.shareSurveyLink(survey.id);
      const data = res?.data ?? res;
      const accessToken = data?.access_token ?? data?.accessToken ?? data?.survey?.access_token;
      const base = window.location.origin;
      const url = accessToken ? `${base}/user/surveys/${survey.id}?access_token=${accessToken}` : `${base}/user/surveys/${survey.id}`;
      if (url) setShareUrl(url); else setError("Không lấy được link.");
    } catch { setError("Tạo link thất bại."); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      const el = document.createElement("textarea");
      el.value = shareUrl; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Chia sẻ khảo sát">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "12px 16px", background: C.primaryBg, borderRadius: 8, border: `1px solid ${C.primaryBorder}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{survey?.title ? <span dangerouslySetInnerHTML={{__html:survey.title}}/> : null}</div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Tạo link để chia sẻ survey với mọi người</div>
        </div>
        {error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: C.errorBg, border: `1px solid ${C.error}` }}>
            <span style={{ fontSize: 12, color: C.error }}>{error}</span>
            <button onClick={handleGenerate} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.error}`, background: C.card, color: C.error, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Thử lại</button>
          </div>
        )}
        {shareUrl ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C.cardBg, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <LinkIcon size={14} color={C.primary} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: C.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{shareUrl}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCopy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, border: `1px solid ${copied ? C.success : C.primaryBorder}`, background: copied ? C.successBg : C.primaryBg, color: copied ? C.success : C.primary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {copied ? <><CheckCircle2 size={14} /> Đã sao chép!</> : <><Copy size={14} /> Sao chép link</>}
              </button>
              <button onClick={() => window.open(shareUrl, "_blank")} style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textSec, cursor: "pointer" }}>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={handleGenerate} disabled={loading} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 16px",
            borderRadius: 8, border: "none", height: 36,
            background: loading ? C.border : C.primary,
            color: "#fff", fontSize: 14, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer"}}>
            {loading ? "Đang tạo link..." : <><LinkIcon size={15} /> Tạo link chia sẻ</>}
          </button>
        )}
      </div>
    </Modal>
  );
}

function InviteModal({ open, onClose, survey, onInvite: onBulkInvite }) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("respondent");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => { if (!open) { setEmails(""); setSuccess(false); setError(""); setSentCount(0); setRole("respondent"); } }, [open]);
  const ROLES = [
    { value: "respondent", label: "Trả lời", desc: "Làm khảo sát" },
    { value: "viewer", label: "Xem", desc: "Chỉ xem" },
    { value: "editor", label: "Chỉnh sửa", desc: "Xem & chỉnh sửa" },
  ];
  const handleSubmit = async e => {
    e.preventDefault();
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (!list.length) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError(""); setSuccess(false);
    try {
      const fn = onBulkInvite || ((id, payload) => surveyService.inviteSurvey(id, payload));
      const results = await Promise.allSettled(list.map(email => fn(survey.id, { email, role })));
      const ok = results.filter(r=>r.status==="fulfilled").length;
      if (ok>0) { setSentCount(ok); setSuccess(true); if (ok===list.length) setEmails(""); }
      if (ok<list.length) setError(`${list.length-ok} email gửi thất bại.`);
    } catch { setError("Gửi thất bại."); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Mời người tham gia" width={500}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {success && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: C.successBg, border: `1px solid ${C.success}` }}>
          <CheckCircle2 size={14} color={C.success} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.success, fontFamily: C.font }}>Đã gửi lời mời đến {sentCount} địa chỉ email.</span>
        </div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginBottom: 8, display: "block", fontFamily: C.font }}>Vai trò</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{ padding: "10px 8px", borderRadius: 8, border: `1px solid ${role === r.value ? C.primary : C.border}`, background: role === r.value ? C.primaryBg : C.card, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: role === r.value ? C.primary : C.text, fontFamily: C.font }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: C.textSec, fontFamily: C.font }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: C.font }}>Địa chỉ email</label>
            <textarea rows={4} value={emails} onChange={e => { setEmails(e.target.value); setError(""); }}
              placeholder={"Mỗi email một dòng\nuser2@email.com"}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1px solid ${error ? C.error : C.border}`, borderRadius: 8, color: C.body, fontSize: 13, fontFamily: C.font, outline: "none", resize: "vertical", lineHeight: 1.7 }}
              onFocus={e => { e.target.style.borderColor = C.primary; }}
              onBlur={e => { e.target.style.borderColor = error ? C.error : C.border; }}
            />
            {error && <div style={{ fontSize: 12, color: C.error, fontFamily: C.font }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>Đóng</button>
              <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 8, border: "none", height: 36, background: loading ? C.border : C.primary, color: "#fff", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: C.font }}>
                {loading ? "Đang gửi..." : <><Mail size={14} /> Gửi lời mời</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ParticipantsModal({ open, onClose, survey }) {
  const [participants, setParticipants] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [confirmPid, setConfirmPid] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    try { const res = await surveyService.getParticipants(survey.id, {}); const raw = res?.data ?? res; setParticipants(raw?.participants ?? []); setCount(raw?.count ?? 0); }
    catch { setError("Không thể tải danh sách."); }
    finally { setLoading(false); }
  }, [survey?.id]);

  useEffect(() => { if (open) { load(); setSearch(""); setConfirmPid(null); } else { setParticipants([]); setCount(0); } }, [open, load]);

  const handleDelete = async pid => {
    setDeleting(pid);
    try { await surveyService.deleteParticipant(survey.id, pid); setParticipants(p => p.filter(x => x.participant_id !== pid)); setCount(c => Math.max(0, c - 1)); setConfirmPid(null); }
    finally { setDeleting(null); }
  };

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    return p.email?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q);
  });

  const getInitials = (name, email) => {
    if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (email || "?")[0].toUpperCase();
  };

  const AV = [{ bg: "#e0e7ff", color: "#3730a3" }, { bg: "#d1fae5", color: "#065f46" }, { bg: "#fce7f3", color: "#9d174d" }, { bg: "#fef3c7", color: "#78350f" }, { bg: "#f3e8ff", color: "#5b21b6" }];
  const ROLE_STYLE = { viewer: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" }, respondent: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" }, editor: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" } };
  const getRoleStyle = role => ROLE_STYLE[role?.toLowerCase()] ?? { color: C.primary, bg: C.primaryBg, border: C.primaryBorder };

  return (
    <Modal open={open} onClose={onClose} title="Quản lý người tham gia" width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, background: C.primaryBg, border: `1px solid ${C.primaryBorder}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color={C.primary} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1, fontFamily: C.font }}>{count}</div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 2, fontFamily: C.font }}>Tổng participants</div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{ padding: "0 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: C.textSec, flexShrink: 0, fontFamily: C.font }}>
            <RefreshCw size={13} style={loading ? {animation:"spin 1s linear infinite"} : {}} />Tải lại
          </button>
        </div>
        {error && !loading && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: C.errorBg, border: `1px solid ${C.error}` }}>
          <span style={{ fontSize: 12, color: C.error, fontFamily: C.font }}>{error}</span>
          <button onClick={load} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.error}`, background: C.card, color: C.error, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>Thử lại</button>
        </div>}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <Search size={13} color={C.textTer} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email hoặc vai trò..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 12, fontFamily: C.font, color: C.body, background: "transparent" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textTer, display: "flex", padding: 0 }}><X size={12} /></button>}
        </div>
        <div style={{ border: `1px solid ${C.borderLight}`, borderRadius: 14, overflow: "hidden", maxHeight: 340, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 20px",gap:12 }}>
              <Loader2 size={26} style={{animation:"spin 1s linear infinite"}} color={C.primary}/>
              <span style={{fontSize:12,color:C.textSec,fontFamily:C.font}}>Đang tải...</span>
            </div>
          ) : filtered.length === 0 && !error ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, fontFamily: C.font }}>{search ? `Không tìm thấy "${search}"` : "Chưa có người tham gia"}</div>
            </div>
          ) : (
            filtered.map((p, i) => {
              const av = AV[i % AV.length];
              const deleteKey = p.participant_id ?? p.id;
              const isConfirming = confirmPid === deleteKey;
              const isDeleting = deleting === deleteKey;
              const roleStyle = getRoleStyle(p.role);
              return (
                <div key={p.participant_id ?? p.id ?? i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none", background: isConfirming ? C.errorBg : "transparent" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: av.bg, color: av.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{getInitials(p.name, p.email)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: C.font }}>{p.name || p.email}</div>
                    {p.name && <div style={{ fontSize: 11, color: C.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: C.font }}>{p.email}</div>}
                  </div>
                  {p.role && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 999, flexShrink: 0, color: roleStyle.color, background: roleStyle.bg, border: `1px solid ${roleStyle.border}`, fontFamily: C.font }}>{p.role}</span>}
                  {isConfirming ? (
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <button onClick={() => setConfirmPid(null)} style={{ padding: "4px 9px", borderRadius: 7, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, background: C.card, color: C.textSec, cursor: "pointer", fontFamily: C.font }}>Huỷ</button>
                      <button onClick={() => handleDelete(deleteKey)} disabled={isDeleting} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: "none", background: isDeleting ? C.border : C.error, color: "#fff", cursor: isDeleting ? "not-allowed" : "pointer", fontFamily: C.font }}>
                        {isDeleting ? <Loader2 size={10} style={{animation:"spin 1s linear infinite"}}/> : <Trash size={10}/>} Xoá
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmPid(deleteKey)} style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textSec }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.error;e.currentTarget.style.color=C.error;e.currentTarget.style.background=C.errorBg;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSec;e.currentTarget.style.background="transparent";}}
                    ><Trash size={12}/></button>
                  )}
                </div>
              );
            })
          )}
        </div>
        {!loading && !error && filtered.length > 0 && search && <div style={{ fontSize: 11, color: C.textSec, textAlign: "center", fontFamily: C.font }}>Hiển thị {filtered.length} / {participants.length} người</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Đóng</button></div>
      </div>
    </Modal>
  );
}

function SendPanel({ survey, onPublish, onCloseSurvey }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("respondent");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const isPublished = survey?.is_published;
  const isClosed = survey?.status === "CLOSED";

  const handleGenerateLink = async () => {
    if (!survey?.id) return;
    setLinkLoading(true); setLinkError("");
    try {
      const res = await surveyService.shareSurveyLink(survey.id);
      const data = res?.data ?? res;
      const accessToken = data?.access_token ?? data?.accessToken ?? data?.survey?.access_token;
      const base = window.location.origin;
      const url = accessToken ? `${base}/user/surveys/${survey.id}?access_token=${accessToken}` : `${base}/user/surveys/${survey.id}`;
      if (url) setShareUrl(url); else setLinkError("Không lấy được link.");
    } catch { setLinkError("Tạo link thất bại."); }
    finally { setLinkLoading(false); }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      const el = document.createElement("textarea");
      el.value = shareUrl; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) { setInviteError("Vui lòng nhập email."); return; }
    setInviteLoading(true); setInviteError(""); setInviteSuccess(false);
    try {
      await surveyService.inviteSurvey(survey.id, { email: inviteEmail.trim(), role: inviteRole });
      setInviteSuccess(true);
      setInviteEmail("");
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch {
      setInviteError("Mời không thành công.");
    }
    finally { setInviteLoading(false); }
  };

  const sendCardStyle = {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: 16, minHeight: 180,
    display: "flex", flexDirection: "column"};

  const iconBox = {
    width: 32, height: 32, borderRadius: 8,
    background: C.primaryBg, color: C.primary,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0};

  const ROLES = [
    { value: "respondent", label: "Trả lời" },
    { value: "viewer", label: "Xem" },
    { value: "editor", label: "Chỉnh sửa" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>

        {/* Share link card */}
        <div style={sendCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={iconBox}><Share2 size={16} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.font }}>Chia sẻ link</div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 1, fontFamily: C.font }}>Tạo link công khai</div>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            {isPublished ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, color: "#10b981", background: "rgba(16,185,129,0.12)", fontFamily: C.font }}>Đã công khai</span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, color: C.warning, background: C.warningBg, fontFamily: C.font }}>Chưa công khai</span>
            )}
          </div>
          <div style={{ flex: 1 }} />
          {shareUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.body, fontFamily: "monospace" }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</span>
              <button onClick={handleCopyLink} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? C.success : C.primary, display: "flex", padding: 0 }}>
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.textSec, background: C.card }}>Chưa có link chia sẻ</div>
              <button onClick={handleGenerateLink} disabled={linkLoading} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "0 14px", borderRadius: 8, border: "none", height: 32,
                background: linkLoading ? C.border : C.primary,
                color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: C.font,
                cursor: linkLoading ? "not-allowed" : "pointer"}}>
                {linkLoading ? "Đang tạo..." : <><LinkIcon size={13} /> Tạo link</>}
              </button>
              {linkError && <div style={{ fontSize: 11, color: C.error, fontFamily: C.font }}>{linkError}</div>}
            </div>
          )}
        </div>

        {/* Email invite card with role selector */}
        <div style={sendCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={iconBox}><Mail size={16} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.font }}>Mời qua email</div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 1, fontFamily: C.font }}>Gửi lời mời trực tiếp</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {ROLES.map(r => (
              <button key={r.value} type="button" onClick={() => setInviteRole(r.value)} style={{
                flex: 1, padding: "4px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600, fontFamily: C.font,
                border: `1px solid ${inviteRole === r.value ? C.primary : C.border}`,
                background: inviteRole === r.value ? C.primaryBg : "transparent",
                color: inviteRole === r.value ? C.primary : C.textSec, cursor: "pointer"}}>
                {r.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          {inviteSuccess && (
            <div style={{ padding: "6px 10px", borderRadius: 6, background: C.successBg, border: `1px solid ${C.success}`, fontSize: 11, color: C.success, marginBottom: 8, fontFamily: C.font }}>
              <CheckCircle2 size={11} style={{ marginRight: 4, display: "inline" }} /> Đã gửi lời mời!
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={inviteEmail} onChange={e => { setInviteEmail(e.target.value); setInviteError(""); }}
              placeholder="email@example.com"
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 6, fontSize: 12, fontFamily: C.font,
                border: `1px solid ${inviteError ? C.error : C.border}`,
                color: C.body, outline: "none", background: C.card}} />
            <button onClick={handleSendInvite} disabled={inviteLoading} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "0 12px", borderRadius: 8,
              border: "none", height: 32, fontSize: 13, fontWeight: 500, fontFamily: C.font,
              background: inviteLoading ? C.border : C.primary,
              color: "#fff", cursor: inviteLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap"}}>
              {inviteLoading ? "..." : "Gửi"}
            </button>
          </div>
          {inviteError && <div style={{ fontSize: 11, color: C.error, marginTop: 4, fontFamily: C.font }}>{inviteError}</div>}
          <button onClick={() => setInviteOpen(true)} style={{
            marginTop: 8, background: "none", border: "none", color: C.primary,
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: C.font,
            display: "flex", alignItems: "center", gap: 4}}>
            <Mail size={12} /> Mời nhiều người
          </button>
        </div>

        {/* Participants card */}
        <div style={sendCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={iconBox}><Users size={16} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.font }}>Quản lý người tham gia</div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 1, fontFamily: C.font }}>Xem danh sách đã mời</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setParticipantsOpen(true)} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "0 14px", borderRadius: 8, border: `1px solid ${C.primary}`, height: 32,
            background: C.card, color: C.primary, fontSize: 13, fontWeight: 500, fontFamily: C.font,
            cursor: "pointer"}}>
            <Users size={14} /> Xem danh sách
          </button>
        </div>
      </div>

      {/* Publish / Close buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button disabled={isPublished} onClick={() => !isPublished && onPublish && onPublish(survey.id, { is_published: true })} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "0 14px", borderRadius: 8, border: "none", height: 36,
          background: isPublished ? "#10b981" : C.primary,
          color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: C.font,
          cursor: isPublished ? "not-allowed" : "pointer", opacity: isPublished ? 0.6 : 1}}>
          {isPublished ? <CheckCircle2 size={16} /> : <Globe size={16} />}
          {isPublished ? "Đã công khai" : "Công khai survey"}
        </button>
        {!isClosed && (
          <button onClick={() => onCloseSurvey && onCloseSurvey(survey.id)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "0 14px", borderRadius: 8, border: `1px solid ${C.error}`,
            background: C.card, color: C.error, fontSize: 13, fontWeight: 600, fontFamily: C.font,
            cursor: "pointer"}}>
            <PowerOff size={16} /> Đóng survey
          </button>
        )}
      </div>

      <ShareLinkModal open={shareOpen} onClose={() => setShareOpen(false)} survey={survey} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} survey={survey} />
      <ParticipantsModal open={participantsOpen} onClose={() => setParticipantsOpen(false)} survey={survey} />
    </div>
  );
}

const TABS_CONFIG = [
  { id: "design", label: "Thiết kế", icon: LayoutTemplate },
  { id: "send", label: "Gửi khảo sát", icon: Send },
  { id: "analyze", label: "Phân tích", icon: BarChart3 },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: "flex",
      gap: 0}}>
      {TABS_CONFIG.map(tab => {
        const Icon = tab.icon;
        const is = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: is ? 500 : 400,
            color: is ? "#5B4EE8" : "#9CA3AF",
            background: "transparent",
            borderBottom: is ? "2px solid #5B4EE8" : "2px solid transparent",
            transition: "border-color 0.15s"}}>
            <Icon size={15} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SurveyStudio() {
  const { surveyId } = useParams();
  const { fetchSurveyById, currentSurvey, publishSurvey, closeSurvey } = useSurvey();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["design", "send", "analyze"];
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "design"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId) return;
    setLoading(true);
    fetchSurveyById(surveyId).finally(() => setLoading(false));
  }, [surveyId]);

  const survey = currentSurvey;
  const statusInfo = STATUS_MAP(survey?.status);

  return (
    <main style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        background: C.card}}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={14} color={C.primary} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{survey?.title ? stripHtml(survey.title) : "Khảo sát"}</div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, color: statusInfo.color, background: statusInfo.bg, flexShrink: 0 }}>{statusInfo.label}</span>
              </div>
            </div>
          )}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.border }} />
              <div style={{ width: 120, height: 12, borderRadius: 4, background: C.border }} />
            </div>
          )}
          <div style={{ width: 1, height: 24, background: C.border, flexShrink: 0 }} />
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "24px auto 60px", padding: "0 20px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textSec, fontSize: 13 }}>
            Đang tải khảo sát...
          </div>
        )}

        {!loading && activeTab === "design" && (
          <MySurveyQuestionsPage
            surveyTitle={survey?.title || ""}
            surveyDescription={survey?.description || ""}
          />
        )}

        {!loading && activeTab === "send" && (
          <SendPanel
            survey={survey}
            onPublish={publishSurvey}
            onCloseSurvey={closeSurvey}
          />
        )}

        {!loading && activeTab === "analyze" && (
          <UserAnalyticsPage />
        )}
      </div>
    </main>
  );
}

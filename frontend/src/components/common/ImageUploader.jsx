import { useState, useRef } from "react";
import { Image, Upload, X, Loader2 } from "lucide-react";
import mediaService from "@/services/mediaService";
import { toast } from "react-toastify";

export default function ImageUploader({ value, onChange, label = "Thêm ảnh", type = "question" }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 10MB.");
      return;
    }

    setUploading(true);
    try {
      const data = type === "option"
        ? await mediaService.uploadOptionMedia(file)
        : await mediaService.uploadQuestionMedia(file);

      const url = data?.url || data?.secure_url;
      const mediaType = data?.media_type || "image";

      if (url) {
        onChange({ url, media_type: mediaType });
      } else {
        toast.error("Không nhận được URL ảnh từ server.");
      }
    } catch (err) {
      toast.error("Tải ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => onChange(null);

  const accentColor = type === "option" ? "#16a34a" : "#4f46e5";
  const bgColor = type === "option" ? "rgba(22,163,74,0.08)" : "rgba(79,70,229,0.08)";
  const borderColor = type === "option" ? "rgba(22,163,74,0.2)" : "rgba(79,70,229,0.2)";

  if (value) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: bgColor, border: `1px solid ${borderColor}` }}>
        <img src={value} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} />
        <span style={{ flex: 1, fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Đã có ảnh</span>
        <button type="button" onClick={handleRemove} style={{ padding: 4, border: "none", borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#dc2626", cursor: "pointer", display: "flex" }}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: dragOver ? bgColor : "rgba(255,255,255,0.5)", border: `2px dashed ${dragOver ? accentColor : borderColor}`, cursor: "pointer", transition: "all .15s" }}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {uploading ? (
        <><Loader2 size={16} color={accentColor} className="animate-spin" /><span style={{ fontSize: 11, color: "#6b7280" }}>Đang tải...</span></>
      ) : (
        <><Image size={16} color={accentColor} /><span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{label}</span></>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} style={{ display: "none" }} />
    </div>
  );
}

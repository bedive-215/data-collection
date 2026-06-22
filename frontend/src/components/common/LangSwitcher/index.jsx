import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LangSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const toggleLang = () => {
    const next = current === "en" ? "vi" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <button onClick={toggleLang} className="btn-admin-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
      <Globe size={14} />
      {current === "en" ? "EN" : "VI"}
    </button>
  );
};

export default LangSwitcher;

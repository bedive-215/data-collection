import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="btn-admin-ghost" style={{ padding: "8px", borderColor: "var(--admin-border)" }}>
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
};

export default ThemeToggle;

import { useUser } from "@/providers/UserProvider";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";

export default function GenderGuard({ children }) {
  const { user, loading: userLoading } = useUser();
  const { loading: authLoading } = useAuth();

  // Đợi cả 2 provider load xong
  if (authLoading || userLoading) {
    console.warn("GenderGuard waiting", { authLoading, userLoading, userGender: user?.gender });
    return (
      <div style={{ position: "fixed", top: 10, left: 10, zIndex: 999999, background: "rgba(0,0,0,0.75)", color: "#fff", padding: "8px 10px", borderRadius: 8, fontSize: 12 }}>
        GenderGuard WAIT {String(authLoading)} {String(userLoading)} gender={String(user?.gender)}
      </div>
    );
  }

  console.warn("GenderGuard decide", { authLoading, userLoading, userGender: user?.gender, hasUser: !!user });



  // User chưa có (chưa đăng nhập) → không guard
  if (!user) return null;

  // Đã load xong, có user, nhưng thiếu gender → redirect
  if (!user.gender) {
    return <Navigate to={ROUTERS.USER.GENDER_SETUP} replace />;
  }

  return children;
}
import { useUser } from "@/providers/UserProvider";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";

export default function GenderGuard({ children }) {
  const { user, loading: userLoading } = useUser();
  const { loading: authLoading } = useAuth();

  if (authLoading || userLoading) {
    return null;
  }

  if (!user) return null;

  if (!user.gender) {
    return <Navigate to={ROUTERS.USER.GENDER_SETUP} replace />;
  }

  return children;
}

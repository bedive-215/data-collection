import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/providers/UserProvider";
import { ROUTERS } from "@/utils/constants";

export default function GenderGuard({ children }) {
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user?.gender) {
      // console.debug("[GenderGuard] No gender — redirecting to GenderSetup");
    }
  }, [loading, user]);

  if (loading) return null;

  if (!user?.gender) {
    return <Navigate to={ROUTERS.USER.GENDER_SETUP} replace />;
  }

  return children;
}

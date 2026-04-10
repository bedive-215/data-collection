import { memo } from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#050505]">
      {children}
    </div>
  );
};

export default memo(AuthLayout);
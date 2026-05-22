import React from "react";
import { ShieldAlert, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function BlockedBanner() {
  const { logout } = useAuth();

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0f121a] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="relative">
          {/* Glow */}
          <div className="absolute -inset-4 bg-red-600/10 rounded-3xl blur-2xl" />

          <div className="relative bg-[#1a1f2e] border border-red-500/20 rounded-2xl p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={40} className="text-red-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-2 font-['Manrope',sans-serif]">
              Tài khoản đã bị khóa
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Tài khoản của bạn đã bị quản trị viên khóa tạm thời.
              Bạn không thể đăng nhập hoặc sử dụng bất kỳ tính năng nào của hệ thống.
            </p>

            {/* Divider */}
            <div className="border-t border-white/5 mb-6" />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Mail size={14} />
                <span>Liên hệ quản trị viên để được hỗ trợ</span>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                  text-sm font-bold text-white bg-red-600/20 hover:bg-red-600/30
                  border border-red-500/30 transition-all"
              >
                <LogOut size={15} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-700 mt-4">
          Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ.
        </p>
      </div>
    </div>
  );
}

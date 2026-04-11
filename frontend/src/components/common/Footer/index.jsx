// src/components/common/Footer/index.jsx
// Premium Dark Footer based on Stitch Design
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 text-sm text-gray-400">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-10 h-10 text-[#2997ff]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-2xl font-bold text-white tracking-tight">TechStore</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Điểm đến công nghệ, trải nghiệm đẳng cấp. Chúng tôi mang đến những sản phẩm tốt nhất với dịch vụ hoàn hảo cho bạn.
            </p>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-base">Liên kết</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/user/home" className="text-gray-400 hover:text-white transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/user/category/dien-thoai" className="text-gray-400 hover:text-white transition-colors">
                  Điện thoại
                </Link>
              </li>
              <li>
                <Link to="/user/category/laptop" className="text-gray-400 hover:text-white transition-colors">
                  Laptop
                </Link>
              </li>
              <li>
                <Link to="/user/category/tai-nghe" className="text-gray-400 hover:text-white transition-colors">
                  Phụ kiện
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-base">Hỗ trợ</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Trung tâm hỗ trợ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Hợp tác
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Tuyển dụng
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Trung tâm trợ giúp
                </a>
              </li>
            </ul>
          </div>

          {/* Account Column */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-base">Tài khoản</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/user/profile" className="text-gray-400 hover:text-white transition-colors">
                  Thông tin cá nhân
                </Link>
              </li>
              <li>
                <Link to="/user/orders" className="text-gray-400 hover:text-white transition-colors">
                  Đơn hàng của tôi
                </Link>
              </li>
              <li>
                <Link to="/user/cart" className="text-gray-400 hover:text-white transition-colors">
                  Giỏ hàng
                </Link>
              </li>
              <li>
                <Link to="/user/warranties" className="text-gray-400 hover:text-white transition-colors">
                  Bảo hành
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">
              © 2026 TechStore . Designed by HaiLamDev
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>

            <p className="text-gray-600 text-xs">
              Việt Nam • Tiếng Việt
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

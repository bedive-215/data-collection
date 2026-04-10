// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";                    // ← Đảm bảo import đúng
import "@/index.css";

// Providers
import { AuthProvider } from "@/providers/AuthProvider.jsx";   // ← bạn import từ providers

console.log("🚀 Rendering App...");

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />          {/* ← THÊM DÒNG NÀY VÀO */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
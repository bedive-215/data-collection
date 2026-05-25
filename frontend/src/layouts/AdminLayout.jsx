import Navbar from "../components/admin/Navbar/index";
import Sidebar from "../components/admin/Sidebar/index";
import { useState } from "react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      style={{ background: "var(--admin-bg)", minHeight: "100vh" }}
      className="overflow-x-hidden"
    >
      {/* Sidebar — fixed, w-64 */}
      <Sidebar />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content — offset by sidebar width */}
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Sticky top navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="p-8 space-y-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

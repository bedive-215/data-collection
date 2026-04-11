import Navbar from "../components/admin/Navbar/index";
import Sidebar from "../components/admin/Sidebar/index";

export default function MainLayout({ children }) {
  return (
    <div className="bg-[#131314] min-h-screen overflow-x-hidden text-[#e5e2e3]">
      {/* Sidebar — fixed, w-64 */}
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Sticky top navbar */}
        <Navbar />

        {/* Page content */}
        <main className="p-8 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
// src/layouts/HomeLayout.jsx
// Layout đặc biệt cho trang Home - full-width, không có container wrapper
// Home page tự render floating navbar riêng nên không cần UserNavbar
import React, { memo } from "react";

const HomeLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* CONTENT - Full width, no wrapper box, no header (Home has its own floating nav) */}
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
};

export default memo(HomeLayout);

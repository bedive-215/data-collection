// ── src/layouts/HomeLayout.jsx
import React, { memo } from "react";
import Navbar from "../components/user/Navbar/index";
import AiChatbox from "@/components/common/AiChatbox";

const HomeLayout = ({ children }) => {
    return (
        <div className="min-h-screen text-gray-900 font-body" style={{ backgroundColor: "#F8FAFC" }}>
            <Navbar />
            <main className="w-full" style={{ backgroundColor: "transparent", overflow: "visible" }}>
                {children}
            </main>
            <AiChatbox />
        </div>
    );
};

export default memo(HomeLayout);

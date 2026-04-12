// src/layouts/HomeLayout.jsx
import React, { memo } from "react";
import Navbar from "../components/user/Navbar/index";

const HomeLayout = ({ children }) => {
    return (
        <div className="min-h-screen text-gray-900 font-body" style={{ backgroundColor: "#f4f5f7" }}>
            <Navbar />
            <main className="w-full" style={{ backgroundColor: "#f4f5f7" }}>
                {children}
            </main>
        </div>
    );
};

export default memo(HomeLayout);
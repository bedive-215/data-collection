import React, { memo } from "react";

/** Full-width shell giống HomeLayout nhưng không có Navbar — dùng cho trang chỉnh sửa câu hỏi. */
const SurveyEditorLayout = ({ children }) => {
  return (
    <div className="min-h-screen text-gray-900 font-body" style={{ backgroundColor: "#f4f5f7" }}>
      <main className="w-full" style={{ backgroundColor: "transparent" }}>
        {children}
      </main>
    </div>
  );
};

export default memo(SurveyEditorLayout);

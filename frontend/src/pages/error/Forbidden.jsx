// src/pages/error/Forbidden.jsx
import React from "react";

const Forbidden = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: "6rem", margin: 0 }}>403</h1>
      <p style={{ fontSize: "1.5rem" }}>Forbidden - You do not have access to this page.</p>
    </div>
  );
};

export default Forbidden;

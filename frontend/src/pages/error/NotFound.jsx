// src/pages/error/NotFound.jsx
import React from "react";

const NotFound = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: "6rem", margin: 0 }}>404</h1>
      <p style={{ fontSize: "1.5rem" }}>Page Not Found</p>
    </div>
  );
};

export default NotFound;

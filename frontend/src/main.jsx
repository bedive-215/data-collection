import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import "@/index.css";

// Providers
import { AuthProvider } from "@/providers/AuthProvider.jsx";
import UserProvider from "@/providers/UserProvider";
import SurveyProvider from "@/providers/Surveyprovider";
import QuestionProvider from "@/providers/Questionprovider";
import ResponseProvider from "@/providers/Responseprovider";

console.log("🚀 Rendering App...");

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <SurveyProvider>
            <QuestionProvider>
              <ResponseProvider>
                <App />
              </ResponseProvider>
            </QuestionProvider>
          </SurveyProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
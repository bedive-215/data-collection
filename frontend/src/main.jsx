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
import OptionProvider from "./providers/OptionProvider";
import AdminStatsProvider from "./providers/AdminStatsProvider";

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
                <AdminStatsProvider>
                <OptionProvider>
                <App />
                
                </OptionProvider>
                </AdminStatsProvider>
              </ResponseProvider>
            </QuestionProvider>
          </SurveyProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
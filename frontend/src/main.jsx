import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import App from "@/App";
import "@/index.css";

// Providers
import { AuthProvider } from "@/providers/AuthProvider.jsx";
import UserProvider from "@/providers/UserProvider";
import SurveyProvider from "@/providers/SurveyProvider";
import QuestionProvider from "@/providers/Questionprovider";
import ResponseProvider from "@/providers/Responseprovider";
import OptionProvider from "./providers/OptionProvider";
import AdminStatsProvider from "./providers/AdminStatsProvider";
import { NotificationProvider } from "./contexts/NotificationContext";

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
                <NotificationProvider>
                <App />
                <ToastContainer
                  position="bottom-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={true}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="dark"
                  toastClassName="!bg-slate-800 !text-white !rounded-xl !shadow-2xl"
                  progressClassName="!bg-blue-500"
                />
                </NotificationProvider>
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
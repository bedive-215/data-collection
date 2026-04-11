// src/AppRouter.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import UserLayout from "@/layouts/UserLayout";
import HomeLayout from "@/layouts/HomeLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Admin pages
import DashboardAdmin from "@/pages/admin/Dashboard";



// User pages
import Home from "@/pages/user/Home";
import DashboardSuser from "@/pages/user/Dashboard";


// Errors
import NotFound from "@/pages/error/NotFound";
import Forbidden from "@/pages/error/Forbidden";

// Constants
import { ROUTERS } from "@/utils/constants";

const routeConfig = [
  // PUBLIC (auth)
  { path: ROUTERS.PUBLIC.LOGIN, element: Login, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.REGISTER, element: Register, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.FORGOT_PASSWORD, element: ForgotPassword, layout: AuthLayout },

  // USER
  { path: ROUTERS.USER.HOME, element: Home, layout: HomeLayout },
  { path: ROUTERS.USER.DASHBOARD, element: DashboardSuser, layout: UserLayout },
  

  // ADMIN pages
  { path: ROUTERS.ADMIN.DASHBOARD, element: DashboardAdmin, layout: AdminLayout },
  
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        const Page = route.element;

        // If a layout is provided, wrap the Page with it.
        const Wrapped = route.layout
          ? () => (
            <route.layout>
              <Page />
            </route.layout>
          )
          : Page;

        return <Route key={route.path} path={route.path} element={<Wrapped />} />;
      })}

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTERS.PUBLIC.LOGIN} replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;

import type { Metadata } from "next";
import React from "react";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | DKVN Admin",
  description: "Trang quản trị hệ thống fanbase DKVN",
};

export default function AdminDashboard() {
  return <DashboardClient />;
}
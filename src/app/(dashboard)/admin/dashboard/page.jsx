"use client";

import { APP_CONFIG } from "@/constants/appConfig";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import DashboardOverview from "@/features/dashboard/components/DashboardOverview";

export default function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={APP_CONFIG.homePageTitle} 
          subtitle={`Welcome back, Administrator! Here is the latest ${APP_CONFIG.schoolName} academic snapshot.`}
        />
        <DashboardOverview />
      </div>
    </DashboardLayout>
  );
}

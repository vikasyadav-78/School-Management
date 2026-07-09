"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/tables/DataTable";

export default function TablesPage() {
  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Academic Module", accessor: "module" },
    { header: "Capacity", accessor: "capacity" },
    { header: "Room No", accessor: "room" }
  ];

  const data = [
    { id: "M001", module: "Artificial Intelligence Lab", capacity: "60 Seats", room: "A-304" },
    { id: "M002", module: "Robotics Workshop", capacity: "40 Seats", room: "B-102" }
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Complex Data Tables" 
        subtitle="Review full tables configurations supporting pagination."
      />
      <DataTable columns={columns} data={data} />
    </DashboardLayout>
  );
}

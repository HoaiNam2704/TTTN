"use client";

import { SidebarProvider, useSidebar } from "@/providers/sidebar-provider";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-muted">
      <AdminSidebar />
      <main
        className={`min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-0" : "ml-56"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}

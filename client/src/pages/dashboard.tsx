import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { ProjectsTable } from "@/components/dashboard/ProjectsTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProjectTimeline } from "@/components/dashboard/ProjectTimeline";
import { EquipmentStatus } from "@/components/dashboard/EquipmentStatus";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentLeads } from "@/components/dashboard/RecentLeads";

import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();


  // Get first active project for project status display
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const activeProject = projects.find((p: Project) => p.status !== "completed" && p.status !== "on_hold");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pool-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6">
          {/* Key Metrics Cards */}
          <div className="mb-8">
            <MetricsCards />
          </div>

          {/* Recent Projects Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ProjectsTable />
            <ActivityFeed />
          </div>

          {/* Project Timeline & Equipment Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <ProjectTimeline />
            </div>
            <div className="space-y-4">
              <EquipmentStatus />
            </div>
          </div>

          {/* Quick Actions & Lead Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuickActions />
            <RecentLeads />
          </div>
        </div>
    </div>
  );
}

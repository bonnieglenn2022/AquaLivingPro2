import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const statusColors = {
  planning: "bg-slate-100 text-slate-800",
  excavation: "bg-sand-yellow/10 text-sand-yellow",
  plumbing: "bg-pool-blue/10 text-pool-blue",
  electrical: "bg-sunset-orange/10 text-sunset-orange",
  gunite: "bg-ocean-teal/10 text-ocean-teal",
  finishing: "bg-garden-green/10 text-garden-green",
  completed: "bg-garden-green/10 text-garden-green",
  on_hold: "bg-coral-red/10 text-coral-red",
};

export function ProjectsTable() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Pool Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded"></div>
                <div className="h-4 w-20 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeProjects = projects?.filter((project: any) => 
    !['completed', 'on_hold'].includes(project.status)
  ).slice(0, 5) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Pool Projects</CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-pool-blue hover:text-pool-blue/80">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activeProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No active projects found</p>
            <Link href="/projects">
              <Button className="mt-4 bg-pool-blue hover:bg-pool-blue/90">
                Create First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Budget
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeProjects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {project.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {project.city && project.state ? `${project.city}, ${project.state}` : 'Location TBD'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge 
                        className={statusColors[project.status as keyof typeof statusColors] || statusColors.planning}
                      >
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm text-slate-900">
                      {project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : 'TBD'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

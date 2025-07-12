import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { useState } from "react";

const phases = [
  { name: "Site Preparation & Excavation", status: "completed", cost: "$8,500", progress: "Completed" },
  { name: "Steel & Rebar Installation", status: "in_progress", cost: "$12,000", progress: "60% complete" },
  { name: "Plumbing & Electrical", status: "pending", cost: "$15,500", progress: "Scheduled for next week" },
  { name: "Gunite Application", status: "pending", cost: "$18,000", progress: "Awaiting plumbing" },
  { name: "Tile & Coping Installation", status: "pending", cost: "$22,000", progress: "TBD" },
  { name: "Pool Equipment Setup", status: "pending", cost: "$14,500", progress: "TBD" },
  { name: "Finishing & Startup", status: "pending", cost: "$6,500", progress: "TBD" },
];

export function ProjectTimeline() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const activeProjects = projects?.filter((project: any) => 
    !['completed', 'on_hold'].includes(project.status)
  ) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3 text-garden-green" />;
      case "in_progress":
        return <Clock className="w-3 h-3 text-pool-blue" />;
      default:
        return <Circle className="w-3 h-3 text-slate-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-garden-green";
      case "in_progress":
        return "text-pool-blue";
      default:
        return "text-slate-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Timeline</CardTitle>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {activeProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No active projects available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(phase.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{phase.name}</p>
                      <p className={`text-xs ${getStatusColor(phase.status)}`}>
                        {phase.progress}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{phase.cost}</p>
                      <p className="text-xs text-slate-500">
                        {phase.status === "completed" ? "On budget" : "Estimated"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

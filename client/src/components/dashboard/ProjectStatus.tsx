import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Circle, Clock } from "lucide-react";
import type { Project, ProjectTodo } from "@shared/schema";

interface ProjectStatusProps {
  project: Project;
}

export function ProjectStatus({ project }: ProjectStatusProps) {
  const { data: nextTodo } = useQuery({
    queryKey: ["/api/projects", project.id, "todos", "next"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/todos/next`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const statusColor = {
    planning: "bg-blue-100 text-blue-800",
    design: "bg-purple-100 text-purple-800",
    permitting: "bg-yellow-100 text-yellow-800",
    construction: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
  }[project.status] || "bg-gray-100 text-gray-800";

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Current Project Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-2">Active Project</h3>
          <div className="flex items-center justify-between">
            <span className="font-medium">{project.name}</span>
            <Badge className={statusColor}>
              {project.status}
            </Badge>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-gray-600 mb-2">Next Todo</h4>
          {nextTodo ? (
            <div className="flex items-start gap-3">
              <Circle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{nextTodo.title}</p>
                <p className="text-xs text-gray-500 mt-1">{nextTodo.description}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">All todos completed!</span>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Started {new Date(project.startDate).toLocaleDateString()}
            </span>
          </div>
          {project.endDate && (
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Expected completion {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
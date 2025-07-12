import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Plus, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProjectTodo } from "@shared/schema";

interface TodoListProps {
  projectId: number;
}

export function TodoList({ projectId }: TodoListProps) {
  const { toast } = useToast();

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "todos"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/todos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ProjectTodo> }) => {
      return await apiRequest("PUT", `/api/todos/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "todos"] });
      toast({
        title: "Success",
        description: "Todo updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive",
      });
    },
  });

  const handleTodoToggle = (todo: ProjectTodo) => {
    updateTodoMutation.mutate({
      id: todo.id,
      updates: { completed: !todo.completed },
    });
  };

  const completedCount = todos.filter((todo: ProjectTodo) => todo.completed).length;
  const totalCount = todos.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Project To-Do List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-pool-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading todos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Project To-Do List
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Progress: {completedCount} of {totalCount} completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todos.map((todo: ProjectTodo) => (
            <div
              key={todo.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                todo.completed
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center mt-0.5">
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.completed}
                  onCheckedChange={() => handleTodoToggle(todo)}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    {todo.order}.
                  </span>
                  <label
                    htmlFor={`todo-${todo.id}`}
                    className={`text-sm font-medium cursor-pointer ${
                      todo.completed ? "line-through text-green-700" : "text-slate-900"
                    }`}
                  >
                    {todo.title}
                  </label>
                </div>
                {todo.description && (
                  <p className={`text-xs mt-1 ${
                    todo.completed ? "text-green-600" : "text-slate-600"
                  }`}>
                    {todo.description}
                  </p>
                )}
                {todo.completed && todo.completedAt && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">
                      Completed {new Date(todo.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {totalCount === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No todos found for this project</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
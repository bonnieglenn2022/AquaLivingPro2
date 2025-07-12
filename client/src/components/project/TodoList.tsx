import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Circle, Plus, Clock, Calendar, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProjectTodo } from "@shared/schema";

interface ToDoListProps {
  projectId: number;
}

export function TodoList({ projectId }: ToDoListProps) {
  const { toast } = useToast();
  const [editingToDo, setEditingToDo] = useState<ProjectTodo | null>(null);
  const [completionDate, setCompletionDate] = useState("");

  const { data: toDos = [], isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "todos"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/todos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const updateToDoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ProjectTodo> }) => {
      return await apiRequest("PUT", `/api/todos/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "todos"] });
      toast({
        title: "Success",
        description: "To Do updated successfully",
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
        description: "Failed to update To Do",
        variant: "destructive",
      });
    },
  });

  const handleToDoToggle = (toDo: ProjectTodo) => {
    if (!toDo.completed) {
      // If marking as complete, show date picker
      setEditingToDo(toDo);
      setCompletionDate(new Date().toISOString().split('T')[0]);
    } else {
      // If unmarking as complete
      updateToDoMutation.mutate({
        id: toDo.id,
        updates: { completed: false },
      });
    }
  };

  const handleDateConfirm = () => {
    if (editingToDo) {
      updateToDoMutation.mutate({
        id: editingToDo.id,
        updates: { 
          completed: true,
          completedAt: new Date(completionDate).toISOString()
        },
      });
      setEditingToDo(null);
      setCompletionDate("");
    }
  };

  const completedCount = toDos.filter((toDo: ProjectTodo) => toDo.completed).length;
  const totalCount = toDos.length;
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
            <p className="text-slate-600">Loading To Dos...</p>
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
          {toDos.map((toDo: ProjectTodo) => (
            <div
              key={toDo.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                toDo.completed
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center mt-0.5">
                <Checkbox
                  id={`todo-${toDo.id}`}
                  checked={toDo.completed}
                  onCheckedChange={() => handleToDoToggle(toDo)}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    {toDo.order}.
                  </span>
                  <label
                    htmlFor={`todo-${toDo.id}`}
                    className={`text-sm font-medium cursor-pointer ${
                      toDo.completed ? "line-through text-green-700" : "text-slate-900"
                    }`}
                  >
                    {toDo.title}
                  </label>
                </div>
                {toDo.description && (
                  <p className={`text-xs mt-1 ${
                    toDo.completed ? "text-green-600" : "text-slate-600"
                  }`}>
                    {toDo.description}
                  </p>
                )}
                {toDo.completed && toDo.completedAt && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">
                      Completed {new Date(toDo.completedAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingToDo(toDo);
                        setCompletionDate(new Date(toDo.completedAt).toISOString().split('T')[0]);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {totalCount === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No To Dos found for this project</p>
          </div>
        )}
      </CardContent>

      {/* Date Picker Dialog */}
      <Dialog open={!!editingToDo} onOpenChange={(open) => !open && setEditingToDo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Completion Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="completion-date">Completion Date</Label>
              <Input
                id="completion-date"
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingToDo(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDateConfirm}
                disabled={!completionDate}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
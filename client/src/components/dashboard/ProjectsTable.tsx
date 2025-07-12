import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Eye, MapPin, DollarSign, Building, Calendar, Edit3, Save, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Project, Customer, InsertProject } from "@shared/schema";
import { TodoList } from "@/components/project/TodoList";

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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<InsertProject>>({});
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Customer";
  };

  const getProjectProgress = (status: string) => {
    switch (status) {
      case "planning": return 10;
      case "excavation": return 25;
      case "plumbing": return 40;
      case "electrical": return 55;
      case "gunite": return 70;
      case "finishing": return 85;
      case "completed": return 100;
      case "on_hold": return 0;
      default: return 0;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "planning": return "Planning";
      case "excavation": return "Excavation";
      case "plumbing": return "Plumbing";
      case "electrical": return "Electrical";
      case "gunite": return "Gunite";
      case "finishing": return "Finishing";
      case "completed": return "Completed";
      case "on_hold": return "On Hold";
      default: return status;
    }
  };

  const getProjectTypeDisplayName = (type: string) => {
    switch (type) {
      case "pool_spa": return "Pool & Spa";
      case "pool_only": return "Pool Only";
      case "decking": return "Decking";
      case "patio_cover": return "Patio Cover";
      case "pergola": return "Pergola";
      case "outdoor_kitchen": return "Outdoor Kitchen";
      case "driveway": return "Driveway";
      default: return type;
    }
  };

  const getProjectTypesDisplay = (types: string[]) => {
    return types.map(type => getProjectTypeDisplayName(type)).join(", ");
  };

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertProject> }) => {
      return await apiRequest("PUT", `/api/projects/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Project updated successfully",
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
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setEditForm({
      name: project.name,
      types: project.types || ["pool_spa"],
      status: project.status,
      budget: project.budget,
      address: project.address,
      city: project.city,
      state: project.state,
      zipCode: project.zipCode,
      description: project.description,
      startDate: project.startDate,
      estimatedCompletion: project.estimatedCompletion,
    });
    setIsDetailsDialogOpen(true);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedProject) {
      setEditForm({
        name: selectedProject.name,
        types: selectedProject.types || ["pool_spa"],
        status: selectedProject.status,
        budget: selectedProject.budget,
        address: selectedProject.address,
        city: selectedProject.city,
        state: selectedProject.state,
        zipCode: selectedProject.zipCode,
        description: selectedProject.description,
        startDate: selectedProject.startDate,
        estimatedCompletion: selectedProject.estimatedCompletion,
      });
    }
  };

  const handleSaveEdit = () => {
    if (selectedProject) {
      updateProjectMutation.mutate({
        id: selectedProject.id,
        updates: editForm,
      });
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProjectTypeChange = (type: string, checked: boolean) => {
    const currentTypes = editForm.types || [];
    if (checked) {
      setEditForm(prev => ({ ...prev, types: [...currentTypes, type] }));
    } else {
      setEditForm(prev => ({ ...prev, types: currentTypes.filter(t => t !== type) }));
    }
  };

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
                  <tr 
                    key={project.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => handleProjectClick(project)}
                  >
                    <td className="py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          {project.name}
                          <Eye className="h-4 w-4 text-slate-400" />
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
      
      {/* Project Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isEditing ? "Edit Project" : selectedProject?.name}</span>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEditClick}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-6">
              {isEditing ? (
                // Edit Mode
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Project Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Project Name</Label>
                          <Input
                            id="edit-name"
                            value={editForm.name || ""}
                            onChange={(e) => handleFormChange("name", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Project Types (select all that apply)</Label>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {[
                              { value: "pool_spa", label: "Pool & Spa" },
                              { value: "pool_only", label: "Pool Only" },
                              { value: "decking", label: "Decking" },
                              { value: "patio_cover", label: "Patio Cover" },
                              { value: "pergola", label: "Pergola" },
                              { value: "outdoor_kitchen", label: "Outdoor Kitchen" },
                              { value: "driveway", label: "Driveway" },
                            ].map((type) => (
                              <div key={type.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`type-${type.value}`}
                                  checked={editForm.types?.includes(type.value) || false}
                                  onCheckedChange={(checked) => handleProjectTypeChange(type.value, checked as boolean)}
                                />
                                <Label htmlFor={`type-${type.value}`} className="text-sm font-normal">
                                  {type.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-status">Status</Label>
                          <Select
                            value={editForm.status || ""}
                            onValueChange={(value) => handleFormChange("status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="excavation">Excavation</SelectItem>
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="gunite">Gunite</SelectItem>
                              <SelectItem value="finishing">Finishing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-budget">Budget</Label>
                          <Input
                            id="edit-budget"
                            type="number"
                            value={editForm.budget || ""}
                            onChange={(e) => handleFormChange("budget", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Location & Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="edit-address">Address</Label>
                          <Input
                            id="edit-address"
                            value={editForm.address || ""}
                            onChange={(e) => handleFormChange("address", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="edit-city">City</Label>
                            <Input
                              id="edit-city"
                              value={editForm.city || ""}
                              onChange={(e) => handleFormChange("city", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-state">State</Label>
                            <Input
                              id="edit-state"
                              value={editForm.state || ""}
                              onChange={(e) => handleFormChange("state", e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-zipCode">Zip Code</Label>
                          <Input
                            id="edit-zipCode"
                            value={editForm.zipCode || ""}
                            onChange={(e) => handleFormChange("zipCode", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-startDate">Start Date</Label>
                          <Input
                            id="edit-startDate"
                            type="date"
                            value={editForm.startDate ? new Date(editForm.startDate).toISOString().split('T')[0] : ""}
                            onChange={(e) => handleFormChange("startDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-estimatedCompletion">Estimated Completion</Label>
                          <Input
                            id="edit-estimatedCompletion"
                            type="date"
                            value={editForm.estimatedCompletion ? new Date(editForm.estimatedCompletion).toISOString().split('T')[0] : ""}
                            onChange={(e) => handleFormChange("estimatedCompletion", e.target.value ? new Date(e.target.value).toISOString() : null)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Project Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={editForm.description || ""}
                        onChange={(e) => handleFormChange("description", e.target.value)}
                        rows={4}
                        placeholder="Enter project description..."
                      />
                    </CardContent>
                  </Card>

                  {/* Edit Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveEdit}
                      disabled={updateProjectMutation.isPending}
                      className="bg-pool-blue hover:bg-pool-blue/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Project Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Customer:</span>
                          <span>{getCustomerName(selectedProject.customerId)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Types:</span>
                          <span>{getProjectTypesDisplay(selectedProject.types || ["pool_spa"])}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
                          <Badge className={statusColors[selectedProject.status as keyof typeof statusColors] || statusColors.planning}>
                            {getStatusDisplayName(selectedProject.status)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Progress:</span>
                          <span>{getProjectProgress(selectedProject.status)}%</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Construction Progress</span>
                            <span>{getProjectProgress(selectedProject.status)}%</span>
                          </div>
                          <Progress value={getProjectProgress(selectedProject.status)} className="h-2" />
                        </div>
                        {selectedProject.budget && (
                          <div className="flex justify-between">
                            <span className="font-medium">Budget:</span>
                            <span>${parseFloat(selectedProject.budget).toLocaleString()}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Location & Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedProject.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Address:</p>
                              <p className="text-sm text-slate-600">{selectedProject.address}</p>
                            </div>
                          </div>
                        )}
                        {(selectedProject.city || selectedProject.state) && (
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">City, State:</p>
                              <p className="text-sm text-slate-600">
                                {selectedProject.city}, {selectedProject.state} {selectedProject.zipCode}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedProject.startDate && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Start Date:</p>
                              <p className="text-sm text-slate-600">
                                {new Date(selectedProject.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedProject.estimatedCompletion && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Estimated Completion:</p>
                              <p className="text-sm text-slate-600">
                                {new Date(selectedProject.estimatedCompletion).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Description */}
                  {selectedProject.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Project Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600">{selectedProject.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Project Todos */}
                  <TodoList projectId={selectedProject.id} />

                  {/* View Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Link href="/projects">
                      <Button variant="outline">
                        View All Projects
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

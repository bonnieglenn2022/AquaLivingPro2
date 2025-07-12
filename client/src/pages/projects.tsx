import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  Building, 
  Waves,
  Wrench,
  CheckCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Project, InsertProject, Customer } from "@shared/schema";
import { TodoList } from "@/components/project/TodoList";

export default function Projects() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["pool_spa"]);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isAuthenticated,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: InsertProject) => {
      return await apiRequest("POST", "/api/projects", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
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
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertProject> }) => {
      return await apiRequest("PUT", `/api/projects/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-blue-100 text-blue-700 border-blue-200";
      case "excavation": return "bg-orange-100 text-orange-700 border-orange-200";
      case "plumbing": return "bg-purple-100 text-purple-700 border-purple-200";
      case "electrical": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "gunite": return "bg-gray-100 text-gray-700 border-gray-200";
      case "finishing": return "bg-green-100 text-green-700 border-green-200";
      case "completed": return "bg-green-100 text-green-700 border-green-200";
      case "on_hold": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
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

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Customer";
  };

  const handleStatusChange = (projectId: number, newStatus: string) => {
    updateProjectMutation.mutate({
      id: projectId,
      updates: { status: newStatus },
    });
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsDialogOpen(true);
  };

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    
    const projectData: InsertProject = {
      name: form.get("name") as string,
      customerId: parseInt(form.get("customerId") as string),
      types: selectedTypes,
      status: "planning",
      budget: form.get("budget") as string || null,
      address: form.get("address") as string || null,
      city: form.get("city") as string || null,
      state: form.get("state") as string || null,
      zipCode: form.get("zipCode") as string || null,
      description: form.get("description") as string || null,
    };

    createProjectMutation.mutate(projectData);
  };

  const handleProjectTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes(prev => [...prev, type]);
    } else {
      setSelectedTypes(prev => prev.filter(t => t !== type));
    }
  };

  const filteredProjects = projects.filter((project: Project) => {
    if (statusFilter === "all") return true;
    return project.status === statusFilter;
  });

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
    <div className="flex h-screen bg-slate-50">
      <AppSidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      <main className="flex-1 overflow-hidden">
        <Header 
          title="Active Pool Projects" 
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
        />
        
        <div className="p-6 overflow-y-auto h-full">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Active Pool Projects</h1>
              <p className="text-slate-600">Manage and track your pool construction projects</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-pool-blue hover:bg-pool-blue/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="customerId">Customer *</Label>
                    <Select name="customerId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.filter((c: Customer) => c.status === "sold").map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.firstName} {customer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Project Types * (select all that apply)</Label>
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
                            id={`create-type-${type.value}`}
                            checked={selectedTypes.includes(type.value)}
                            onCheckedChange={(checked) => handleProjectTypeChange(type.value, checked as boolean)}
                          />
                          <Label htmlFor={`create-type-${type.value}`} className="text-sm font-normal">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget</Label>
                    <Input id="budget" name="budget" type="number" placeholder="0.00" />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" name="state" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={3} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProjectMutation.isPending}>
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
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

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-pool-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <Building className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Projects Found</h3>
              <p className="text-slate-600 mb-4">
                When leads are marked as "Sold", projects will automatically appear here.
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-pool-blue hover:bg-pool-blue/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: Project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-slate-600">{getCustomerName(project.customerId)}</p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusDisplayName(project.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Project Type & Progress */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Waves className="h-4 w-4 text-pool-blue" />
                        <span className="text-sm font-medium">{getProjectTypesDisplay(project.types || ["pool_spa"])}</span>
                      </div>
                      <span className="text-sm text-slate-600">{getProjectProgress(project.status)}%</span>
                    </div>
                    
                    <Progress value={getProjectProgress(project.status)} className="h-2" />

                    {/* Location */}
                    {project.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-600">
                          {project.city}, {project.state}
                        </span>
                      </div>
                    )}

                    {/* Budget */}
                    {project.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-600">
                          ${parseFloat(project.budget).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Select 
                        value={project.status} 
                        onValueChange={(value) => handleStatusChange(project.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
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
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(project)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Project Details Dialog */}
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedProject?.name}
                </DialogTitle>
              </DialogHeader>
              
              {selectedProject && (
                <div className="space-y-6">
                  {/* Project Overview */}
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
                          <Badge className={getStatusColor(selectedProject.status)}>
                            {getStatusDisplayName(selectedProject.status)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Progress:</span>
                          <span>{getProjectProgress(selectedProject.status)}%</span>
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
                        <CardTitle className="text-lg">Location</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedProject.address && (
                          <div>
                            <span className="font-medium">Address:</span>
                            <p className="text-slate-600">{selectedProject.address}</p>
                          </div>
                        )}
                        {(selectedProject.city || selectedProject.state) && (
                          <div>
                            <span className="font-medium">City, State:</span>
                            <p className="text-slate-600">
                              {selectedProject.city}, {selectedProject.state} {selectedProject.zipCode}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Description */}
                  {selectedProject.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600">{selectedProject.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Project Todos */}
                  <TodoList projectId={selectedProject.id} />

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

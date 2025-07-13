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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Phone, Mail, MapPin, Calendar, User, TrendingUp, Filter, Upload, FileText, Image } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Customer, InsertCustomer } from "@shared/schema";

export default function Leads() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    leadSource: "",
    priority: "warm",
    salesperson: ""
  });
  const [editFormData, setEditFormData] = useState({
    leadSource: "",
    priority: "warm",
    salesperson: ""
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isAuthenticated,
  });

  const uploadLeadsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/customers/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsUploadDialogOpen(false);
      toast({
        title: "Upload Complete",
        description: data.message,
      });
    },
    onError: (error) => {
      console.error("Error uploading leads:", error);
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
        title: "Upload Failed",
        description: `Failed to upload leads: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: InsertCustomer) => {
      return await apiRequest("POST", "/api/customers", customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsCreateDialogOpen(false);
      setFormData({ leadSource: "", priority: "warm", salesperson: "" }); // Reset form
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating lead:", error);
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
        description: `Failed to create lead: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertCustomer> }) => {
      return await apiRequest("PUT", `/api/customers/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      toast({
        title: "Success",
        description: "Lead updated successfully",
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
        description: "Failed to update lead",
        variant: "destructive",
      });
    },
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

  // Filter customers based on selected filters
  const filteredCustomers = customers.filter((customer: Customer) => {
    const statusMatch = statusFilter === "all" || customer.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || customer.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  // Group customers by status for metrics
  const metrics = {
    total: customers.length,
    newLeads: customers.filter((c: Customer) => c.status === "new_lead").length,
    inDesign: customers.filter((c: Customer) => ["design", "design_meeting", "redesign"].includes(c.status)).length,
    bidding: customers.filter((c: Customer) => ["bid", "budget_meeting", "rebid"].includes(c.status)).length,
    sold: customers.filter((c: Customer) => c.status === "sold").length,
    hot: customers.filter((c: Customer) => c.priority === "hot").length,
    warm: customers.filter((c: Customer) => c.priority === "warm").length,
    cold: customers.filter((c: Customer) => c.priority === "cold").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new_lead": return "bg-blue-100 text-blue-800";
      case "design": 
      case "design_meeting": 
      case "redesign": return "bg-purple-100 text-purple-800";
      case "bid": 
      case "budget_meeting": 
      case "rebid": return "bg-orange-100 text-orange-800";
      case "sign_contract": return "bg-green-100 text-green-800";
      case "sold": return "bg-emerald-100 text-emerald-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      case "waiting_on_financing": return "bg-cyan-100 text-cyan-800";
      case "lost_lead": 
      case "bad_lead": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "new_lead": return "New Lead";
      case "design": return "Design";
      case "design_meeting": return "Design Meeting";
      case "redesign": return "ReDesign";
      case "bid": return "Bid";
      case "budget_meeting": return "Budget Meeting";
      case "rebid": return "Rebid";
      case "sign_contract": return "Sign Contract";
      case "sold": return "Sold";
      case "on_hold": return "On Hold";
      case "waiting_on_financing": return "Waiting on Financing";
      case "lost_lead": return "Lost Lead";
      case "bad_lead": return "Bad Lead";
      default: return status;
    }
  };

  const getSalespersonDisplayName = (salesperson: string | null) => {
    if (!salesperson || salesperson === "unassigned") return "Unassigned";
    switch (salesperson) {
      case "tracy_glenn": return "Tracy Glenn";
      default: return salesperson;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hot": return "bg-red-100 text-red-800";
      case "warm": return "bg-orange-100 text-orange-800";
      case "cold": return "bg-blue-100 text-blue-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const handleCreateLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    
    const leadData: InsertCustomer = {
      firstName: form.get("firstName") as string,
      lastName: form.get("lastName") as string,
      email: form.get("email") as string || null,
      phone: form.get("phone") as string || null,
      address: form.get("address") as string || null,
      city: form.get("city") as string || null,
      state: form.get("state") as string || null,
      zipCode: form.get("zipCode") as string || null,
      leadSource: formData.leadSource || null,
      status: "new_lead", // Always set as new_lead for new entries
      priority: formData.priority || "warm",
      salesperson: formData.salesperson || null,
      notes: form.get("notes") as string || null,
    };

    console.log("Creating lead with data:", leadData);
    createCustomerMutation.mutate(leadData);
  };

  const handleStatusChange = (customerId: number, newStatus: string) => {
    updateCustomerMutation.mutate({
      id: customerId,
      updates: { status: newStatus },
    });
  };

  const handlePriorityChange = (customerId: number, newPriority: string) => {
    updateCustomerMutation.mutate({
      id: customerId,
      updates: { priority: newPriority },
    });
  };

  const handleSalespersonChange = (customerId: number, newSalesperson: string) => {
    updateCustomerMutation.mutate({
      id: customerId,
      updates: { salesperson: newSalesperson },
    });
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
  };

  const handleEditLead = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      leadSource: customer.leadSource || "",
      priority: customer.priority || "warm",
      salesperson: customer.salesperson || ""
    });
    setIsEditDialogOpen(true);
    setIsDetailsDialogOpen(false);
  };

  const handleUpdateLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const form = new FormData(e.currentTarget);
    
    const updates: Partial<InsertCustomer> = {
      firstName: form.get("firstName") as string,
      lastName: form.get("lastName") as string,
      email: form.get("email") as string || null,
      phone: form.get("phone") as string || null,
      address: form.get("address") as string || null,
      city: form.get("city") as string || null,
      state: form.get("state") as string || null,
      zipCode: form.get("zipCode") as string || null,
      leadSource: editFormData.leadSource || null,
      priority: editFormData.priority || "warm",
      salesperson: editFormData.salesperson || null,
      notes: form.get("notes") as string || null,
    };

    updateCustomerMutation.mutate({
      id: selectedCustomer.id,
      updates
    });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <AppSidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      <main className="flex-1 overflow-hidden">
        <Header 
          title="CRM & Leads" 
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
        />
        
        <div className="p-6 overflow-y-auto h-full">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-pool-blue to-ocean-teal text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pool-blue-100 text-sm">Total Contacts</p>
                    <p className="text-2xl font-bold">{metrics.total}</p>
                  </div>
                  <User className="h-8 w-8 text-pool-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">New Leads</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.newLeads}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">In Design</p>
                    <p className="text-2xl font-bold text-purple-600">{metrics.inDesign}</p>
                  </div>
                  <User className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Hot Leads</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.hot}</p>
                  </div>
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">H</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Warm Leads</p>
                    <p className="text-2xl font-bold text-orange-600">{metrics.warm}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">W</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Bidding</p>
                    <p className="text-2xl font-bold text-orange-600">{metrics.bidding}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">B</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Sold</p>
                    <p className="text-2xl font-bold text-emerald-600">{metrics.sold}</p>
                  </div>
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div className="flex gap-4 items-center">
              <div className="flex gap-2">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-pool-blue hover:bg-pool-blue/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Lead
                    </Button>
                  </DialogTrigger>
                </Dialog>
                
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-pool-blue text-pool-blue hover:bg-pool-blue hover:text-white">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV/Excel
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new_lead">New Lead</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="bid">Bid</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leads Grid */}
          <div className="space-y-4">
            {customersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-slate-200 rounded"></div>
                      <div className="h-6 w-16 bg-slate-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No leads found matching your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((customer: Customer) => (
                  <Card 
                    key={customer.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(customer)}
                  >
                    <CardContent className="p-4">
                      <div onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 
                            className="font-semibold text-slate-900 hover:text-pool-blue cursor-pointer"
                            onClick={() => handleViewDetails(customer)}
                          >
                            {customer.firstName} {customer.lastName}
                          </h3>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600 mb-4">
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{customer.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 items-center mb-3">
                          <Badge variant={customer.status === "sold" ? "default" : "secondary"}>
                            {customer.status?.replace(/_/g, " ") || "New Lead"}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {customer.priority === "hot" && <Flame className="h-4 w-4 text-red-500" />}
                            {customer.priority === "warm" && <TrendingUp className="h-4 w-4 text-yellow-500" />}
                            {customer.priority === "cold" && <TrendingDown className="h-4 w-4 text-blue-500" />}
                            <span className="text-xs text-slate-600 capitalize">{customer.priority || "warm"}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center flex-wrap">
                          <Select
                            value={customer.status || "new_lead"}
                            onValueChange={(value) => handleStatusChange(customer.id, value)}
                            disabled={updateCustomerMutation.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new_lead">New Lead</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="design_meeting">Design Meeting</SelectItem>
                              <SelectItem value="redesign">Redesign</SelectItem>
                              <SelectItem value="bid">Bid</SelectItem>
                              <SelectItem value="budget_meeting">Budget Meeting</SelectItem>
                              <SelectItem value="rebid">Rebid</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={customer.priority || "warm"}
                            onValueChange={(value) => handlePriorityChange(customer.id, value)}
                            disabled={updateCustomerMutation.isPending}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hot">Hot</SelectItem>
                              <SelectItem value="warm">Warm</SelectItem>
                              <SelectItem value="cold">Cold</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={customer.salesperson || "unassigned"}
                            onValueChange={(value) => handleSalespersonChange(customer.id, value)}
                            disabled={updateCustomerMutation.isPending}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tracy_glenn">Tracy Glenn</SelectItem>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(customer)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Lead Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" name="firstName" required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" name="lastName" required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" type="tel" />
                      </div>
                      <div>
                        <Label htmlFor="leadSource">Lead Source</Label>
                        <Select 
                          value={formData.leadSource} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, leadSource: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="home_show">Home Show</SelectItem>
                            <SelectItem value="advertisement">Advertisement</SelectItem>
                            <SelectItem value="cold_call">Cold Call</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={formData.priority} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hot">Hot</SelectItem>
                            <SelectItem value="warm">Warm</SelectItem>
                            <SelectItem value="cold">Cold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input id="zipCode" name="zipCode" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" />
                    </div>

                    <div>
                      <Label htmlFor="salesperson">Assigned Salesperson</Label>
                      <Select 
                        value={formData.salesperson} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, salesperson: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select salesperson" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tracy_glenn">Tracy Glenn</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" name="notes" placeholder="Initial notes about the lead..." />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCreateDialogOpen(false);
                        setFormData({ leadSource: "", priority: "warm", salesperson: "" });
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCustomerMutation.isPending}>
                        {createCustomerMutation.isPending ? "Creating..." : "Create Lead"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Lead Details Dialog */}
              <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Lead Details - {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {selectedCustomer && (
                    <div className="space-y-6">
                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">Name:</span>
                              <span>{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                            </div>
                            {selectedCustomer.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                <span className="font-medium">Email:</span>
                                <span>{selectedCustomer.email}</span>
                              </div>
                            )}
                            {selectedCustomer.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-slate-500" />
                                <span className="font-medium">Phone:</span>
                                <span>{selectedCustomer.phone}</span>
                              </div>
                            )}
                            {(selectedCustomer.address || selectedCustomer.city || selectedCustomer.state) && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-slate-500 mt-1" />
                                <div>
                                  <span className="font-medium">Address:</span>
                                  <div className="text-slate-600">
                                    {selectedCustomer.address && <div>{selectedCustomer.address}</div>}
                                    {(selectedCustomer.city || selectedCustomer.state) && (
                                      <div>
                                        {selectedCustomer.city}{selectedCustomer.city && selectedCustomer.state && ", "}{selectedCustomer.state} {selectedCustomer.zipCode}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Lead Status</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Current Status:</span>
                              <Badge className={getStatusColor(selectedCustomer.status)}>
                                {getStatusDisplayName(selectedCustomer.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Priority:</span>
                              <Badge className={getPriorityColor(selectedCustomer.priority || "warm")}>
                                {selectedCustomer.priority}
                              </Badge>
                            </div>
                            {selectedCustomer.leadSource && (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-500" />
                                <span className="font-medium">Lead Source:</span>
                                <span>{selectedCustomer.leadSource}</span>
                              </div>
                            )}
                            {selectedCustomer.salesperson && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-500" />
                                <span className="font-medium">Assigned To:</span>
                                <span>{getSalespersonDisplayName(selectedCustomer.salesperson)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">Created:</span>
                              <span>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Notes Section */}
                      {selectedCustomer.notes && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Notes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-slate-600 whitespace-pre-wrap">{selectedCustomer.notes}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Documents Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documents & Photos
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* File Upload Area */}
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-600 mb-2">Upload photos, PDFs, or other documents</p>
                            <Input 
                              type="file" 
                              multiple 
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx" 
                              className="hidden" 
                              id={`file-upload-${selectedCustomer.id}`}
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  const fileNames = Array.from(files).map(f => f.name).join(', ');
                                  toast({
                                    title: "Files Selected",
                                    description: `Selected: ${fileNames}`,
                                  });
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`file-upload-${selectedCustomer.id}`} 
                              className="cursor-pointer inline-block"
                            >
                              <div className="bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-4 py-2 text-sm font-medium text-slate-700 mt-2 inline-flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Choose Files
                              </div>
                            </Label>
                            <p className="text-xs text-slate-500 mt-2">
                              Supports: PDF, JPG, PNG, GIF, DOC, DOCX
                            </p>
                          </div>

                          {/* Existing Documents List */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-slate-700">Uploaded Documents</h4>
                            {/* Placeholder for existing documents */}
                            <div className="text-slate-500 text-sm italic">
                              No documents uploaded yet
                            </div>
                            {/* Future: Map through actual documents from database */}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                          Close
                        </Button>
                        <Button 
                          className="bg-pool-blue hover:bg-pool-blue/90"
                          onClick={() => handleEditLead(selectedCustomer)}
                        >
                          Edit Lead
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Edit Lead Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Lead - {selectedCustomer?.firstName} {selectedCustomer?.lastName}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateLead} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-firstName">First Name *</Label>
                        <Input 
                          id="edit-firstName" 
                          name="firstName" 
                          defaultValue={selectedCustomer?.firstName}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-lastName">Last Name *</Label>
                        <Input 
                          id="edit-lastName" 
                          name="lastName" 
                          defaultValue={selectedCustomer?.lastName}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input 
                          id="edit-email" 
                          name="email" 
                          type="email" 
                          defaultValue={selectedCustomer?.email || ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input 
                          id="edit-phone" 
                          name="phone" 
                          type="tel" 
                          defaultValue={selectedCustomer?.phone || ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-leadSource">Lead Source</Label>
                        <Select 
                          value={editFormData.leadSource} 
                          onValueChange={(value) => setEditFormData(prev => ({ ...prev, leadSource: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="home_show">Home Show</SelectItem>
                            <SelectItem value="advertisement">Advertisement</SelectItem>
                            <SelectItem value="cold_call">Cold Call</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-priority">Priority</Label>
                        <Select 
                          value={editFormData.priority} 
                          onValueChange={(value) => setEditFormData(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hot">Hot</SelectItem>
                            <SelectItem value="warm">Warm</SelectItem>
                            <SelectItem value="cold">Cold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-city">City</Label>
                        <Input 
                          id="edit-city" 
                          name="city" 
                          defaultValue={selectedCustomer?.city || ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-state">State</Label>
                        <Input 
                          id="edit-state" 
                          name="state" 
                          defaultValue={selectedCustomer?.state || ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-zipCode">Zip Code</Label>
                        <Input 
                          id="edit-zipCode" 
                          name="zipCode" 
                          defaultValue={selectedCustomer?.zipCode || ""}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-address">Address</Label>
                      <Input 
                        id="edit-address" 
                        name="address" 
                        defaultValue={selectedCustomer?.address || ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-salesperson">Assigned Salesperson</Label>
                      <Select 
                        value={editFormData.salesperson} 
                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, salesperson: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select salesperson" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tracy_glenn">Tracy Glenn</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Textarea 
                        id="edit-notes" 
                        name="notes" 
                        placeholder="Notes about the lead..." 
                        defaultValue={selectedCustomer?.notes || ""}
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditFormData({ leadSource: "", priority: "warm", salesperson: "" });
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateCustomerMutation.isPending}>
                        {updateCustomerMutation.isPending ? "Updating..." : "Update Lead"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="flex gap-2 items-center">
                <Filter className="h-4 w-4 text-slate-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new_lead">New Lead</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="design_meeting">Design Meeting</SelectItem>
                    <SelectItem value="redesign">ReDesign</SelectItem>
                    <SelectItem value="bid">Bid</SelectItem>
                    <SelectItem value="budget_meeting">Budget Meeting</SelectItem>
                    <SelectItem value="rebid">Rebid</SelectItem>
                    <SelectItem value="sign_contract">Sign Contract</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="waiting_on_financing">Waiting on Financing</SelectItem>
                    <SelectItem value="lost_lead">Lost Lead</SelectItem>
                    <SelectItem value="bad_lead">Bad Lead</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Leads/Customers List */}
          <div className="space-y-4">
            {customersLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-pool-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading leads...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No leads found</h3>
                  <p className="text-slate-600 mb-4">Get started by adding your first lead or adjust your filters.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-pool-blue hover:bg-pool-blue/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Lead
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredCustomers.map((customer: Customer) => (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetails(customer)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 hover:text-pool-blue cursor-pointer" onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(customer);
                                }}>
                                  {customer.firstName} {customer.lastName}
                                </h3>
                                <Badge className={getStatusColor(customer.status)}>
                                  {getStatusDisplayName(customer.status)}
                                </Badge>
                                <Badge className={getPriorityColor(customer.priority || "warm")}>
                                  {customer.priority}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                {customer.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{customer.email}</span>
                                  </div>
                                )}
                                {customer.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{customer.phone}</span>
                                  </div>
                                )}
                                {customer.city && customer.state && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{customer.city}, {customer.state}</span>
                                  </div>
                                )}
                                {customer.leadSource && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Source: {customer.leadSource}</span>
                                  </div>
                                )}
                                {customer.salesperson && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>Sales: {getSalespersonDisplayName(customer.salesperson)}</span>
                                  </div>
                                )}
                              </div>

                              {customer.notes && (
                                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{customer.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={customer.status}
                            onValueChange={(value) => handleStatusChange(customer.id, value)}
                            disabled={updateCustomerMutation.isPending}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new_lead">New Lead</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="design_meeting">Design Meeting</SelectItem>
                              <SelectItem value="redesign">ReDesign</SelectItem>
                              <SelectItem value="bid">Bid</SelectItem>
                              <SelectItem value="budget_meeting">Budget Meeting</SelectItem>
                              <SelectItem value="rebid">Rebid</SelectItem>
                              <SelectItem value="sign_contract">Sign Contract</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                              <SelectItem value="waiting_on_financing">Waiting on Financing</SelectItem>
                              <SelectItem value="lost_lead">Lost Lead</SelectItem>
                              <SelectItem value="bad_lead">Bad Lead</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={customer.priority || "warm"}
                            onValueChange={(value) => handlePriorityChange(customer.id, value)}
                            disabled={updateCustomerMutation.isPending}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hot">Hot</SelectItem>
                              <SelectItem value="warm">Warm</SelectItem>
                              <SelectItem value="cold">Cold</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={customer.salesperson || "unassigned"}
                            onValueChange={(value) => handleSalespersonChange(customer.id, value)}
                            disabled={updateCustomerMutation.isPending}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tracy_glenn">Tracy Glenn</SelectItem>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(customer)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload CSV Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Leads from CSV/Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadLeadsMutation.mutate(file);
                    }
                  }}
                  disabled={uploadLeadsMutation.isPending}
                />
                <div>
                  <p className="text-lg font-medium text-slate-900 mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-slate-600">
                    Supports CSV, XLS, and XLSX files (max 5MB)
                  </p>
                </div>
              </label>
            </div>

            {uploadLeadsMutation.isPending && (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-4 border-pool-blue border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-slate-600">Uploading and processing leads...</span>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">Expected CSV Format:</h4>
              <div className="text-sm text-slate-600 space-y-1">
                <p><strong>Required:</strong> firstName, lastName (or First Name, Last Name)</p>
                <p><strong>Optional:</strong> email, phone, address, city, state, zipCode, leadSource, priority, salesperson, notes</p>
              </div>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Create and download sample CSV
                    const csv = `firstName,lastName,email,phone,address,city,state,zipCode,leadSource,priority,salesperson,notes
John,Doe,john.doe@email.com,(555) 123-4567,123 Main St,Austin,TX,78701,Website,warm,tracy_glenn,Interested in pool installation
Jane,Smith,jane.smith@email.com,(555) 987-6543,456 Oak Ave,Dallas,TX,75201,Referral,hot,,Called about spa addition`;
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'leads_sample.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Sample CSV
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

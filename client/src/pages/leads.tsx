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
import { Plus, Phone, Mail, MapPin, Calendar, User, TrendingUp, Filter } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Customer, InsertCustomer } from "@shared/schema";

export default function Leads() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    leadSource: "",
    priority: "warm",
    salesperson: ""
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isAuthenticated,
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

  return (
    <div className="flex h-screen bg-slate-50">
      <AppSidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="CRM & Leads" />
        
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
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pool-blue hover:bg-pool-blue/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Lead
                  </Button>
                </DialogTrigger>
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
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900">
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

                        <div className="flex flex-col sm:flex-row gap-2">
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

                          <Button variant="outline" size="sm">
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
    </div>
  );
}

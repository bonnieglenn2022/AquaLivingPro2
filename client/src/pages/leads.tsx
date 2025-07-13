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
import { Plus, Phone, Mail, MapPin, User, Filter, Upload, FileText, Smartphone } from "lucide-react";
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
  const [isContactsDialogOpen, setIsContactsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    leadSource: "",
    salesperson: ""
  });
  const [editFormData, setEditFormData] = useState({
    leadSource: "",
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

  const importContactsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/customers/import-contacts', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsContactsDialogOpen(false);
      toast({
        title: "Import Complete",
        description: data.message,
      });
    },
    onError: (error) => {
      console.error("Error importing contacts:", error);
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
        title: "Import Failed",
        description: `Failed to import contacts: ${error.message}`,
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
      setIsContactsDialogOpen(false);
      setFormData({ leadSource: "", salesperson: "" });
      toast({
        title: "Lead Created",
        description: "New lead has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating customer:", error);
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
        title: "Lead Updated",
        description: "Lead information has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating customer:", error);
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
        description: `Failed to update lead: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Redirect if not authenticated
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-pool-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredCustomers = customers.filter((customer: Customer) => {
    const statusMatch = statusFilter === "all" || customer.status === statusFilter;
    return statusMatch;
  });

  const metrics = {
    newLeads: customers.filter((c: Customer) => c.status === "new_lead").length,
    inDesign: customers.filter((c: Customer) => ["design", "design_meeting", "redesign"].includes(c.status)).length,
    bidding: customers.filter((c: Customer) => ["bid", "budget_meeting", "rebid"].includes(c.status)).length,
    sold: customers.filter((c: Customer) => c.status === "sold").length,
  };

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const leadData: InsertCustomer = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zipCode: (formData.get("zipCode") as string) || null,
      leadSource: (formData.get("leadSource") as string) || null,
      status: "new_lead",
      salesperson: (formData.get("salesperson") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    createCustomerMutation.mutate(leadData);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
  };

  const handleEditLead = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      leadSource: customer.leadSource || "",
      salesperson: customer.salesperson || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = (customerId: number, newStatus: string) => {
    updateCustomerMutation.mutate({ 
      id: customerId, 
      updates: { status: newStatus } 
    });
  };



  const handleSalespersonChange = (customerId: number, newSalesperson: string) => {
    updateCustomerMutation.mutate({ 
      id: customerId, 
      updates: { salesperson: newSalesperson === "unassigned" ? null : newSalesperson } 
    });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <AppSidebar 
        isMobileOpen={isMobileSidebarOpen} 
        setIsMobileOpen={setIsMobileSidebarOpen} 
      />
      
      <main className="flex-1 overflow-hidden">
        <Header onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Leads & Customers</h1>
              <p className="text-slate-600 mt-1">Manage your sales pipeline and customer relationships</p>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">New Leads</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.newLeads}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">N</div>
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
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>
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
                
                <Dialog open={isContactsDialogOpen} onOpenChange={setIsContactsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Import vCard Contact
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
            </div>
          </div>

          {/* Leads Grid */}
          <div className="space-y-4">
            {customersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
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
                ))}
              </div>
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
                <Input id="leadSource" name="leadSource" placeholder="e.g., Website, Referral" />
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
              <Select name="salesperson">
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
                setFormData({ leadSource: "", salesperson: "" });
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
                <p><strong>Optional:</strong> email, phone, address, city, state, zipCode, leadSource, salesperson, notes</p>
              </div>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Create and download sample CSV
                    const csv = `firstName,lastName,email,phone,address,city,state,zipCode,leadSource,salesperson,notes
John,Doe,john.doe@email.com,(555) 123-4567,123 Main St,Austin,TX,78701,Website,tracy_glenn,Interested in pool installation
Jane,Smith,jane.smith@email.com,(555) 987-6543,456 Oak Ave,Dallas,TX,75201,Referral,,Called about spa addition`;
                    
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
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Address:</span>
                        <span>
                          {selectedCustomer.address}
                          {selectedCustomer.city && `, ${selectedCustomer.city}`}
                          {selectedCustomer.state && `, ${selectedCustomer.state}`}
                          {selectedCustomer.zipCode && ` ${selectedCustomer.zipCode}`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <Badge variant={selectedCustomer.status === "sold" ? "default" : "secondary"}>
                        {selectedCustomer.status?.replace(/_/g, " ") || "New Lead"}
                      </Badge>
                    </div>

                    {selectedCustomer.leadSource && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Lead Source:</span>
                        <span>{selectedCustomer.leadSource}</span>
                      </div>
                    )}
                    {selectedCustomer.salesperson && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Salesperson:</span>
                        <span>{selectedCustomer.salesperson === "tracy_glenn" ? "Tracy Glenn" : selectedCustomer.salesperson}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedCustomer.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleEditLead(selectedCustomer)}>
                  Edit Lead
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import vCard Contact Dialog */}
      <Dialog open={isContactsDialogOpen} onOpenChange={setIsContactsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import vCard Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
              <Smartphone className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".vcf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importContactsMutation.mutate(file);
                    }
                  }}
                  disabled={importContactsMutation.isPending}
                />
                <div>
                  <p className="text-lg font-medium text-slate-900 mb-2">
                    Tap here to select a vCard file
                  </p>
                  <p className="text-sm text-slate-600">
                    Import one contact at a time from your phone (.vcf files)
                  </p>
                </div>
              </label>
            </div>

            {importContactsMutation.isPending && (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-slate-600">Importing contact...</span>
              </div>
            )}

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">How to share a single contact from iPhone:</h4>
              <div className="text-sm text-slate-600 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600 mt-0.5">1.</span>
                  <span>Open Contacts app on your iPhone</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600 mt-0.5">2.</span>
                  <span>Find and tap the contact you want to import</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600 mt-0.5">3.</span>
                  <span>Tap "Share Contact" at the bottom</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600 mt-0.5">4.</span>
                  <span>Choose "Save to Files" and save as .vcf</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600 mt-0.5">5.</span>
                  <span>Upload the saved .vcf file here</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                <strong>Tip:</strong> You can also AirDrop or email the contact to yourself and save the .vcf file.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Truck, 
  Search, 
  Plus,
  Star,
  Phone,
  Mail,
  MapPin,
  Filter,
  Edit,
  Trash2
} from "lucide-react";
import type { Vendor, InsertVendor } from "@shared/schema";

const vendorTypes = {
  equipment_supplier: "bg-pool-blue/10 text-pool-blue",
  subcontractor: "bg-garden-green/10 text-garden-green",
  material_supplier: "bg-sunset-orange/10 text-sunset-orange",
};

const specialties = [
  "Pool Equipment",
  "Plumbing",
  "Electrical", 
  "Concrete",
  "Excavation",
  "Tile & Stone",
  "Landscaping",
  "Outdoor Kitchens",
  "Automation",
  "Lighting"
];

export default function Vendors() {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: isAuthenticated,
  });

  const createVendorMutation = useMutation({
    mutationFn: async (vendor: InsertVendor) => {
      return await apiRequest("/api/vendors", "POST", vendor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setIsAddVendorOpen(false);
      setEditingVendor(null);
      toast({ title: "Success", description: "Vendor created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create vendor", variant: "destructive" });
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertVendor> }) => {
      return await apiRequest(`/api/vendors/${id}`, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setIsAddVendorOpen(false);
      setEditingVendor(null);
      toast({ title: "Success", description: "Vendor updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update vendor", variant: "destructive" });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/vendors/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Success", description: "Vendor deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete vendor", variant: "destructive" });
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

  const handleAddVendor = (data: FormData) => {
    const formData = Object.fromEntries(data);
    const vendorData: InsertVendor = {
      name: formData.name as string,
      type: formData.type as string,
      contactName: formData.contactName as string,
      email: formData.email as string,
      phone: formData.phone as string,
      address: formData.address as string,
      city: formData.city as string,
      state: formData.state as string,
      zipCode: formData.zipCode as string,
      specialty: formData.specialty as string,
      rating: formData.rating ? parseInt(formData.rating as string) : null,
      notes: formData.notes as string,
    };

    if (editingVendor) {
      updateVendorMutation.mutate({ id: editingVendor.id, updates: vendorData });
    } else {
      createVendorMutation.mutate(vendorData);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.contactName && vendor.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vendor.specialty && vendor.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-sand-yellow fill-current' : 'text-slate-300'
        }`}
      />
    ));
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <AppSidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="Vendor Management" />
        
        <div className="p-6 overflow-y-auto h-full">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingVendor(null)} 
                  className="bg-pool-blue hover:bg-pool-blue/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
                </DialogHeader>
                <form action={handleAddVendor} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Company Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        defaultValue={editingVendor?.name} 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Vendor Type</Label>
                      <Select name="type" defaultValue={editingVendor?.type}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equipment_supplier">Equipment Supplier</SelectItem>
                          <SelectItem value="subcontractor">Subcontractor</SelectItem>
                          <SelectItem value="material_supplier">Material Supplier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input 
                        id="contactName" 
                        name="contactName" 
                        defaultValue={editingVendor?.contactName || ""} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialty">Specialty</Label>
                      <Select name="specialty" defaultValue={editingVendor?.specialty || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pool_equipment">Pool Equipment</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="concrete">Concrete</SelectItem>
                          <SelectItem value="excavation">Excavation</SelectItem>
                          <SelectItem value="tile_stone">Tile & Stone</SelectItem>
                          <SelectItem value="landscaping">Landscaping</SelectItem>
                          <SelectItem value="outdoor_kitchens">Outdoor Kitchens</SelectItem>
                          <SelectItem value="automation">Automation</SelectItem>
                          <SelectItem value="lighting">Lighting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        defaultValue={editingVendor?.email || ""} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        defaultValue={editingVendor?.phone || ""} 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      name="address" 
                      defaultValue={editingVendor?.address || ""} 
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        defaultValue={editingVendor?.city || ""} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        name="state" 
                        defaultValue={editingVendor?.state || ""} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input 
                        id="zipCode" 
                        name="zipCode" 
                        defaultValue={editingVendor?.zipCode || ""} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rating">Rating (1-5)</Label>
                      <Select name="rating" defaultValue={editingVendor?.rating?.toString() || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Rating</SelectItem>
                          <SelectItem value="1">1 Star</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      defaultValue={editingVendor?.notes || ""} 
                      placeholder="Additional notes about this vendor..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAddVendorOpen(false);
                        setEditingVendor(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createVendorMutation.isPending || updateVendorMutation.isPending}
                    >
                      {editingVendor ? "Update Vendor" : "Add Vendor"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Vendor Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Vendors</p>
                    <p className="text-3xl font-bold text-slate-900">{filteredVendors.length}</p>
                    <p className="text-sm text-pool-blue">Active suppliers</p>
                  </div>
                  <div className="w-12 h-12 bg-pool-blue/10 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-pool-blue" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Equipment Suppliers</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {filteredVendors.filter(v => v.type === 'equipment_supplier').length}
                    </p>
                    <p className="text-sm text-garden-green">Pool equipment</p>
                  </div>
                  <div className="w-12 h-12 bg-garden-green/10 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-garden-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Subcontractors</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {filteredVendors.filter(v => v.type === 'subcontractor').length}
                    </p>
                    <p className="text-sm text-sunset-orange">Specialized trades</p>
                  </div>
                  <div className="w-12 h-12 bg-sunset-orange/10 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-sunset-orange" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendors List */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Directory</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 w-20 bg-slate-200 rounded"></div>
                        <div className="h-4 w-16 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Vendors Yet</h3>
                  <p className="text-slate-600 mb-6">
                    Add equipment suppliers, subcontractors, and material suppliers to build your vendor network.
                  </p>
                  <Button onClick={() => setIsAddVendorOpen(true)} className="bg-pool-blue hover:bg-pool-blue/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Vendor
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-pool-blue to-ocean-teal rounded-lg flex items-center justify-center text-white font-semibold">
                          {vendor.name[0]}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{vendor.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Badge className={vendorTypes[vendor.type as keyof typeof vendorTypes] || vendorTypes.equipment_supplier}>
                                {vendor.type?.replace('_', ' ')}
                              </Badge>
                            </div>
                            {vendor.specialty && (
                              <span className="text-slate-600">{vendor.specialty}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            {vendor.phone && (
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <Phone className="w-3 h-3" />
                                <span>{vendor.phone}</span>
                              </div>
                            )}
                            {vendor.email && (
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <Mail className="w-3 h-3" />
                                <span>{vendor.email}</span>
                              </div>
                            )}
                            {vendor.city && vendor.state && (
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <MapPin className="w-3 h-3" />
                                <span>{vendor.city}, {vendor.state}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {vendor.rating && (
                          <div className="flex items-center space-x-1 mb-1">
                            {renderStars(vendor.rating)}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingVendor(vendor);
                              setIsAddVendorOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteVendorMutation.mutate(vendor.id)}
                            disabled={deleteVendorMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Badge variant={vendor.isActive ? "default" : "secondary"}>
                          {vendor.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Specialties */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Pool & Outdoor Living Specialties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {specialties.map((specialty) => (
                  <div key={specialty} className="text-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-slate-700">{specialty}</p>
                    <p className="text-xs text-slate-500">
                      {vendors?.filter((v: any) => v.specialty === specialty.toLowerCase().replace(' ', '_')).length || 0} vendors
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

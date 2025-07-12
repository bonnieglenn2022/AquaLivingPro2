import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, 
  Search, 
  Plus,
  Star,
  Phone,
  Mail,
  MapPin,
  Filter
} from "lucide-react";

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
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["/api/vendors"],
    enabled: isAuthenticated,
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

  const handleAddVendor = () => {
    toast({
      title: "Add Vendor",
      description: "Add vendor feature will be available soon!",
    });
  };

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
                  className="pl-10 pr-4 py-2 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <Button onClick={handleAddVendor} className="bg-pool-blue hover:bg-pool-blue/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>

          {/* Vendor Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Vendors</p>
                    <p className="text-3xl font-bold text-slate-900">{vendors?.length || 0}</p>
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
                      {vendors?.filter((v: any) => v.type === 'equipment_supplier').length || 0}
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
                      {vendors?.filter((v: any) => v.type === 'subcontractor').length || 0}
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
              ) : !vendors || vendors.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Vendors Yet</h3>
                  <p className="text-slate-600 mb-6">
                    Add equipment suppliers, subcontractors, and material suppliers to build your vendor network.
                  </p>
                  <Button onClick={handleAddVendor} className="bg-pool-blue hover:bg-pool-blue/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Vendor
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendors.map((vendor: any) => (
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

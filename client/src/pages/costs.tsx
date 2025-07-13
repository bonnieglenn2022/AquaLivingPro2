import { useState } from "react";
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
import { Plus, DollarSign, Pencil, Trash2, History, Building2, Package, Layers } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { CostCategory, CostItem, InsertCostCategory, InsertCostItem, CostItemTier, InsertCostItemTier } from "@shared/schema";

const DEFAULT_CATEGORIES = [
  { name: "Excavation", description: "Site preparation and excavation costs" },
  { name: "Rebar", description: "Steel reinforcement materials and installation" },
  { name: "Gunite", description: "Gunite application and related materials" },
  { name: "Plaster", description: "Pool surface finishing materials" },
  { name: "Equipment", description: "Pool equipment and installation" },
  { name: "Plumbing", description: "Plumbing materials and labor" },
  { name: "Electrical", description: "Electrical work and materials" },
  { name: "Permitting", description: "Permits and inspection fees" }
];

const UNIT_TYPES = [
  { value: "sq_ft", label: "Square Feet" },
  { value: "linear_ft", label: "Linear Feet" },
  { value: "cubic_yard", label: "Cubic Yards" },
  { value: "each", label: "Each" },
  { value: "hour", label: "Hours" },
  { value: "day", label: "Days" },
  { value: "lot", label: "Lot/Project" }
];

export default function Costs() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<CostCategory | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CostItem | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [useTieredPricing, setUseTieredPricing] = useState(false);
  const [tierList, setTierList] = useState<Partial<InsertCostItemTier>[]>([]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/cost-categories"],
    enabled: isAuthenticated,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["/api/cost-items", { categoryId: selectedCategory?.id }],
    queryFn: () => selectedCategory 
      ? fetch(`/api/cost-items?categoryId=${selectedCategory.id}`).then(res => res.json())
      : [],
    enabled: isAuthenticated && !!selectedCategory,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCostCategory) => {
      return await apiRequest("POST", "/api/cost-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-categories"] });
      setIsCategoryDialogOpen(false);
      toast({
        title: "Category Created",
        description: "Cost category has been created successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: { item: InsertCostItem; tiers?: Partial<InsertCostItemTier>[] }) => {
      if (data.tiers && data.tiers.length > 0) {
        return await apiRequest("POST", "/api/cost-items/with-tiers", data);
      } else {
        return await apiRequest("POST", "/api/cost-items", data.item);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-items"] });
      setIsItemDialogOpen(false);
      setSelectedItem(null);
      setIsEditingItem(false);
      setUseTieredPricing(false);
      setTierList([]);
      toast({
        title: "Cost Item Created",
        description: "Cost item has been created successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to create cost item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertCostItem> }) => {
      return await apiRequest("PUT", `/api/cost-items/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-items"] });
      toast({
        title: "Cost Item Updated",
        description: "Cost item has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to update cost item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const categoryData: InsertCostCategory = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      sortOrder: categories.length,
    };

    createCategoryMutation.mutate(categoryData);
  };

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const itemData: InsertCostItem = {
      categoryId: selectedCategory!.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      unitType: formData.get("unitType") as string,
      costPerUnit: useTieredPricing ? null : (formData.get("costPerUnit") as string),
      supplierName: formData.get("supplierName") as string || null,
      supplierContact: formData.get("supplierContact") as string || null,
      notes: formData.get("notes") as string || null,
    };

    const submitData = {
      item: itemData,
      tiers: useTieredPricing ? tierList.filter(tier => tier.tierName && tier.price) : undefined
    };

    createItemMutation.mutate(submitData);
  };

  const addTier = () => {
    setTierList([...tierList, { tierName: "", minValue: 0, maxValue: 0, price: 0, sortOrder: tierList.length }]);
  };

  const updateTier = (index: number, field: keyof InsertCostItemTier, value: string | number) => {
    const updatedTiers = [...tierList];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setTierList(updatedTiers);
  };

  const removeTier = (index: number) => {
    setTierList(tierList.filter((_, i) => i !== index));
  };

  const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const itemData: Partial<InsertCostItem> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      unitType: formData.get("unitType") as string,
      costPerUnit: useTieredPricing ? null : (formData.get("costPerUnit") as string),
      supplierName: formData.get("supplierName") as string || null,
      supplierContact: formData.get("supplierContact") as string || null,
      notes: formData.get("notes") as string || null,
    };

    updateItemMutation.mutate({ id: selectedItem.id, updates: itemData });
  };

  const initializeDefaultCategories = async () => {
    for (const category of DEFAULT_CATEGORIES) {
      await createCategoryMutation.mutateAsync({
        ...category,
        sortOrder: DEFAULT_CATEGORIES.indexOf(category),
      });
    }
  };

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
              <h1 className="text-3xl font-bold text-slate-900">Cost Management</h1>
              <p className="text-slate-600 mt-1">Manage build and materials costs across all project categories</p>
            </div>
            
            <div className="flex gap-2">
              {categories.length === 0 && (
                <Button 
                  onClick={initializeDefaultCategories}
                  variant="outline"
                  disabled={createCategoryMutation.isPending}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Setup Default Categories
                </Button>
              )}
              
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Cost Category</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Category Name</Label>
                      <Input id="name" name="name" placeholder="e.g., Excavation" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" placeholder="Brief description of this cost category" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCategoryMutation.isPending}>
                        {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Cost Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No cost categories yet.</p>
                      <p className="text-sm">Create categories to organize your costs.</p>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCategory?.id === category.id
                            ? "bg-pool-blue text-white border-pool-blue"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <h3 className="font-medium">{category.name}</h3>
                        {category.description && (
                          <p className={`text-sm mt-1 ${
                            selectedCategory?.id === category.id ? "text-blue-100" : "text-slate-600"
                          }`}>
                            {category.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cost Items Panel */}
            <div className="lg:col-span-2">
              {selectedCategory ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {selectedCategory.name} Cost Items
                      </CardTitle>
                      <Dialog 
                        open={isItemDialogOpen} 
                        onOpenChange={(open) => {
                          setIsItemDialogOpen(open);
                          if (!open) {
                            setUseTieredPricing(false);
                            setTierList([]);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add Cost Item to {selectedCategory.name}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreateItem} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Item Name</Label>
                                <Input id="name" name="name" placeholder="e.g., Concrete per cubic yard" required />
                              </div>
                              <div>
                                <Label htmlFor="unitType">Unit Type</Label>
                                <Select name="unitType" required>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNIT_TYPES.map((unit) => (
                                      <SelectItem key={unit.value} value={unit.value}>
                                        {unit.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Pricing Type Toggle */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="useTieredPricing" 
                                  checked={useTieredPricing}
                                  onCheckedChange={(checked) => {
                                    setUseTieredPricing(!!checked);
                                    if (checked && tierList.length === 0) {
                                      setTierList([{ tierName: "", minValue: 0, maxValue: 0, price: 0, sortOrder: 0 }]);
                                    }
                                  }}
                                />
                                <Label htmlFor="useTieredPricing" className="flex items-center gap-2 cursor-pointer">
                                  <Layers className="h-4 w-4" />
                                  Use Tiered Pricing (based on quantity/size ranges)
                                </Label>
                              </div>

                              {useTieredPricing ? (
                                <div className="space-y-3 border rounded-lg p-4 bg-slate-50">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Price Tiers</Label>
                                    <Button 
                                      type="button" 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={addTier}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Tier
                                    </Button>
                                  </div>
                                  
                                  {tierList.map((tier, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                      <div className="col-span-3">
                                        <Label className="text-xs">Tier Name</Label>
                                        <Input
                                          placeholder="e.g., Small Jobs"
                                          value={tier.tierName || ""}
                                          onChange={(e) => updateTier(index, "tierName", e.target.value)}
                                          size="sm"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Min</Label>
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          value={tier.minValue || ""}
                                          onChange={(e) => updateTier(index, "minValue", parseFloat(e.target.value) || 0)}
                                          size="sm"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Max</Label>
                                        <Input
                                          type="number"
                                          placeholder="100"
                                          value={tier.maxValue || ""}
                                          onChange={(e) => updateTier(index, "maxValue", parseFloat(e.target.value) || 0)}
                                          size="sm"
                                        />
                                      </div>
                                      <div className="col-span-3">
                                        <Label className="text-xs">Price ($)</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0.00"
                                          value={tier.price || ""}
                                          onChange={(e) => updateTier(index, "price", parseFloat(e.target.value) || 0)}
                                          size="sm"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => removeTier(index)}
                                          className="w-full"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="costPerUnit">Cost Per Unit ($)</Label>
                                    <Input 
                                      id="costPerUnit" 
                                      name="costPerUnit" 
                                      type="number" 
                                      step="0.01" 
                                      placeholder="0.00" 
                                      required={!useTieredPricing}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="supplierName">Supplier Name</Label>
                                    <Input id="supplierName" name="supplierName" placeholder="e.g., ABC Materials" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {useTieredPricing && (
                              <div>
                                <Label htmlFor="supplierName">Supplier Name</Label>
                                <Input id="supplierName" name="supplierName" placeholder="e.g., ABC Materials" />
                              </div>
                            )}

                            <div>
                              <Label htmlFor="supplierContact">Supplier Contact</Label>
                              <Input id="supplierContact" name="supplierContact" placeholder="Phone, email, or website" />
                            </div>

                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea id="description" name="description" placeholder="Additional details about this cost item" />
                            </div>

                            <div>
                              <Label htmlFor="notes">Notes</Label>
                              <Textarea id="notes" name="notes" placeholder="Any special notes or considerations" />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createItemMutation.isPending}>
                                {createItemMutation.isPending ? "Creating..." : "Create Item"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>No cost items in this category yet.</p>
                        <p className="text-sm">Add items to track costs for {selectedCategory.name.toLowerCase()}.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium text-slate-900">{item.name}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {UNIT_TYPES.find(u => u.value === item.unitType)?.label || item.unitType}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {item.hasTieredPricing ? (
                                      <div className="flex items-center gap-2">
                                        <Layers className="h-4 w-4" />
                                        <span className="font-medium">Tiered Pricing</span>
                                        <span>per {UNIT_TYPES.find(u => u.value === item.unitType)?.label.toLowerCase() || item.unitType}</span>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="font-medium">${item.costPerUnit}</span>
                                        <span>per {UNIT_TYPES.find(u => u.value === item.unitType)?.label.toLowerCase() || item.unitType}</span>
                                      </>
                                    )}
                                  </div>
                                  {item.lastUpdated && (
                                    <span className="text-xs">
                                      Updated {new Date(item.lastUpdated).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {item.description && (
                                  <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                                )}

                                {item.supplierName && (
                                  <div className="text-sm text-slate-600">
                                    <span className="font-medium">Supplier:</span> {item.supplierName}
                                    {item.supplierContact && (
                                      <span className="ml-2">({item.supplierContact})</span>
                                    )}
                                  </div>
                                )}

                                {item.notes && (
                                  <div className="text-sm text-slate-600 mt-2 italic">
                                    {item.notes}
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 ml-4">
                                <Dialog 
                                  open={isEditingItem && selectedItem?.id === item.id} 
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setIsEditingItem(false);
                                      setSelectedItem(null);
                                      setUseTieredPricing(false);
                                      setTierList([]);
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setIsEditingItem(true);
                                        setUseTieredPricing(!!item.hasTieredPricing);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Edit Cost Item: {item.name}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleEditItem} className="space-y-4">
                                      <div>
                                        <Label htmlFor="editName">Item Name</Label>
                                        <Input 
                                          id="editName" 
                                          name="name" 
                                          defaultValue={item.name}
                                          placeholder="e.g., Excavation per cubic yard" 
                                          required 
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="editUnitType">Unit Type</Label>
                                          <Select name="unitType" defaultValue={item.unitType}>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select unit type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {UNIT_TYPES.map((unit) => (
                                                <SelectItem key={unit.value} value={unit.value}>
                                                  {unit.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label htmlFor="editSupplierName">Supplier Name</Label>
                                          <Input 
                                            id="editSupplierName" 
                                            name="supplierName" 
                                            defaultValue={item.supplierName || ""}
                                            placeholder="e.g., ABC Materials" 
                                          />
                                        </div>
                                      </div>

                                      {!useTieredPricing && (
                                        <div>
                                          <Label htmlFor="editCostPerUnit">Cost Per Unit ($)</Label>
                                          <Input 
                                            id="editCostPerUnit" 
                                            name="costPerUnit" 
                                            type="number" 
                                            step="0.01" 
                                            defaultValue={item.costPerUnit || ""}
                                            placeholder="0.00" 
                                            required={!useTieredPricing}
                                          />
                                        </div>
                                      )}

                                      <div>
                                        <Label htmlFor="editSupplierContact">Supplier Contact</Label>
                                        <Input 
                                          id="editSupplierContact" 
                                          name="supplierContact" 
                                          defaultValue={item.supplierContact || ""}
                                          placeholder="Phone, email, or website" 
                                        />
                                      </div>

                                      <div>
                                        <Label htmlFor="editDescription">Description</Label>
                                        <Textarea 
                                          id="editDescription" 
                                          name="description" 
                                          defaultValue={item.description || ""}
                                          placeholder="Additional details about this cost item" 
                                        />
                                      </div>

                                      <div>
                                        <Label htmlFor="editNotes">Notes</Label>
                                        <Textarea 
                                          id="editNotes" 
                                          name="notes" 
                                          defaultValue={item.notes || ""}
                                          placeholder="Any special notes or considerations" 
                                        />
                                      </div>

                                      <div className="flex justify-end gap-2">
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          onClick={() => {
                                            setIsEditingItem(false);
                                            setSelectedItem(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button type="submit" disabled={updateItemMutation.isPending}>
                                          {updateItemMutation.isPending ? "Updating..." : "Update Item"}
                                        </Button>
                                      </div>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // View cost history functionality would go here
                                    toast({
                                      title: "Cost History",
                                      description: "Cost history feature coming soon!",
                                    });
                                  }}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center text-slate-500">
                      <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                      <h3 className="text-lg font-medium mb-2">Select a Category</h3>
                      <p>Choose a cost category from the left to view and manage cost items.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Package, Edit, Trash2, Upload, Download } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CostCategory, CostItem, InsertCostCategory, InsertCostItem, Supplier, Subcontractor } from "@shared/schema";

export default function CostCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<CostCategory[]>({
    queryKey: ["/api/cost-categories"],
  });

  const { data: costItems = [], isLoading: itemsLoading } = useQuery<CostItem[]>({
    queryKey: ["/api/cost-items"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: subcontractors = [] } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: InsertCostCategory) => {
      return await apiRequest("/api/cost-categories", {
        method: "POST",
        body: JSON.stringify(category),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-categories"] });
      setIsAddCategoryOpen(false);
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (item: InsertCostItem) => {
      return await apiRequest("/api/cost-items", {
        method: "POST",
        body: JSON.stringify(item),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-items"] });
      setIsAddItemOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Cost item saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save cost item", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CostItem> }) => {
      return await apiRequest(`/api/cost-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-items"] });
      setEditingItem(null);
      toast({ title: "Success", description: "Cost item updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update cost item", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/cost-items/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-items"] });
      toast({ title: "Success", description: "Cost item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete cost item", variant: "destructive" });
    },
  });

  const handleAddCategory = (data: FormData) => {
    const formData = Object.fromEntries(data);
    createCategoryMutation.mutate({
      name: formData.name as string,
      description: formData.description as string,
      sortOrder: parseInt(formData.sortOrder as string) || 0,
    });
  };

  const handleAddItem = (data: FormData) => {
    const formData = Object.fromEntries(data);
    const itemData = {
      categoryId: parseInt(formData.categoryId as string),
      name: formData.name as string,
      description: formData.description as string,
      unitType: formData.unitType as string,
      costPerUnit: formData.costPerUnit as string,
      supplierName: formData.supplierName === "none" ? null : (formData.supplierName as string),
      supplierContact: formData.supplierContact as string,
      subcontractorName: formData.subcontractorName === "none" ? null : (formData.subcontractorName as string),
      notes: formData.notes as string,
      type: formData.type as string,
      accountingCode: formData.accountingCode === "none" ? null : (formData.accountingCode as string),
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, updates: itemData });
    } else {
      createItemMutation.mutate(itemData);
    }
  };

  const filteredItems = costItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || item.categoryId === parseInt(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const groupedItems = categories.reduce((acc, category) => {
    acc[category.id] = filteredItems.filter(item => item.categoryId === category.id);
    return acc;
  }, {} as Record<number, CostItem[]>);

  if (categoriesLoading || itemsLoading) {
    return <div>Loading cost catalog...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Cost Catalog</h1>
              <p className="text-muted-foreground">
                Centralized database of all project costs and materials
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search cost items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="items" className="space-y-6">
            <TabsList>
              <TabsTrigger value="items">Cost Items</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            {/* Cost Items Tab */}
            <TabsContent value="items" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Cost Items</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredItems.length} items {selectedCategory !== "all" && `in ${categories.find(c => c.id === parseInt(selectedCategory))?.name}`}
                  </p>
                </div>
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingItem(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Cost Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Edit Cost Item" : "Add Cost Item"}</DialogTitle>
                    </DialogHeader>
                    <form action={handleAddItem} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="categoryId">Category</Label>
                          <Select name="categoryId" defaultValue={editingItem?.categoryId?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="name">Item Name</Label>
                          <Input id="name" name="name" defaultValue={editingItem?.name} required />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={editingItem?.description || ""} />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="unitType">Unit Type</Label>
                          <Select name="unitType" defaultValue={editingItem?.unitType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="each">Each</SelectItem>
                              <SelectItem value="sq ft">Square Foot</SelectItem>
                              <SelectItem value="linear ft">Linear Foot</SelectItem>
                              <SelectItem value="cubic yard">Cubic Yard</SelectItem>
                              <SelectItem value="ton">Ton</SelectItem>
                              <SelectItem value="hour">Hour</SelectItem>
                              <SelectItem value="day">Day</SelectItem>
                              <SelectItem value="lbs">Pounds</SelectItem>
                              <SelectItem value="gallon">Gallon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="costPerUnit">Cost per Unit</Label>
                          <Input 
                            id="costPerUnit" 
                            name="costPerUnit" 
                            type="number" 
                            step="0.01" 
                            defaultValue={editingItem?.costPerUnit} 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="supplierName">Supplier</Label>
                          <Select name="supplierName" defaultValue={editingItem?.supplierName || ""}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Supplier</SelectItem>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.name}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="supplierContact">Supplier Contact</Label>
                          <Input 
                            id="supplierContact" 
                            name="supplierContact" 
                            placeholder="Phone, email, or website"
                            defaultValue={editingItem?.supplierContact || ""} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="subcontractorName">Subcontractor</Label>
                          <Select name="subcontractorName" defaultValue={editingItem?.subcontractorName || ""}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subcontractor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Subcontractor</SelectItem>
                              {subcontractors.map((subcontractor) => (
                                <SelectItem key={subcontractor.id} value={subcontractor.name}>
                                  {subcontractor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea 
                          id="notes" 
                          name="notes" 
                          placeholder="Additional notes, specifications, etc."
                          defaultValue={editingItem?.notes || ""} 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select name="type" defaultValue={editingItem?.type || ""}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Labor">Labor</SelectItem>
                              <SelectItem value="Material">Material</SelectItem>
                              <SelectItem value="Subcontractor">Subcontractor</SelectItem>
                              <SelectItem value="Equipment">Equipment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="accountingCode">Accounting Code (Optional)</Label>
                          <Select name="accountingCode" defaultValue={editingItem?.accountingCode || ""}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select code" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Code</SelectItem>
                              <SelectItem value="01-00">01-00 - Administrative</SelectItem>
                              <SelectItem value="01-10">01-10 - Consulting Fees</SelectItem>
                              <SelectItem value="02-00">02-00 - Site Work</SelectItem>
                              <SelectItem value="02-10">02-10 - Excavation</SelectItem>
                              <SelectItem value="02-20">02-20 - Grading</SelectItem>
                              <SelectItem value="03-00">03-00 - Concrete</SelectItem>
                              <SelectItem value="03-10">03-10 - Footings</SelectItem>
                              <SelectItem value="03-20">03-20 - Foundations</SelectItem>
                              <SelectItem value="03-30">03-30 - Slabs</SelectItem>
                              <SelectItem value="04-00">04-00 - Masonry</SelectItem>
                              <SelectItem value="05-00">05-00 - Steel</SelectItem>
                              <SelectItem value="06-00">06-00 - Wood & Plastics</SelectItem>
                              <SelectItem value="06-10">06-10 - Rough Carpentry</SelectItem>
                              <SelectItem value="06-20">06-20 - Finish Carpentry</SelectItem>
                              <SelectItem value="07-00">07-00 - Thermal & Moisture Protection</SelectItem>
                              <SelectItem value="07-10">07-10 - Waterproofing</SelectItem>
                              <SelectItem value="07-20">07-20 - Insulation</SelectItem>
                              <SelectItem value="07-30">07-30 - Roofing</SelectItem>
                              <SelectItem value="08-00">08-00 - Openings</SelectItem>
                              <SelectItem value="08-10">08-10 - Doors</SelectItem>
                              <SelectItem value="08-20">08-20 - Windows</SelectItem>
                              <SelectItem value="09-00">09-00 - Finishes</SelectItem>
                              <SelectItem value="09-10">09-10 - Flooring</SelectItem>
                              <SelectItem value="09-20">09-20 - Drywall</SelectItem>
                              <SelectItem value="09-30">09-30 - Painting</SelectItem>
                              <SelectItem value="15-00">15-00 - Mechanical</SelectItem>
                              <SelectItem value="15-10">15-10 - Plumbing</SelectItem>
                              <SelectItem value="15-20">15-20 - HVAC</SelectItem>
                              <SelectItem value="16-00">16-00 - Electrical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsAddItemOpen(false);
                            setEditingItem(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createItemMutation.isPending || updateItemMutation.isPending}
                        >
                          {editingItem ? "Update Item" : "Add Item"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Items by Category */}
              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryItems = groupedItems[category.id] || [];
                  if (selectedCategory !== "all" && parseInt(selectedCategory) !== category.id) {
                    return null;
                  }
                  
                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              {category.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {categoryItems.length} items
                            </p>
                          </div>
                          <Badge variant="outline">
                            {categoryItems.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {categoryItems.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No items in this category yet</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Unit Type</TableHead>
                                <TableHead>Cost/Unit</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Subcontractor</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell>{item.unitType}</TableCell>
                                  <TableCell>${parseFloat(item.costPerUnit).toFixed(2)}</TableCell>
                                  <TableCell>{item.supplierName && item.supplierName !== "none" ? item.supplierName : '-'}</TableCell>
                                  <TableCell>{item.subcontractorName && item.subcontractorName !== "none" ? item.subcontractorName : '-'}</TableCell>
                                  <TableCell>{item.type || '-'}</TableCell>
                                  <TableCell>{item.accountingCode && item.accountingCode !== 'none' ? item.accountingCode : '-'}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingItem(item);
                                          setIsAddItemOpen(true);
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteItemMutation.mutate(item.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Cost Categories</h2>
                  <p className="text-sm text-muted-foreground">
                    Organize your cost items into logical categories
                  </p>
                </div>
                <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Cost Category</DialogTitle>
                    </DialogHeader>
                    <form action={handleAddCategory} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Category Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" />
                      </div>
                      <div>
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Input id="sortOrder" name="sortOrder" type="number" defaultValue="0" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createCategoryMutation.isPending}>
                          Add Category
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {category.name}
                        <Badge variant="outline">
                          {costItems.filter(item => item.categoryId === category.id).length} items
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
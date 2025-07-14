import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Calculator, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProjectBidItem, CostCategory, CostItem } from "@shared/schema";

interface ProjectBidProps {
  projectId: number;
}

export function ProjectBid({ projectId }: ProjectBidProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBuildFromCostsOpen, setIsBuildFromCostsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCostItems, setSelectedCostItems] = useState<{ costItemId: number; quantity: number; markupPercentage: number }[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bidItems = [], isLoading } = useQuery<ProjectBidItem[]>({
    queryKey: ["/api/projects", projectId, "bid-items"],
  });

  const { data: costCategories = [] } = useQuery<CostCategory[]>({
    queryKey: ["/api/cost-categories"],
  });

  const { data: costItems = [] } = useQuery<CostItem[]>({
    queryKey: ["/api/cost-items"],
  });

  const createBidItemMutation = useMutation({
    mutationFn: async (bidItem: Partial<ProjectBidItem>) => {
      return await apiRequest(`/api/projects/${projectId}/bid-items`, {
        method: "POST",
        body: JSON.stringify(bidItem),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "bid-items"] });
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Bid item created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create bid item", variant: "destructive" });
    },
  });

  const buildFromCostsMutation = useMutation({
    mutationFn: async (bidItems: { costItemId: number; quantity: number; markupPercentage?: number }[]) => {
      return await apiRequest(`/api/projects/${projectId}/bid-from-costs`, {
        method: "POST",
        body: JSON.stringify({ bidItems }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "bid-items"] });
      setIsBuildFromCostsOpen(false);
      setSelectedCostItems([]);
      toast({ title: "Success", description: "Bid created from cost items successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to build bid from cost items", variant: "destructive" });
    },
  });

  const deleteBidItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/bid-items/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "bid-items"] });
      toast({ title: "Success", description: "Bid item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete bid item", variant: "destructive" });
    },
  });

  const handleAddBidItem = (data: FormData) => {
    const formData = Object.fromEntries(data);
    const quantity = parseFloat(formData.quantity as string);
    const unitPrice = parseFloat(formData.unitPrice as string);
    
    createBidItemMutation.mutate({
      categoryId: parseInt(formData.categoryId as string),
      name: formData.name as string,
      description: formData.description as string,
      quantity: quantity.toString(),
      unitType: formData.unitType as string,
      unitPrice: unitPrice.toString(),
      totalPrice: (quantity * unitPrice).toString(),
      markupPercentage: formData.markupPercentage as string || "0",
      notes: formData.notes as string,
    });
  };

  const handleBuildFromCosts = () => {
    if (selectedCostItems.length === 0) {
      toast({ title: "Error", description: "Please select at least one cost item", variant: "destructive" });
      return;
    }
    buildFromCostsMutation.mutate(selectedCostItems);
  };

  const addCostItemToBid = () => {
    if (!selectedCategory) {
      toast({ title: "Error", description: "Please select a category first", variant: "destructive" });
      return;
    }
    
    setSelectedCostItems(prev => [...prev, {
      costItemId: 0,
      quantity: 1,
      markupPercentage: 20
    }]);
  };

  const updateCostItem = (index: number, field: string, value: any) => {
    setSelectedCostItems(prev => 
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  };

  const removeCostItem = (index: number) => {
    setSelectedCostItems(prev => prev.filter((_, i) => i !== index));
  };

  const filteredCostItems = selectedCategory 
    ? costItems.filter(item => item.categoryId === parseInt(selectedCategory))
    : [];

  const totalBidAmount = bidItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);

  if (isLoading) {
    return <div>Loading bid items...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Project Bid</h3>
          <p className="text-sm text-muted-foreground">
            Total Bid Amount: ${totalBidAmount.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBuildFromCostsOpen} onOpenChange={setIsBuildFromCostsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Build from Costs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Build Bid from Cost Items</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={addCostItemToBid} disabled={!selectedCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Cost Item
                </Button>

                {selectedCostItems.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cost Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Markup %</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCostItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select 
                                value={item.costItemId.toString()} 
                                onValueChange={(value) => updateCostItem(index, 'costItemId', parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select cost item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredCostItems.map((costItem) => (
                                    <SelectItem key={costItem.id} value={costItem.id.toString()}>
                                      {costItem.name} - ${costItem.costPerUnit}/{costItem.unitType}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateCostItem(index, 'quantity', parseFloat(e.target.value))}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.markupPercentage}
                                onChange={(e) => updateCostItem(index, 'markupPercentage', parseFloat(e.target.value))}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCostItem(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsBuildFromCostsOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBuildFromCosts}
                    disabled={selectedCostItems.length === 0 || buildFromCostsMutation.isPending}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Build Bid
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bid Item</DialogTitle>
              </DialogHeader>
              <form action={handleAddBidItem} className="space-y-4">
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select name="categoryId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" required />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" name="quantity" type="number" step="0.01" required />
                  </div>
                  <div>
                    <Label htmlFor="unitType">Unit Type</Label>
                    <Input id="unitType" name="unitType" placeholder="each, sq ft, linear ft" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unitPrice">Unit Price</Label>
                    <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
                  </div>
                  <div>
                    <Label htmlFor="markupPercentage">Markup %</Label>
                    <Input id="markupPercentage" name="markupPercentage" type="number" step="0.01" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBidItemMutation.isPending}>
                    Add Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bid Items</CardTitle>
        </CardHeader>
        <CardContent>
          {bidItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bid items yet</p>
              <p className="text-sm text-muted-foreground">Add items manually or build from your cost management items</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bidItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity} {item.unitType}</TableCell>
                    <TableCell>${parseFloat(item.unitPrice || "0").toLocaleString()}</TableCell>
                    <TableCell>${parseFloat(item.totalPrice || "0").toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBidItemMutation.mutate(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
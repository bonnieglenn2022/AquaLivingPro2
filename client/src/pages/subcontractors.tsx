import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubcontractorSchema, type Subcontractor, type InsertSubcontractor } from "@shared/schema";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function Subcontractors() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subcontractors = [], isLoading } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
  });

  const form = useForm<InsertSubcontractor>({
    resolver: zodResolver(insertSubcontractorSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      licenseNumber: "",
      specialty: "",
      rating: undefined,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSubcontractor) => {
      console.log("Creating subcontractor with data:", data);
      return apiRequest("POST", "/api/subcontractors", data);
    },
    onSuccess: (newSubcontractor) => {
      console.log("Subcontractor created successfully:", newSubcontractor);
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Subcontractor created successfully",
      });
    },
    onError: (error) => {
      console.error("Create subcontractor error:", error);
      console.error("Full error details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subcontractor",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertSubcontractor> }) =>
      apiRequest("PUT", `/api/subcontractors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      setIsDialogOpen(false);
      setEditingSubcontractor(null);
      form.reset();
      toast({
        title: "Success",
        description: "Subcontractor updated successfully",
      });
    },
    onError: (error) => {
      console.error("Update subcontractor error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subcontractor",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/subcontractors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      toast({
        title: "Success",
        description: "Subcontractor deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete subcontractor error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete subcontractor",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertSubcontractor) => {
    if (editingSubcontractor) {
      updateMutation.mutate({ id: editingSubcontractor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (subcontractor: Subcontractor) => {
    setEditingSubcontractor(subcontractor);
    form.reset({
      name: subcontractor.name,
      contactName: subcontractor.contactName || "",
      email: subcontractor.email || "",
      phone: subcontractor.phone || "",
      address: subcontractor.address || "",
      city: subcontractor.city || "",
      state: subcontractor.state || "",
      zipCode: subcontractor.zipCode || "",
      licenseNumber: subcontractor.licenseNumber || "",
      specialty: subcontractor.specialty || "",
      rating: subcontractor.rating || undefined,
      notes: subcontractor.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this subcontractor?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingSubcontractor(null);
    form.reset();
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return "-";
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subcontractors</h1>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subcontractor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSubcontractor ? "Edit Subcontractor" : "Add New Subcontractor"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter company name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter contact name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="Enter email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter phone number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="specialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialty</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Excavation, Plumbing, Electrical" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter license number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rating (1-5)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1" 
                                max="5" 
                                placeholder="Rate 1-5 stars"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter zip code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {editingSubcontractor ? "Update" : "Create"} Subcontractor
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>License #</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading subcontractors...
                    </TableCell>
                  </TableRow>
                ) : subcontractors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No subcontractors found. Add your first subcontractor to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  subcontractors.map((subcontractor) => (
                    <TableRow key={subcontractor.id}>
                      <TableCell className="font-medium">{subcontractor.name}</TableCell>
                      <TableCell>{subcontractor.contactName || "-"}</TableCell>
                      <TableCell>
                        {subcontractor.specialty ? (
                          <Badge variant="outline">{subcontractor.specialty}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{subcontractor.phone || "-"}</TableCell>
                      <TableCell>{renderStars(subcontractor.rating)}</TableCell>
                      <TableCell>{subcontractor.licenseNumber || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subcontractor)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(subcontractor.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
    </div>
  );
}
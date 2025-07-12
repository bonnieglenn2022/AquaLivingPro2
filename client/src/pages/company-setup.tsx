import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building, MapPin, Phone, Mail, FileText, Users, Plus, X } from "lucide-react";
import { useLocation } from "wouter";

const companySetupSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  slug: z.string().min(2, "Company slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
  description: z.string().optional(),
  industry: z.string().default("pool_construction"),
});

const locationSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().default(false),
});

type CompanySetupForm = z.infer<typeof companySetupSchema>;
type LocationForm = z.infer<typeof locationSchema>;

export default function CompanySetup() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState<LocationForm[]>([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [companyCode, setCompanyCode] = useState("");

  const form = useForm<CompanySetupForm>({
    resolver: zodResolver(companySetupSchema),
    defaultValues: {
      industry: "pool_construction",
    },
  });

  const locationForm = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      isPrimary: locations.length === 0,
    },
  });

  // Check if user already has a company
  const { data: existingCompany } = useQuery({
    queryKey: ["/api/user/company"],
    enabled: !!user,
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanySetupForm & { locations: LocationForm[] }) => {
      const response = await apiRequest("POST", "/api/companies", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCompanyCode(data.companyCode);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["/api/user/company"] });
      toast({
        title: "Company Created Successfully!",
        description: `Your company code is ${data.companyCode}. Save this code to invite team members.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanySetupForm) => {
    if (locations.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one office location.",
        variant: "destructive",
      });
      return;
    }
    
    createCompanyMutation.mutate({
      ...data,
      locations,
    });
  };

  const addLocation = (locationData: LocationForm) => {
    // If this is primary, make sure no other location is primary
    if (locationData.isPrimary) {
      setLocations(prev => prev.map(loc => ({ ...loc, isPrimary: false })));
    }
    
    setLocations(prev => [...prev, locationData]);
    setShowLocationForm(false);
    locationForm.reset({
      isPrimary: false,
    });
  };

  const removeLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  // Redirect if user already has a company
  if (existingCompany && !authLoading) {
    setLocation("/dashboard");
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pool-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to AquaLiving Pro</h1>
          <p className="text-slate-600">Let's set up your pool construction company</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-pool-blue text-white' : 'bg-slate-200 text-slate-500'}`}>
              <Building className="w-5 h-5" />
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-pool-blue' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-pool-blue text-white' : 'bg-slate-200 text-slate-500'}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className={`w-20 h-1 ${step >= 3 ? 'bg-pool-blue' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-pool-blue text-white' : 'bg-slate-200 text-slate-500'}`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(() => setStep(2))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Pool Construction" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Slug *</FormLabel>
                          <FormControl>
                            <Input placeholder="acme-pool" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="info@acmepools.com" {...field} />
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
                          <FormLabel>Business Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.acmepools.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Business Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Business St" {...field} />
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
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Austin" {...field} />
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
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input placeholder="TX" {...field} />
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
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="78701" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your pool construction business..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-pool-blue hover:bg-pool-blue/90">
                      Continue to Office Locations
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Office Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Locations */}
              {locations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900">Added Locations</h3>
                  {locations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{location.name}</h4>
                          {location.isPrimary && <Badge>Primary</Badge>}
                        </div>
                        <p className="text-sm text-slate-600">
                          {location.address}, {location.city}, {location.state} {location.zipCode}
                        </p>
                        {location.phone && (
                          <p className="text-sm text-slate-600">{location.phone}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Separator />
                </div>
              )}

              {/* Add Location Form */}
              {!showLocationForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowLocationForm(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Office Location
                </Button>
              ) : (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium">Add New Location</h3>
                  <Form {...locationForm}>
                    <div className="space-y-4">
                      <FormField
                        control={locationForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Main Office" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={locationForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Office St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={locationForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="Austin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={locationForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State *</FormLabel>
                              <FormControl>
                                <Input placeholder="TX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={locationForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code *</FormLabel>
                              <FormControl>
                                <Input placeholder="78701" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={locationForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={locationForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="office@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPrimary"
                          checked={locationForm.watch("isPrimary")}
                          onChange={(e) => locationForm.setValue("isPrimary", e.target.checked)}
                        />
                        <Label htmlFor="isPrimary">Primary Location</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={locationForm.handleSubmit(addLocation)}
                          className="bg-pool-blue hover:bg-pool-blue/90"
                        >
                          Add Location
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowLocationForm(false);
                            locationForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Form>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={locations.length === 0 || createCompanyMutation.isPending}
                  className="bg-pool-blue hover:bg-pool-blue/90"
                >
                  {createCompanyMutation.isPending ? "Creating Company..." : "Create Company"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Company Created Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Building className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Welcome to AquaLiving Pro!</h3>
                <p className="text-slate-600">Your company has been set up successfully.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <h4 className="font-medium text-blue-900 mb-2">Your Company Code</h4>
                <div className="text-2xl font-mono font-bold text-blue-700 bg-white px-4 py-2 rounded border">
                  {companyCode}
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  Share this code with team members to invite them to your company
                </p>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => setLocation("/dashboard")}
                  className="bg-pool-blue hover:bg-pool-blue/90"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
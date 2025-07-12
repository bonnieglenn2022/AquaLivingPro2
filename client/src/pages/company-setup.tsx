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

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building, Phone, Mail, FileText, Users } from "lucide-react";
import { useLocation } from "wouter";

const companySetupSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
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



type CompanySetupForm = z.infer<typeof companySetupSchema>;

export default function CompanySetup() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [step, setStep] = useState(1);
  const [companyCode, setCompanyCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const form = useForm<CompanySetupForm>({
    resolver: zodResolver(companySetupSchema),
    defaultValues: {
      name: "",
      website: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      description: "",
      industry: "pool_construction",
    },
  });



  // Check if user already has a company
  const { data: existingCompany } = useQuery({
    queryKey: ["/api/user/company"],
    enabled: !!user,
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanySetupForm) => {
      // Auto-generate slug from company name
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      
      const response = await apiRequest("POST", "/api/companies", { ...data, slug });
      return response.json();
    },
    onSuccess: (data) => {
      setCompanyCode(data.companyCode);
      setStep(2);
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

  const joinCompanyMutation = useMutation({
    mutationFn: async (companyCode: string) => {
      const response = await apiRequest("POST", "/api/companies/join", { companyCode });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/company"] });
      toast({
        title: "Successfully Joined Company!",
        description: `You've joined ${data.company.name}.`,
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Invalid company code or invitation has expired.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanySetupForm) => {
    createCompanyMutation.mutate(data);
  };

  const handleJoinCompany = () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company code.",
        variant: "destructive",
      });
      return;
    }
    
    joinCompanyMutation.mutate(joinCode.trim().toUpperCase());
  };



  // Note: Company existence is now handled by App.tsx routing

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

        {mode === "choose" && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Get Started</CardTitle>
              <p className="text-center text-slate-600">Choose how you'd like to proceed</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setMode("create")}
                className="w-full bg-pool-blue hover:bg-pool-blue/90 h-20 text-lg"
              >
                <Building className="w-6 h-6 mr-3" />
                Create New Company
              </Button>
              
              <div className="text-center text-slate-500 text-sm">or</div>
              
              <Button
                onClick={() => setMode("join")}
                variant="outline"
                className="w-full h-20 text-lg border-2"
              >
                <Users className="w-6 h-6 mr-3" />
                Join Existing Company
              </Button>
            </CardContent>
          </Card>
        )}

        {mode === "join" && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Join Company</CardTitle>
              <p className="text-center text-slate-600">Enter your company code to join</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="joinCode">Company Code</Label>
                <Input
                  id="joinCode"
                  placeholder="Enter 6-character code (e.g., ABC123)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-wider"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMode("choose")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoinCompany}
                  disabled={joinCompanyMutation.isPending || joinCode.length !== 6}
                  className="flex-1 bg-pool-blue hover:bg-pool-blue/90"
                >
                  {joinCompanyMutation.isPending ? "Joining..." : "Join Company"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === "create" && (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-pool-blue text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Building className="w-5 h-5" />
                </div>
                <div className={`w-20 h-1 ${step >= 2 ? 'bg-pool-blue' : 'bg-slate-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-pool-blue text-white' : 'bg-slate-200 text-slate-500'}`}>
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setMode("choose")}>
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createCompanyMutation.isPending}
                      className="bg-pool-blue hover:bg-pool-blue/90"
                    >
                      {createCompanyMutation.isPending ? "Creating Company..." : "Create Company"}
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
                  onClick={() => setLocation("/")}
                  className="bg-pool-blue hover:bg-pool-blue/90"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
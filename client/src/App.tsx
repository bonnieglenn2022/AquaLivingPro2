import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import CompanySetup from "@/pages/company-setup";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Leads from "@/pages/leads";
import Estimates from "@/pages/estimates";
import Scheduling from "@/pages/scheduling";
import Documents from "@/pages/documents";
import Vendors from "@/pages/vendors";
import Reports from "@/pages/reports";
import Costs from "@/pages/costs";
import Finances from "@/pages/finances";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check if user has a company (only if authenticated)
  const { data: userCompany, isLoading: companyLoading } = useQuery({
    queryKey: ["/api/user/company"],
    enabled: isAuthenticated && !!user,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Show loading state
  if (isLoading || (isAuthenticated && companyLoading)) {
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
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : !userCompany ? (
        // User needs to set up company
        <Route path="*" component={CompanySetup} />
      ) : (
        // User has a company - show normal app
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/leads" component={Leads} />
          <Route path="/estimates" component={Estimates} />
          <Route path="/scheduling" component={Scheduling} />
          <Route path="/documents" component={Documents} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/reports" component={Reports} />
          <Route path="/costs" component={Costs} />
          <Route path="/finances" component={Finances} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

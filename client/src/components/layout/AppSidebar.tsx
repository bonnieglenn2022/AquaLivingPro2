import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Waves, 
  LayoutDashboard, 
  Building, 
  Users, 
  Calculator, 
  Calendar,
  FileText,
  Truck,
  BarChart3,
  DollarSign,
  CreditCard,
  Package,
  HardHat,
  X
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/projects", icon: Building, label: "Projects" },
  { path: "/leads", icon: Users, label: "CRM & Leads" },
  { path: "/estimates", icon: Calculator, label: "Estimating" },
  { path: "/scheduling", icon: Calendar, label: "Scheduling" },
  { path: "/documents", icon: FileText, label: "Documents" },
  { path: "/vendors", icon: Truck, label: "Vendors" },
  { path: "/suppliers", icon: Package, label: "Suppliers" },
  { path: "/subcontractors", icon: HardHat, label: "Subcontractors" },
  { path: "/cost-catalog", icon: DollarSign, label: "Cost Catalog" },
  { path: "/finances", icon: CreditCard, label: "Job Finances" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
];

interface AppSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ isMobileOpen = false, onMobileClose }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-white shadow-lg border-r border-slate-200 z-50",
        "lg:block", // Always visible on large screens
        "fixed lg:relative inset-y-0 left-0", // Fixed position on mobile
        isMobileOpen ? "block" : "hidden lg:block" // Show/hide on mobile based on state
      )}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pool-blue to-ocean-teal rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">AquaLiving Pro</h1>
                <p className="text-sm text-slate-500">Pool & Outdoor Living</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
      
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                    isActive
                      ? "bg-pool-blue/10 text-pool-blue"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => {
                    // Close mobile sidebar when navigating
                    if (onMobileClose) {
                      onMobileClose();
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

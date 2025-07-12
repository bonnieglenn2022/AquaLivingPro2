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
  BarChart3
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/projects", icon: Building, label: "Projects" },
  { path: "/leads", icon: Users, label: "CRM & Leads" },
  { path: "/estimates", icon: Calculator, label: "Estimating" },
  { path: "/scheduling", icon: Calendar, label: "Scheduling" },
  { path: "/documents", icon: FileText, label: "Documents" },
  { path: "/vendors", icon: Truck, label: "Vendors" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-slate-200 hidden lg:block">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pool-blue to-ocean-teal rounded-lg flex items-center justify-center">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AquaLiving Pro</h1>
            <p className="text-sm text-slate-500">Pool & Outdoor Living</p>
          </div>
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
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

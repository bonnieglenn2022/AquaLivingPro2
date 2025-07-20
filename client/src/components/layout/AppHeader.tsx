import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Calculator,
  Calendar,
  FileText,
  Settings,
  DollarSign,
  Package,
  Building,
  Truck,
  UserCheck,
  ChevronDown,
  User,
  LogOut,
  Bell,
  Search,
} from "lucide-react";

export function AppHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);



  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Sales & Estimating",
      trigger: true,
      items: [
        {
          title: "Leads",
          href: "/leads",
          icon: Users,
          description: "Manage leads and prospects",
        },
        {
          title: "Estimates",
          href: "/estimates",
          icon: Calculator,
          description: "Project estimates and proposals",
        },
        {
          title: "Cost Catalog",
          href: "/cost-catalog",
          icon: Package,
          description: "Cost database and pricing",
        },
      ],
    },
    {
      title: "Project Management",
      trigger: true,
      items: [
        {
          title: "Projects",
          href: "/projects",
          icon: FolderOpen,
          description: "Active and completed projects",
        },
        {
          title: "Scheduling",
          href: "/scheduling",
          icon: Calendar,
          description: "Project scheduling and tasks",
        },
        {
          title: "Documents",
          href: "/documents",
          icon: FileText,
          description: "Project documents and files",
        },
      ],
    },
    {
      title: "Job Finances",
      trigger: true,
      items: [
        {
          title: "Finances",
          href: "/finances",
          icon: DollarSign,
          description: "Financial management and reporting",
        },
        {
          title: "Reports",
          href: "/reports",
          icon: FileText,
          description: "Financial reports and analytics",
        },
      ],
    },
    {
      title: "Vendors & Subs",
      trigger: true,
      items: [
        {
          title: "Vendors",
          href: "/vendors",
          icon: Building,
          description: "Vendor management",
        },
        {
          title: "Suppliers",
          href: "/suppliers",
          icon: Truck,
          description: "Material supplier database",
        },
        {
          title: "Subcontractors",
          href: "/subcontractors",
          icon: UserCheck,
          description: "Subcontractor management",
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-pool-blue text-white font-bold">
                AL
              </div>
              <span className="hidden font-bold sm:inline-block text-lg">
                AquaLiving Pro
              </span>
            </Link>
          </div>

          {/* Main Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.trigger ? (
                    <>
                      <NavigationMenuTrigger className="h-9">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="max-h-[80vh] overflow-y-auto">
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {item.items?.map((subItem) => (
                            <li key={subItem.title}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  location === subItem.href && "bg-accent"
                                )}
                              >
                                <div className="flex items-center space-x-2">
                                  <subItem.icon className="h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">
                                    {subItem.title}
                                  </div>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {subItem.description}
                                </p>
                              </Link>
                            </li>
                            ))}
                          </ul>
                        </div>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "h-9",
                          location === item.href && "bg-accent"
                        )}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button variant="ghost" size="sm" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  {user?.profileImageUrl ? (
                    <img
                      className="rounded-full object-cover"
                      src={user.profileImageUrl}
                      alt={user.firstName || "User"}
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && (
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                    )}
                    {user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/company-setup">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Company Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
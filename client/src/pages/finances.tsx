import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  FileText, 
  ShoppingCart, 
  Wrench, 
  Receipt, 
  CreditCard,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Project {
  id: number;
  name: string;
  status: string;
  customer?: {
    firstName: string;
    lastName: string;
  };
}

interface ProjectBudget {
  id: number;
  projectId: number;
  name: string;
  totalBudget: string;
  totalCommitted: string;
  totalSpent: string;
  isActive: boolean;
  createdAt: string;
}

interface PurchaseOrder {
  id: number;
  projectId: number;
  poNumber: string;
  title: string;
  status: string;
  totalAmount: string;
  vendor?: {
    name: string;
  };
  createdAt: string;
}

interface WorkOrder {
  id: number;
  projectId: number;
  woNumber: string;
  title: string;
  status: string;
  totalAmount: string;
  vendor?: {
    name: string;
  };
  createdAt: string;
}

interface VendorBill {
  id: number;
  projectId: number;
  billNumber: string;
  title: string;
  status: string;
  totalAmount: string;
  vendor?: {
    name: string;
  };
  billDate: string;
}

interface CustomerInvoice {
  id: number;
  projectId: number;
  invoiceNumber: string;
  title: string;
  status: string;
  totalAmount: string;
  balanceDue: string;
  customer?: {
    firstName: string;
    lastName: string;
  };
  invoiceDate: string;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

export default function Finances() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // Fetch projects for project selector
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch project budgets
  const { data: budgets = [] } = useQuery<ProjectBudget[]>({
    queryKey: ["/api/budgets", selectedProject],
    enabled: !!selectedProject,
  });

  // Fetch purchase orders
  const { data: purchaseOrders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders", selectedProject],
    enabled: !!selectedProject,
  });

  // Fetch work orders
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders", selectedProject],
    enabled: !!selectedProject,
  });

  // Fetch vendor bills
  const { data: vendorBills = [] } = useQuery<VendorBill[]>({
    queryKey: ["/api/vendor-bills", selectedProject],
    enabled: !!selectedProject,
  });

  // Fetch customer invoices
  const { data: customerInvoices = [] } = useQuery<CustomerInvoice[]>({
    queryKey: ["/api/customer-invoices", selectedProject],
    enabled: !!selectedProject,
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount || '0'));
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.draft}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Calculate totals for selected project
  const projectTotals = {
    totalBudget: budgets.reduce((sum, budget) => sum + parseFloat(budget.totalBudget || '0'), 0),
    totalCommitted: budgets.reduce((sum, budget) => sum + parseFloat(budget.totalCommitted || '0'), 0),
    totalSpent: budgets.reduce((sum, budget) => sum + parseFloat(budget.totalSpent || '0'), 0),
    pendingInvoices: customerInvoices.filter(inv => inv.status === 'sent' || inv.status === 'pending').length,
    overdueInvoices: customerInvoices.filter(inv => inv.status === 'overdue').length,
  };

  if (!selectedProject) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-pool-blue to-ocean-teal rounded-lg flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Job Finances</h1>
          <p className="text-slate-600 mb-8">Manage budgets, purchase orders, invoices, and financial tracking</p>
          
          <div className="max-w-md mx-auto">
            <label htmlFor="project-select" className="block text-sm font-medium text-slate-700 mb-2">
              Select a project to view finances
            </label>
            <select
              id="project-select"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pool-blue focus:border-transparent"
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(Number(e.target.value) || null)}
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.customer?.firstName} {project.customer?.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Finances</h1>
          <p className="text-slate-600">
            {selectedProjectData?.name} - {selectedProjectData?.customer?.firstName} {selectedProjectData?.customer?.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pool-blue focus:border-transparent"
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(Number(e.target.value) || null)}
          >
            <option value="">Switch Project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.customer?.firstName} {project.customer?.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectTotals.totalBudget.toString())}</div>
            <p className="text-xs text-muted-foreground">Total budgeted amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Committed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectTotals.totalCommitted.toString())}</div>
            <p className="text-xs text-muted-foreground">POs & Work Orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Spent</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectTotals.totalSpent.toString())}</div>
            <p className="text-xs text-muted-foreground">Vendor bills paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectTotals.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {projectTotals.overdueInvoices > 0 && (
                <span className="text-red-600">{projectTotals.overdueInvoices} overdue</span>
              )}
              {projectTotals.overdueInvoices === 0 && "All current"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="budgets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="vendor-bills">Vendor Bills</TabsTrigger>
          <TabsTrigger value="customer-invoices">Customer Invoices</TabsTrigger>
        </TabsList>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Project Budgets</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </div>
          
          <div className="grid gap-4">
            {budgets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No budgets created</h3>
                  <p className="text-slate-600 mb-4">Create your first budget to start tracking project costs</p>
                  <Button>Create First Budget</Button>
                </CardContent>
              </Card>
            ) : (
              budgets.map((budget) => (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{budget.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {budget.isActive && (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Budget</p>
                        <p className="text-lg font-semibold">{formatCurrency(budget.totalBudget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Committed</p>
                        <p className="text-lg font-semibold">{formatCurrency(budget.totalCommitted)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Spent</p>
                        <p className="text-lg font-semibold">{formatCurrency(budget.totalSpent)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Purchase Order
            </Button>
          </div>
          
          <div className="grid gap-4">
            {purchaseOrders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No purchase orders</h3>
                  <p className="text-slate-600 mb-4">Create purchase orders to manage material and equipment purchases</p>
                  <Button>Create First Purchase Order</Button>
                </CardContent>
              </Card>
            ) : (
              purchaseOrders.map((po) => (
                <Card key={po.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{po.title}</CardTitle>
                        <CardDescription>PO #{po.poNumber} • {po.vendor?.name}</CardDescription>
                      </div>
                      {getStatusBadge(po.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{formatCurrency(po.totalAmount)}</p>
                      <p className="text-sm text-slate-600">
                        Created {new Date(po.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="work-orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Work Orders</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Work Order
            </Button>
          </div>
          
          <div className="grid gap-4">
            {workOrders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No work orders</h3>
                  <p className="text-slate-600 mb-4">Create work orders to manage subcontractor services</p>
                  <Button>Create First Work Order</Button>
                </CardContent>
              </Card>
            ) : (
              workOrders.map((wo) => (
                <Card key={wo.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{wo.title}</CardTitle>
                        <CardDescription>WO #{wo.woNumber} • {wo.vendor?.name}</CardDescription>
                      </div>
                      {getStatusBadge(wo.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{formatCurrency(wo.totalAmount)}</p>
                      <p className="text-sm text-slate-600">
                        Created {new Date(wo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Vendor Bills Tab */}
        <TabsContent value="vendor-bills" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vendor Bills</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Record Bill
            </Button>
          </div>
          
          <div className="grid gap-4">
            {vendorBills.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No vendor bills</h3>
                  <p className="text-slate-600 mb-4">Record bills received from vendors for materials and services</p>
                  <Button>Record First Bill</Button>
                </CardContent>
              </Card>
            ) : (
              vendorBills.map((bill) => (
                <Card key={bill.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{bill.title}</CardTitle>
                        <CardDescription>Bill #{bill.billNumber} • {bill.vendor?.name}</CardDescription>
                      </div>
                      {getStatusBadge(bill.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{formatCurrency(bill.totalAmount)}</p>
                      <p className="text-sm text-slate-600">
                        Bill Date {new Date(bill.billDate).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Customer Invoices Tab */}
        <TabsContent value="customer-invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Customer Invoices</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
          
          <div className="grid gap-4">
            {customerInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No customer invoices</h3>
                  <p className="text-slate-600 mb-4">Create invoices to bill customers for completed work</p>
                  <Button>Create First Invoice</Button>
                </CardContent>
              </Card>
            ) : (
              customerInvoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{invoice.title}</CardTitle>
                        <CardDescription>
                          Invoice #{invoice.invoiceNumber} • {invoice.customer?.firstName} {invoice.customer?.lastName}
                        </CardDescription>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(invoice.totalAmount)}</p>
                        {parseFloat(invoice.balanceDue) > 0 && (
                          <p className="text-sm text-red-600">Balance Due: {formatCurrency(invoice.balanceDue)}</p>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        Invoice Date {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
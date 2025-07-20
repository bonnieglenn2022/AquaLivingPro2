import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  FileText,
  PieChart,
  LineChart,
  Target
} from "lucide-react";

const reportTypes = [
  {
    title: "Project Profitability",
    description: "Analyze actual costs vs. budgets for pool projects",
    icon: DollarSign,
    color: "bg-garden-green/10 text-garden-green",
  },
  {
    title: "Equipment Tracking",
    description: "Monitor pool equipment costs and delivery schedules",
    icon: Target,
    color: "bg-pool-blue/10 text-pool-blue",
  },
  {
    title: "Lead Conversion",
    description: "Track lead sources and conversion rates",
    icon: TrendingUp,
    color: "bg-sunset-orange/10 text-sunset-orange",
  },
  {
    title: "Project Timeline",
    description: "Analyze phase completion times and delays",
    icon: Calendar,
    color: "bg-ocean-teal/10 text-ocean-teal",
  },
  {
    title: "Vendor Performance",
    description: "Evaluate supplier delivery and quality metrics",
    icon: BarChart3,
    color: "bg-sand-yellow/10 text-sand-yellow",
  },
  {
    title: "Revenue Trends",
    description: "Monthly and quarterly revenue analysis",
    icon: LineChart,
    color: "bg-coral-red/10 text-coral-red",
  },
];

const quickStats = [
  {
    title: "This Month Revenue",
    value: "$0",
    change: "0%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Active Projects",
    value: "0",
    change: "0%",
    trend: "up", 
    icon: BarChart3,
  },
  {
    title: "Completion Rate",
    value: "0%",
    change: "0%",
    trend: "up",
    icon: Target,
  },
  {
    title: "Average Profit Margin",
    value: "0%",
    change: "0%",
    trend: "up",
    icon: TrendingUp,
  },
];

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pool-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleGenerateReport = (reportType: string) => {
    toast({
      title: "Generate Report",
      description: `${reportType} report generation will be available soon!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        </div>
        
        {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </Button>
            </div>
            <Button className="bg-pool-blue hover:bg-pool-blue/90">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                      <p className={`text-sm ${stat.trend === 'up' ? 'text-garden-green' : 'text-coral-red'}`}>
                        {stat.change} from last month
                      </p>
                    </div>
                      <div className="w-12 h-12 bg-pool-blue/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-pool-blue" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Report Types */}
        <Card className="mb-8">
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((report, index) => {
                  const IconComponent = report.icon;
                  return (
                    <div key={index} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${report.color}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{report.title}</h3>
                      <p className="text-sm text-slate-600 mb-4">{report.description}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleGenerateReport(report.title)}
                      >
                        Generate Report
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
        </Card>

        {/* Analytics Dashboard Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <LineChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Data Available</h3>
                  <p className="text-slate-600">
                    Complete some projects to see revenue trends and analytics.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PieChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Data Available</h3>
                  <p className="text-slate-600">
                    Add projects to see status distribution and progress analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Pool Industry Insights */}
        <Card className="mt-8">
            <CardHeader>
              <CardTitle>Pool Industry Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border border-slate-200 rounded-lg">
                  <div className="w-12 h-12 bg-pool-blue/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-pool-blue" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Seasonal Trends</h3>
                  <p className="text-sm text-slate-600">
                    Track construction timing based on weather and demand patterns.
                  </p>
                </div>

                <div className="text-center p-4 border border-slate-200 rounded-lg">
                  <div className="w-12 h-12 bg-garden-green/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-garden-green" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Cost Analysis</h3>
                  <p className="text-sm text-slate-600">
                    Compare material and equipment costs across different project types.
                  </p>
                </div>

                <div className="text-center p-4 border border-slate-200 rounded-lg">
                  <div className="w-12 h-12 bg-sunset-orange/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-sunset-orange" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Performance Metrics</h3>
                  <p className="text-sm text-slate-600">
                    Monitor crew productivity and project completion efficiency.
                  </p>
                </div>
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

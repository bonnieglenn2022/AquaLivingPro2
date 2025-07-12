import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building, 
  DollarSign, 
  Users, 
  ClipboardCheck 
} from "lucide-react";

export function MetricsCards() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                </div>
                <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Projects</p>
              <p className="text-3xl font-bold text-slate-900">{metrics?.activeProjects || 0}</p>
              <p className="text-sm text-garden-green">Pool & outdoor living</p>
            </div>
            <div className="w-12 h-12 bg-pool-blue/10 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-pool-blue" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Revenue Pipeline</p>
              <p className="text-3xl font-bold text-slate-900">
                {metrics?.revenue ? formatCurrency(metrics.revenue) : '$0'}
              </p>
              <p className="text-sm text-garden-green">Active projects value</p>
            </div>
            <div className="w-12 h-12 bg-garden-green/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-garden-green" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">New Leads</p>
              <p className="text-3xl font-bold text-slate-900">{metrics?.leads || 0}</p>
              <p className="text-sm text-sunset-orange">Follow up required</p>
            </div>
            <div className="w-12 h-12 bg-sunset-orange/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-sunset-orange" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Tasks Due</p>
              <p className="text-3xl font-bold text-slate-900">{metrics?.tasks || 0}</p>
              <p className="text-sm text-coral-red">Next 7 days</p>
            </div>
            <div className="w-12 h-12 bg-coral-red/10 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-coral-red" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

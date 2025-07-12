import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Building, 
  DollarSign, 
  Users, 
  ClipboardCheck,
  ExternalLink
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
      <Link href="/projects">
        <Card className="border-slate-200 cursor-pointer hover:shadow-lg transition-shadow duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Projects</p>
                <p className="text-3xl font-bold text-slate-900">{metrics?.activeProjects || 0}</p>
                <p className="text-sm text-garden-green">Pool & outdoor living</p>
              </div>
              <div className="w-12 h-12 bg-pool-blue/10 rounded-lg flex items-center justify-center group-hover:bg-pool-blue/20 transition-colors">
                <Building className="w-6 h-6 text-pool-blue" />
              </div>
            </div>
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center text-xs text-slate-500">
                <ExternalLink className="w-3 h-3 mr-1" />
                View all projects
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      
      <Link href="/reports">
        <Card className="border-slate-200 cursor-pointer hover:shadow-lg transition-shadow duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Revenue Pipeline</p>
                <p className="text-3xl font-bold text-slate-900">
                  {metrics?.revenue ? formatCurrency(metrics.revenue) : '$0'}
                </p>
                <p className="text-sm text-garden-green">Active projects value</p>
              </div>
              <div className="w-12 h-12 bg-garden-green/10 rounded-lg flex items-center justify-center group-hover:bg-garden-green/20 transition-colors">
                <DollarSign className="w-6 h-6 text-garden-green" />
              </div>
            </div>
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center text-xs text-slate-500">
                <ExternalLink className="w-3 h-3 mr-1" />
                View reports
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      
      <Link href="/leads">
        <Card className="border-slate-200 cursor-pointer hover:shadow-lg transition-shadow duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">New Leads</p>
                <p className="text-3xl font-bold text-slate-900">{metrics?.leads || 0}</p>
                <p className="text-sm text-sunset-orange">Follow up required</p>
              </div>
              <div className="w-12 h-12 bg-sunset-orange/10 rounded-lg flex items-center justify-center group-hover:bg-sunset-orange/20 transition-colors">
                <Users className="w-6 h-6 text-sunset-orange" />
              </div>
            </div>
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center text-xs text-slate-500">
                <ExternalLink className="w-3 h-3 mr-1" />
                View leads
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      
      <Link href="/scheduling">
        <Card className="border-slate-200 cursor-pointer hover:shadow-lg transition-shadow duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tasks Due</p>
                <p className="text-3xl font-bold text-slate-900">{metrics?.tasks || 0}</p>
                <p className="text-sm text-coral-red">Next 7 days</p>
              </div>
              <div className="w-12 h-12 bg-coral-red/10 rounded-lg flex items-center justify-center group-hover:bg-coral-red/20 transition-colors">
                <ClipboardCheck className="w-6 h-6 text-coral-red" />
              </div>
            </div>
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center text-xs text-slate-500">
                <ExternalLink className="w-3 h-3 mr-1" />
                View tasks
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

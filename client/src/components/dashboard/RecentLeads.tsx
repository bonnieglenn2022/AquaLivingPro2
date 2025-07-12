import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserPlus } from "lucide-react";

const priorityColors = {
  hot: "bg-coral-red/10 text-coral-red",
  warm: "bg-sunset-orange/10 text-sunset-orange",
  cold: "bg-slate-100 text-slate-600",
};

export function RecentLeads() {
  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Leads</CardTitle>
            <Button variant="ghost" size="sm" disabled>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-12"></div>
                  <div className="h-6 w-16 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const leads = customers?.filter((customer: any) => customer.status === "lead") || [];
  const recentLeads = leads.slice(0, 3);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    return `${diffDays - 1} days ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Link href="/leads">
            <Button variant="ghost" size="sm" className="text-pool-blue hover:text-pool-blue/80">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentLeads.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No recent leads</p>
            <Link href="/leads">
              <Button className="mt-4 bg-pool-blue hover:bg-pool-blue/90">
                Add First Lead
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentLeads.map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pool-blue to-ocean-teal rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(lead.firstName, lead.lastName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lead.email || lead.phone || 'Contact info needed'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(lead.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">New Lead</p>
                  <Badge 
                    className={priorityColors[lead.priority as keyof typeof priorityColors] || priorityColors.warm}
                  >
                    {lead.priority || 'warm'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

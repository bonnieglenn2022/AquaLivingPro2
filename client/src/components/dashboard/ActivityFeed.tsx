import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Image, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  FileText,
  Users
} from "lucide-react";

const activityIcons = {
  photo_upload: Image,
  status_change: CheckCircle,
  task_completed: CheckCircle,
  equipment_delayed: AlertTriangle,
  estimate_submitted: DollarSign,
  project_created: FileText,
  project_updated: FileText,
  task_created: CheckCircle,
  task_updated: CheckCircle,
  change_order_created: AlertTriangle,
};

const activityColors = {
  photo_upload: "bg-pool-blue/10 text-pool-blue",
  status_change: "bg-garden-green/10 text-garden-green",
  task_completed: "bg-garden-green/10 text-garden-green",
  equipment_delayed: "bg-sunset-orange/10 text-sunset-orange",
  estimate_submitted: "bg-pool-blue/10 text-pool-blue",
  project_created: "bg-ocean-teal/10 text-ocean-teal",
  project_updated: "bg-ocean-teal/10 text-ocean-teal",
  task_created: "bg-garden-green/10 text-garden-green",
  task_updated: "bg-garden-green/10 text-garden-green",
  change_order_created: "bg-sunset-orange/10 text-sunset-orange",
};

export function ActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.slice(0, 10).map((activity: any) => {
              const IconComponent = activityIcons[activity.type as keyof typeof activityIcons] || FileText;
              const colorClass = activityColors[activity.type as keyof typeof activityColors] || "bg-slate-100 text-slate-600";
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Calculator, 
  UserPlus, 
  BarChart3 
} from "lucide-react";

export function QuickActions() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: "Quick Action",
      description: `${action} feature will be available soon!`,
    });
  };

  const actions = [
    {
      icon: Plus,
      label: "New Project",
      action: () => handleAction("New Project"),
      bgColor: "bg-pool-blue/10",
      iconColor: "text-pool-blue",
    },
    {
      icon: Calculator,
      label: "Create Estimate",
      action: () => handleAction("Create Estimate"),
      bgColor: "bg-ocean-teal/10",
      iconColor: "text-ocean-teal",
    },
    {
      icon: UserPlus,
      label: "Add Lead",
      action: () => handleAction("Add Lead"),
      bgColor: "bg-sunset-orange/10",
      iconColor: "text-sunset-orange",
    },
    {
      icon: BarChart3,
      label: "View Reports",
      action: () => handleAction("View Reports"),
      bgColor: "bg-garden-green/10",
      iconColor: "text-garden-green",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="flex flex-col items-center p-4 h-auto border-slate-200 hover:bg-slate-50"
                onClick={action.action}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${action.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <span className="text-sm font-medium text-slate-900">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

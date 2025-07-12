import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";

const statusColors = {
  available: "bg-garden-green/10 text-garden-green",
  in_use: "bg-pool-blue/10 text-pool-blue",
  maintenance: "bg-sunset-orange/10 text-sunset-orange",
  ordered: "bg-sand-yellow/10 text-sand-yellow",
  delayed: "bg-coral-red/10 text-coral-red",
};

// Mock equipment data for demonstration
const mockEquipment = [
  {
    id: 1,
    name: "Variable Speed Pump",
    model: "Pentair SuperFlo VS",
    status: "available",
  },
  {
    id: 2,
    name: "Pool Heater",
    model: "Hayward H400FDN",
    status: "ordered",
  },
  {
    id: 3,
    name: "Sand Filter",
    model: "Pentair Clean & Clear",
    status: "available",
  },
  {
    id: 4,
    name: "Automation System",
    model: "Jandy AquaLink RS",
    status: "delayed",
  },
];

export function EquipmentStatus() {
  const { data: equipment, isLoading } = useQuery({
    queryKey: ["/api/equipment"],
  });

  // Use actual data if available, otherwise fall back to mock data
  const equipmentData = equipment || mockEquipment;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Status</CardTitle>
      </CardHeader>
      <CardContent>
        {equipmentData.length === 0 ? (
          <div className="text-center py-8">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No equipment found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {equipmentData.slice(0, 6).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.model || item.brand || 'Equipment'}</p>
                  </div>
                </div>
                <Badge 
                  className={statusColors[item.status as keyof typeof statusColors] || statusColors.available}
                >
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

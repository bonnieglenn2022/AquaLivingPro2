import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VendorBill, ProjectBidItem } from "@shared/schema";

interface ProjectCostsProps {
  projectId: number;
}

export function ProjectCosts({ projectId }: ProjectCostsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendorBills = [], isLoading: billsLoading } = useQuery<VendorBill[]>({
    queryKey: ["/api/vendor-bills", projectId],
  });

  const { data: bidItems = [], isLoading: bidLoading } = useQuery<ProjectBidItem[]>({
    queryKey: ["/api/projects", projectId, "bid-items"],
  });

  const calculateActualCostsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/projects/${projectId}/calculate-actual-costs`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ 
        title: "Success", 
        description: `Actual costs calculated: $${data.actualCosts.toLocaleString()}` 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to calculate actual costs", 
        variant: "destructive" 
      });
    },
  });

  if (billsLoading || bidLoading) {
    return <div>Loading cost data...</div>;
  }

  // Calculate totals
  const paidBills = vendorBills.filter(bill => bill.status === 'paid');
  const actualCosts = paidBills.reduce((sum, bill) => sum + parseFloat(bill.totalAmount || "0"), 0);
  const totalBidAmount = bidItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);
  const variance = actualCosts - totalBidAmount;
  const variancePercentage = totalBidAmount > 0 ? (variance / totalBidAmount) * 100 : 0;

  // Group costs by category
  const costsByCategory = paidBills.reduce((acc, bill) => {
    const category = bill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(bill);
    return acc;
  }, {} as Record<string, VendorBill[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Project Costs</h3>
          <p className="text-sm text-muted-foreground">
            Actual costs from paid vendor bills
          </p>
        </div>
        <Button 
          onClick={() => calculateActualCostsMutation.mutate()}
          disabled={calculateActualCostsMutation.isPending}
        >
          <Calculator className="w-4 h-4 mr-2" />
          Recalculate Costs
        </Button>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Original project bid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${actualCosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From paid vendor bills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            {variance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${variance >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {variance >= 0 ? '+' : ''}${variance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {variancePercentage >= 0 ? '+' : ''}{variancePercentage.toFixed(1)}% vs bid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Progress */}
      {totalBidAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost vs Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Actual Costs</span>
                <span>${actualCosts.toLocaleString()} / ${totalBidAmount.toLocaleString()}</span>
              </div>
              <Progress 
                value={(actualCosts / totalBidAmount) * 100} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{((actualCosts / totalBidAmount) * 100).toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Costs by Category */}
      {Object.keys(costsByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Costs by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(costsByCategory).map(([category, bills]) => {
                const categoryTotal = bills.reduce((sum, bill) => sum + parseFloat(bill.totalAmount || "0"), 0);
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{category}</h4>
                      <span className="font-semibold">${categoryTotal.toLocaleString()}</span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {bills.map((bill) => (
                        <div key={bill.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span>{bill.vendorName}</span>
                            <Badge variant="outline" className="text-xs">
                              {bill.status}
                            </Badge>
                          </div>
                          <span>${parseFloat(bill.totalAmount || "0").toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Paid Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Paid Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {paidBills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No paid bills yet</p>
              <p className="text-sm text-muted-foreground">
                Actual costs will appear here when vendor bills are marked as paid
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidBills.slice(0, 10).map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.vendorName}</TableCell>
                    <TableCell>{bill.billNumber}</TableCell>
                    <TableCell>
                      {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{bill.category || 'Other'}</TableCell>
                    <TableCell>${parseFloat(bill.totalAmount || "0").toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {bill.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cost Comparison */}
      {bidItems.length > 0 && paidBills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bid vs Actual Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Bid Total</p>
                  <p className="text-lg font-semibold">${totalBidAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Total</p>
                  <p className="text-lg font-semibold">${actualCosts.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Difference</p>
                  <p className={`text-lg font-semibold ${variance >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {variance >= 0 ? '+' : ''}${variance.toLocaleString()}
                  </p>
                </div>
              </div>
              
              {Math.abs(variancePercentage) > 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-800">
                    Cost Variance Alert
                  </p>
                  <p className="text-sm text-yellow-700">
                    Actual costs are {Math.abs(variancePercentage).toFixed(1)}% 
                    {variance >= 0 ? ' over' : ' under'} the original bid amount.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
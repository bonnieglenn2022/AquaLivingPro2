import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Image, 
  FileImage, 
  Upload, 
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical
} from "lucide-react";
import { Input } from "@/components/ui/input";

const documentTypes = {
  permit: "bg-sunset-orange/10 text-sunset-orange",
  design: "bg-pool-blue/10 text-pool-blue",
  contract: "bg-garden-green/10 text-garden-green",
  photo: "bg-ocean-teal/10 text-ocean-teal",
  inspection: "bg-coral-red/10 text-coral-red",
  invoice: "bg-sand-yellow/10 text-sand-yellow",
};

const getDocumentIcon = (type: string) => {
  switch (type) {
    case 'photo':
      return Image;
    case 'design':
      return FileImage;
    default:
      return FileText;
  }
};

export default function Documents() {
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

  const handleUpload = () => {
    toast({
      title: "Document Upload",
      description: "Document upload feature will be available soon!",
    });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <AppSidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="Document Management" />
        
        <div className="p-6 overflow-y-auto h-full">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  className="pl-10 pr-4 py-2 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <Button onClick={handleUpload} className="bg-pool-blue hover:bg-pool-blue/90">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>

          {/* Document Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {Object.entries(documentTypes).map(([type, colorClass]) => {
              const IconComponent = getDocumentIcon(type);
              return (
                <Card key={type} className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${colorClass}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium text-slate-900 capitalize">{type}s</h3>
                    <p className="text-sm text-slate-500">0 files</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Documents Yet</h3>
                <p className="text-slate-600 mb-6">
                  Upload permits, designs, contracts, photos, and other project documents to get started.
                </p>
                <Button onClick={handleUpload} className="bg-pool-blue hover:bg-pool-blue/90">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Document
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Document Management Features */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-pool-blue/10 rounded-lg flex items-center justify-center">
                    <Image className="w-5 h-5 text-pool-blue" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Photo Markup</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Add annotations, arrows, text, and timestamps to progress photos for clear communication.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-garden-green/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-garden-green" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Permit Tracking</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Organize permits, inspections, and compliance documents with automated tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-sunset-orange/10 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-sunset-orange" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Easy Sharing</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Share documents with customers, vendors, and team members through secure portals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

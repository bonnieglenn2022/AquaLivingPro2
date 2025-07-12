import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Waves, 
  Building, 
  Calculator, 
  Calendar, 
  FileText, 
  Users,
  ChevronRight,
  CheckCircle
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pool-blue to-ocean-teal rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AquaLiving Pro</h1>
              <p className="text-sm text-slate-500">Pool & Outdoor Living</p>
            </div>
          </div>
          <Button onClick={handleLogin} className="bg-pool-blue hover:bg-pool-blue/90">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            The Complete Solution for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pool-blue to-ocean-teal">
              Pool & Outdoor Living Builders
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Streamline your pool construction business with industry-specific project management, 
            CRM, estimating, and job costing - all in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleLogin}
              size="lg" 
              className="bg-pool-blue hover:bg-pool-blue/90 text-lg px-8 py-3"
            >
              Get Started Today
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything You Need to Build Better
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Purpose-built for pool and outdoor living contractors with features 
              that understand your unique workflow and challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 border-slate-100 hover:border-pool-blue/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-pool-blue/10 rounded-lg flex items-center justify-center mb-4">
                  <Building className="w-6 h-6 text-pool-blue" />
                </div>
                <CardTitle>Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Track every phase from excavation to finishing with pool-specific milestones, 
                  equipment scheduling, and real-time progress monitoring.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-ocean-teal/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-ocean-teal/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-ocean-teal" />
                </div>
                <CardTitle>Pool CRM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Manage leads, customers, and vendors with industry-specific fields for 
                  pool specifications, outdoor living preferences, and follow-up workflows.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-sunset-orange/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-sunset-orange/10 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-sunset-orange" />
                </div>
                <CardTitle>Smart Estimating</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Generate accurate estimates for pools, spas, decks, and outdoor kitchens 
                  with pre-built templates and equipment cost databases.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-garden-green/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-garden-green/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-garden-green" />
                </div>
                <CardTitle>Advanced Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Coordinate complex pool construction phases with weather-dependent scheduling, 
                  crew management, and equipment delivery tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-sand-yellow/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-sand-yellow/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-sand-yellow" />
                </div>
                <CardTitle>Document Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Store permits, designs, inspections, and progress photos with powerful 
                  markup tools and automated compliance tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100 hover:border-coral-red/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-coral-red/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-coral-red" />
                </div>
                <CardTitle>Job Costing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Track actual costs against budgets with pool equipment pricing, 
                  labor rates, and material costs for better profitability insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Built by Pool Professionals, for Pool Professionals
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Unlike generic construction software, AquaLiving Pro understands the unique 
                challenges of pool and outdoor living construction. From excavation permits 
                to equipment commissioning, every feature is designed for your workflow.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-garden-green" />
                  <span className="text-slate-700">Pool-specific project phases and milestones</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-garden-green" />
                  <span className="text-slate-700">Equipment and material cost databases</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-garden-green" />
                  <span className="text-slate-700">Weather-dependent scheduling tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-garden-green" />
                  <span className="text-slate-700">Customer portal for progress updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-garden-green" />
                  <span className="text-slate-700">Integrated vendor management for suppliers</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="text-3xl font-bold text-pool-blue mb-2">95%</div>
                  <div className="text-sm text-slate-600">Project completion accuracy</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="text-3xl font-bold text-garden-green mb-2">40%</div>
                  <div className="text-sm text-slate-600">Faster estimate creation</div>
                </div>
              </div>
              <div className="space-y-6 pt-12">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="text-3xl font-bold text-sunset-orange mb-2">25%</div>
                  <div className="text-sm text-slate-600">Increase in profitability</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="text-3xl font-bold text-ocean-teal mb-2">60%</div>
                  <div className="text-sm text-slate-600">Reduction in admin time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-pool-blue to-ocean-teal">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Pool Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of pool and outdoor living contractors who have streamlined 
            their operations and increased profitability with AquaLiving Pro.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-white text-pool-blue hover:bg-slate-100 text-lg px-8 py-3"
          >
            Start Your Free Trial
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-slate-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-pool-blue to-ocean-teal rounded-lg flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">AquaLiving Pro</span>
          </div>
          <p className="text-slate-400">
            © 2025 AquaLiving Pro. The complete project management solution for pool & outdoor living builders.
          </p>
        </div>
      </footer>
    </div>
  );
}

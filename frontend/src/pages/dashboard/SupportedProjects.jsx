import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ExternalLink, MessageSquare, Download, Package } from 'lucide-react';
import { Button, Card, Input, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { backerData } from '../../mockData';

export function SupportedProjects() {
  // Extended mock data for this view
  const supportedProjects = [
    ...backerData.activeCampaigns.map(c => ({ ...c, status: 'active', fulfillmentStatus: 'In Progress' })),
    {
      id: 101,
      title: "Community Clean Water Initiative",
      creator: "WaterAid Nepal",
      amountBacked: 2500,
      progress: 100,
      daysLeft: 0,
      image: "https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&q=80&w=300",
      status: 'completed',
      fulfillmentStatus: 'Delivered',
      rewardTier: "Community Supporter",
      backedDate: "2023-11-15"
    },
    {
      id: 102,
      title: "Traditional Art Documentary",
      creator: "Heritage Filmmakers",
      amountBacked: 5000,
      progress: 100,
      daysLeft: 0,
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=300",
      status: 'completed',
      fulfillmentStatus: 'Shipped',
      rewardTier: "Digital Download + Credits",
      backedDate: "2023-10-01"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supported Projects</h1>
          <p className="text-slate-500">Track the progress and rewards of projects you've backed</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search projects..." className="pl-9" />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-6 w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1 sm:flex-none px-6">All Projects</TabsTrigger>
          <TabsTrigger value="active" className="flex-1 sm:flex-none px-6">Active</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 sm:flex-none px-6">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {supportedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-6">
          {supportedProjects.filter(p => p.status === 'active').map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {supportedProjects.filter(p => p.status === 'completed').map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <Card className="p-6 border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 h-32 shrink-0 rounded-lg overflow-hidden bg-slate-100 relative">
          <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
          {project.status === 'completed' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge className="bg-green-500 text-white border-none">Successful</Badge>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900 hover:text-sky-600 transition-colors">
                  <Link to={`/campaigns/${project.id}`}>{project.title}</Link>
                </h3>
                <p className="text-sm text-slate-500">by {project.creator}</p>
              </div>
              <Badge variant="outline" className={`
                ${project.fulfillmentStatus === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' : 
                  project.fulfillmentStatus === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                  'bg-slate-50 text-slate-700 border-slate-200'}
              `}>
                <Package className="w-3 h-3 mr-1" /> {project.fulfillmentStatus || 'In Progress'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 mb-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Backed Amount</div>
                <div className="font-bold text-slate-900">Rs. {project.amountBacked.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Reward Tier</div>
                <div className="font-medium text-slate-900 text-sm truncate" title={project.rewardTier || "Early Bird Special"}>
                  {project.rewardTier || "Early Bird Special"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Backed Date</div>
                <div className="font-medium text-slate-900 text-sm">{project.backedDate || "2024-03-15"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Status</div>
                <div className="font-medium text-slate-900 text-sm">{project.progress}% Funded</div>
              </div>
            </div>
          </div>

          {project.status === 'active' && (
            <div className="space-y-2">
              <Progress value={project.progress} className="h-2" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{project.daysLeft} days left</span>
                <span>Goal reached!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3 justify-end">
        <Button variant="ghost" size="sm" className="text-slate-600">
          <Download className="w-4 h-4 mr-2" /> Receipt
        </Button>
        <Button variant="outline" size="sm">
          <MessageSquare className="w-4 h-4 mr-2" /> Message Creator
        </Button>
        <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
          <ExternalLink className="w-4 h-4 mr-2" /> View Campaign
        </Button>
      </div>
    </Card>
  );
}

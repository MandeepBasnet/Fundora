import React from 'react';
import { CheckCircle2, XCircle, Eye, Clock, Calendar, FileText, Download } from 'lucide-react';
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';

export function CampaignQueue() {
  // Mock data for pending campaigns
  const pendingCampaigns = [
    {
      id: 101,
      title: "Community Library Project",
      creator: "Saraswati School",
      category: "Education",
      goal: 200000,
      submitted: "2024-03-21",
      image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=300"
    },
    {
      id: 102,
      title: "Urban Rooftop Gardens",
      creator: "Kathmandu Green",
      category: "Environment",
      goal: 150000,
      submitted: "2024-03-20",
      image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=300"
    },
    {
      id: 103,
      title: "Traditional Music Preservation",
      creator: "Folk Nepal",
      category: "Art & Culture",
      goal: 300000,
      submitted: "2024-03-19",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=300"
    }
  ];

  // Mock data for pending milestones
  const pendingMilestones = [
    {
      id: 201,
      campaign: "Smart Solar Backpack",
      creator: "TechFarm Nepal",
      milestone: "Prototype Development",
      amount: 12500,
      submitted: "2024-03-22",
      proofType: "Video + Documents"
    },
    {
      id: 202,
      campaign: "Eco-Friendly Bricks",
      creator: "Green Build",
      milestone: "Machinery Acquisition",
      amount: 50000,
      submitted: "2024-03-21",
      proofType: "Invoice + Photos"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approvals & Reviews</h1>
          <p className="text-slate-500">Manage campaign submissions and milestone proofs</p>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="campaigns" className="px-6">Campaigns <Badge className="ml-2 bg-blue-100 text-blue-700 border-none">3</Badge></TabsTrigger>
          <TabsTrigger value="milestones" className="px-6">Milestones <Badge className="ml-2 bg-orange-100 text-orange-700 border-none">2</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card className="border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Campaign</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Goal</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={campaign.image} alt="" className="w-10 h-10 rounded object-cover bg-slate-200" />
                          <div>
                            <div className="font-medium text-slate-900">{campaign.title}</div>
                            <div className="text-xs text-slate-500">by {campaign.creator}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">{campaign.category}</Badge>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        Rs. {campaign.goal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {campaign.submitted}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card className="border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Campaign / Milestone</th>
                    <th className="px-6 py-4">Release Amount</th>
                    <th className="px-6 py-4">Proof Type</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingMilestones.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{item.campaign}</div>
                          <div className="text-xs text-blue-600 font-medium">{item.milestone}</div>
                          <div className="text-xs text-slate-500">by {item.creator}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-green-600">
                        Rs. {item.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="flex w-fit items-center gap-1">
                          <FileText className="w-3 h-3" /> {item.proofType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.submitted}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600" title="View Proof">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Approve Release">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

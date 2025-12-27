import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Eye, MoreVertical, Filter, Search, Flag, ShieldAlert, X, MessageSquare, User, Ban
} from 'lucide-react';
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Avatar } from '../../components/ui';

export function Moderation() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Mock Data for Moderation Queue
  const campaignQueue = [
    { id: 1, title: "Eco-Friendly Water Purifier", creator: "GreenTech Solutions", date: "2024-10-24", status: "Pending", risk: "Low", category: "Technology" },
    { id: 2, title: "Community Art Center", creator: "Sarah Jenkins", date: "2024-10-23", status: "Pending", risk: "Medium", category: "Community" },
    { id: 3, title: "Crypto Investment Bot", creator: "Fast Money LLC", date: "2024-10-22", status: "Flagged", risk: "High", category: "Finance" },
  ];

  const reportedContent = [
    { id: 101, type: "Campaign", title: "Solar Powered Backpack", reporter: "User123", reason: "Misleading Claims", date: "2024-10-25", status: "Open", description: "The creator claims 100% efficiency which is scientifically impossible." },
    { id: 102, type: "Comment", title: "Re: Project Updates", reporter: "Backer99", reason: "Harassment", date: "2024-10-24", status: "Investigating", description: "This user is repeatedly posting abusive comments." },
    { id: 103, type: "User", title: "John Doe", reporter: "Admin", reason: "Suspicious Activity", date: "2024-10-23", status: "Resolved", description: "Multiple failed login attempts from different locations." },
  ];

  const handleOpenReview = (report) => {
    setSelectedReport(report);
    setShowReviewModal(true);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Moderation Center</h1>
          <p className="text-slate-500">Review campaigns and manage reported content.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
          <Button variant="outline"><Search className="w-4 h-4 mr-2" /> Search</Button>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-6">
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Campaign Review <Badge className="ml-2 bg-blue-100 text-blue-700 border-none">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
            Reported Content <Badge className="ml-2 bg-red-100 text-red-700 border-none">3</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Campaign Details</th>
                    <th className="px-6 py-4">Submission Date</th>
                    <th className="px-6 py-4">Risk Level</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaignQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-slate-500 text-xs">by {item.creator} • {item.category}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.date}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`
                          ${item.risk === 'High' ? 'border-red-200 bg-red-50 text-red-700' : 
                            item.risk === 'Medium' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                            'border-green-200 bg-green-50 text-green-700'}
                        `}>
                          {item.risk} Risk
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:bg-green-50">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
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

        <TabsContent value="reports">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Reported Item</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Reporter</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportedContent.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${item.type === 'Campaign' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                            {item.type === 'Campaign' ? <ShieldAlert className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.title}</div>
                            <div className="text-slate-500 text-xs">{item.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-full">
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.reporter}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">{item.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => handleOpenReview(item)}>Review</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Review Modal */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" /> Review Report #{selectedReport.id}
              </h2>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Report Details</h3>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-red-800 font-medium">Reason:</span>
                        <span className="text-sm text-red-900 font-bold">{selectedReport.reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-800 font-medium">Reporter:</span>
                        <span className="text-sm text-red-900">{selectedReport.reporter}</span>
                      </div>
                      <div className="pt-2 border-t border-red-200">
                        <span className="text-xs text-red-800 font-medium block mb-1">Description:</span>
                        <p className="text-sm text-red-900 italic">"{selectedReport.description}"</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Content Preview</h3>
                    <Card className="p-4 border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-3 mb-3">
                         {selectedReport.type === 'Campaign' ? <ShieldAlert className="w-5 h-5 text-blue-600" /> : <MessageSquare className="w-5 h-5 text-slate-600" />}
                         <span className="font-bold text-slate-900">{selectedReport.title}</span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {selectedReport.type === 'Campaign' 
                          ? "This is a preview of the campaign content that was reported..." 
                          : "This is the comment content that was reported..."}
                      </p>
                      <Button variant="link" className="px-0 text-blue-600 h-auto mt-2 text-xs">View Full Content</Button>
                    </Card>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Resolution Actions</h3>
                  
                  <div className="space-y-3">
                    <button className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-full group-hover:bg-green-200">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Dismiss Report</div>
                          <div className="text-xs text-slate-500">Content is safe, false alarm</div>
                        </div>
                      </div>
                    </button>

                    <button className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-full group-hover:bg-amber-200">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Issue Warning</div>
                          <div className="text-xs text-slate-500">Notify user about violation</div>
                        </div>
                      </div>
                    </button>

                    <button className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-full group-hover:bg-red-200">
                          <Ban className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Suspend / Delete</div>
                          <div className="text-xs text-slate-500">Remove content or ban user</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Internal Notes</label>
                    <textarea 
                      className="w-full p-3 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add notes for other moderators..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>Cancel</Button>
              <Button className="bg-slate-900 text-white hover:bg-slate-800">Save Resolution</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

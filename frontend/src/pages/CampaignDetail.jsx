import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, Share2, PlayCircle, ExternalLink, ShieldCheck, Wallet, CheckCircle2, Flag, MapPin, Clock, Users, MessageCircle, X, AlertTriangle
} from 'lucide-react';
import { Button, Card, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent, Avatar, Input } from '../components/ui';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { MilestoneTimeline } from '../components/MilestoneTimeline';
import { RewardTier } from '../components/RewardTier';
import { campaignData } from '../mockData';

export function CampaignDetail() {
  const [selectedReward, setSelectedReward] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  
  const percentageFunded = Math.round((campaignData.raised / campaignData.goal) * 100);

  const handleBackProject = () => {
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* 1. Header Section: Title & Blurb (Kickstarter Style: Top Center) */}
      <div className="bg-white pt-8 md:pt-12 pb-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{campaignData.title}</h1>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">{campaignData.description || "A revolutionary way to help local farmers using smart technology to increase yields and sustainability."}</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
            {/* Left Column: Media (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
               <div className="aspect-video bg-black rounded-xl overflow-hidden relative group shadow-md">
                <ImageWithFallback 
                  src={campaignData.image}
                  alt={campaignData.title}
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-100 pb-4">
                 <MapPin className="w-4 h-4" /> {campaignData.location}
                 <span className="mx-2">•</span>
                 <span className="font-medium text-slate-900">{campaignData.category}</span>
              </div>
            </div>

            {/* Right Column: Stats & Actions (4 cols) */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wide mb-1">Project We Love</h3>
                <p className="text-blue-700 text-xs">This project has been featured by our editorial team.</p>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-sky-600" style={{ width: `${Math.min(percentageFunded, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-baseline text-sky-600 font-bold">
                    <span>{percentageFunded}% funded</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-3xl font-bold text-slate-900">Rs. {campaignData.raised.toLocaleString()}</span>
                  <span className="block text-slate-500 text-sm">pledged of Rs. {campaignData.goal.toLocaleString()} goal</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-3xl font-bold text-slate-900">{campaignData.backers}</span>
                  <span className="block text-slate-500 text-sm">backers</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-3xl font-bold text-slate-900">{campaignData.daysLeft}</span>
                  <span className="block text-slate-500 text-sm">days to go</span>
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-sm shadow-sm transition-all"
                  onClick={handleBackProject}
                >
                  Back this project
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-sm border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-medium">
                    <Heart className="w-4 h-4 mr-2" /> Remind me
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-sm border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-medium">
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                  All or nothing. This project will only be funded if it reaches its goal by {new Date().toLocaleDateString()}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (Sticky-ish) */}
      <div className="border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="story" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent space-x-8 overflow-x-auto">
              <TabsTrigger value="story" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-sky-600 text-slate-600 font-medium text-sm px-4 py-5 bg-transparent shadow-none whitespace-nowrap transition-colors hover:text-sky-600">
                Campaign
              </TabsTrigger>
              <TabsTrigger value="milestones" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-sky-600 text-slate-600 font-medium text-sm px-4 py-5 bg-transparent shadow-none whitespace-nowrap transition-colors hover:text-sky-600">
                Milestones & Evidence
              </TabsTrigger>
              <TabsTrigger value="updates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-sky-600 text-slate-600 font-medium text-sm px-4 py-5 bg-transparent shadow-none whitespace-nowrap transition-colors hover:text-sky-600">
                Updates <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">3</span>
              </TabsTrigger>
              <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-sky-600 text-slate-600 font-medium text-sm px-4 py-5 bg-transparent shadow-none whitespace-nowrap transition-colors hover:text-sky-600">
                Comments <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">12</span>
              </TabsTrigger>
            </TabsList>

            {/* 3. Main Content Grid */}
            <div className="grid lg:grid-cols-12 gap-12 py-12 text-left">
              {/* Left Content Column (8 cols) */}
              <div className="lg:col-span-8">
                <TabsContent value="story" className="mt-0 animate-in fade-in-50">
                  <div className="prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-img:rounded-xl">
                    <h3 className="text-2xl mb-4">About the Project</h3>
                    <p className="text-lg leading-relaxed mb-6">{campaignData.story}</p>
                    
                    <div className="my-10 p-6 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
                      <ShieldCheck className="w-10 h-10 text-sky-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Fundora Verified</h4>
                        <p className="text-sm text-slate-600">This project has passed our rigorous verification process. Milestones are tracked and funds are released in stages.</p>
                      </div>
                    </div>
                    
                    <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-6">
                      [Additional Project Images/Content]
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="milestones" className="mt-0 animate-in fade-in-50">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-900">Project Roadmap</h2>
                      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">On Track</Badge>
                    </div>
                    
                    <Card className="p-6 border-slate-200 bg-slate-50/50">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-sky-600" />
                        Verified Evidence
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="aspect-square bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group">
                          <ExternalLink className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-2" />
                          <span className="text-xs font-medium text-slate-600">Prototype Demo</span>
                        </div>
                        <div className="aspect-square bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group">
                          <ExternalLink className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-2" />
                          <span className="text-xs font-medium text-slate-600">Field Report</span>
                        </div>
                      </div>
                    </Card>

                    <MilestoneTimeline milestones={campaignData.milestones} />
                  </div>
                </TabsContent>

                <TabsContent value="updates" className="mt-0 animate-in fade-in-50">
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-6 hover:border-blue-200 transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-500">Update #{4-i}</span>
                          <span className="text-sm text-slate-400">Oct {10 + i}, 2024</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">Production Phase {i} Initiated</h3>
                        <p className="text-slate-600 line-clamp-2">We are happy to report that the initial batch of sensors has arrived at our warehouse and testing has begun...</p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-sm text-slate-500">
                          <span className="hover:text-sky-600">12 Comments</span>
                          <span className="hover:text-sky-600">45 Likes</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="mt-0 animate-in fade-in-50">
                  <div className="bg-slate-50 p-6 rounded-xl mb-8">
                    <h3 className="font-bold text-slate-900 mb-4">Post a comment</h3>
                    <textarea 
                      className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none mb-3"
                      placeholder="Ask a question or cheer the creator on..."
                    ></textarea>
                    <div className="flex justify-end">
                      <Button className="bg-sky-600 hover:bg-sky-700 text-white">Post Comment</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-4 pb-6 border-b border-slate-100 last:border-0">
                        <Avatar fallback={`U${i}`} className="bg-slate-200 text-slate-600" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">Backer Name {i}</span>
                            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">Super Backer</Badge>
                            <span className="text-xs text-slate-400">• 2 days ago</span>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">This project looks amazing! I've been waiting for a solution like this for my farm. Can you confirm the battery life?</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>

              {/* Right Sidebar (4 cols) */}
              <div className="lg:col-span-4 space-y-8">
                {/* Creator Card */}
                <div className="border-b border-slate-200 pb-8">
                  <h4 className="font-bold text-slate-900 mb-4">Created by</h4>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16" fallback="TF" />
                    <div>
                      <div className="font-bold text-lg text-slate-900">{campaignData.creator}</div>
                      <div className="text-sm text-slate-500">3 Campaigns • Chitwan, Nepal</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">We are a team of agricultural engineers and software developers passionate about modernizing farming.</p>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-sm" asChild>
                      <Link to="/messages">
                        <MessageCircle className="w-4 h-4 mr-2" /> Message
                      </Link>
                    </Button>
                    <Button variant="link" className="flex-1 text-sky-600 font-bold hover:text-blue-700 hover:no-underline text-sm">
                      See more projects
                    </Button>
                  </div>
                </div>

                {/* Support / Rewards */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-6">Support</h4>
                  <div className="space-y-6">
                    {campaignData.rewards.map((reward) => (
                      <RewardTier 
                        key={reward.id} 
                        reward={reward}
                        selected={selectedReward === reward.id}
                        onSelect={() => {
                          setSelectedReward(reward.id);
                          handleBackProject();
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Payment Options */}
                <Card className="p-4 bg-slate-50 border-slate-200">
                  <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-500" />
                    Secure Payment
                  </h4>
                  <div className="flex gap-2">
                    <div className="h-8 w-12 bg-white border border-slate-200 rounded flex items-center justify-center">
                      <span className="text-[10px] font-bold text-sky-600">eSewa</span>
                    </div>
                    <div className="h-8 w-12 bg-white border border-slate-200 rounded flex items-center justify-center">
                      <span className="text-[10px] font-bold text-purple-600">Khalti</span>
                    </div>
                  </div>
                </Card>

                {/* Flag Campaign */}
                <div className="pt-8 border-t border-slate-200">
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors w-full justify-center"
                  >
                    <Flag className="w-4 h-4" />
                    Report this project
                  </button>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-white shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Back this project</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Pledge Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rs.</span>
                  <Input 
                    type="number" 
                    defaultValue={selectedReward ? campaignData.rewards.find(r => r.id === selectedReward)?.amount : 100} 
                    className="pl-10 text-lg font-bold"
                  />
                </div>
                <p className="text-xs text-slate-500">Minimum pledge is Rs. 100</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setPaymentMethod('esewa')}
                    className={`border rounded-lg p-4 cursor-pointer flex items-center justify-center gap-2 ${paymentMethod === 'esewa' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="font-bold text-green-600">eSewa</span>
                  </div>
                  <div 
                    onClick={() => setPaymentMethod('khalti')}
                    className={`border rounded-lg p-4 cursor-pointer flex items-center justify-center gap-2 ${paymentMethod === 'khalti' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="font-bold text-purple-600">Khalti</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                <p>You will be redirected to {paymentMethod === 'esewa' ? 'eSewa' : 'Khalti'} to complete your payment securely.</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 px-8">Continue to Payment</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-white shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Report Project
              </h2>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-600">
                Please let us know why you are reporting this project. Our moderation team will review your report within 24 hours.
              </p>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Reason</label>
                <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <option>Fraud or Scam</option>
                  <option>Inappropriate Content</option>
                  <option>Copyright Violation</option>
                  <option>Misleading Information</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Please provide more details..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReportModal(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white">Submit Report</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

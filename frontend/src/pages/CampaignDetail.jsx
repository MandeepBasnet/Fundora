import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Share2, PlayCircle, ExternalLink, ShieldCheck, Wallet, CheckCircle2, Flag, MapPin, Clock, Users, MessageCircle, X, AlertTriangle
} from 'lucide-react';
import { Button, Card, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent, Avatar, Input } from '../components/ui';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { MilestoneTimeline } from '../components/MilestoneTimeline';
import { RewardTier } from '../components/RewardTier';
import CommentSection from '../components/campaigns/CommentSection';
import UpdateFeed from '../components/campaigns/UpdateFeed';
import { ReportCampaignModal } from '../components/campaigns/ReportCampaignModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedReward, setSelectedReward] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  const [pledgeAmount, setPledgeAmount] = useState(100);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const response = await api.get(`/campaigns/${id}`);
        
        // Transform API data to UI format if needed
        const c = response.data;
        const mappedCampaign = {
          ...c,
          id: c._id,
          image: c.coverImage || (c.images && c.images[0]?.url) || 'https://via.placeholder.com/800x450',
          raised: c.currentAmount,
          goal: c.fundingGoal,
          backers: c.backerCount,
          transactions: c.transactionCount,
          daysLeft: c.daysRemaining,
          story: c.description, // Mapping description to story for the tab
          fundingType: c.fundingType,
          rewards: c.rewardTiers?.map(r => ({ 
            ...r, 
            id: r._id,
            available: r.isAvailable,
            limited: r.quantityLimit,
            backers: r.quantityClaimed || 0
          })) || [], // Ensure ID mapping
          creatorName: c.creator?.name || 'Unknown Creator',
          creatorAvatar: c.creator?.profile?.avatar,
          location: c.creator?.profile?.address?.city || 'Nepal', // Fallback
          isBacked: c.isBacked || false,
          userBackedAmount: c.userBackedAmount || 0,
          status: c.status,
          rejectionReason: c.rejectionReason || null
        };
        
        setCampaign(mappedCampaign);
      } catch (err) {
        console.error('Error fetching campaign details:', err);
        setError('Failed to load campaign details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampaignData();
    }
  }, [id]);

  const handleBackProject = () => {
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Something went wrong</h2>
        <p className="text-slate-600 mb-6">{error || 'Campaign not found'}</p>
        <Link to="/campaigns">
          <Button>Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  const percentageFunded = Math.round((campaign.raised / campaign.goal) * 100);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Termination Notice */}
      {campaign.status === 'terminated' && (
        <div className="bg-red-50 border-b-2 border-red-500 p-6 flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-red-800 mb-1">Campaign Terminated</h2>
            <p className="text-red-700 font-medium">
              This campaign has been terminated by Trust & Safety due to a violation of our terms of service.
              All backers have been automatically refunded.
            </p>
            {campaign.rejectionReason && (
              <div className="mt-3 bg-white/60 p-3 rounded border border-red-200 text-red-800 text-sm">
                <strong>Official Reason:</strong> {campaign.rejectionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="bg-white pt-8 md:pt-12 pb-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{campaign.title}</h1>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">{campaign.shortDescription || campaign.title}</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
            {/* Left Column: Media (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Main Media Display */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden relative group shadow-md">
                {(() => {
                  const allMedia = [
                    ...(campaign.images || []).map(img => ({ type: 'image', url: img.url || img })),
                    ...(campaign.video?.url ? [{ type: 'video', url: campaign.video.url }] : [])
                  ];
                  const currentMedia = allMedia[selectedMediaIndex] || allMedia[0];
                  
                  if (!currentMedia) {
                    return (
                      <ImageWithFallback 
                        src={campaign.image}
                        alt={campaign.title}
                        className="w-full h-full object-cover opacity-90"
                      />
                    );
                  }
                  
                  if (currentMedia.type === 'video') {
                    return (
                      <video 
                        src={currentMedia.url} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  
                  return (
                    <ImageWithFallback 
                      src={currentMedia.url}
                      alt={campaign.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                  );
                })()}
              </div>

              {/* Thumbnail Gallery */}
              {(() => {
                const allMedia = [
                  ...(campaign.images || []).map(img => ({ type: 'image', url: img.url || img })),
                  ...(campaign.video?.url ? [{ type: 'video', url: campaign.video.url }] : [])
                ];
                
                if (allMedia.length > 1) {
                  return (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {allMedia.map((media, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedMediaIndex(idx)}
                          className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedMediaIndex === idx 
                              ? 'border-sky-600 ring-2 ring-sky-200' 
                              : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          {media.type === 'video' ? (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                              <PlayCircle className="w-6 h-6 text-white" />
                            </div>
                          ) : (
                            <img 
                              src={media.url} 
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-100 pb-4">
                 <MapPin className="w-4 h-4" /> {campaign.location}
                 <span className="mx-2">•</span>
                 <span className="font-medium text-slate-900">{campaign.category}</span>
                 {campaign.fundingType && (
                   <>
                     <span className="mx-2">•</span>
                     <Badge variant="secondary" className="bg-sky-50 text-sky-700 hover:bg-sky-100 uppercase text-xs tracking-wider">
                       {campaign.fundingType.replace('-', ' ')}
                     </Badge>
                   </>
                 )}
              </div>
            </div>

            {/* Right Column: Stats & Actions (4 cols) */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wide mb-1">Project We Love</h3>
                <p className="text-blue-700 text-xs">This project has been featured by our editorial team.</p>
              </div>

              <div className="space-y-6 mb-8">
                {campaign.isBacked && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-green-700">You backed this project!</span>
                        </div>
                        <p className="text-sm text-green-800">
                            You have pledged <span className="font-bold">Rs. {campaign.userBackedAmount.toLocaleString()}</span> so far.
                        </p>
                    </div>
                )}

                <div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-sky-600" style={{ width: `${Math.min(percentageFunded, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-baseline text-sky-600 font-bold">
                    <span>{percentageFunded}% funded</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-3xl font-bold text-slate-900">Rs. {campaign.raised.toLocaleString()}</span>
                  <span className="block text-slate-500 text-sm">total funded of Rs. {campaign.goal.toLocaleString()} goal</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-3xl font-bold text-slate-900">{campaign.backers}</span>
                  <span className="block text-slate-500 text-sm">backers ({campaign.transactions || 0} transaction{(campaign.transactions || 0) === 1 ? '' : 's'})</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-3xl font-bold text-slate-900">{campaign.daysLeft}</span>
                  <span className="block text-slate-500 text-sm">days to go</span>
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-sm shadow-sm transition-all"
                  onClick={handleBackProject}
                >
                  {campaign.isBacked ? "Back this project again" : "Back this project"}
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
                  All or nothing. This project will only be funded if it reaches its goal by {new Date(campaign.endDate).toLocaleDateString()}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
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
              <TabsTrigger value="updates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 text-slate-600 font-medium text-sm px-4 py-5 bg-transparent shadow-none whitespace-nowrap transition-colors hover:text-sky-600">
                Updates
              </TabsTrigger>
              <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-sky-600 text-slate-600 font-medium text-sm px-4 py-5 bg-transparent shadow-none whitespace-nowrap transition-colors hover:text-sky-600">
                Comments
              </TabsTrigger>
            </TabsList>

            {/* 3. Main Content Grid */}
            <div className="grid lg:grid-cols-12 gap-12 py-12 text-left">
              {/* Left Content Column (8 cols) */}
              <div className="lg:col-span-8">
                <TabsContent value="story" className="mt-0 animate-in fade-in-50">
                  <div className="prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-img:rounded-xl">
                    <h3 className="text-2xl mb-4">About the Project</h3>
                    <p className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">{campaign.story}</p>
                    
                    <div className="my-10 p-6 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
                      <ShieldCheck className="w-10 h-10 text-sky-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Fundora Verified</h4>
                        <p className="text-sm text-slate-600">This project has passed our rigorous verification process. Milestones are tracked and funds are released in stages.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="milestones" className="mt-0 animate-in fade-in-50">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-900">Project Roadmap</h2>
                      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">On Track</Badge>
                    </div>
                    
                    {campaign.milestones && campaign.milestones.length > 0 ? (
                      <MilestoneTimeline milestones={campaign.milestones} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="bg-white p-4 rounded-full mb-4 shadow-sm border border-slate-100">
                          <Flag className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Milestones Yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                          The creator hasn't published any milestones or evidence for this campaign yet. Check back later for updates on their progress.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="updates" className="mt-0 animate-in fade-in-50">
                  <UpdateFeed campaignId={campaign.id} creatorId={campaign.creator?._id} />
                </TabsContent>

                <TabsContent value="comments" className="mt-0 animate-in fade-in-50">
                  <CommentSection campaignId={campaign.id} creatorId={campaign.creator?._id} />
                </TabsContent>
              </div>

              {/* Right Sidebar (4 cols) */}
              <div className="lg:col-span-4 space-y-8">
                {/* Creator Card */}
                <div className="border-b border-slate-200 pb-8">
                  <h4 className="font-bold text-slate-900 mb-4">Created by</h4>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16" src={campaign.creatorAvatar} fallback={campaign.creatorName.charAt(0)} />
                    <div>
                      <div className="font-bold text-lg text-slate-900">{campaign.creatorName}</div>
                      <div className="text-sm text-slate-500">3 Campaigns • {campaign.location}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">We are a team of agricultural engineers and software developers passionate about modernizing farming.</p>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                       {campaign.isBacked ? (
                         <Button variant="outline" className="flex-1 text-sm bg-white hover:bg-slate-50 border-sky-200 text-sky-700" onClick={async () => {
                            try {
                              const creatorId = campaign.creator?._id || campaign.creator;
                              const res = await api.post('/messages/initiate', { campaignId: campaign.id, creatorId });
                              if (res.data.success) {
                                navigate(`/messages/${res.data.data._id}`);
                              }
                            } catch (e) { console.error('Error initiating chat', e); }
                         }}>
                           <MessageCircle className="w-4 h-4 mr-2" /> Message Creator
                         </Button>
                       ) : (
                         <Button variant="outline" disabled className="flex-1 text-sm opacity-50 cursor-not-allowed">
                           <MessageCircle className="w-4 h-4 mr-2" /> Message (Backers Only)
                         </Button>
                       )}
                      <Button variant="link" className="flex-1 text-sky-600 font-bold hover:text-blue-700 hover:no-underline text-sm">
                        See more projects
                      </Button>
                    </div>
                    {campaign.isBacked && (
                      <p className="text-center text-[10px] text-slate-400">
                        Typical response time: ~1 hour
                      </p>
                    )}
                  </div>
                </div>

                {/* Support / Rewards */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-6">Support</h4>
                  <div className="space-y-6">
                    {campaign.rewards.length > 0 ? campaign.rewards.map((reward) => (
                      <RewardTier 
                        key={reward.id} 
                        reward={reward}
                        selected={selectedReward === reward.id}
                        onSelect={() => {
                          setSelectedReward(reward.id);
                          handleBackProject();
                        }}
                      />
                    )) : (
                       <p className="text-sm text-slate-500">No specific reward tiers. You can just back the project!</p>
                    )}
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
                      <span className="text-[10px] font-bold text-green-600">eSewa</span>
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
                    defaultValue={selectedReward ? campaign.rewards.find(r => r.id === selectedReward)?.amount : 100} 
                    onChange={(e) => setPledgeAmount(e.target.value)}
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
              <Button 
                className="bg-blue-600 hover:bg-blue-700 px-8"
                onClick={() => {
                  navigate('/payment/select', { 
                    state: { 
                      campaign, 
                      initialAmount: pledgeAmount,
                      initialPaymentMethod: paymentMethod,
                      selectedRewardId: selectedReward
                    } 
                  });
                }}
              >
                Continue to Payment
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ReportCampaignModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        campaignId={campaign.id} 
      />
    </div>
  );
}

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ExternalLink, Clock } from 'lucide-react';
import { Button, Card, Input, Badge, Progress } from '../../components/ui';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export default function SavedCampaigns() {
  const [savedCampaigns, setSavedCampaigns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSavedCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/saved-campaigns');
      
      const formatted = res.data.map(c => {
          const progress = Math.min(100, Math.round((c.currentAmount / c.fundingGoal) * 100));

          return {
              id: c._id || c.id,
              title: c.title,
              creator: c.creator?.name || 'Unknown Creator',
              amountBacked: c.currentAmount || 0,
              goal: c.fundingGoal || 0,
              progress: progress,
              daysLeft: c.daysRemaining || 0,
              image: c.coverImage || c.images?.[0]?.url || 'https://placehold.co/600x400?text=No+Image',
              status: c.status,
              category: c.category || 'General',
          };
      });
      
      setSavedCampaigns(formatted);
    } catch (error) {
      console.error("Failed to fetch saved campaigns", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSavedCampaigns();
  }, []);

  const handleUnsave = async (campaignId) => {
    try {
      await api.post(`/users/save-campaign/${campaignId}`);
      toast.success('Campaign removed from saved lists');
      setSavedCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch(err) {
      toast.error('Failed to remove campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saved Campaigns</h1>
          <p className="text-slate-500">Projects you've explicitly saved to review later</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search saved..." className="pl-9" />
          </div>
        </div>
      </div>

      {savedCampaigns.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <Heart className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Saved Campaigns</h3>
          <p className="text-slate-500 mb-6">You haven't saved any campaigns yet. Browse and 'Like' campaigns to see them here.</p>
          <Link to="/campaigns">
            <Button className="bg-sky-600 hover:bg-sky-700 text-white">Browse Campaigns</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {savedCampaigns.map((project) => (
            <SavedCard 
              key={project.id} 
              project={project} 
              onUnsave={() => handleUnsave(project.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedCard({ project, onUnsave }) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 h-32 shrink-0 rounded-lg overflow-hidden bg-slate-100 relative group cursor-pointer" onClick={() => navigate(`/campaigns/${project.id}`)}>
          <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute top-2 right-2">
            <Badge className="bg-white/90 text-slate-800 border-none shadow-sm backdrop-blur-sm">
              {project.category}
            </Badge>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2 gap-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900 hover:text-sky-600 transition-colors">
                  <Link to={`/campaigns/${project.id}`}>{project.title}</Link>
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 mb-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Funded</div>
                <div className="font-bold text-slate-900">Rs. {project.amountBacked.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Goal</div>
                <div className="font-medium text-slate-900 text-sm">
                  Rs. {project.goal.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Time Left</div>
                <div className="font-medium text-slate-900 text-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> {project.daysLeft} days
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Status</div>
                <div className="font-medium text-slate-900 text-sm">{project.status}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={project.progress} className="h-2" />
            <div className="flex justify-between text-xs text-slate-500">
              <span className="font-medium text-sky-600">{project.progress}% funded</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3 justify-end items-center">
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onUnsave}>
          <Heart className="w-4 h-4 mr-2 fill-current" /> Remove
        </Button>
        <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={() => navigate(`/campaigns/${project.id}`)}>
          <ExternalLink className="w-4 h-4 mr-2" /> View Campaign
        </Button>
      </div>
    </Card>
  );
}

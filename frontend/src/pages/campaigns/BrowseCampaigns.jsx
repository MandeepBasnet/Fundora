import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Button, Input, Card, Badge, Progress } from '../../components/ui';
import api from '../../services/api';

export function BrowseCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 6, total: 0, pages: 1 });
  
  // Filter states
  const [sortBy, setSortBy] = useState('trending'); // most-funded, trending, closing-soon, recently-added
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [fundingType, setFundingType] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, [debouncedSearch, sortBy, selectedCategories, fundingType, pagination.page, pagination.limit]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // Map sort options to backend
      let sortParam = 'newest';
      if (sortBy === 'trending') sortParam = 'most-backed';
      if (sortBy === 'most-funded') sortParam = 'most-funded';
      if (sortBy === 'closing-soon') sortParam = 'ending-soon';
      if (sortBy === 'recently-added') sortParam = 'newest';

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortParam,
        search: debouncedSearch,
        fundingType: fundingType === 'All Types' ? '' : fundingType,
      };

      // Support multiple categories? Backend mostly supports one query param for now or custom logic.
      // Since backend `campaignController` checks `if (category) query.category = category;`, it likely handles single string.
      // If we want multiple, we need backend changes. For now, let's assume single selection or just take the first one if multiple selected, 
      // or simplistic filtering. Let's just pass the first one for now or rely on client side if we fetched all? 
      // No, let's stick to simple single category filter for MVP if backend is simple.
      // Actually, let's allow "category" to be passed. If user selects multiple, maybe we just pick one?
      // Or let's update frontend UI to single select radio for category for simplicity, matching Funding Type.
      // Actually, let's stick to checkbox UI but only send one for now or send array if backend supported it.
      // The backend code I wrote supports `query.$or` for search but `query.category = category` for exact match.
      // I will join them by comma if backend handled it, but it doesn't.
      // I'll leave the UI as checkboxes but sending multiple might not work perfectly without backend update.
      // Let's just send the first selected category if any.
      if (selectedCategories.length > 0) {
        params.category = selectedCategories[0];
      }

      const response = await api.get('/campaigns', { params });
      setCampaigns(response.data.campaigns);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        return prev.filter(c => c !== category);
      } else {
        // Enforce single selection for now since backend is simple
        return [category]; 
      }
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to map DB campaign to UI format if needed
  // (Assuming backend returns compatible structure, but double check image fields etc)
  // Backend returns: _id, title, description, currentAmount, fundingGoal, backerCount, endDate, images[], category
  // UI expects: id, title, description, raised, goal, backers, daysLeft, image
  const mapCampaignToUI = (c) => ({
    id: c._id,
    title: c.title,
    description: c.shortDescription || c.description,
    raised: c.currentAmount,
    goal: c.fundingGoal,
    backers: c.backerCount,
    daysLeft: c.daysRemaining, // virtual field from backend
    image: c.coverImage || (c.images && c.images[0]?.url) || 'https://via.placeholder.com/600x400',
    category: c.category,
    progress: c.fundingProgress // virtual field
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Explore Campaigns</h1>
            <p className="text-slate-500">Discover projects that matter to you</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="Search campaigns..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>
            <Button variant="outline" className="lg:hidden" onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            </Button>
          </div>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="lg:hidden mb-6 space-y-4 animate-in slide-in-from-top-2">
            <Card className="p-4 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Categories
              </h3>
              <div className="space-y-2">
                {['Technology', 'Agriculture', 'Education', 'Health', 'Community', 'Art & Creative'].map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-sky-600 focus:ring-blue-500"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryChange(cat)}
                    />
                    <span className="text-slate-600">{cat}</span>
                  </label>
                ))}
              </div>
            </Card>
            <Card className="p-4 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">Funding Type</h3>
              <div className="space-y-2">
                {['All Types', 'reward-based', 'donation-based', 'milestone-based'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="fundingTypeMobile" 
                      className="border-slate-300 text-sky-600 focus:ring-blue-500" 
                      checked={fundingType === type || (type === 'All Types' && fundingType === '')}
                      onChange={() => {
                        setFundingType(type === 'All Types' ? '' : type);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                    />
                    <span className="text-slate-600 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        ) }

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="hidden lg:block space-y-6">
            <Card className="p-6 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Categories
              </h3>
              <div className="space-y-3">
                {['Technology', 'Agriculture', 'Education', 'Health', 'Community', 'Art & Creative'].map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-sky-600 focus:ring-blue-500" 
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryChange(cat)}
                    />
                    <span className="text-slate-600 group-hover:text-sky-600 transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Funding Type</h3>
              <div className="space-y-3">
                {['All Types', 'reward-based', 'donation-based', 'milestone-based'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="fundingType" 
                      className="border-slate-300 text-sky-600 focus:ring-blue-500"
                      checked={fundingType === type || (type === 'All Types' && fundingType === '')}
                      onChange={() => {
                        setFundingType(type === 'All Types' ? '' : type);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                    />
                    <span className="text-slate-600 group-hover:text-sky-600 transition-colors capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* Campaign Grid */}
          <div className="lg:col-span-3">
            {/* Sort & Items Per Page Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">{pagination.total} campaigns</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <select 
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="trending">Trending</option>
                    <option value="most-funded">Most Funded</option>
                    <option value="closing-soon">Closing Soon</option>
                    <option value="recently-added">Recently Added</option>
                  </select>
                </div>

                {/* Items Per Page */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Show:</span>
                  <select 
                    value={pagination.limit}
                    onChange={(e) => {
                      setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }));
                    }}
                    className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={18}>18</option>
                    <option value={24}>24</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Campaign Cards */}
            {loading ? (
               <div className="flex justify-center items-center py-20">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
               </div>
            ) : campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {campaigns.map(c => mapCampaignToUI(c)).map((campaign) => (
                  <Link to={`/campaigns/${campaign.id}`} key={campaign.id} className="group">
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow border-slate-200 cursor-pointer">
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={campaign.image} 
                          alt={campaign.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 backdrop-blur-sm shadow-sm">
                          {campaign.daysLeft} Days Left
                        </Badge>
                      </div>
                      <div className="p-5">
                        <div className="mb-3">
                          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">{campaign.category}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-sky-600 transition-colors">
                          {campaign.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                          {campaign.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="font-bold text-slate-900">Rs. {campaign.raised.toLocaleString()}</span>
                            <span className="text-slate-500">{campaign.progress}%</span>
                          </div>
                          <Progress value={campaign.progress} className="h-2" />
                          <div className="flex justify-between items-center pt-2 text-xs text-slate-500">
                            <span>{campaign.backers} Backers</span>
                            <span>Goal: Rs. {campaign.goal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No campaigns found matching your criteria.</p>
              </div>
            )}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-12 gap-4">
                <div className="text-sm text-slate-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  
                  {/* Simplified pagination for now */}
                  <div className="flex items-center px-4 text-sm text-slate-600">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  
                  <Button 
                    variant="outline"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Button, Input, Card, Badge, Progress } from '../../components/ui';
import { browseCampaigns } from '../../mockData';

export function BrowseCampaigns() {
  const [sortBy, setSortBy] = useState('trending'); // most-funded, trending, closing-soon, recently-added
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sorting logic
  const sortedCampaigns = useMemo(() => {
    let sorted = [...browseCampaigns];
    
    switch (sortBy) {
      case 'most-funded':
        sorted.sort((a, b) => b.raised - a.raised);
        break;
      case 'trending':
        sorted.sort((a, b) => b.trendingScore - a.trendingScore);
        break;
      case 'closing-soon':
        sorted.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
      case 'recently-added':
        sorted.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        break;
      default:
        break;
    }
    
    // Apply search filter
    if (searchQuery) {
      sorted = sorted.filter(campaign => 
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return sorted;
  }, [sortBy, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(sortedCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCampaigns = sortedCampaigns.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

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
                  setCurrentPage(1); // Reset to first page on search
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
                    <input type="checkbox" className="rounded border-slate-300 text-sky-600 focus:ring-blue-500" />
                    <span className="text-slate-600">{cat}</span>
                  </label>
                ))}
              </div>
            </Card>
            <Card className="p-4 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">Funding Type</h3>
              <div className="space-y-2">
                {['All Types', 'Reward-based', 'Donation-based', 'Milestone-based'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="fundingTypeMobile" className="border-slate-300 text-sky-600 focus:ring-blue-500" />
                    <span className="text-slate-600">{type}</span>
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
                    <input type="checkbox" className="rounded border-slate-300 text-sky-600 focus:ring-blue-500" />
                    <span className="text-slate-600 group-hover:text-sky-600 transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Funding Type</h3>
              <div className="space-y-3">
                {['All Types', 'Reward-based', 'Donation-based', 'Milestone-based'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="fundingType" className="border-slate-300 text-sky-600 focus:ring-blue-500" />
                    <span className="text-slate-600 group-hover:text-sky-600 transition-colors">{type}</span>
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
                <span className="text-sm text-slate-600">{sortedCampaigns.length} campaigns</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <select 
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
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
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
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
            {currentCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {currentCampaigns.map((campaign) => (
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
                            <span className="text-slate-500">{Math.round((campaign.raised/campaign.goal)*100)}%</span>
                          </div>
                          <Progress value={(campaign.raised/campaign.goal)*100} className="h-2" />
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
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-12 gap-4">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedCampaigns.length)} of {sortedCampaigns.length}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  {getPageNumbers().map((page, index) => 
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-slate-400">...</span>
                    ) : (
                      <Button 
                        key={page}
                        variant={currentPage === page ? "secondary" : "outline"}
                        className={currentPage === page ? "bg-sky-600 text-white hover:bg-sky-700" : ""}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                  
                  <Button 
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
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

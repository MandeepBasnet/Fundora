import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Wallet, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui';
import { ProjectCard } from '../components/ProjectCard';

export function HomePage() {
  const trendingProjects = [
    {
      id: 1,
      title: "Smart Agriculture IoT System for Nepali Farmers",
      creator: "TechFarm Nepal",
      image: "agriculture technology",
      goal: 500000,
      raised: 387500,
      backers: 156,
      daysLeft: 12,
      milestoneVerified: true,
      category: "Technology"
    },
    {
      id: 2,
      title: "Documentary: Preserving Traditional Nepali Art Forms",
      creator: "Heritage Filmmakers",
      image: "traditional nepal art",
      goal: 300000,
      raised: 245000,
      backers: 89,
      daysLeft: 8,
      milestoneVerified: true,
      category: "Film & Video"
    },
    {
      id: 3,
      title: "Clean Water Initiative for Rural Communities",
      creator: "WaterAid Nepal",
      image: "clean water community",
      goal: 750000,
      raised: 520000,
      backers: 234,
      daysLeft: 20,
      milestoneVerified: false,
      category: "Social Cause"
    },
    {
      id: 4,
      title: "Eco-Friendly Packaging Startup",
      creator: "GreenPack Nepal",
      image: "eco friendly packaging",
      goal: 400000,
      raised: 158000,
      backers: 67,
      daysLeft: 25,
      milestoneVerified: false,
      category: "Business"
    },
    {
      id: 5,
      title: "Mobile App for Local Artisan Marketplace",
      creator: "Kala Bazaar",
      image: "artisan marketplace mobile",
      goal: 600000,
      raised: 480000,
      backers: 145,
      daysLeft: 15,
      milestoneVerified: true,
      category: "Technology"
    },
    {
      id: 6,
      title: "Youth Coding Bootcamp in Kathmandu",
      creator: "Code Nepal",
      image: "coding bootcamp education",
      goal: 350000,
      raised: 295000,
      backers: 112,
      daysLeft: 10,
      milestoneVerified: false,
      category: "Education"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-20 mix-blend-overlay"></div>
        <div className="bg-gradient-to-r from-slate-900 via-blue-900/90 to-slate-900/80 absolute inset-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium mb-6 backdrop-blur-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>#1 Trusted Crowdfunding Platform in Nepal</span>
                </div>
                <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                  Empowering Nepali <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">Dreams & Innovations</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  Fund innovative projects with confidence through milestone-based releases. 
                  Your support, their success, guaranteed transparency.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/start-campaign">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-blue-50 text-base px-8 h-12 font-bold shadow-xl">
                    Start a Campaign
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/campaigns">
                  <Button size="lg" variant="outline" className="border-white/30 text-black hover:bg-white/10 hover:text-black text-base px-8 h-12 backdrop-blur-sm">
                    Explore Projects
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <span>Verified Creators</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span>Secure Payments (eSewa/Khalti)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">50Cr+</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Raised</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">120+</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Projects Funded</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">15K+</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Active Backers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">0%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Fraud Cases</div>
          </div>
        </div>
      </div>

      {/* Trust Features */}
      <section className="bg-white py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-blue-50/50 transition-colors group">
              <div className="bg-blue-100 p-4 rounded-2xl mb-6 text-sky-600 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Milestone Verification</h3>
              <p className="text-slate-600 leading-relaxed">Funds released only after verified project progress. We ensure creators deliver on their promises step-by-step.</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-blue-50/50 transition-colors group">
              <div className="bg-purple-100 p-4 rounded-2xl mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                <Wallet className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Local Payment Support</h3>
              <p className="text-slate-600 leading-relaxed">Seamlessly support projects using your favorite local payment methods including eSewa, Khalti, and bank transfers.</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-blue-50/50 transition-colors group">
              <div className="bg-green-100 p-4 rounded-2xl mb-6 text-green-600 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent Tracking</h3>
              <p className="text-slate-600 leading-relaxed">Get real-time updates on project milestones, fund usage, and impact. Know exactly where your money goes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Trending Campaigns</h2>
              <p className="text-slate-600 text-lg">Support the most exciting projects in Nepal</p>
            </div>
            <Link to="/campaigns" className="hidden sm:block">
              <Button variant="outline" className="gap-2">
                View All Projects <ArrowRight className="w-4 h-4"/>
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {trendingProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          
          <div className="mt-10 text-center sm:hidden">
            <Link to="/campaigns">
              <Button variant="outline" className="w-full">View All Projects</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Backers Trust Fundora Section */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Backers Trust Fundora</h2>
            <p className="text-gray-600">We've built a system that protects your investment through milestone-based releases.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Funds are Locked</h3>
              <p className="text-gray-600">Your contribution is held securely. It's not released to the creator all at once.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Milestone Verification</h3>
              <p className="text-gray-600">Creators must prove they completed a project stage before unlocking the next batch of funds.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Vetted</h3>
              <p className="text-gray-600">Flag suspicious campaigns. Our moderation team reviews alerts within 24 hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Ready to Bring Your Idea to Life?</h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join hundreds of successful Nepali creators who have raised funds and built communities on Fundora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/start-campaign">
              <Button size="lg" className="bg-sky-600 hover:bg-sky-700 text-white px-10 py-6 text-lg h-auto shadow-xl">
                Start Your Campaign
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-100 px-10 py-6 text-lg h-auto">
              Learn How it Works
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

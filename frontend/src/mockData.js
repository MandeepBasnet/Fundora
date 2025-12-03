export const campaignData = {
  id: 1,
  title: "Smart Agriculture IoT System for Nepali Farmers",
  creator: "TechFarm Nepal",
  image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYzOTYzNzgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  category: "Technology",
  location: "Chitwan, Nepal",
  raised: 387500,
  goal: 500000,
  backers: 156,
  daysLeft: 12,
  story: "Our project aims to revolutionize farming in Nepal by introducing affordable IoT sensors...",
  milestones: [
    { id: 1, title: "Prototype Development", description: "Building the initial sensor prototype", status: "completed", fundAmount: 100000, completedDate: "2024-01-15", proofUrl: "#" },
    { id: 2, title: "Field Testing", description: "Testing sensors in real farms", status: "completed", fundAmount: 150000, completedDate: "2024-03-10", proofUrl: "#" },
    { id: 3, title: "Mass Production", description: "Manufacturing 500 units", status: "in-progress", fundAmount: 200000, expectedDate: "2024-06-01" },
    { id: 4, title: "Distribution", description: "Distributing to farmers", status: "locked", fundAmount: 50000, expectedDate: "2024-08-01" }
  ],
  rewards: [
    { id: 1, title: "Early Bird", amount: 1000, description: "Get one sensor at 50% off", backers: 50, delivery: "Aug 2024", available: true, popular: true },
    { id: 2, title: "Farmer Kit", amount: 5000, description: "Full kit with 5 sensors and hub", backers: 20, delivery: "Sep 2024", available: true }
  ]
};


export const dashboardData = {
  totalRaised: 387500,
  goal: 500000,
  backers: 156,
  views: 12500,
  campaignTitle: "Smart Agriculture IoT System",
  pendingMilestones: [
    { id: 3, title: "Mass Production", description: "Manufacturing 500 units", fundAmount: 200000, deadline: "2024-06-01" }
  ],
  completedMilestones: [
    { id: 1, title: "Prototype Development", fundAmount: 100000, completedDate: "2024-01-15" },
    { id: 2, title: "Field Testing", fundAmount: 150000, completedDate: "2024-03-10" }
  ],
  recentBackers: [
    { name: "Ram Sharma", amount: 5000, date: "2 hours ago" },
    { name: "Sita Nepali", amount: 1000, date: "5 hours ago" }
  ]
};

export const creatorCampaigns = [
  {
    id: 1,
    title: "Smart Agriculture IoT System",
    status: "active",
    raised: 387500,
    goal: 500000,
    backers: 156,
    daysLeft: 12,
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: 2,
    title: "Remote Learning Tablets for Rural Schools",
    status: "draft",
    raised: 0,
    goal: 1000000,
    backers: 0,
    daysLeft: 0,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: 3,
    title: "Community Clean Water Initiative",
    status: "completed",
    raised: 750000,
    goal: 700000,
    backers: 234,
    daysLeft: 0,
    image: "https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&q=80&w=300"
  }
];

export const financeData = {
  availableBalance: 250000,
  pendingBalance: 137500,
  totalWithdrawn: 150000,
  transactions: [
    { id: "TXN-1234", date: "2024-03-15", description: "Milestone 1 Release", amount: 100000, status: "completed" },
    { id: "TXN-1235", date: "2024-03-10", description: "Milestone 2 Release", amount: 50000, status: "completed" },
    { id: "TXN-1236", date: "2024-02-28", description: "Platform Fee (5%)", amount: -5000, status: "completed" },
  ]
};

export const backerData = {
  totalBacked: 15000,
  campaignsBacked: 5,
  activeCampaigns: [
    {
      id: 1,
      title: "Smart Agriculture IoT System",
      creator: "TechFarm Nepal",
      amountBacked: 5000,
      progress: 75,
      daysLeft: 12,
      image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&q=80&w=300"
    },
    {
      id: 4,
      title: "Eco-Friendly Bamboo Housing",
      creator: "Green Homes",
      amountBacked: 2000,
      progress: 45,
      daysLeft: 25,
      image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=300"
    }
  ],
  recentTransactions: [
    { id: "TXN-9988", date: "2024-03-20", description: "Backed Smart Agriculture", amount: 5000 },
    { id: "TXN-9989", date: "2024-03-18", description: "Backed Bamboo Housing", amount: 2000 }
  ],
  recommended: [
    {
      id: 5,
      title: "Digital Literacy for Seniors",
      category: "Education",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=300"
    }
  ]
};

export const adminData = {
  totalCampaigns: 156,
  totalUsers: 1250,
  totalFunding: 4500000,
  activeCampaigns: 42,
  pendingApprovals: 8,
  pendingReviews: 12,
  flaggedCampaigns: 3,
  platformSuccessRate: 85,
  monthlyRevenue: 225000,
  recentActivity: [
    { id: 1, type: "new_campaign", message: "New campaign 'Solar Irrigation' submitted", time: "10 mins ago" },
    { id: 2, type: "flag", message: "Campaign #45 flagged for copyright", time: "1 hour ago" },
    { id: 3, type: "large_backing", message: "Large backing of Rs. 50,000 on Campaign #12", time: "2 hours ago" }
  ]
};

export const browseCampaigns = [
  {
    id: 1,
    title: "Smart Agriculture IoT System for Nepali Farmers",
    category: "Technology",
    description: "A revolutionary project to change the way we think about sustainable farming in Nepal.",
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&q=80&w=600",
    raised: 387500,
    goal: 500000,
    backers: 156,
    daysLeft: 12,
    createdDate: "2024-10-15",
    trendingScore: 8.5
  },
  {
    id: 2,
    title: "Documentary: Preserving Traditional Nepali Art Forms",
    category: "Film & Video",
    description: "Capturing the beauty of traditional Nepali art before it disappears.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600",
    raised: 245000,
    goal: 300000,
    backers: 89,
    daysLeft: 8,
    createdDate: "2024-10-20",
    trendingScore: 7.2
  },
  {
    id: 3,
    title: "Clean Water Initiative for Rural Communities",
    category: "Social Cause",
    description: "Bringing clean drinking water to 10 remote villages in Nepal.",
    image: "https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&q=80&w=600",
    raised: 520000,
    goal: 750000,
    backers: 234,
    daysLeft: 20,
    createdDate: "2024-09-28",
    trendingScore: 9.1
  },
  {
    id: 4,
    title: "Eco-Friendly Packaging Startup",
    category: "Business",
    description: "Replacing plastic packaging with biodegradable alternatives made in Nepal.",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600",
    raised: 158000,
    goal: 400000,
    backers: 67,
    daysLeft: 25,
    createdDate: "2024-10-05",
    trendingScore: 6.8
  },
  {
    id: 5,
    title: "Mobile App for Local Artisan Marketplace",
    category: "Technology",
    description: "Connecting local artisans directly with customers through a mobile platform.",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=600",
    raised: 480000,
    goal: 600000,
    backers: 145,
    daysLeft: 15,
    createdDate: "2024-10-12",
    trendingScore: 8.0
  },
  {
    id: 6,
    title: "Youth Coding Bootcamp in Kathmandu",
    category: "Education",
    description: "Teaching programming skills to underprivileged youth in Kathmandu.",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600",
    raised: 295000,
    goal: 350000,
    backers: 112,
    daysLeft: 10,
    createdDate: "2024-10-18",
    trendingScore: 7.5
  },
  {
    id: 7,
    title: "Mountain Trail Conservation Project",
    category: "Environment",
    description: "Preserve and maintain hiking trails in the Annapurna region.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=600",
    raised: 680000,
    goal: 800000,
    backers: 289,
    daysLeft: 5,
    createdDate: "2024-09-15",
    trendingScore: 9.5
  },
  {
    id: 8,
    title: "Women's Handicraft Cooperative",
    category: "Social Cause",
    description: "Empowering rural women through traditional handicraft production.",
    image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600",
    raised: 125000,
    goal: 250000,
    backers: 54,
    daysLeft: 30,
    createdDate: "2024-11-01",
    trendingScore: 5.5
  },
  {
    id: 9,
    title: "Solar-Powered School Lighting",
    category: "Technology",
    description: "Installing solar panels in schools without electricity access.",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=600",
    raised: 410000,
    goal: 500000,
    backers: 178,
    daysLeft: 7,
    createdDate: "2024-10-08",
    trendingScore: 8.8
  },
  {
    id: 10,
    title: "Organic Coffee Farm Development",
    category: "Agriculture",
    description: "Establishing an organic coffee farm in Gulmi district.",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600",
    raised: 345000,
    goal: 700000,
    backers: 98,
    daysLeft: 18,
    createdDate: "2024-10-22",
    trendingScore: 6.2
  },
  {
    id: 11,
    title: "Digital Library for Remote Areas",
    category: "Education",
    description: "Creating digital learning centers with e-books and online courses.",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=600",
    raised: 890000,
    goal: 1000000,
    backers: 412,
    daysLeft: 3,
    createdDate: "2024-09-10",
    trendingScore: 9.8
  },
  {
    id: 12,
    title: "Traditional Music Album Production",
    category: "Music",
    description: "Recording and preserving traditional Nepali folk music.",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=600",
    raised: 78000,
    goal: 150000,
    backers: 45,
    daysLeft: 22,
    createdDate: "2024-11-05",
    trendingScore: 4.9
  },
  {
    id: 13,
    title: "Bee Keeping & Honey Production Initiative",
    category: "Agriculture",
    description: "Training farmers in modern beekeeping techniques.",
    image: "https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&q=80&w=600",
    raised: 215000,
    goal: 300000,
    backers: 87,
    daysLeft: 14,
    createdDate: "2024-10-25",
    trendingScore: 7.0
  },
  {
    id: 14,
    title: "Adventure Tourism Gear Rental Platform",
    category: "Business",
    description: "Online platform for renting trekking and climbing equipment.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=600",
    raised: 520000,
    goal: 600000,
    backers: 156,
    daysLeft: 2,
    createdDate: "2024-10-01",
    trendingScore: 8.3
  },
  {
    id: 15,
    title: "Mental Health Awareness Campaign",
    category: "Health",
    description: "Breaking stigma and providing mental health resources in Nepal.",
    image: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=600",
    raised: 165000,
    goal: 400000,
    backers: 92,
    daysLeft: 28,
    createdDate: "2024-11-08",
    trendingScore: 5.8
  },
  {
    id: 16,
    title: "Earthquake-Resistant Building Workshops",
    category: "Education",
    description: "Teaching construction workers earthquake-safe building techniques.",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=600",
    raised: 445000,
    goal: 550000,
    backers: 201,
    daysLeft: 6,
    createdDate: "2024-10-03",
    trendingScore: 8.6
  },
  {
    id: 17,
    title: "Heritage Building Restoration Fund",
    category: "Culture",
    description: "Restoring historic temples and monuments in Patan Durbar Square.",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=600",
    raised: 750000,
    goal: 1200000,
    backers: 342,
    daysLeft: 35,
    createdDate: "2024-09-20",
    trendingScore: 7.8
  },
  {
    id: 18,
    title: "Mobile Veterinary Clinic for Rural Areas",
    category: "Health",
    description: "Providing affordable veterinary care to livestock in remote villages.",
    image: "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&q=80&w=600",
    raised: 198000,
    goal: 450000,
    backers: 76,
    daysLeft: 16,
    createdDate: "2024-11-02",
    trendingScore: 6.5
  }
];

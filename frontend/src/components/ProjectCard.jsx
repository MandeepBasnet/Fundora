import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Target } from 'lucide-react';
import { Card, Button, Badge, Progress } from './ui';

export function ProjectCard({ project }) {
  const percent = Math.min(100, Math.round((project.raised / project.goal) * 100));
  const imageUrl = project.image.startsWith('http') 
    ? project.image 
    : `https://source.unsplash.com/random/800x600/?${project.image}`;

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-slate-200">
        <img 
          src={imageUrl} 
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 hover:bg-white">
          {project.category}
        </Badge>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 line-clamp-2 mb-1">{project.title}</h3>
          <p className="text-sm text-slate-500">by <span className="text-sky-600 font-medium">{project.creator}</span></p>
        </div>
        
        <div className="space-y-4 mb-6 flex-1">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-sky-600">Rs. {project.raised.toLocaleString()}</span>
              <span className="text-slate-400">of Rs. {project.goal.toLocaleString()}</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
          
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100">
            <div className="text-center">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Target className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-900">{percent}%</div>
              <div className="text-[10px] uppercase text-slate-500 font-medium">Funded</div>
            </div>
            <div className="text-center border-l border-slate-100">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-900">{project.backers}</div>
              <div className="text-[10px] uppercase text-slate-500 font-medium">Backers</div>
            </div>
            <div className="text-center border-l border-slate-100">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-900">{project.daysLeft}</div>
              <div className="text-[10px] uppercase text-slate-500 font-medium">Days Left</div>
            </div>
          </div>
        </div>
        
        <Link to={`/campaigns/${project.id}`}>
          <Button className="w-full bg-slate-900 hover:bg-slate-800">
            View Campaign
          </Button>
        </Link>
      </div>
    </Card>
  );
}

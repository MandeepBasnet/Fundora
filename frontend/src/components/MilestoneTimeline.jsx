import React from 'react';
import { CheckCircle2, Clock, Lock, ShieldCheck, ExternalLink } from 'lucide-react';
import { Badge, Button } from './ui';

export function MilestoneTimeline({ milestones }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'locked': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-6 h-6 text-white" />;
      case 'in-progress': return <Clock className="w-6 h-6 text-white" />;
      case 'locked': return <Lock className="w-6 h-6 text-white" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Completed</Badge>;
      case 'in-progress': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">In Progress</Badge>;
      case 'locked': return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none">Locked</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="relative">
          {/* Connection Line */}
          {index < milestones.length - 1 && (
            <div 
              className={`absolute left-6 top-12 w-0.5 h-full ${
                milestone.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          )}

          {/* Milestone Card */}
          <div className="flex gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center flex-shrink-0 relative z-10`}>
              {getStatusIcon(milestone.status)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">{milestone.title}</h3>
                    {getStatusBadge(milestone.status)}
                  </div>
                  <div className="text-right">
                    <div className="text-blue-600 font-medium">
                      Rs. {milestone.fundAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">to be released</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {milestone.status === 'completed' && milestone.completedDate && (
                      <span className="text-green-700 font-medium">Completed on {new Date(milestone.completedDate).toLocaleDateString()}</span>
                    )}
                    {milestone.status === 'in-progress' && milestone.expectedDate && (
                      <span className="text-blue-700 font-medium">Expected by {new Date(milestone.expectedDate).toLocaleDateString()}</span>
                    )}
                    {milestone.status === 'locked' && milestone.expectedDate && (
                      <span className="text-gray-500">Expected by {new Date(milestone.expectedDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  {milestone.status === 'completed' && milestone.proofUrl && (
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Proof
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-blue-900 mb-2 font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> How Milestone-Based Funding Works</h4>
        <ul className="text-sm text-blue-800 space-y-1 pl-5 list-disc">
          <li>Funds are held securely until milestones are completed</li>
          <li>Creators submit proof for each milestone</li>
          <li>Our team verifies the submission within 48 hours</li>
          <li>Once verified, funds are released to the creator</li>
          <li>You'll receive notifications for each milestone completion</li>
        </ul>
      </div>
    </div>
  );
}

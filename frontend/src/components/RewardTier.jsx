import React from 'react';
import { Users, Calendar, Star } from 'lucide-react';
import { Badge, Button } from './ui';

export function RewardTier({ reward, selected, onSelect }) {
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        selected 
          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' 
          : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'
      } ${!reward.available ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={reward.available ? onSelect : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xl font-bold text-gray-900 mb-1">
            Rs. {reward.amount.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{reward.title}</h4>
            {reward.popular && (
              <Badge className="bg-orange-100 text-orange-700 border-none flex items-center gap-1 hover:bg-orange-200">
                <Star className="w-3 h-3 fill-orange-700" />
                Popular
              </Badge>
            )}
          </div>
        </div>
        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-blue-600' : 'border-gray-300'}`}>
          {selected && <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{reward.backers} backers</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{reward.delivery}</span>
        </div>
      </div>

      {/* Limited availability */}
      {reward.limited && (
        <div className="mb-3 text-sm font-medium text-orange-600">
          Limited: Only {reward.limited} remaining
        </div>
      )}

      {/* Action Button */}
      {reward.available ? (
        <Button 
          variant={selected ? "default" : "outline"}
          className={`w-full ${selected ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {selected ? 'Selected' : 'Select Reward'}
        </Button>
      ) : (
        <Button variant="outline" className="w-full" disabled>
          No Longer Available
        </Button>
      )}
    </div>
  );
}

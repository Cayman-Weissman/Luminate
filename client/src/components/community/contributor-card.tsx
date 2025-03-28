import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ContributorBadge {
  id: number;
  name: string;
  icon: string;
  filled?: boolean;
}

interface ContributorCardProps {
  id: number;
  name: string;
  username: string;
  points: number;
  rank: number;
  avatar: string;
  badges: ContributorBadge[];
}

const ContributorCard: React.FC<ContributorCardProps> = ({
  id,
  name,
  username,
  points,
  rank,
  avatar,
  badges
}) => {
  // Determine badge color based on rank
  const getRankStyles = () => {
    switch(rank) {
      case 1:
        return 'bg-primary text-zinc-900';
      case 2:
        return 'bg-blue-500 text-zinc-900';
      case 3:
        return 'bg-white text-zinc-900';
      default:
        return 'bg-zinc-700 text-white';
    }
  };

  return (
    <Card className="bg-zinc-800 rounded-xl shadow-lg hover:shadow-xl transition-all">
      <CardContent className="p-4 flex items-center">
        <div className="relative mr-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getRankStyles()} flex items-center justify-center text-xs font-bold`}>
            {rank}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-white">{name}</h4>
          <p className="text-zinc-400 text-sm">{points.toLocaleString()} points</p>
          
          <div className="flex mt-1">
            {badges.map((badge) => (
              <span key={badge.id} className="mr-1" title={badge.name}>
                <i className={`${badge.icon || 'ri-medal-fill'} ${badge.filled !== false ? 'text-primary' : 'text-zinc-400'} text-xs`}></i>
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContributorCard;

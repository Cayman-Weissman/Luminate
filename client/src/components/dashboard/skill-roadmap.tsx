import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface RoadmapItem {
  id: number;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  completedDate?: string;
  progress?: number;
}

interface SkillRoadmapProps {
  title: string;
  progress: number;
  items: RoadmapItem[];
  onContinue?: (id: number) => void;
}

const SkillRoadmap: React.FC<SkillRoadmapProps> = ({
  title,
  progress,
  items,
  onContinue
}) => {
  const renderItemIcon = (item: RoadmapItem, index: number) => {
    if (item.status === 'completed') {
      return (
        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
          <i className="ri-check-line text-white"></i>
        </div>
      );
    } else if (item.status === 'in-progress') {
      return (
        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10">
          <span className="text-sm font-medium text-zinc-900">{index + 1}</span>
        </div>
      );
    } else {
      return (
        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center z-10 border border-zinc-700">
          <span className="text-sm font-medium">{index + 1}</span>
        </div>
      );
    }
  };

  return (
    <Card className="bg-zinc-800 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-white">Your Skill Roadmap</CardTitle>
          <button className="text-zinc-400 hover:text-white text-sm flex items-center">
            Customize
            <i className="ri-edit-line ml-1"></i>
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">{title}</span>
            <span className="text-primary text-sm">{progress}% Complete</span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        
        {/* Roadmap Timeline */}
        <div className="relative mt-8">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 h-full w-0.5 bg-zinc-900"></div>
          
          {/* Timeline Items */}
          {items.map((item, index) => (
            <div key={item.id} className="relative pl-12 pb-8 last:pb-0">
              {renderItemIcon(item, index)}
              
              <div className={`bg-zinc-900 p-4 rounded-lg ${item.status === 'in-progress' ? 'border border-primary' : ''} ${item.status === 'locked' ? 'opacity-60' : ''}`}>
                <h4 className="text-white font-medium mb-1">{item.title}</h4>
                
                {item.status === 'completed' && item.completedDate && (
                  <p className="text-sm text-zinc-400">Completed on {item.completedDate}</p>
                )}
                
                {item.status === 'in-progress' && (
                  <>
                    <p className="text-sm text-zinc-400">In Progress - {item.progress}% Complete</p>
                    <button 
                      onClick={() => onContinue && onContinue(item.id)} 
                      className="mt-2 text-sm text-blue-400 flex items-center"
                    >
                      Continue Learning
                      <i className="ri-arrow-right-line ml-1"></i>
                    </button>
                  </>
                )}
                
                {item.status === 'locked' && (
                  <p className="text-sm text-zinc-400">Locked - Complete previous courses first</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillRoadmap;

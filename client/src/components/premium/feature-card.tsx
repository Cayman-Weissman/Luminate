import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description
}) => {
  return (
    <div className="flex items-start">
      <div className="bg-primary/10 p-2 rounded-md mr-3 flex-shrink-0">
        <i className={`${icon} text-primary`}></i>
      </div>
      <div>
        <h4 className="text-white font-medium">{title}</h4>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;

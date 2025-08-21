import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  change?: string;
  trend?: 'up' | 'down';
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  gradient,
  change,
  trend = 'up'
}) => {
  return (
    <Card className="card-gaming relative overflow-hidden group animate-slide-in-gaming">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-card opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <p className="text-sm font-gaming text-muted-foreground tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-gaming font-bold text-foreground">
              {value}
            </p>
          </div>
          
          <div className={`p-4 rounded-xl ${gradient} shadow-glow-primary group-hover:scale-110 transition-transform duration-300`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
        
        {change && (
          <div className="flex items-center space-x-2 text-sm">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-accent" />
            ) : (
              <TrendingDown className="w-4 h-4 text-error" />
            )}
            <span className="text-muted-foreground font-gaming">
              {change}
            </span>
          </div>
        )}
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      </div>
    </Card>
  );
};

export default StatsCard;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, BarChart3, Monitor, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface MobileNavigationProps {
  activeTab: 'dashboard' | 'stations' | 'userManagement'|'credits';
  setActiveTab: (tab: 'dashboard' | 'stations' | 'userManagement'|'credits') => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileNavOpen,
  setMobileNavOpen
}) => {
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <Collapsible open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <div className="flex justify-end">
          <CollapsibleTrigger asChild>
            <Button variant="default" size="icon" className="rounded-full shadow-lg w-14 h-14 flex items-center justify-center ring-2 ring-primary/20 bg-card/80 backdrop-blur-md">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-3 bg-card/90 backdrop-blur-md rounded-lg p-2 shadow-lg flex justify-around">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => { setActiveTab('dashboard'); setMobileNavOpen(false); }}
              aria-label="Dashboard"
              title="Dashboard"
              className={`flex-1 mx-1 ${activeTab === 'dashboard' ? 'btn-gaming' : 'hover:bg-primary/10'} font-gaming`}
              size="sm"
            >
              <BarChart3 className="w-6 h-6 mx-auto" />
            </Button>
            <Button
              variant={activeTab === 'stations' ? 'default' : 'ghost'}
              onClick={() => { setActiveTab('stations'); setMobileNavOpen(false); }}
              aria-label="Stations"
              title="Stations"
              className={`flex-1 mx-1 ${activeTab === 'stations' ? 'btn-gaming' : 'hover:bg-primary/10'} font-gaming`}
              size="sm"
            >
              <Monitor className="w-6 h-6 mx-auto" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => { navigate('/settings'); setMobileNavOpen(false); }}
              aria-label="Settings"
              title="Settings"
              className="flex-1 mx-1 hover:bg-primary/10 font-gaming"
              size="sm"
            >
              <Cog className="w-6 h-6 mx-auto" />
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MobileNavigation;

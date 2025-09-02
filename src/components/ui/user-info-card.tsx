import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Shield } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  loginTime?: string;
}

interface UserInfoCardProps {
  user: User | null;
  onLogout: () => void;
  compact?: boolean;
}

  const UserInfoCard: React.FC<UserInfoCardProps> = ({ user, onLogout, compact = false }) => {
    console.log('UserInfoCard rendered with user:', user);
    
    const handleLogout = () => {
      console.log('Logout button clicked, calling onLogout function');
      onLogout();
    };
    
    if (!user) {
    return (
      <Card className="card-gaming">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-muted">
                <User className="w-5 h-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Not logged in</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'manager':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'staff':
        return 'bg-success/20 text-success border-success/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{user.username}</p>
            <Badge className={`text-xs ${getRoleColor(user.role)}`}>
              <Shield className="w-3 h-3 mr-1" />
              {user.role}
            </Badge>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="card-gaming">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-gaming text-foreground">Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout? You'll need to re-authenticate to access the dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <Card className="card-gaming">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getRoleColor(user.role)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
                {user.loginTime && (
                  <span className="text-xs text-muted-foreground">
                    Since {new Date(user.loginTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="card-gaming">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-gaming text-foreground">Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to logout? You'll need to re-authenticate to access the dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
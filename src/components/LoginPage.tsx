import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import gamingBg from '@/assets/gaming-bg.jpg';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const mockToken = 'mock-jwt-token';
        onLogin(mockToken);
        toast({
          title: "Welcome back!",
          description: "Successfully logged into Gaming Cafe Admin",
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${gamingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-gaming" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-gaming" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md card-gaming border-primary/20 backdrop-blur-md animate-slide-in-gaming relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 animate-glow-pulse shadow-glow-primary">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-gaming font-bold bg-gradient-gaming bg-clip-text text-transparent mb-2">
              GAMING CAFE
            </h1>
            <h2 className="text-xl font-gaming font-semibold text-primary mb-2">
              ADMIN CONTROL
            </h2>
            <p className="text-muted-foreground">
              Access the neural interface to manage your gaming empire
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="font-gaming text-sm tracking-wide">
                  USERNAME
                </Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming"
                  placeholder="Enter admin username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-gaming text-sm tracking-wide">
                  PASSWORD
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming pr-12"
                    placeholder="Enter secure password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/20"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 btn-gaming font-gaming font-semibold text-lg tracking-wider relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>INITIALIZING...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>CONNECT TO SYSTEM</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <div className="bg-muted/30 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-gaming text-muted-foreground mb-2">
                DEFAULT ACCESS CODES
              </p>
              <div className="text-xs font-mono space-y-1">
                <p className="text-primary">Username: admin</p>
                <p className="text-accent">Password: admin123</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Zap, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import gamingBg from '@/assets/gaming-bg.jpg';
import { login, register } from "@/services/apis/api";
import AdminWebSocketService, { ConnectionState } from "@/services/Websockets";

interface LoginPageProps {
  onLogin: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [connection, setConnection] = useState<ConnectionState>("disconnected");

  useEffect(() => {
    const ws = AdminWebSocketService.getInstance();
    ws.onConnectionChange = (state) => setConnection(state);
    ws.connect();
    return () => {
      ws.onConnectionChange = null;
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // ⛔ prevent page reload
    setLoading(true);
    try {
      if (mode === "login") {
        // const data = await login(credentials.username, credentials.password);

        const data = await login(credentials.username, credentials.password);
        const token = data?.token;

        if (token) {
          // Store the authentication token
          localStorage.setItem('adminToken', token);
          
          // Store user info along with token
          localStorage.setItem('currentUser', JSON.stringify({
            username: data.user?.username || credentials.username,
            email: data.user?.email || '',
            role: data.user?.role || 'admin'
          }));
          
          onLogin(token);
        }
        // const token = data?.token || "mock-jwt-token";
        //  onLogin(token);

        toast({
          title: "Welcome back!",
          description: "Successfully logged into Gaming Cafe Admin",
        });
      } else {
        if (credentials.password !== credentials.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Confirm password does not match.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        await register({
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
          role: credentials.role,
        });

        toast({
          title: "Account Created",
          description: `User "${credentials.username}" registered successfully.`,
        });

        setMode("login");
        setCredentials({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "user",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Server error",
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
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-gaming" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-gaming" style={{ animationDelay: '1s' }} />
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${connection === 'connected' ? 'bg-primary' : connection === 'error' ? 'bg-destructive' : 'bg-muted-foreground/40'}`} />
        <span className="text-xs text-muted-foreground">Live: {connection}</span>
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
              {mode === 'login' ? 'ADMIN CONTROL' : 'REGISTER ACCOUNT'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'login'
                ? 'Access the neural interface to manage your gaming empire'
                : 'Create a new account to join the gaming network'}
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
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming"
                  placeholder="Enter username"
                />
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-gaming text-sm tracking-wide">
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming"
                    placeholder="Enter your email"
                  />
                </div>
              )}

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
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming pr-12"
                    placeholder="Enter password"
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

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-gaming text-sm tracking-wide">
                    CONFIRM PASSWORD
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={credentials.confirmPassword}
                    onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                    className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming pr-12"
                    placeholder="Re-enter password"
                  />
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="role" className="font-gaming text-sm tracking-wide">
                    ROLE
                  </Label>
                  <select
                    id="role"
                    value={credentials.role}
                    onChange={(e) => setCredentials({ ...credentials, role: e.target.value })}
                    className="bg-input/50 border-primary/30 focus:border-primary h-12 w-full font-gaming px-3 rounded"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 btn-gaming font-gaming font-semibold text-lg tracking-wider relative overflow-hidden flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'INITIALIZING...' : 'CREATING...'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {mode === 'login' ? <Zap className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{mode === 'login' ? 'CONNECT TO SYSTEM' : 'REGISTER ACCOUNT'}</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm text-primary font-gaming underline"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
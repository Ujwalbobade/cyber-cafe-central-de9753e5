import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Zap, UserPlus, Mail, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import gamingBg from '@/assets/gaming-bg.jpg';
import { login, register, forgotPassword, forgotUsername } from "@/services/apis/api";
import AdminWebSocketService, { ConnectionState } from "@/services/Websockets";

interface LoginPageProps {
  onLogin: (token: string, userInfo: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgotPassword' | 'forgotUsername'>('login');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'admin',
    phonenumber: ''

  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [connection, setConnection] = useState<ConnectionState>("disconnected");

  useEffect(() => {
    const ws = AdminWebSocketService.getInstance();
    ws.onConnectionChange = state => setConnection(state);
    ws.connect();
    return () => {
      ws.onConnectionChange = null;
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await login(credentials.username, credentials.password);
        const token = data?.token;
        if (token) {
          const userInfo = {
            username: data.user?.username || credentials.username,
            email: data.user?.email || '',
            role: data.role || 'user',
          };
          localStorage.setItem("adminToken", token);
          localStorage.setItem("currentUser", JSON.stringify(userInfo));
          console.log("User Info on Login:", userInfo);
          onLogin(token, userInfo);
          toast({ title: "Welcome back!", description: "Logged in successfully." });
        }
      } else if (mode === 'register') {
        if (credentials.password !== credentials.confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
        } else {
          await register({
            username: credentials.username,
            email: credentials.email,
            password: credentials.password,
            role: credentials.role, 
            fullName: credentials.username,
            phoneNumber: credentials.phonenumber
          });
          toast({ title: "Registered", description: "Account created successfully." });
          setMode('login');
          setCredentials({ username: '', password: '', confirmPassword: '', email: '', role: 'admin' , phonenumber: ''});
        }
      } else if (mode === 'forgotPassword') {
        if (!credentials.email) {
          toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
        } else {
          await forgotPassword(credentials.email);
          toast({ title: "Check Email", description: "Password reset instructions sent." });
          setMode('login');
        }
      } else if (mode === 'forgotUsername') {
        if (!credentials.email) {
          toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
        } else {
          await forgotUsername(credentials.email);
          toast({ title: "Check Email", description: "Username recovery instructions sent." });
          setMode('login');
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Server error", variant: "destructive" });
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
        backgroundPosition: 'center',
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
              {mode === 'login'
                ? 'ADMIN LOGIN'
                : mode === 'register'
                  ? 'REGISTER ACCOUNT'
                  : mode === 'forgotPassword'
                    ? 'FORGOT PASSWORD'
                    : 'FORGOT USERNAME'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'login'
                ? 'Enter username or email and password'
                : mode === 'register'
                  ? 'Fill details to register'
                  : 'Enter your email to recover'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username / Email / Identifier */}
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="font-gaming text-sm tracking-wide">
                {mode === 'register' ? 'Username' : (mode === 'forgotUsername' || mode === 'forgotPassword') ? 'Email' : 'Username or Email'}
              </Label>
              <Input
                id="usernameOrEmail"
                type={mode === 'forgotUsername' || mode === 'forgotPassword' ? 'email' : 'text'}
                required
                value={mode === 'forgotUsername' || mode === 'forgotPassword' ? credentials.email : credentials.username}
                onChange={e =>
                  mode === 'forgotUsername' || mode === 'forgotPassword'
                    ? setCredentials({ ...credentials, email: e.target.value })
                    : setCredentials({ ...credentials, username: e.target.value })
                }
                className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming"
                placeholder={
                  mode === 'forgotUsername'
                    ? 'Enter your registered email'
                    : mode === 'forgotPassword'
                      ? 'Enter your registered email'
                      : mode === 'register'
                        ? 'Choose a username'
                        : 'Username or email'
                }
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="font-gaming text-sm tracking-wide">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={credentials.email}
                  onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                  className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming"
                  placeholder="Enter your email"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="font-gaming text-sm tracking-wide">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={credentials.password}
                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                    className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming pr-12"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-gaming text-sm tracking-wide">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.confirmPassword}
                  onChange={e => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                  className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming pr-12"
                  placeholder="Re-enter password"
                />
              </div>
            )}
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="role" className="font-gaming text-sm tracking-wide">Role</Label>
                <select
                  id="role"
                  value={credentials.role}
                  onChange={e => setCredentials({ ...credentials, role: e.target.value })}
                  className="bg-input/50 border-primary/30 focus:border-primary h-12 w-full font-gaming px-3"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 btn-gaming font-gaming font-semibold text-lg"
            >
              {loading
                ? (mode === 'login'
                  ? 'Signing In...'
                  : mode === 'register'
                    ? 'Registering...'
                    : mode === 'forgotPassword'
                      ? 'Sending...'
                      : 'Sending...'
                )
                : (mode === 'login'
                  ? 'LOGIN'
                  : mode === 'register'
                    ? 'REGISTER'
                    : mode === 'forgotPassword'
                      ? 'RESET PASSWORD'
                      : 'RECOVER USERNAME'
                )
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            {mode !== 'register' && (
              <Button
                type="button"
                variant="link"
                className="text-sm text-primary font-gaming underline"
                onClick={() => setMode('register')}
              >
                Don’t have an account? Register
              </Button>
            )}
            {mode !== 'login' && (
              <Button
                type="button"
                variant="link"
                className="ml-4 text-sm text-primary font-gaming underline"
                onClick={() => setMode('login')}
              >
                Back to Login
              </Button>
            )}
          </div>
          {mode === 'login' && (
            <div className="flex justify-between text-sm mb-4">
              <button
                type="button"
                className="text-primary underline font-gaming"
                onClick={() => setMode('forgotPassword')}
              >
                Forgot Password?
              </button>
              <button
                type="button"
                className="text-primary underline font-gaming"
                onClick={() => setMode('forgotUsername')}
              >
                Forgot Username?
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
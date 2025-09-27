import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiFetchNoAuth } from "@/services/apis/api";
import gamingBg from "@/assets/gaming-bg.jpg";

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    toast({
      title: "Error",
      description: "Passwords do not match",
      variant: "destructive",
    });
    return;
  }

  try {
    await apiFetchNoAuth("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      newPassword: password,
      confirmPassword: confirmPassword
    }),
  });

    toast({
      title: "Success",
      description: "Password has been reset successfully.",
    });

    window.location.href = "/login"; 
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to reset password",
      variant: "destructive",
    });
  }
};
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Invalid or missing token.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${gamingBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-gaming" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-gaming"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <Card className="w-full max-w-md card-gaming border-primary/20 backdrop-blur-md animate-slide-in-gaming relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 animate-glow-pulse shadow-glow-primary">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-gaming font-bold bg-gradient-gaming bg-clip-text text-transparent mb-2">
              RESET PASSWORD
            </h2>
            <p className="text-muted-foreground">
              Enter your new password and confirm below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password" className="font-gaming text-sm tracking-wide">
                New Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming pr-12"
                  placeholder="Enter new password"
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

            <div>
              <Label
                htmlFor="confirmPassword"
                className="font-gaming text-sm tracking-wide"
              >
                Confirm Password
              </Label>
              <Input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input/50 border-primary/30 focus:border-primary h-12 font-gaming"
                placeholder="Re-enter password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-gaming font-gaming font-semibold text-lg"
            >
              Reset Password
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail } from "lucide-react";
import { LoaderCircle } from "@/components/LoaderCircle";

import { useToast } from "@/hooks/use-toast";

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const from = location.state?.from?.pathname || "/admin";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (!phone || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter your phone and password",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const user = await login(phone, password);
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
      });
      
      // Redirect to admin dashboard
      navigate("/admin");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 px-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm border-opacity-50 shadow-lg">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-2">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">E-Courier Admin</CardTitle>
            <CardDescription className="text-muted-foreground">
              Securely access your admin account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-sm text-center">
                Log in with your phone number and password to access the admin panel.
                  </p>
                </div>
                
            <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="Enter your phone number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    size="lg" 
                    className="w-full font-semibold h-12 text-md"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                    Log in to Admin Panel
                      </>
                    )}
                  </Button>
                </form>
          </CardContent>
          
          <CardFooter className="flex flex-col items-center gap-4 border-t p-6">
            <div className="text-sm text-center">
              E-Courier Management System
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}; 
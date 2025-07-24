//src/components/layouts/DashboardLayout.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
  FileText,
  BarChart3,
  Shield,
  User,
  UserCircle,
  HelpCircle,
  Clock1,
  CreditCard,
  Settings,
  Bell,
  KeyRound,
  Trash2,
  CheckCheck,
  Eye,
  EyeOff,
  X,
  MapPin,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api_calls";
import { LoaderCircle } from "@/components/LoaderCircle";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
// FIXED: Correct import for notifications hook

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
 
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Navigation items for E-Courier system
  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/",
      description: "Overview of shipments and system status",
    },
    {
      title: "Users",
      icon: Users,
      // Remove href to prevent routing to /admin/users
      description: "Manage system users",
      subItems: [
        {
          title: "Admins",
          icon: Shield,
          href: "/admin/admins",
          description: "Manage system administrators",
        },
        {
          title: "Couriers",
          icon: Clock1,
          href: "/admin/couriers",
          description: "Manage courier accounts",
        },
        {
          title: "Customers",
          icon: User,
          href: "/admin/customers",
          description: "Manage customer accounts",
        },
      ],
    },
    {
      title: "Cities",
      icon: MapPin,
      href: "/admin/cities",
      description: "Manage cities",
    },
    {
      title: "Hubs",
      icon: FileText,
      href: "/admin/hubs",
      description: "Manage hubs",
    },
    {
      title: "Pricing Rules",
      icon: BarChart3,
      href: "/admin/pricing-rules",
      description: "Manage pricing rules",
    },
    {
      title: "Shipments",
      icon: Truck,
      href: "/admin/shipments",
      description: "View and manage shipments",
    },
    {
      title: "Reports",
      icon: BarChart3,
      href: "/admin/reports",
      description: "View system reports and analytics",
    }
    // Removed Profile and Help & Support
  ];

  // Use user data (name, phone, role) instead of wallet
  const getUserDisplay = () => {
    if (!user) return "";
    let display = user.name || user.phone || "Admin";
    if (user.role) display += ` (${user.role})`;
    return display;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };



  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changingPassword) return;

    // Validate passwords
    const { currentPassword, newPassword, confirmPassword } = changePasswordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: "Invalid password",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await api.post("/users/change-password", {
        currentPassword,
        newPassword,
      });

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setShowChangePasswordModal(false);
      setChangePasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 lg:hidden z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 bg-card border-r transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20",
          "lg:transform-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn(
          "flex h-16 items-center px-4 border-b",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <Clock1 className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold text-foreground">E-Courier</h1>
            </div>
          )}
          {!isSidebarOpen && (
            <Clock1 className="h-6 w-6 text-primary" />
          )}
          <button
            onClick={() => {
              if (windowWidth >= 1024) {
                setIsSidebarOpen(!isSidebarOpen);
              } else {
                setIsMobileMenuOpen(false);
              }
            }}
            className="p-1 rounded-full hover:bg-muted transition-colors hidden lg:flex"
          >
            {isSidebarOpen ? 
              <ChevronLeft className="h-5 w-5 text-foreground" /> : 
              <ChevronRight className="h-5 w-5 text-foreground" />
            }
          </button>
        </div>

        <div className="py-4 flex flex-col h-[calc(100%-4rem)] justify-between">
          <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = item.href
                  ? location.pathname === item.href
                  : item.subItems && item.subItems.some(subItem => location.pathname === subItem.href);

                return (
                  <div key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {item.href ? (
                          <Link
                            to={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <item.icon className={cn(
                              "flex-shrink-0",
                              isSidebarOpen ? "h-5 w-5" : "h-6 w-6"
                            )} />
                            {isSidebarOpen && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </Link>
                        ) : (
                          <div
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group cursor-default",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <item.icon className={cn(
                              "flex-shrink-0",
                              isSidebarOpen ? "h-5 w-5" : "h-6 w-6"
                            )} />
                            {isSidebarOpen && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </div>
                        )}
                      </TooltipTrigger>
                      {!isSidebarOpen && (
                        <TooltipContent side="right" className="max-w-xs">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    {/* Render sub-items if they exist */}
                    {item.subItems && isSidebarOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems.map((subItem) => {
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <Tooltip key={subItem.href}>
                              <TooltipTrigger asChild>
                                <Link
                                  to={subItem.href}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative group",
                                    isSubActive
                                      ? "bg-primary/20 text-primary"
                                      : "text-muted-foreground hover:bg-muted/50"
                                  )}
                                >
                                  <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{subItem.title}</span>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <div>
                                  <p className="font-medium">{subItem.title}</p>
                                  {subItem.description && (
                                    <p className="text-xs text-muted-foreground">{subItem.description}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </TooltipProvider>

          <div className="px-3 mt-auto">
            {isSidebarOpen && (
              <div className="mb-4 p-3 rounded-lg bg-muted">
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.phone || "N/A"}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase">
                    {user?.role || "Admin"}
                  </p>
                </div>
              </div>
            )}
            
            <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-3 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive",
                      !isSidebarOpen && "justify-center px-0"
                    )}
                    onClick={() => setShowLogoutAlert(true)}
                  >
                    <LogOut className="h-5 w-5" />
                    {isSidebarOpen && <span>Logout</span>}
                  </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    <p className="font-medium">Logout</p>
                    <p className="text-xs text-muted-foreground">Sign out of your account</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
      )}>
        <header className="sticky top-0 z-40 h-16 border-b bg-background/80 backdrop-blur-sm px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="text-lg font-semibold">
              E-Courier Admin Portal
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <ThemeToggle />
            {/* Settings Button
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>System Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 md:pl-3 md:pr-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium leading-none mb-1">{user?.name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground leading-none">{user?.phone || "N/A"}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.phone || "N/A"}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem> */}
                {/* <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem> */}
               
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowLogoutAlert(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
              <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your session will end and you will be redirected to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
        
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>


      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowChangePasswordModal(false)}
                disabled={changingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
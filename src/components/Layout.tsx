import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, ShoppingCart, Calendar, LogOut, User, Rss, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session && location.pathname !== "/auth") {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session && location.pathname !== "/auth") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      
      if (direction !== "down" && scrollY < 10) {
        setIsScrolled(false);
      } else if (direction === "down" && scrollY > 50) {
        setIsScrolled(true);
      } else if (direction === "up") {
        setIsScrolled(false);
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Odhlásený",
      description: "Boli ste úspešne odhlásený.",
    });
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  const navItems = [
    { to: "/", icon: UtensilsCrossed, label: "Recepty" },
    { to: "/feed", icon: Rss, label: "Feed" },
    { to: "/shopping-list", icon: ShoppingCart, label: "Nákupný zoznam" },
    { to: "/meal-plans", icon: Calendar, label: "Jedálničky" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background relative">
      {/* Gradient overlay decoration */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary))/10%,transparent_50%)] pointer-events-none -z-10" />
      
      {/* Top Navbar - kompaktný na mobile, auto-hide pri scrollovaní */}
      <header 
        className={`border-b bg-gradient-to-r from-card via-card/95 to-primary/5 backdrop-blur-sm sticky z-50 shadow-sm transition-transform duration-300 ${
          isScrolled ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="container mx-auto px-4 py-2 md:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <span className="text-lg md:text-2xl font-bold">MealMaster</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                      isActive
                        ? "text-foreground border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px]">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <span className="text-xl font-bold">MealMaster</span>
                    </div>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? "text-foreground border-l-4 border-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                    <div className="border-t pt-4 mt-4">
                      <Button variant="ghost" className="w-full justify-start gap-3" size="lg" asChild>
                        <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                          <User className="w-5 h-5" />
                          <span>Profil</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 text-destructive" 
                        size="lg"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Odhlásiť sa</span>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop User Actions */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/profile">
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8 pb-20 md:pb-8 relative z-10">
        {children}
      </main>

      {/* Bottom Navigation Bar - len na mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/95 to-primary/5 backdrop-blur-sm border-t md:hidden z-40 shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                  isActive
                    ? "text-primary border-t-2 border-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Trending from "@/pages/trending";
import Community from "@/pages/community";
import Courses from "@/pages/courses";
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import { InteractiveBackground } from "@/components/layout/interactive-background";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  return user ? <Component /> : null;
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <InteractiveBackground />
      <Navbar />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/trending" component={() => <ProtectedRoute component={Trending} />} />
          <Route path="/community" component={() => <ProtectedRoute component={Community} />} />
          <Route path="/courses" component={() => <ProtectedRoute component={Courses} />} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

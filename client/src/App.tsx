import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

// Page imports
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Community from "@/pages/community";
import Topics from "@/pages/topics";
import TopicLearning from "@/pages/topic-learning";
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";

// Component imports
import { InteractiveBackground } from "@/components/layout/interactive-background";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

// Context imports
import { AuthProvider, useAuth } from "@/context/auth-context";

// Custom hooks
import useScrollTop from "@/hooks/use-scroll-top";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("User not authenticated, redirecting to login");
      window.location.href = "/login";
    }
  }, [user, isLoading]);
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  return user ? <Component /> : null;
}

function ScrollToTopOnNavigate() {
  // This component will handle scrolling to top on route changes
  useScrollTop();
  return null;
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <InteractiveBackground />
      <Navbar />
      {/* Ensures scroll to top on every page navigation */}
      <ScrollToTopOnNavigate />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/topics" component={() => <ProtectedRoute component={Topics} />} />
          <Route path="/topics/:id" component={TopicLearning} />
          <Route path="/community" component={() => <ProtectedRoute component={Community} />} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
          <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
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
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

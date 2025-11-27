import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Community Pages
import Community from "./pages/Community";
import CommunityDetail from "./pages/CommunityDetail";

// Connect Pages
import Connect from "./pages/Connect";
import CreateProject from "./pages/connect/CreateProject";
import ProjectDetails from "./pages/connect/ProjectDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Main Navigation */}
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Auth */}
            <Route path="/auth/*" element={<Auth />} />

            {/* Community Section */}
            <Route path="/community" element={<Community />} />
            <Route path="/community/:id" element={<CommunityDetail />} />

            {/* Connect Section */}
            <Route path="/connect" element={<Connect />} />
            <Route path="/connect/create-project" element={<CreateProject />} />
            <Route path="/connect/projects/:projectId" element={<ProjectDetails />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

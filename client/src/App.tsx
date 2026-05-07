import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

import { LandingPage } from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import AgentCreationPage from "@/pages/AgentCreationPage";
import MemoryIntelligencePage from "@/pages/MemoryIntelligencePage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import AICopilotPage from "@/pages/AICopilotPage";
import AgentMarketplacePage from "@/pages/AgentMarketplacePage";
import WalletBillingPage from "@/pages/WalletBillingPage";
import PrivacySecurityPage from "@/pages/PrivacySecurityPage";
import AdminPanelPage from "@/pages/AdminPanelPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />

      <Route path="/dashboard">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/agents/new">
        <ProtectedRoute><AgentCreationPage /></ProtectedRoute>
      </Route>
      <Route path="/memory">
        <ProtectedRoute><MemoryIntelligencePage /></ProtectedRoute>
      </Route>
      <Route path="/integrations">
        <ProtectedRoute><IntegrationsPage /></ProtectedRoute>
      </Route>
      <Route path="/copilot">
        <ProtectedRoute><AICopilotPage /></ProtectedRoute>
      </Route>
      <Route path="/marketplace">
        <ProtectedRoute><AgentMarketplacePage /></ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute><WalletBillingPage /></ProtectedRoute>
      </Route>
      <Route path="/privacy">
        <ProtectedRoute><PrivacySecurityPage /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute><AdminPanelPage /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <Router />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;

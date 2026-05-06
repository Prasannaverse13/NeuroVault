import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/agents/new" component={AgentCreationPage} />
      <Route path="/memory" component={MemoryIntelligencePage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/copilot" component={AICopilotPage} />
      <Route path="/marketplace" component={AgentMarketplacePage} />
      <Route path="/billing" component={WalletBillingPage} />
      <Route path="/privacy" component={PrivacySecurityPage} />
      <Route path="/admin" component={AdminPanelPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

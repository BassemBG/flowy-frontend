import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import WhatsAppAgent from "./pages/WhatsAppAgent";
import Glossary from "./pages/Glossary";
import Translation from "./pages/Translation";
import Skills from "./pages/Skills";
import NoteKeeper from "./pages/NoteKeeper";
import Shadowing from "./pages/Shadowing";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/whatsapp-agent" element={<WhatsAppAgent />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/translation" element={<Translation />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/notekeeper" element={<NoteKeeper />} />
            <Route path="/shadowing" element={<Shadowing />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

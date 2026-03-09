import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Recipes from "./pages/Recipes";
import Feed from "./pages/Feed";
import ShoppingList from "./pages/ShoppingList";
import MealPlans from "./pages/MealPlans";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Recipes /></Layout>} />
          <Route path="/feed" element={<Layout><Feed /></Layout>} />
          <Route path="/shopping-list" element={<Layout><ShoppingList /></Layout>} />
          <Route path="/meal-plans" element={<Layout><MealPlans /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;

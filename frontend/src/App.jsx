import AppRouter from "@/routes/AppRouter";
import { GamificationProvider } from "@/contexts/GamificationContext";
import "@/i18n";

const App = () => (
  <GamificationProvider>
    <AppRouter />
  </GamificationProvider>
);

export default App;

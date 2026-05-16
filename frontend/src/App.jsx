import AppRouter from "@/routes/AppRouter";
import { NotificationProvider } from "@/contexts/NotificationContext";
import "@/i18n";

const App = () => (
  <NotificationProvider>
    <AppRouter />
  </NotificationProvider>
);

export default App;

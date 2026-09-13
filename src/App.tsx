import { AppointmentProvider } from "./context/AppointmentContext";
import { AuthStateSync } from "./routes/AuthStateSync";
import { AppRoutes } from "./routes/AppRoutes";
import "./styles/global.css";

function App() {
    return (
        <AppointmentProvider>
            <AuthStateSync />
            <AppRoutes />
        </AppointmentProvider>
    );
}

export default App;

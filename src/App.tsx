import { AppErrorBoundary } from "./components/ErrorBoundary/AppErrorBoundary";
import { AppointmentProvider } from "./context/AppointmentContext";
import { AxiosAuthProvider } from "./providers/AxiosAuthProvider";
import { AuthStateSync } from "./routes/AuthStateSync";
import { AppRoutes } from "./routes/AppRoutes";
import "./styles/global.css";

function App() {
    return (
        <AppErrorBoundary>
            <AppointmentProvider>
                <AxiosAuthProvider>
                    <AuthStateSync />
                    <AppRoutes />
                </AxiosAuthProvider>
            </AppointmentProvider>
        </AppErrorBoundary>
    );
}

export default App;

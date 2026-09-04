import { AppointmentProvider } from "./context/AppointmentContext";
import { AppRoutes } from "./routes/AppRoutes";
import "./styles/global.css";

function App() {
    return (
        <AppointmentProvider>
            <AppRoutes />
        </AppointmentProvider>
    );
}

export default App;

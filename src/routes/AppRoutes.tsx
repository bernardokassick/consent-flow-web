import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { AppointmentFillPage } from "../pages/AppointmentFill/AppointmentFillPage";
import { AppointmentResultPage } from "../pages/AppointmentResult/AppointmentResultPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { NewAppointmentPage } from "../pages/NewAppointment/NewAppointmentPage";

export function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route
                        path="/agendamento/novo"
                        element={<NewAppointmentPage />}
                    />
                    <Route
                        path="/agendamento/preenchimento"
                        element={<AppointmentFillPage />}
                    />
                    <Route
                        path="/agendamento/resultado"
                        element={<AppointmentResultPage />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

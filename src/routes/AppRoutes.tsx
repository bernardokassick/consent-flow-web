import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { AppointmentFillPage } from "../pages/AppointmentFill/AppointmentFillPage";
import { AppointmentReviewPage } from "../pages/AppointmentReview/AppointmentReviewPage";
import { AppointmentResultPage } from "../pages/AppointmentResult/AppointmentResultPage";
import { AppointmentSignaturePage } from "../pages/AppointmentSignature/AppointmentSignaturePage";
import { ConsentsPage } from "../pages/Consents/ConsentsPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { LoginPage } from "../pages/Login/LoginPage";
import { NewAppointmentPage } from "../pages/NewAppointment/NewAppointmentPage";
import { appPaths } from "./appPaths";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={`${appPaths.login}/*`} element={<LoginPage />} />
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        path="/"
                        element={<Navigate to={appPaths.dashboard} replace />}
                    />
                    <Route path={appPaths.dashboard} element={<DashboardPage />} />
                    <Route path={appPaths.consents} element={<ConsentsPage />} />
                    <Route
                        path={appPaths.appointment.select}
                        element={<NewAppointmentPage />}
                    />
                    <Route
                        path={appPaths.appointment.fill}
                        element={<AppointmentFillPage />}
                    />
                    <Route
                        path={appPaths.appointment.review}
                        element={<AppointmentReviewPage />}
                    />
                    <Route
                        path={appPaths.appointment.signature}
                        element={<AppointmentSignaturePage />}
                    />
                    <Route
                        path={appPaths.appointment.result}
                        element={<AppointmentResultPage />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

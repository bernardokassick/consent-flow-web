import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { AppointmentFillPage } from "../pages/AppointmentFill/AppointmentFillPage";
import { AppointmentReviewPage } from "../pages/AppointmentReview/AppointmentReviewPage";
import { AppointmentResultPage } from "../pages/AppointmentResult/AppointmentResultPage";
import { AppointmentSignaturePage } from "../pages/AppointmentSignature/AppointmentSignaturePage";
import { ConsentsPage } from "../pages/Consents/ConsentsPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { NewAppointmentPage } from "../pages/NewAppointment/NewAppointmentPage";
import { appPaths } from "./appPaths";

export function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
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

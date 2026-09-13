import { UserButton } from "@clerk/react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import "./AppHeader.css";

const navItems = [
    {
        label: "Dashboard",
        path: appPaths.dashboard,
    },
    {
        label: "Consentimentos",
        path: appPaths.consents,
    },
];

export function AppHeader() {
    const location = useLocation();
    const { resetAppointment } = useAppointment();
    const isAppointmentFlow = location.pathname.startsWith("/agendamento");

    function resetAppointmentFlowIfNeeded() {
        if (isAppointmentFlow) {
            resetAppointment();
        }
    }

    return (
        <header className="app-header">
            <Link
                aria-label="PivattoDocs"
                className="brand"
                onClick={resetAppointmentFlowIfNeeded}
                to={appPaths.dashboard}
            >
                PivattoDocs
            </Link>

            <nav className="main-nav" aria-label="Navegacao principal">
                {navItems.map((item) => (
                    <NavLink
                        className={({ isActive }) => (isActive ? "active" : "")}
                        key={item.path}
                        onClick={
                            item.path === appPaths.dashboard
                                ? resetAppointmentFlowIfNeeded
                                : undefined
                        }
                        to={item.path}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="header-actions" aria-label="Acoes da conta">
                {/* <button aria-label="Notificacoes" className="icon-button">
                    <span className="notification-dot" />
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16z" />
                        <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
                    </svg>
                </button>
                <button aria-label="Configuracoes" className="icon-button">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                        <path d="m19.4 15 .1.1 1.4 1.1-2 3.5-1.7-.7-.2-.1a7.9 7.9 0 0 1-1.7 1l-.2.1-.3 1.8h-4l-.3-1.8-.2-.1a7.9 7.9 0 0 1-1.7-1l-.2.1-1.7.7-2-3.5 1.4-1.1.1-.1a7.8 7.8 0 0 1 0-2l-.1-.1-1.4-1.1 2-3.5 1.7.7.2.1a7.9 7.9 0 0 1 1.7-1l.2-.1.3-1.8h4l.3 1.8.2.1a7.9 7.9 0 0 1 1.7 1l.2-.1 1.7-.7 2 3.5-1.4 1.1-.1.1a7.8 7.8 0 0 1 0 2z" />
                    </svg>
                </button> */}
                <UserButton />
            </div>
        </header>
    );
}

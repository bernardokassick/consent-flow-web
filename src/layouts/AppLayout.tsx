import { Outlet } from "react-router-dom";

import { AppFooter } from "../components/AppFooter/AppFooter";
import { AppHeader } from "../components/AppHeader/AppHeader";

export function AppLayout() {
    return (
        <div className="app-shell">
            <AppHeader />
            <main>
                <Outlet />
            </main>
            <AppFooter />
        </div>
    );
}

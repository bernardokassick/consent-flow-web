import { useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

import { appPaths } from "./appPaths";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return <div className="auth-loading">Carregando autenticação...</div>;
    }

    if (!isSignedIn) {
        return <Navigate to={appPaths.login} replace />;
    }

    return children;
}

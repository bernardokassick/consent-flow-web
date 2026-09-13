import { SignIn, useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

import { appPaths } from "../../routes/appPaths";
import "./LoginPage.css";

export function LoginPage() {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return <div className="auth-loading">Carregando autenticação...</div>;
    }

    if (isSignedIn) {
        return <Navigate to={appPaths.dashboard} replace />;
    }

    return (
        <main className="login-page">
            <section className="login-panel">
                <div className="login-brand">
                    <span>PivattoDocs</span>
                    <h1>Acesse sua conta</h1>
                    <p>Entre para gerenciar consentimentos e atendimentos.</p>
                </div>

                <SignIn
                    fallbackRedirectUrl={appPaths.dashboard}
                    path={appPaths.login}
                    routing="path"
                />
            </section>
        </main>
    );
}

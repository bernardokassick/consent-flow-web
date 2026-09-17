import { SignIn, useAuth } from "@clerk/react";
import { Navigate, useSearchParams } from "react-router-dom";

import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";
import { appPaths } from "../../routes/appPaths";
import "./LoginPage.css";

export function LoginPage() {
    const [searchParams] = useSearchParams();
    const { isLoaded, isSignedIn } = useAuth();
    const hasExpiredSession = searchParams.get("sessionExpired") === "1";

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

                {hasExpiredSession ? (
                    <ErrorMessage message="Sua sessão expirou. Entre novamente para continuar." />
                ) : null}

                <SignIn
                    fallbackRedirectUrl={appPaths.dashboard}
                    path={appPaths.login}
                    routing="path"
                />
            </section>
        </main>
    );
}

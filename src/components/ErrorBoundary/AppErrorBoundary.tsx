import { Component, type ErrorInfo, type ReactNode } from "react";

import { appPaths } from "../../routes/appPaths";
import "./AppErrorBoundary.css";

interface AppErrorBoundaryProps {
    children: ReactNode;
}

interface AppErrorBoundaryState {
    hasError: boolean;
}

export class AppErrorBoundary extends Component<
    AppErrorBoundaryProps,
    AppErrorBoundaryState
> {
    state: AppErrorBoundaryState = {
        hasError: false,
    };

    static getDerivedStateFromError(): AppErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <main className="app-error-boundary-page">
                    <section className="app-error-boundary-card">
                        <h1>Não foi possível exibir esta página.</h1>
                        <p>Você pode voltar ao Dashboard e tentar novamente.</p>
                        <button
                            onClick={() => {
                                window.location.assign(appPaths.dashboard);
                            }}
                            type="button"
                        >
                            Voltar ao Dashboard
                        </button>
                    </section>
                </main>
            );
        }

        return this.props.children;
    }
}

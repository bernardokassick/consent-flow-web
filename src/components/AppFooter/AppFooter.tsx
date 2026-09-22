import "./AppFooter.css";

export function AppFooter() {
    return (
        <footer className="app-footer">
            <div className="app-footer-content">
                <div className="app-footer-identity">
                    <strong>PivattoDocs</strong>
                    <span aria-hidden="true">·</span>
                    <span>Gestão digital de termos e consentimentos</span>
                </div>
                <p>© 2026 Clínica Pivatto. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
}

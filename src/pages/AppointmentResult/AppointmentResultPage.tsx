import { useNavigate } from "react-router-dom";

import { useAppointment } from "../../hooks/useAppointment";
import "./AppointmentResultPage.css";

export function AppointmentResultPage() {
    const navigate = useNavigate();
    const { generatedDocuments, resetAppointment, selectedTemplates } =
        useAppointment();

    function downloadDocuments() {
        if (!generatedDocuments) {
            return;
        }

        const downloadUrl = URL.createObjectURL(generatedDocuments);
        const downloadLink = document.createElement("a");

        downloadLink.href = downloadUrl;
        downloadLink.download = "documentos-preenchidos.zip";
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(downloadUrl);
    }

    function goToDashboard() {
        resetAppointment();
        navigate("/dashboard");
    }

    if (!generatedDocuments) {
        return (
            <section className="appointment-result-page">
                <div className="appointment-result-card">
                    <h1>Nenhum documento gerado foi encontrado.</h1>
                    <button
                        className="appointment-result-primary-button"
                        onClick={() => navigate("/agendamento/novo")}
                        type="button"
                    >
                        Voltar para novo agendamento
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="appointment-result-page">
            <div className="appointment-result-card success">
                <div className="success-icon" aria-hidden="true">
                    ✓
                </div>

                <div className="appointment-result-content">
                    <h1>Documentos gerados com sucesso</h1>
                    <p>
                        Os termos selecionados foram preenchidos e estão prontos
                        para download.
                    </p>
                    <span>
                        {selectedTemplates.length} documento(s) processado(s)
                    </span>
                </div>

                <div className="appointment-result-actions">
                    <button
                        className="appointment-result-secondary-button"
                        onClick={goToDashboard}
                        type="button"
                    >
                        Voltar ao Dashboard
                    </button>
                    <button
                        className="appointment-result-secondary-button"
                        onClick={() => navigate("/agendamento/preenchimento")}
                        type="button"
                    >
                        Editar dados
                    </button>
                    <button
                        className="appointment-result-primary-button"
                        onClick={downloadDocuments}
                        type="button"
                    >
                        Baixar documentos
                    </button>
                </div>
            </div>
        </section>
    );
}

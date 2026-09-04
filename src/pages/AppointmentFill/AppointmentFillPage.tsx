import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppointment } from "../../hooks/useAppointment";
import { fillMultiplePdfs } from "../../services/pdfService";
import "./AppointmentFillPage.css";

function formatFieldLabel(field: string) {
    const fieldWithSpaces = field.replaceAll("_", " ").trim();

    return fieldWithSpaces.charAt(0).toUpperCase() + fieldWithSpaces.slice(1);
}

export function AppointmentFillPage() {
    const navigate = useNavigate();
    const {
        fields,
        selectedTemplates,
        setGeneratedDocuments,
        setValues,
        values,
    } = useAppointment();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasAppointmentData =
        selectedTemplates.length > 0 && fields.length > 0;

    function updateFieldValue(field: string, value: string) {
        setValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
    }

    async function handleGenerateDocuments() {
        if (!hasAppointmentData) {
            return;
        }

        try {
            setIsGenerating(true);
            setError(null);

            const zipBlob = await fillMultiplePdfs(selectedTemplates, values);
            setGeneratedDocuments(zipBlob);
            navigate("/agendamento/resultado");
        } catch (generateError) {
            console.error(generateError);
            setError("Não foi possível gerar os documentos. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    }

    if (!hasAppointmentData) {
        return (
            <section className="appointment-fill-page">
                <div className="appointment-fill-empty-card">
                    <h1>Nenhum dado de agendamento foi encontrado.</h1>
                    <button
                        className="generate-documents-button"
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
        <section className="appointment-fill-page">
            <div className="appointment-fill-heading">
                <h1>Preenchimento do Agendamento</h1>
                <p>Informe os dados que serao usados nos documentos selecionados.</p>
            </div>

            <div className="appointment-fill-card">
                <div className="appointment-fill-card-header">
                    <h2>Dados dos documentos</h2>
                    <p>Preencha os campos encontrados nos termos de consentimento.</p>
                </div>

                <div className="appointment-field-list">
                    {fields.map((field) => (
                        <div className="appointment-field" key={field}>
                            <label htmlFor={`appointment-field-${field}`}>
                                {formatFieldLabel(field)}
                            </label>
                            <input
                                id={`appointment-field-${field}`}
                                onChange={(event) =>
                                    updateFieldValue(field, event.target.value)
                                }
                                type="text"
                                value={values[field] ?? ""}
                            />
                        </div>
                    ))}
                </div>

                <div className="appointment-fill-actions">
                    <button
                        className="back-button"
                        onClick={() => navigate(-1)}
                        type="button"
                    >
                        Voltar
                    </button>
                    <button
                        className="generate-documents-button"
                        disabled={isGenerating}
                        onClick={handleGenerateDocuments}
                        type="button"
                    >
                        {isGenerating ? "Gerando documentos..." : "Gerar documentos"}
                    </button>
                </div>
                {error ? <p className="appointment-fill-error">{error}</p> : null}
            </div>
        </section>
    );
}

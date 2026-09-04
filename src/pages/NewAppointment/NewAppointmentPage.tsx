import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppointment } from "../../hooks/useAppointment";
import { getPdfFields, getPdfTemplates } from "../../services/pdfService";
import type { PdfTemplate } from "../../types/PdfTemplate";
import "./NewAppointmentPage.css";

export function NewAppointmentPage() {
    const navigate = useNavigate();
    const { selectedTemplates, setFields, setSelectedTemplates } =
        useAppointment();
    const [templates, setTemplates] = useState<PdfTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [templatesError, setTemplatesError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTemplates() {
            try {
                setIsLoadingTemplates(true);
                setTemplatesError(null);

                const data = await getPdfTemplates();
                const availableTemplateIds = new Set(
                    data.map((template) => template.id),
                );

                setTemplates(data);
                setSelectedTemplates((currentTemplates) =>
                    currentTemplates.filter((templateId) =>
                        availableTemplateIds.has(templateId),
                    ),
                );
            } catch (error) {
                console.error(error);
                setTemplatesError(
                    "Não foi possível carregar os termos de consentimento.",
                );
            } finally {
                setIsLoadingTemplates(false);
            }
        }

        loadTemplates();
    }, [setSelectedTemplates]);

    function toggleTemplate(templateId: string) {
        setSelectedTemplates((currentTemplates) => {
            if (currentTemplates.includes(templateId)) {
                return currentTemplates.filter((id) => id !== templateId);
            }

            return [...currentTemplates, templateId];
        });
    }

    async function handleContinue() {
        const fields = await getPdfFields(selectedTemplates);

        setFields(fields);
        navigate("/agendamento/preenchimento");
    }

    return (
        <section className="new-appointment-page">
            <div className="new-appointment-heading">
                <h1>Novo Agendamento</h1>
                <p>
                    Crie um novo agendamento e selecione os termos de
                    consentimento.
                </p>
            </div>

            <div className="template-selection-card">
                <div className="template-selection-header">
                    <h2>Selecione os termos de consentimento</h2>
                    <p>
                        Escolha quais documentos serao usados neste agendamento.
                    </p>
                </div>

                {isLoadingTemplates ? (
                    <p className="template-status-message">
                        Carregando termos de consentimento...
                    </p>
                ) : null}

                {templatesError ? (
                    <p className="template-status-message error">
                        {templatesError}
                    </p>
                ) : null}

                {!isLoadingTemplates &&
                !templatesError &&
                templates.length === 0 ? (
                    <p className="template-status-message">
                        Nenhum termo de consentimento disponível.
                    </p>
                ) : null}

                {!isLoadingTemplates &&
                !templatesError &&
                templates.length > 0 ? (
                    <div className="template-list">
                        {templates.map((template) => {
                            const isSelected = selectedTemplates.includes(
                                template.id,
                            );

                            return (
                                <label
                                    className={
                                        isSelected
                                            ? "template-option selected"
                                            : "template-option"
                                    }
                                    key={template.id}
                                >
                                    <input
                                        checked={isSelected}
                                        onChange={() =>
                                            toggleTemplate(template.id)
                                        }
                                        type="checkbox"
                                    />
                                    <span className="template-option-content">
                                        <strong>{template.name}</strong>
                                        <span className="template-file-name">
                                            {template.id}
                                        </span>
                                        <span>{template.description}</span>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                ) : null}

                <button
                    className="continue-button"
                    disabled={
                        selectedTemplates.length === 0 ||
                        isLoadingTemplates ||
                        Boolean(templatesError)
                    }
                    onClick={handleContinue}
                    type="button"
                >
                    Continuar
                </button>
            </div>
        </section>
    );
}

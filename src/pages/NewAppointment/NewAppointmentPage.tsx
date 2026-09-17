import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import { getPdfFields, getPdfTemplates } from "../../services/pdfService";
import type { PdfTemplate } from "../../types/PdfTemplate";
import { getApiErrorMessage, isRequestCanceled } from "../../utils/apiError";
import "./NewAppointmentPage.css";

export function NewAppointmentPage() {
    const navigate = useNavigate();
    const { selectedTemplates, setFields, setSelectedTemplates } =
        useAppointment();
    const [templates, setTemplates] = useState<PdfTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [templatesError, setTemplatesError] = useState<string | null>(null);
    const [continueError, setContinueError] = useState<string | null>(null);
    const [isContinuing, setIsContinuing] = useState(false);
    const isLoadingTemplatesRef = useRef(false);
    const templatesRequestIdRef = useRef(0);
    const isContinuingRef = useRef(false);

    async function loadTemplates(signal?: AbortSignal) {
        if (isLoadingTemplatesRef.current) {
            return;
        }

        const requestId = templatesRequestIdRef.current + 1;

        templatesRequestIdRef.current = requestId;

        try {
            isLoadingTemplatesRef.current = true;
            setIsLoadingTemplates(true);
            setTemplatesError(null);

            const data = await getPdfTemplates(signal);

            if (signal?.aborted || requestId !== templatesRequestIdRef.current) {
                return;
            }

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
            if (isRequestCanceled(error)) {
                return;
            }

            if (requestId !== templatesRequestIdRef.current) {
                return;
            }

            console.error(error);
            setTemplatesError(
                getApiErrorMessage(
                    error,
                    "Não foi possível carregar os termos de consentimento.",
                ),
            );
        } finally {
            if (requestId === templatesRequestIdRef.current) {
                isLoadingTemplatesRef.current = false;
                setIsLoadingTemplates(false);
            }
        }
    }

    useEffect(() => {
        const controller = new AbortController();

        loadTemplates(controller.signal);

        return () => {
            isLoadingTemplatesRef.current = false;
            controller.abort();
        };
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
        if (isContinuingRef.current) {
            return;
        }

        try {
            isContinuingRef.current = true;
            setIsContinuing(true);
            setContinueError(null);

            const fields = await getPdfFields(selectedTemplates);

            setFields(fields);
            navigate(appPaths.appointment.fill);
        } catch (error) {
            console.error(error);
            setContinueError(
                getApiErrorMessage(
                    error,
                    "Não foi possível carregar os campos dos documentos.",
                ),
            );
        } finally {
            isContinuingRef.current = false;
            setIsContinuing(false);
        }
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
                        <LoadingSpinner /> Carregando termos de consentimento...
                    </p>
                ) : null}

                {templatesError ? (
                    <ErrorMessage
                        actionDisabled={isLoadingTemplates}
                        actionLabel={
                            isLoadingTemplates ? "Carregando..." : "Tentar novamente"
                        }
                        message={templatesError}
                        onAction={loadTemplates}
                    />
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
                        Boolean(templatesError) ||
                        isContinuing
                    }
                    onClick={handleContinue}
                    type="button"
                >
                    {isContinuing ? (
                        <>
                            <LoadingSpinner /> Carregando...
                        </>
                    ) : (
                        "Continuar"
                    )}
                </button>
                {continueError ? <ErrorMessage message={continueError} /> : null}
            </div>
        </section>
    );
}

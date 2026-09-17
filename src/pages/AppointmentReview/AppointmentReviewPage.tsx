import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import {
    getPdfTemplates,
    previewPdf,
} from "../../services/pdfService";
import type { PdfTemplate } from "../../types/PdfTemplate";
import { getApiErrorMessage, isRequestCanceled } from "../../utils/apiError";
import "./AppointmentReviewPage.css";

export function AppointmentReviewPage() {
    const navigate = useNavigate();
    const { fields, selectedTemplates, values } = useAppointment();
    const [templates, setTemplates] = useState<PdfTemplate[]>([]);
    const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<
        string | null
    >(selectedTemplates[0] ?? null);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [templatesError, setTemplatesError] = useState<string | null>(null);
    const isLoadingTemplatesRef = useRef(false);
    const templatesRequestIdRef = useRef(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewUrlRef = useRef<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [previewRetryKey, setPreviewRetryKey] = useState(0);
    const abortPreviewRef = useRef<AbortController | null>(null);
    const hasAppointmentData =
        selectedTemplates.length > 0 && fields.length > 0;

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

            setTemplates(
                data.filter((template) => selectedTemplates.includes(template.id)),
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
                    "Não foi possível carregar os termos selecionados.",
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
        if (!hasAppointmentData) {
            return;
        }

        const controller = new AbortController();

        loadTemplates(controller.signal);

        return () => {
            isLoadingTemplatesRef.current = false;
            controller.abort();
        };
    }, [hasAppointmentData, selectedTemplates]);

    const selectedTemplate = useMemo(
        () =>
            templates.find((template) => template.id === selectedPreviewTemplate) ??
            null,
        [selectedPreviewTemplate, templates],
    );

    useEffect(() => {
        if (!selectedPreviewTemplate || !hasAppointmentData) {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }

            return;
        }

        const templateId = selectedPreviewTemplate;
        const controller = new AbortController();

        abortPreviewRef.current?.abort();
        abortPreviewRef.current = controller;

        async function loadPreview() {
            try {
                if (previewUrlRef.current) {
                    URL.revokeObjectURL(previewUrlRef.current);
                    previewUrlRef.current = null;
                }

                setPreviewUrl(null);
                setIsLoadingPreview(true);
                setPreviewError(null);

                const previewBlob = await previewPdf(
                    templateId,
                    values,
                    controller.signal,
                );

                if (controller.signal.aborted) {
                    return;
                }

                const nextPreviewUrl = URL.createObjectURL(previewBlob);

                previewUrlRef.current = nextPreviewUrl;
                setPreviewUrl(nextPreviewUrl);
            } catch (error) {
                if (isRequestCanceled(error)) {
                    return;
                }

                console.error(error);

                if (previewUrlRef.current) {
                    URL.revokeObjectURL(previewUrlRef.current);
                    previewUrlRef.current = null;
                }

                setPreviewUrl(null);
                setPreviewError(
                    getApiErrorMessage(
                        error,
                        "Não foi possível carregar a visualização deste documento.",
                    ),
                );
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingPreview(false);
                }
            }
        }

        loadPreview();

        return () => {
            controller.abort();
        };
    }, [hasAppointmentData, previewRetryKey, selectedPreviewTemplate, values]);

    useEffect(
        () => () => {
            abortPreviewRef.current?.abort();

            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
        },
        [],
    );


    if (!hasAppointmentData) {
        return (
            <section className="appointment-review-page">
                <div className="appointment-review-empty-card">
                    <h1>Nenhum dado de agendamento foi encontrado.</h1>
                    <button
                        className="review-primary-button"
                        onClick={() => navigate(appPaths.appointment.select)}
                        type="button"
                    >
                        Voltar para novo agendamento
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="appointment-review-page">
            <div className="appointment-review-heading">
                <span>Revisão dos documentos</span>
                <h1>Revise os termos</h1>
                <p>
                    Confira os documentos selecionados antes de seguir para a
                    assinatura do paciente.
                </p>
            </div>

            <div className="appointment-review-layout">
                <aside className="review-document-list-card">
                    <div className="review-card-header">
                        <h2>Documentos selecionados</h2>
                        <p>Clique em um termo para visualizar o PDF.</p>
                    </div>

                    {isLoadingTemplates ? (
                        <p className="review-status-message">
                            <LoadingSpinner /> Carregando documentos...
                        </p>
                    ) : null}

                    {templatesError ? (
                        <ErrorMessage
                            actionDisabled={isLoadingTemplates}
                            actionLabel={
                                isLoadingTemplates
                                    ? "Carregando..."
                                    : "Tentar novamente"
                            }
                            message={templatesError}
                            onAction={loadTemplates}
                        />
                    ) : null}

                    {!isLoadingTemplates &&
                    !templatesError &&
                    templates.length === 0 ? (
                        <p className="review-status-message">
                            Nenhum documento selecionado foi encontrado.
                        </p>
                    ) : null}

                    {!isLoadingTemplates &&
                    !templatesError &&
                    templates.length > 0 ? (
                        <div className="review-document-list">
                            {templates.map((template) => {
                                const isSelected =
                                    selectedPreviewTemplate === template.id;

                                return (
                                    <button
                                        className={
                                            isSelected
                                                ? "review-document-item selected"
                                                : "review-document-item"
                                        }
                                        key={template.id}
                                        disabled={isLoadingPreview && isSelected}
                                        onClick={() =>
                                            setSelectedPreviewTemplate(template.id)
                                        }
                                        type="button"
                                    >
                                        <span className="review-document-icon">
                                            PDF
                                        </span>
                                        <span>
                                            <strong>{template.name}</strong>
                                            <small>{template.id}</small>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}

                    <div className="review-info-message">
                        Leia todos os termos antes de seguir para a assinatura.
                    </div>
                </aside>

                <div className="review-preview-card">
                    <div className="review-preview-header">
                        <div>
                            <h2>
                                {selectedTemplate?.name ??
                                    "Visualização do documento"}
                            </h2>
                            <p>
                                {selectedTemplate?.description ??
                                    "Selecione um termo para visualizar."}
                            </p>
                        </div>

                        {previewUrl && !isLoadingPreview && !previewError ? (
                            <a
                                className="review-open-link"
                                href={previewUrl}
                                rel="noreferrer"
                                target="_blank"
                            >
                                Abrir PDF
                            </a>
                        ) : null}
                    </div>

                    <div className="review-pdf-frame">
                        {isLoadingPreview ? (
                            <p>
                                <LoadingSpinner /> Carregando documento...
                            </p>
                        ) : null}

                        {previewError ? (
                            <ErrorMessage
                                actionDisabled={isLoadingPreview}
                                actionLabel={
                                    isLoadingPreview
                                        ? "Carregando..."
                                        : "Tentar novamente"
                                }
                                message={previewError}
                                onAction={() =>
                                    setPreviewRetryKey((currentKey) => currentKey + 1)
                                }
                            />
                        ) : null}

                        {previewUrl && !isLoadingPreview && !previewError ? (
                            <iframe
                                src={previewUrl}
                                title={
                                    selectedTemplate?.name ??
                                    "Preview do documento PDF"
                                }
                            />
                        ) : null}

                        {!previewUrl && !isLoadingPreview && !previewError ? (
                            <p>Selecione um documento para visualizar.</p>
                        ) : null}
                    </div>

                    <div className="appointment-review-actions">
                        <button
                            className="review-secondary-button"
                            onClick={() => navigate(appPaths.appointment.fill)}
                            type="button"
                        >
                            Voltar
                        </button>
                        <button
                            className="review-primary-button"
                            disabled={!previewUrl}
                            onClick={() => navigate(appPaths.appointment.signature)}
                            type="button"
                        >
                            Seguir para assinatura
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import {
    getPdfTemplates,
    previewPdf,
} from "../../services/pdfService";
import type { PdfTemplate } from "../../types/PdfTemplate";
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
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewUrlRef = useRef<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const hasAppointmentData =
        selectedTemplates.length > 0 && fields.length > 0;

    useEffect(() => {
        if (!hasAppointmentData) {
            return;
        }

        async function loadTemplates() {
            try {
                setIsLoadingTemplates(true);
                setTemplatesError(null);

                const data = await getPdfTemplates();

                setTemplates(
                    data.filter((template) =>
                        selectedTemplates.includes(template.id),
                    ),
                );
            } catch (error) {
                console.error(error);
                setTemplatesError(
                    "Não foi possível carregar os termos selecionados.",
                );
            } finally {
                setIsLoadingTemplates(false);
            }
        }

        loadTemplates();
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
        let shouldIgnorePreview = false;

        async function loadPreview() {
            try {
                if (previewUrlRef.current) {
                    URL.revokeObjectURL(previewUrlRef.current);
                    previewUrlRef.current = null;
                }

                setPreviewUrl(null);
                setIsLoadingPreview(true);
                setPreviewError(null);

                const previewBlob = await previewPdf(templateId, values);

                if (shouldIgnorePreview) {
                    return;
                }

                const nextPreviewUrl = URL.createObjectURL(previewBlob);

                previewUrlRef.current = nextPreviewUrl;
                setPreviewUrl(nextPreviewUrl);
            } catch (error) {
                console.error(error);

                if (!shouldIgnorePreview) {
                    if (previewUrlRef.current) {
                        URL.revokeObjectURL(previewUrlRef.current);
                        previewUrlRef.current = null;
                    }

                    setPreviewUrl(null);
                    setPreviewError(
                        "Não foi possível carregar o preview deste documento.",
                    );
                }
            } finally {
                if (!shouldIgnorePreview) {
                    setIsLoadingPreview(false);
                }
            }
        }

        loadPreview();

        return () => {
            shouldIgnorePreview = true;
        };
    }, [hasAppointmentData, selectedPreviewTemplate, values]);

    useEffect(
        () => () => {
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
                            Carregando documentos...
                        </p>
                    ) : null}

                    {templatesError ? (
                        <p className="review-status-message error">
                            {templatesError}
                        </p>
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
                            <p>Gerando preview do documento...</p>
                        ) : null}

                        {previewError ? (
                            <p className="review-preview-error">{previewError}</p>
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

import { useCallback, useEffect, useRef, useState } from "react";

import {
    getPdfTemplates,
    getTemplatePreview,
} from "../../services/pdfService";
import type { PdfTemplate } from "../../types/PdfTemplate";
import "./ConsentsPage.css";

export function ConsentsPage() {
    const [templates, setTemplates] = useState<PdfTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<PdfTemplate | null>(
        null,
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewUrlRef = useRef<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const revokePreviewUrl = useCallback(() => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
    }, []);

    const closePreviewModal = useCallback(() => {
        revokePreviewUrl();
        setPreviewUrl(null);
        setPreviewError(null);
        setPreviewTemplate(null);
    }, [revokePreviewUrl]);

    useEffect(() => {
        async function loadTemplates() {
            try {
                setIsLoading(true);
                setError(null);

                const data = await getPdfTemplates();

                setTemplates(data);
            } catch (loadError) {
                console.error(loadError);
                setError("Não foi possível carregar os consentimentos.");
            } finally {
                setIsLoading(false);
            }
        }

        loadTemplates();
    }, []);

    useEffect(() => {
        if (!previewTemplate) {
            return;
        }

        const templateId = previewTemplate.id;
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

                const previewBlob = await getTemplatePreview(templateId);

                if (shouldIgnorePreview) {
                    return;
                }

                const nextPreviewUrl = URL.createObjectURL(previewBlob);

                previewUrlRef.current = nextPreviewUrl;
                setPreviewUrl(nextPreviewUrl);
            } catch (previewLoadError) {
                console.error(previewLoadError);

                if (!shouldIgnorePreview) {
                    setPreviewError("Não foi possível carregar este consentimento.");
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
    }, [previewTemplate]);

    useEffect(() => {
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closePreviewModal();
            }
        }

        if (previewTemplate) {
            document.addEventListener("keydown", closeOnEscape);
        }

        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [closePreviewModal, previewTemplate]);

    useEffect(
        () => () => {
            revokePreviewUrl();
        },
        [revokePreviewUrl],
    );

    function openPreviewModal(template: PdfTemplate) {
        setPreviewTemplate(template);
    }

    return (
        <section className="consents-page">
            <div className="consents-heading">
                <h1>Consentimentos</h1>
                <p>Consulte os termos de consentimento disponíveis no sistema.</p>
            </div>

            {isLoading ? (
                <p className="consents-status-message">
                    Carregando consentimentos...
                </p>
            ) : null}

            {error ? (
                <p className="consents-status-message error">{error}</p>
            ) : null}

            {!isLoading && !error && templates.length === 0 ? (
                <p className="consents-status-message">
                    Nenhum consentimento cadastrado.
                </p>
            ) : null}

            {!isLoading && !error && templates.length > 0 ? (
                <div className="consents-list">
                    {templates.map((template) => (
                        <article className="consent-card" key={template.id}>
                            <div className="consent-icon" aria-hidden="true">
                                PDF
                            </div>
                            <div className="consent-content">
                                <h2>{template.name}</h2>
                                <span>{template.id}</span>
                                <p>{template.description}</p>
                            </div>
                            <button
                                className="consent-preview-button"
                                onClick={() => openPreviewModal(template)}
                                type="button"
                            >
                                Visualizar
                            </button>
                        </article>
                    ))}
                </div>
            ) : null}

            {previewTemplate ? (
                <div className="consent-modal-backdrop">
                    <div
                        aria-labelledby="consent-preview-title"
                        aria-modal="true"
                        className="consent-preview-modal"
                        role="dialog"
                    >
                        <div className="consent-modal-header">
                            <div>
                                <h2 id="consent-preview-title">
                                    {previewTemplate.name}
                                </h2>
                                <p>{previewTemplate.id}</p>
                            </div>
                            <button
                                aria-label="Fechar visualização"
                                className="consent-modal-close-button"
                                onClick={closePreviewModal}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <div className="consent-modal-body">
                            {isLoadingPreview ? (
                                <p>Carregando documento...</p>
                            ) : null}

                            {previewError ? (
                                <p className="consent-preview-error">
                                    {previewError}
                                </p>
                            ) : null}

                            {previewUrl && !isLoadingPreview && !previewError ? (
                                <iframe
                                    src={previewUrl}
                                    title={`Preview de ${previewTemplate.name}`}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

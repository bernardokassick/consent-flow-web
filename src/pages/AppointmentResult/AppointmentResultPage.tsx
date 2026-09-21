import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import {
    downloadDocumentGeneration,
    emailDocumentGeneration,
} from "../../services/pdfService";
import { getApiErrorCode, getApiErrorMessage, getApiErrorStatus } from "../../utils/apiError";
import "./AppointmentResultPage.css";

export function AppointmentResultPage() {
    const navigate = useNavigate();
    const { generatedDocuments, resetAppointment, selectedTemplates, values } =
        useAppointment();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [recipientEmailError, setRecipientEmailError] = useState<string | null>(
        null,
    );
    const [emailSendError, setEmailSendError] = useState<string | null>(null);
    const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(
        null,
    );
    const [documentActionError, setDocumentActionError] = useState<string | null>(
        null,
    );
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const recipientInputRef = useRef<HTMLInputElement>(null);
    const emailTriggerRef = useRef<HTMLButtonElement>(null);

    const trimmedRecipientEmail = recipientEmail.trim();
    const canSendEmail =
        isValidEmail(trimmedRecipientEmail) && !isSendingEmail;

    useEffect(() => {
        if (!isEmailModalOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !isSendingEmail) {
                closeEmailModal();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        recipientInputRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isEmailModalOpen, isSendingEmail]);

    async function downloadDocuments() {
        if (!generatedDocuments) {
            return;
        }

        try {
            setDocumentActionError(null);
            setIsDownloading(true);

            const generatedZip = await downloadDocumentGeneration(
                generatedDocuments.generationId,
            );
            const downloadUrl = URL.createObjectURL(generatedZip.blob);
            const downloadLink = document.createElement("a");

            downloadLink.href = downloadUrl;
            downloadLink.download = generatedZip.filename || "documentos.zip";
            document.body.append(downloadLink);
            downloadLink.click();
            downloadLink.remove();
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error(error);
            setDocumentActionError(
                getDocumentGenerationErrorMessage(
                    error,
                    "Não foi possível baixar os documentos. Tente novamente.",
                ),
            );
        } finally {
            setIsDownloading(false);
        }
    }

    function goToDashboard() {
        resetAppointment();
        navigate(appPaths.dashboard);
    }

    function openEmailModal() {
        setRecipientEmail(values.patient_email?.trim() ?? "");
        setRecipientEmailError(null);
        setEmailSendError(null);
        setDocumentActionError(null);
        setEmailSuccessMessage(null);
        setIsEmailModalOpen(true);
    }

    function closeEmailModal() {
        if (isSendingEmail) {
            return;
        }

        setIsEmailModalOpen(false);
        setRecipientEmailError(null);
        setEmailSendError(null);
        emailTriggerRef.current?.focus();
    }

    function updateRecipientEmail(value: string) {
        setRecipientEmail(value);

        if (recipientEmailError) {
            setRecipientEmailError(null);
        }

        if (emailSendError) {
            setEmailSendError(null);
        }
    }

    async function handleSendEmail() {
        if (isSendingEmail) {
            return;
        }

        if (!isValidEmail(trimmedRecipientEmail)) {
            setRecipientEmailError("Informe um endereço de e-mail válido.");
            return;
        }

        setRecipientEmailError(null);
        setEmailSendError(null);
        setIsSendingEmail(true);

        try {
            if (!generatedDocuments) {
                return;
            }

            await emailDocumentGeneration(
                generatedDocuments.generationId,
                trimmedRecipientEmail,
            );
            setIsEmailModalOpen(false);
            setEmailSuccessMessage("E-mail enviado com sucesso.");
            emailTriggerRef.current?.focus();
        } catch (error) {
            console.error(error);
            setEmailSendError(
                getDocumentGenerationErrorMessage(
                    error,
                    "Não foi possível enviar o e-mail. Tente novamente.",
                ),
            );
        } finally {
            setIsSendingEmail(false);
        }
    }

    if (!generatedDocuments) {
        return (
            <section className="appointment-result-page">
                <div className="appointment-result-card">
                    <h1>Nenhum documento gerado foi encontrado.</h1>
                    <button
                        className="appointment-result-primary-button"
                        onClick={() => navigate(appPaths.appointment.select)}
                        type="button"
                    >
                        Voltar para novo atendimento
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
                        {generatedDocuments.documents.length || selectedTemplates.length} documento(s) processado(s)
                    </span>
                </div>

                <div className="appointment-result-actions">
                    <div className="appointment-result-document-actions">
                        <button
                            className="appointment-result-primary-button"
                            disabled={isDownloading}
                            onClick={() => {
                                void downloadDocuments();
                            }}
                            type="button"
                        >
                            {isDownloading ? "Baixando..." : "Baixar documentos"}
                        </button>
                        <button
                            className="appointment-result-email-button"
                            onClick={openEmailModal}
                            ref={emailTriggerRef}
                            type="button"
                        >
                            Enviar por e-mail
                        </button>
                    </div>

                    <div className="appointment-result-navigation-actions">
                        <button
                            className="appointment-result-secondary-button"
                            onClick={() => navigate(appPaths.appointment.fill)}
                            type="button"
                        >
                            Editar dados
                        </button>
                        <button
                            className="appointment-result-secondary-button"
                            onClick={goToDashboard}
                            type="button"
                        >
                            Voltar ao Dashboard
                        </button>
                    </div>
                </div>

                {emailSuccessMessage ? (
                    <p className="appointment-result-success-message">
                        {emailSuccessMessage}
                    </p>
                ) : null}
                {documentActionError ? (
                    <p className="appointment-result-error-message">
                        {documentActionError}
                    </p>
                ) : null}
            </div>

            {isEmailModalOpen ? (
                <div className="email-modal-backdrop">
                    <div
                        aria-labelledby="email-modal-title"
                        aria-modal="true"
                        className="email-modal"
                        role="dialog"
                    >
                        <div className="email-modal-header">
                            <div>
                                <h2 id="email-modal-title">
                                    Enviar documentos por e-mail
                                </h2>
                                <p>
                                    Confirme o endereço que receberá os documentos
                                    deste atendimento.
                                </p>
                            </div>
                            <button
                                aria-label="Fechar envio por e-mail"
                                className="email-modal-close-button"
                                disabled={isSendingEmail}
                                onClick={closeEmailModal}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="email-modal-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleSendEmail();
                            }}
                        >
                            <label htmlFor="document-recipient-email">
                                E-mail do destinatário
                            </label>
                            <input
                                autoComplete="email"
                                disabled={isSendingEmail}
                                id="document-recipient-email"
                                inputMode="email"
                                onBlur={() => {
                                    if (
                                        trimmedRecipientEmail &&
                                        !isValidEmail(trimmedRecipientEmail)
                                    ) {
                                        setRecipientEmailError(
                                            "Informe um endereço de e-mail válido.",
                                        );
                                    }
                                }}
                                onChange={(event) =>
                                    updateRecipientEmail(event.target.value)
                                }
                                ref={recipientInputRef}
                                type="email"
                                value={recipientEmail}
                            />
                            {recipientEmailError ? (
                                <p className="email-modal-error">
                                    {recipientEmailError}
                                </p>
                            ) : null}
                            {emailSendError ? (
                                <p className="email-modal-error">
                                    {emailSendError}
                                </p>
                            ) : null}

                            <div className="email-modal-actions">
                                <button
                                    className="appointment-result-secondary-button"
                                    disabled={isSendingEmail}
                                    onClick={closeEmailModal}
                                    type="button"
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="appointment-result-primary-button"
                                    disabled={!canSendEmail}
                                    type="submit"
                                >
                                    {isSendingEmail ? "Enviando..." : "Enviar e-mail"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getDocumentGenerationErrorMessage(
    error: unknown,
    fallbackMessage = "Os documentos desta sessão expiraram. Gere-os novamente para continuar.",
) {
    const status = getApiErrorStatus(error);
    const code = getApiErrorCode(error);

    if (
        status === 404 ||
        status === 410 ||
        code === "DOCUMENT_GENERATION_EXPIRED" ||
        code === "DOCUMENT_GENERATION_NOT_FOUND" ||
        code === "GENERATION_EXPIRED" ||
        code === "GENERATION_NOT_FOUND"
    ) {
        return "Os documentos desta sessão expiraram. Gere-os novamente para continuar.";
    }

    return getApiErrorMessage(error, fallbackMessage);
}

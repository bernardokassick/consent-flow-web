import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import {
    downloadGeneratedDocument,
    emailDocumentGeneration,
    printGeneratedDocuments,
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
    const [documentActionSuccess, setDocumentActionSuccess] = useState<
        string | null
    >(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPrintFilenames, setSelectedPrintFilenames] = useState<string[]>(
        [],
    );
    const [printError, setPrintError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const recipientInputRef = useRef<HTMLInputElement>(null);
    const emailTriggerRef = useRef<HTMLButtonElement>(null);
    const printCloseButtonRef = useRef<HTMLButtonElement>(null);
    const printTriggerRef = useRef<HTMLButtonElement>(null);

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

    useEffect(() => {
        if (!isPrintModalOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !isPrinting) {
                setIsPrintModalOpen(false);
                setPrintError(null);
                printTriggerRef.current?.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        printCloseButtonRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isPrintModalOpen, isPrinting]);

    async function downloadDocuments() {
        if (!generatedDocuments || isDownloading) {
            return;
        }

        setDocumentActionError(null);
        setDocumentActionSuccess(null);
        setIsDownloading(true);

        try {
            const results = await Promise.allSettled(
                generatedDocuments.documents.map(async ({ filename }) => ({
                    blob: await downloadGeneratedDocument(
                        generatedDocuments.generationId,
                        filename,
                    ),
                    filename,
                })),
            );

            const successfulDownloads = results.filter(
                (result): result is PromiseFulfilledResult<{
                    blob: Blob;
                    filename: string;
                }> => result.status === "fulfilled",
            );
            const failedDownloads = results.filter(
                (result): result is PromiseRejectedResult =>
                    result.status === "rejected",
            );

            successfulDownloads.forEach(({ value }) => {
                triggerBlobDownload(value.blob, value.filename);
            });

            if (failedDownloads.length === 0) {
                setDocumentActionSuccess(
                    successfulDownloads.length === 1
                        ? "1 documento baixado."
                        : `${successfulDownloads.length} documentos baixados.`,
                );
                return;
            }

            if (successfulDownloads.length > 0) {
                const hasExpiredFailure = failedDownloads.some(({ reason }) =>
                    isDocumentGenerationExpired(reason),
                );
                const failedMessage =
                    failedDownloads.length === 1
                        ? "1 documento não pôde ser baixado."
                        : `${failedDownloads.length} documentos não puderam ser baixados.`;

                setDocumentActionError(
                    `${successfulDownloads.length} de ${results.length} documentos baixados. ${failedMessage}${
                        hasExpiredFailure
                            ? " Os documentos desta sessão expiraram. Gere-os novamente para continuar."
                            : ""
                    }`,
                );
                return;
            }

            const expiredFailure = failedDownloads.find(({ reason }) =>
                isDocumentGenerationExpired(reason),
            );

            setDocumentActionError(
                getDocumentGenerationErrorMessage(
                    expiredFailure?.reason ?? failedDownloads[0]?.reason,
                    "Não foi possível baixar os documentos. Tente novamente.",
                ),
            );
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

    function openPrintModal() {
        if (!generatedDocuments) {
            return;
        }

        setSelectedPrintFilenames(
            generatedDocuments.documents.map(({ filename }) => filename),
        );
        setPrintError(null);
        setDocumentActionError(null);
        setDocumentActionSuccess(null);
        setIsPrintModalOpen(true);
    }

    function closePrintModal() {
        if (isPrinting) {
            return;
        }

        setIsPrintModalOpen(false);
        setPrintError(null);
        printTriggerRef.current?.focus();
    }

    function togglePrintDocument(filename: string) {
        setSelectedPrintFilenames((currentFilenames) =>
            currentFilenames.includes(filename)
                ? currentFilenames.filter(
                      (currentFilename) => currentFilename !== filename,
                  )
                : [...currentFilenames, filename],
        );
    }

    async function handlePrintDocuments() {
        if (
            !generatedDocuments ||
            isPrinting ||
            selectedPrintFilenames.length === 0
        ) {
            return;
        }

        const printWindow = window.open("", "_blank");

        if (!printWindow) {
            setPrintError(
                "Não foi possível abrir a impressão. Permita pop-ups e tente novamente.",
            );
            return;
        }

        printWindow.document.title = "Preparando documentos para impressão";
        printWindow.document.body.textContent =
            "Preparando documentos para impressão...";

        const filenames = generatedDocuments.documents
            .map(({ filename }) => filename)
            .filter((filename) => selectedPrintFilenames.includes(filename));

        setPrintError(null);
        setIsPrinting(true);

        try {
            const combinedPdf = await printGeneratedDocuments(
                generatedDocuments.generationId,
                filenames,
            );

            if (printWindow.closed) {
                throw new Error("Print window was closed");
            }

            openPdfPrintDialog(printWindow, combinedPdf);
            setIsPrintModalOpen(false);
        } catch (error) {
            console.error(error);
            printWindow.close();
            setPrintError(
                getDocumentGenerationErrorMessage(
                    error,
                    "Não foi possível preparar os documentos para impressão. Tente novamente.",
                ),
            );
        } finally {
            setIsPrinting(false);
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
        setDocumentActionSuccess(null);
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
                            onClick={openPrintModal}
                            ref={printTriggerRef}
                            type="button"
                        >
                            Imprimir documentos
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
                {documentActionSuccess ? (
                    <p className="appointment-result-success-message">
                        {documentActionSuccess}
                    </p>
                ) : null}
                {documentActionError ? (
                    <p className="appointment-result-error-message">
                        {documentActionError}
                    </p>
                ) : null}
            </div>

            {isPrintModalOpen ? (
                <div className="email-modal-backdrop">
                    <div
                        aria-labelledby="print-modal-title"
                        aria-modal="true"
                        className="email-modal print-modal"
                        role="dialog"
                    >
                        <div className="email-modal-header">
                            <div>
                                <h2 id="print-modal-title">
                                    Imprimir documentos
                                </h2>
                                <p>
                                    Selecione os documentos que deseja imprimir.
                                </p>
                            </div>
                            <button
                                aria-label="Fechar seleção de documentos"
                                className="email-modal-close-button"
                                disabled={isPrinting}
                                onClick={closePrintModal}
                                ref={printCloseButtonRef}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <div className="print-modal-content">
                            <div className="print-modal-selection-header">
                                <span>
                                    {selectedPrintFilenames.length} de {generatedDocuments.documents.length} documentos selecionados
                                </span>
                                <div className="print-modal-selection-actions">
                                    <button
                                        disabled={
                                            isPrinting ||
                                            selectedPrintFilenames.length ===
                                                generatedDocuments.documents.length
                                        }
                                        onClick={() =>
                                            setSelectedPrintFilenames(
                                                generatedDocuments.documents.map(
                                                    ({ filename }) => filename,
                                                ),
                                            )
                                        }
                                        type="button"
                                    >
                                        Selecionar todos
                                    </button>
                                    <button
                                        disabled={
                                            isPrinting ||
                                            selectedPrintFilenames.length === 0
                                        }
                                        onClick={() =>
                                            setSelectedPrintFilenames([])
                                        }
                                        type="button"
                                    >
                                        Desmarcar todos
                                    </button>
                                </div>
                            </div>

                            <div className="print-document-list">
                                {generatedDocuments.documents.map(
                                    ({ filename }, index) => {
                                        const inputId = `print-document-${index}`;

                                        return (
                                            <label
                                                className="print-document-option"
                                                htmlFor={inputId}
                                                key={`${filename}-${index}`}
                                            >
                                                <input
                                                    checked={selectedPrintFilenames.includes(
                                                        filename,
                                                    )}
                                                    disabled={isPrinting}
                                                    id={inputId}
                                                    onChange={() =>
                                                        togglePrintDocument(
                                                            filename,
                                                        )
                                                    }
                                                    type="checkbox"
                                                />
                                                <span>{filename}</span>
                                            </label>
                                        );
                                    },
                                )}
                            </div>

                            {printError ? (
                                <p className="email-modal-error" role="alert">
                                    {printError}
                                </p>
                            ) : null}

                            <div className="email-modal-actions">
                                <button
                                    className="appointment-result-secondary-button"
                                    disabled={isPrinting}
                                    onClick={closePrintModal}
                                    type="button"
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="appointment-result-primary-button"
                                    disabled={
                                        isPrinting ||
                                        selectedPrintFilenames.length === 0
                                    }
                                    onClick={() => {
                                        void handlePrintDocuments();
                                    }}
                                    type="button"
                                >
                                    {isPrinting ? "Preparando..." : "Imprimir"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

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

function triggerBlobDownload(blob: Blob, filename: string) {
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = filename;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
}

function openPdfPrintDialog(printWindow: Window, pdf: Blob) {
    const printUrl = URL.createObjectURL(pdf);
    const iframe = printWindow.document.createElement("iframe");
    let hasCleanedUp = false;

    function cleanup() {
        if (hasCleanedUp) {
            return;
        }

        hasCleanedUp = true;
        URL.revokeObjectURL(printUrl);
    }

    printWindow.document.title = "Imprimir documentos";
    printWindow.document.body.replaceChildren();
    printWindow.document.body.style.margin = "0";
    iframe.title = "Documentos para impressão";
    iframe.style.width = "100vw";
    iframe.style.height = "100vh";
    iframe.style.border = "0";
    iframe.addEventListener("load", () => {
        const pdfWindow = iframe.contentWindow;

        pdfWindow?.addEventListener("afterprint", cleanup, { once: true });
        pdfWindow?.focus();
        pdfWindow?.print();
    });
    iframe.src = printUrl;
    printWindow.document.body.append(iframe);
    printWindow.addEventListener("beforeunload", cleanup, { once: true });
    window.setTimeout(cleanup, 10 * 60 * 1000);
}

function isDocumentGenerationExpired(error: unknown) {
    const status = getApiErrorStatus(error);
    const code = getApiErrorCode(error);

    return (
        status === 404 ||
        status === 410 ||
        code === "DOCUMENT_GENERATION_EXPIRED" ||
        code === "DOCUMENT_GENERATION_NOT_FOUND" ||
        code === "GENERATION_EXPIRED" ||
        code === "GENERATION_NOT_FOUND"
    );
}

function getDocumentGenerationErrorMessage(
    error: unknown,
    fallbackMessage = "Os documentos desta sessão expiraram. Gere-os novamente para continuar.",
) {
    if (isDocumentGenerationExpired(error)) {
        return "Os documentos desta sessão expiraram. Gere-os novamente para continuar.";
    }

    return getApiErrorMessage(error, fallbackMessage);
}

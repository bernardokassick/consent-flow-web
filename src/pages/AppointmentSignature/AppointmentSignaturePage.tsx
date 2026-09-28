import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { SignatureStep } from "../../components/SignatureStep/SignatureStep";
import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import { createDocumentGeneration } from "../../services/pdfService";
import { getApiErrorMessage } from "../../utils/apiError";
import { filterSignaturesForFields } from "../../utils/signatures";
import "./AppointmentSignaturePage.css";

const signatureStepIds = {
    patient: "paciente",
    guardian: "responsavel",
    witness1: "testemunha-1",
    witness2: "testemunha-2",
} as const;

type SignatureStepId =
    (typeof signatureStepIds)[keyof typeof signatureStepIds];

type SignatureFlowStep = {
    description: string;
    id: SignatureStepId;
    signatureKey: string;
    signatureLabel: string;
    title: string;
};

const patientSignatureKey = "patient_signature";
const guardianSignatureKey = "guardian_signature";

function getWitnessSignatureKey(witnessNumber: 1 | 2) {
    return `witness_${witnessNumber}_signature`;
}

export function AppointmentSignaturePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        fields,
        selectedDoctorId,
        selectedTemplates,
        setGeneratedDocuments,
        signatures,
        values,
    } = useAppointment();
    const [hasConfirmedConsent, setHasConfirmedConsent] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const generatingRef = useRef(false);
    const hasAppointmentData =
        selectedTemplates.length > 0 && fields.length > 0;

    const fieldKeys = useMemo(
        () => new Set(fields.map((field) => field.key)),
        [fields],
    );

    const signatureSteps = useMemo<SignatureFlowStep[]>(() => {
        const steps: SignatureFlowStep[] = [];

        if (fieldKeys.has(patientSignatureKey)) {
            steps.push({
                description:
                    "Assine abaixo para confirmar que leu e compreendeu todos os termos de consentimento.",
                id: signatureStepIds.patient,
                signatureKey: patientSignatureKey,
                signatureLabel: "Assinatura do paciente",
                title: "Assinatura do paciente",
            });
        }

        if (fieldKeys.has(guardianSignatureKey)) {
            steps.push({
                description:
                    "Solicite ao responsável legal que assine no campo abaixo.",
                id: signatureStepIds.guardian,
                signatureKey: guardianSignatureKey,
                signatureLabel: "Assinatura do responsável legal",
                title: "Assinatura do responsável legal",
            });
        }

        const witness1SignatureKey = getWitnessSignatureKey(1);
        const witness2SignatureKey = getWitnessSignatureKey(2);

        if (fieldKeys.has(witness1SignatureKey)) {
            steps.push({
                description:
                    "Colete a assinatura da testemunha no campo abaixo.",
                id: signatureStepIds.witness1,
                signatureKey: witness1SignatureKey,
                signatureLabel: "Assinatura",
                title: "Testemunha 1",
            });
        }

        if (fieldKeys.has(witness2SignatureKey)) {
            steps.push({
                description:
                    "Colete a assinatura da testemunha no campo abaixo.",
                id: signatureStepIds.witness2,
                signatureKey: witness2SignatureKey,
                signatureLabel: "Assinatura",
                title: "Testemunha 2",
            });
        }

        return steps;
    }, [fieldKeys]);

    const requestedStepId = searchParams.get("etapa") as SignatureStepId | null;
    const currentStepIndex = Math.max(
        signatureSteps.findIndex((step) => step.id === requestedStepId),
        0,
    );
    const currentStep = signatureSteps[currentStepIndex];
    const isLastStep = currentStepIndex === signatureSteps.length - 1;
    const currentSignature = currentStep
        ? signatures[currentStep.signatureKey]
        : undefined;
    const canConfirmStep =
        Boolean(currentSignature) &&
        (currentStep?.id !== signatureStepIds.patient || hasConfirmedConsent) &&
        !isGenerating;

    useEffect(() => {
        if (!hasAppointmentData || !currentStep) {
            return;
        }

        if (requestedStepId !== currentStep.id) {
            navigate(
                `${appPaths.appointment.signature}?etapa=${currentStep.id}`,
                { replace: true },
            );
        }
    }, [currentStep, hasAppointmentData, navigate, requestedStepId]);

    function navigateToStep(step: SignatureFlowStep) {
        navigate(`${appPaths.appointment.signature}?etapa=${step.id}`);
    }

    function handleBack() {
        const previousStep = signatureSteps[currentStepIndex - 1];

        if (previousStep) {
            navigateToStep(previousStep);
            return;
        }

        navigate(appPaths.appointment.review);
    }

    function validateCurrentStep() {
        if (!currentStep) {
            return false;
        }

        if (!signatures[currentStep.signatureKey]) {
            setError("Assine no campo indicado antes de continuar.");
            return false;
        }

        if (currentStep.id === signatureStepIds.patient && !hasConfirmedConsent) {
            setError("Confirme que leu e compreendeu os termos antes de continuar.");
            return false;
        }

        return true;
    }

    async function generateDocuments() {
        if (generatingRef.current) {
            return;
        }

        try {
            generatingRef.current = true;
            setIsGenerating(true);
            setError(null);

            const payloadSignatures = filterSignaturesForFields(signatures, fields);

            const generatedDocuments = await createDocumentGeneration(
                selectedTemplates,
                values,
                payloadSignatures,
                selectedDoctorId,
            );
            setGeneratedDocuments(generatedDocuments);
            navigate(appPaths.appointment.result);
        } catch (generateError) {
            console.error(generateError);
            setError(
                getApiErrorMessage(
                    generateError,
                    "Não foi possível gerar os documentos. Tente novamente.",
                ),
            );
        } finally {
            generatingRef.current = false;
            setIsGenerating(false);
        }
    }

    async function handleConfirmStep() {
        if (isGenerating || !validateCurrentStep()) {
            return;
        }

        const nextStep = signatureSteps[currentStepIndex + 1];

        if (nextStep) {
            setError(null);
            navigateToStep(nextStep);
            return;
        }

        await generateDocuments();
    }

    if (!hasAppointmentData || !currentStep) {
        return (
            <section className="appointment-signature-page">
                <div className="appointment-signature-empty-card">
                    <h1>Nenhum dado de atendimento foi encontrado.</h1>
                    <button
                        className="signature-primary-button"
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
        <section className="appointment-signature-page">
            <div className="appointment-signature-card">
                <SignatureStep
                    description={currentStep.description}
                    disabled={isGenerating}
                    signatureKey={currentStep.signatureKey}
                    signatureLabel={currentStep.signatureLabel}
                    title={currentStep.title}
                >
                    {currentStep.id === signatureStepIds.patient ? (
                        <label className="signature-confirmation">
                            <input
                                checked={hasConfirmedConsent}
                                disabled={isGenerating}
                                onChange={(event) =>
                                    setHasConfirmedConsent(event.target.checked)
                                }
                                type="checkbox"
                            />
                            <span>
                                Confirmo que li e compreendi todos os termos de
                                consentimento e concordo com os procedimentos
                                descritos.
                            </span>
                        </label>
                    ) : null}

                    <div className="appointment-signature-actions">
                        <button
                            className="signature-secondary-button"
                            disabled={isGenerating}
                            onClick={handleBack}
                            type="button"
                        >
                            Voltar
                        </button>
                        <button
                            className="signature-primary-button"
                            disabled={!canConfirmStep}
                            onClick={handleConfirmStep}
                            type="button"
                        >
                            {isGenerating
                                ? (
                                    <>
                                        <LoadingSpinner /> Gerando documentos...
                                    </>
                                )
                                : isLastStep
                                  ? "Gerar documentos"
                                  : "Confirmar"}
                        </button>
                    </div>

                    {isGenerating ? (
                        <p className="signature-loading-helper">
                            Isso pode levar alguns segundos.
                        </p>
                    ) : null}

                    {error ? (
                        <ErrorMessage
                            actionDisabled={isGenerating}
                            actionLabel={
                                isGenerating ? "Gerando..." : "Tentar novamente"
                            }
                            message={error}
                            onAction={isLastStep ? handleConfirmStep : undefined}
                        />
                    ) : null}
                </SignatureStep>
            </div>
        </section>
    );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { SignatureStep } from "../../components/SignatureStep/SignatureStep";
import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import { createDocumentGeneration } from "../../services/pdfService";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatCpf } from "../../utils/masks";
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
    witnessNumber?: 1 | 2;
};

const patientSignatureKey = "patient_signature";
const guardianSignatureKey = "guardian_signature";

function getWitnessFieldKeys(witnessNumber: 1 | 2) {
    return {
        cpf: `witness_${witnessNumber}_cpf`,
        name: `witness_${witnessNumber}_name`,
        signature: `witness_${witnessNumber}_signature`,
    };
}

function hasRequiredValue(value?: string) {
    return Boolean(value?.trim());
}

export function AppointmentSignaturePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        fields,
        selectedDoctorId,
        selectedTemplates,
        setGeneratedDocuments,
        setValues,
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

        const witness1FieldKeys = getWitnessFieldKeys(1);
        const witness2FieldKeys = getWitnessFieldKeys(2);

        if (fieldKeys.has(witness1FieldKeys.signature)) {
            steps.push({
                description:
                    "Preencha os dados exigidos e colete a assinatura da testemunha.",
                id: signatureStepIds.witness1,
                signatureKey: witness1FieldKeys.signature,
                signatureLabel: "Assinatura",
                title: "Testemunha 1",
                witnessNumber: 1,
            });
        }

        if (fieldKeys.has(witness2FieldKeys.signature)) {
            steps.push({
                description:
                    "Preencha os dados exigidos e colete a assinatura da testemunha.",
                id: signatureStepIds.witness2,
                signatureKey: witness2FieldKeys.signature,
                signatureLabel: "Assinatura",
                title: "Testemunha 2",
                witnessNumber: 2,
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
        (!currentStep?.witnessNumber || isWitnessStepValid(currentStep.witnessNumber)) &&
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

    function isWitnessStepValid(witnessNumber: 1 | 2) {
        const witnessFieldKeys = getWitnessFieldKeys(witnessNumber);
        const needsName = fieldKeys.has(witnessFieldKeys.name);
        const needsCpf = fieldKeys.has(witnessFieldKeys.cpf);
        const needsSignature = fieldKeys.has(witnessFieldKeys.signature);

        return (
            (!needsName || hasRequiredValue(values[witnessFieldKeys.name])) &&
            (!needsCpf || hasRequiredValue(values[witnessFieldKeys.cpf])) &&
            (!needsSignature || Boolean(signatures[witnessFieldKeys.signature]))
        );
    }

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

    function updateWitnessValue(fieldKey: string, value: string) {
        setValues((currentValues) => ({
            ...currentValues,
            [fieldKey]: value,
        }));
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

        if (currentStep.witnessNumber) {
            const witnessFieldKeys = getWitnessFieldKeys(currentStep.witnessNumber);

            if (
                fieldKeys.has(witnessFieldKeys.name) &&
                !hasRequiredValue(values[witnessFieldKeys.name])
            ) {
                setError("Informe o nome completo da testemunha antes de continuar.");
                return false;
            }

            if (
                fieldKeys.has(witnessFieldKeys.cpf) &&
                !hasRequiredValue(values[witnessFieldKeys.cpf])
            ) {
                setError("Informe o CPF da testemunha antes de continuar.");
                return false;
            }
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

    function renderWitnessFields(witnessNumber: 1 | 2) {
        const witnessFieldKeys = getWitnessFieldKeys(witnessNumber);
        const showName = fieldKeys.has(witnessFieldKeys.name);
        const showCpf = fieldKeys.has(witnessFieldKeys.cpf);

        if (!showName && !showCpf) {
            return null;
        }

        return (
            <div className="witness-fields">
                {showName ? (
                    <label className="witness-field">
                        <span>Nome completo</span>
                        <input
                            disabled={isGenerating}
                            onChange={(event) =>
                                updateWitnessValue(
                                    witnessFieldKeys.name,
                                    event.target.value,
                                )
                            }
                            type="text"
                            value={values[witnessFieldKeys.name] ?? ""}
                        />
                    </label>
                ) : null}

                {showCpf ? (
                    <label className="witness-field">
                        <span>CPF</span>
                        <input
                            disabled={isGenerating}
                            inputMode="numeric"
                            onChange={(event) =>
                                updateWitnessValue(
                                    witnessFieldKeys.cpf,
                                    formatCpf(event.target.value),
                                )
                            }
                            placeholder="000.000.000-00"
                            type="text"
                            value={values[witnessFieldKeys.cpf] ?? ""}
                        />
                    </label>
                ) : null}
            </div>
        );
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
                    {currentStep.witnessNumber
                        ? renderWitnessFields(currentStep.witnessNumber)
                        : null}

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

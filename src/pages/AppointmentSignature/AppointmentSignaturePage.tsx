import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { SignatureField } from "../../components/SignatureField/SignatureField";
import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import { fillMultiplePdfs } from "../../services/pdfService";
import "./AppointmentSignaturePage.css";

const patientSignatureKey = "patient_signature";

export function AppointmentSignaturePage() {
    const navigate = useNavigate();
    const {
        fields,
        selectedTemplates,
        setGeneratedDocuments,
        setSignatures,
        signatures,
        values,
    } = useAppointment();
    const [hasConfirmedConsent, setHasConfirmedConsent] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasAppointmentData =
        selectedTemplates.length > 0 && fields.length > 0;
    const patientSignature = signatures[patientSignatureKey];
    const canConfirmSignature =
        Boolean(patientSignature) && hasConfirmedConsent && !isGenerating;

    function updatePatientSignature(signature: string) {
        setSignatures((currentSignatures) => {
            if (!signature) {
                const nextSignatures = { ...currentSignatures };

                delete nextSignatures[patientSignatureKey];

                return nextSignatures;
            }

            return {
                ...currentSignatures,
                [patientSignatureKey]: signature,
            };
        });
    }

    async function confirmSignature() {
        if (!patientSignature) {
            setError("Assine no campo indicado antes de continuar.");
            return;
        }

        if (!hasConfirmedConsent) {
            setError("Confirme que leu e compreendeu os termos antes de continuar.");
            return;
        }

        if (isGenerating) {
            return;
        }

        try {
            setIsGenerating(true);
            setError(null);

            const zipBlob = await fillMultiplePdfs(
                selectedTemplates,
                values,
                signatures,
            );
            setGeneratedDocuments(zipBlob);
            navigate(appPaths.appointment.result);
        } catch (generateError) {
            console.error(generateError);
            setError("Não foi possível gerar os documentos. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    }

    if (!hasAppointmentData) {
        return (
            <section className="appointment-signature-page">
                <div className="appointment-signature-empty-card">
                    <h1>Nenhum dado de agendamento foi encontrado.</h1>
                    <button
                        className="signature-primary-button"
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
        <section className="appointment-signature-page">
            <div className="appointment-signature-heading">
                <h1>Assinatura do paciente</h1>
                <p>
                    Assine abaixo para confirmar que leu e compreendeu todos os
                    termos de consentimento.
                </p>
            </div>

            <div className="appointment-signature-card">
                <div className="signature-summary">
                    <div>
                        <span>Paciente</span>
                        <strong>{values.patient_name || "Paciente"}</strong>
                    </div>
                    <div>
                        <span>Documentos</span>
                        <strong>
                            {selectedTemplates.length} termo(s) selecionado(s)
                        </strong>
                    </div>
                </div>

                <SignatureField
                    label="Assinatura do paciente"
                    onChange={updatePatientSignature}
                    value={patientSignature}
                />

                <label className="signature-confirmation">
                    <input
                        checked={hasConfirmedConsent}
                        onChange={(event) =>
                            setHasConfirmedConsent(event.target.checked)
                        }
                        type="checkbox"
                    />
                    <span>
                        Confirmo que li e compreendi todos os termos de
                        consentimento e concordo com os procedimentos descritos.
                    </span>
                </label>

                <div className="appointment-signature-actions">
                    <button
                        className="signature-secondary-button"
                        onClick={() => navigate(appPaths.appointment.review)}
                        type="button"
                    >
                        Voltar
                    </button>
                    <button
                        className="signature-primary-button"
                        disabled={!canConfirmSignature}
                        onClick={confirmSignature}
                        type="button"
                    >
                        {isGenerating
                            ? "Gerando documentos..."
                            : "Confirmar assinatura"}
                    </button>
                </div>

                {error ? <p className="appointment-signature-error">{error}</p> : null}
            </div>
        </section>
    );
}

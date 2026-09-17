import { type ReactNode } from "react";

import { useAppointment } from "../../hooks/useAppointment";
import { SignatureField } from "../SignatureField/SignatureField";

interface SignatureStepProps {
    children?: ReactNode;
    description: string;
    disabled?: boolean;
    signatureKey: string;
    signatureLabel: string;
    title: string;
}

export function SignatureStep({
    children,
    description,
    disabled = false,
    signatureKey,
    signatureLabel,
    title,
}: SignatureStepProps) {
    const { setSignatures, signatures } = useAppointment();
    const signature = signatures[signatureKey];

    function updateSignature(value: string) {
        setSignatures((currentSignatures) => {
            if (!value) {
                const nextSignatures = { ...currentSignatures };

                delete nextSignatures[signatureKey];

                return nextSignatures;
            }

            return {
                ...currentSignatures,
                [signatureKey]: value,
            };
        });
    }

    return (
        <>
            <div className="appointment-signature-heading">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>

            <SignatureField
                label={signatureLabel}
                disabled={disabled}
                onChange={updateSignature}
                value={signature}
            />

            {children}
        </>
    );
}

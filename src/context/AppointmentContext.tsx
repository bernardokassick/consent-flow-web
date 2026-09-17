import {
    type ReactNode,
    useState,
} from "react";

import type { GeneratedDocuments } from "../types/GeneratedDocuments";
import type { PdfField } from "../types/PdfField";
import { AppointmentContext } from "./appointmentContextValue";

type AppointmentProviderProps = {
    children: ReactNode;
};

export function AppointmentProvider({ children }: AppointmentProviderProps) {
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(
        null,
    );
    const [fields, setFields] = useState<PdfField[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [signatures, setSignatures] = useState<Record<string, string>>({});
    const [generatedDocuments, setGeneratedDocuments] =
        useState<GeneratedDocuments | null>(null);

    function resetAppointment() {
        setSelectedTemplates([]);
        setSelectedDoctorId(null);
        setFields([]);
        setValues({});
        setSignatures({});
        setGeneratedDocuments(null);
    }

    return (
        <AppointmentContext
            value={{
                selectedTemplates,
                selectedDoctorId,
                fields,
                values,
                signatures,
                generatedDocuments,
                setSelectedTemplates,
                setSelectedDoctorId,
                setFields,
                setValues,
                setSignatures,
                setGeneratedDocuments,
                resetAppointment,
            }}
        >
            {children}
        </AppointmentContext>
    );
}

import { useNavigate } from "react-router-dom";

import { DateInput } from "../../components/DateInput/DateInput";
import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import type { PdfField, PdfFieldType } from "../../types/PdfField";
import { formatCpf, formatPhone } from "../../utils/masks";
import "./AppointmentFillPage.css";

const fieldOrders = {
    patient: [
        "patient_name",
        "patient_cpf",
        "patient_birth_date",
        "patient_phone",
        "patient_email",
        "patient_address",
        "patient_profession",
    ],
    guardian: ["guardian_name", "guardian_cpf", "guardian_relationship"],
    doctor: ["doctor_name", "doctor_crm", "doctor_specialty"],
};

const signatureFieldKeys = new Set([
    "patient_signature",
    "doctor_signature",
    "guardian_signature",
]);

const cpfFieldKeys = new Set(["patient_cpf", "guardian_cpf"]);
const dateFieldKeys = new Set(["patient_birth_date", "signature_date"]);
const phoneFieldKeys = new Set(["patient_phone"]);
const emailFieldKeys = new Set(["patient_email"]);

type AppointmentFieldSection = {
    title: string;
    fields: PdfField[];
};

function isSignatureField(field: PdfField) {
    return field.type === "SIGNATURE" || signatureFieldKeys.has(field.key);
}

function resolveFieldType(field: PdfField): PdfFieldType {
    if (field.type && field.type !== "TEXT") {
        return field.type;
    }

    if (cpfFieldKeys.has(field.key)) {
        return "CPF";
    }

    if (dateFieldKeys.has(field.key)) {
        return "DATE";
    }

    if (phoneFieldKeys.has(field.key)) {
        return "PHONE";
    }

    if (emailFieldKeys.has(field.key)) {
        return "EMAIL";
    }

    return "TEXT";
}

function sortFieldsByPreferredOrder(fields: PdfField[], order: string[]) {
    return [...fields].sort((firstField, secondField) => {
        const firstIndex = order.indexOf(firstField.key);
        const secondIndex = order.indexOf(secondField.key);

        if (firstIndex === -1 && secondIndex === -1) {
            return firstField.key.localeCompare(secondField.key);
        }

        if (firstIndex === -1) {
            return 1;
        }

        if (secondIndex === -1) {
            return -1;
        }

        return firstIndex - secondIndex;
    });
}

function getFieldClassName(field: PdfField) {
    const fullWidthFields = new Set([
        "patient_name",
        "patient_address",
        "patient_profession",
        "guardian_name",
        "doctor_name",
    ]);

    return fullWidthFields.has(field.key)
        ? "appointment-field full-width"
        : "appointment-field";
}

function groupFieldsBySection(fields: PdfField[]): AppointmentFieldSection[] {
    const textFields = fields.filter((field) => !isSignatureField(field));
    const patientFields = sortFieldsByPreferredOrder(
        textFields.filter((field) => field.key.startsWith("patient_")),
        fieldOrders.patient,
    );
    const guardianFields = sortFieldsByPreferredOrder(
        textFields.filter((field) => field.key.startsWith("guardian_")),
        fieldOrders.guardian,
    );
    const doctorFields = sortFieldsByPreferredOrder(
        textFields.filter((field) => field.key.startsWith("doctor_")),
        fieldOrders.doctor,
    );

    return [
        {
            title: "Informações do paciente",
            fields: patientFields,
        },
        {
            title: "Informações do responsável",
            fields: guardianFields,
        },
        {
            title: "Informações do médico",
            fields: doctorFields,
        },
    ].filter((section) => section.fields.length > 0);
}

function getInputMode(fieldType: PdfFieldType) {
    if (fieldType === "CPF") {
        return "numeric";
    }

    if (fieldType === "PHONE") {
        return "tel";
    }

    if (fieldType === "EMAIL") {
        return "email";
    }

    return undefined;
}

function getInputType(fieldType: PdfFieldType) {
    if (fieldType === "PHONE") {
        return "tel";
    }

    if (fieldType === "EMAIL") {
        return "email";
    }

    return "text";
}

function getAutoComplete(fieldType: PdfFieldType) {
    if (fieldType === "PHONE") {
        return "tel";
    }

    if (fieldType === "EMAIL") {
        return "email";
    }

    return undefined;
}

function formatFieldValue(fieldType: PdfFieldType, value: string) {
    if (fieldType === "CPF") {
        return formatCpf(value);
    }

    if (fieldType === "PHONE") {
        return formatPhone(value);
    }

    return value;
}

export function AppointmentFillPage() {
    const navigate = useNavigate();
    const {
        fields,
        selectedTemplates,
        setValues,
        values,
    } = useAppointment();
    const hasAppointmentData =
        selectedTemplates.length > 0 && fields.length > 0;
    const fieldSections = groupFieldsBySection(fields);

    function updateFieldValue(field: string, value: string) {
        setValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
    }

    function goToReviewStep() {
        if (!hasAppointmentData) {
            return;
        }

        navigate(appPaths.appointment.review);
    }

    if (!hasAppointmentData) {
        return (
            <section className="appointment-fill-page">
                <div className="appointment-fill-empty-card">
                    <h1>Nenhum dado de agendamento foi encontrado.</h1>
                    <button
                        className="generate-documents-button"
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
        <section className="appointment-fill-page">
            <div className="appointment-fill-heading">
                <h1>Preenchimento do Agendamento</h1>
                <p>Informe os dados que serao usados nos documentos selecionados.</p>
            </div>

            <div className="appointment-field-sections">
                {fieldSections.map((section) => (
                    <div className="appointment-fill-card" key={section.title}>
                        <div className="appointment-fill-card-header">
                            <h2>{section.title}</h2>
                            <p>
                                Preencha os campos encontrados nos termos de
                                consentimento.
                            </p>
                        </div>

                        <div className="appointment-field-list">
                            {section.fields.map((field) => {
                                const fieldType = resolveFieldType(field);

                                return (
                                    <div
                                        className={getFieldClassName(field)}
                                        key={field.key}
                                    >
                                        {fieldType === "DATE" ? (
                                            <DateInput
                                                id={`appointment-field-${field.key}`}
                                                label={field.label}
                                                maxDate={
                                                    field.key ===
                                                    "patient_birth_date"
                                                        ? new Date()
                                                        : undefined
                                                }
                                                onChange={(value) =>
                                                    updateFieldValue(
                                                        field.key,
                                                        value,
                                                    )
                                                }
                                                value={values[field.key] ?? ""}
                                            />
                                        ) : (
                                            <>
                                                <label
                                                    htmlFor={`appointment-field-${field.key}`}
                                                >
                                                    {field.label}
                                                </label>
                                                <input
                                                    autoComplete={getAutoComplete(
                                                        fieldType,
                                                    )}
                                                    id={`appointment-field-${field.key}`}
                                                    inputMode={getInputMode(
                                                        fieldType,
                                                    )}
                                                    onChange={(event) =>
                                                        updateFieldValue(
                                                            field.key,
                                                            formatFieldValue(
                                                                fieldType,
                                                                event.target.value,
                                                            ),
                                                        )
                                                    }
                                                    type={getInputType(fieldType)}
                                                    value={values[field.key] ?? ""}
                                                />
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="appointment-fill-actions">
                    <button
                        className="back-button"
                        onClick={() => navigate(appPaths.appointment.select)}
                        type="button"
                    >
                        Voltar
                    </button>
                    <button
                        className="generate-documents-button"
                        onClick={goToReviewStep}
                        type="button"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </section>
    );
}

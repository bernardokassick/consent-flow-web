import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DateInput } from "../../components/DateInput/DateInput";
import { DoctorSelect } from "../../components/DoctorSelect/DoctorSelect";
import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";
import { useAppointment } from "../../hooks/useAppointment";
import { appPaths } from "../../routes/appPaths";
import { getDoctors } from "../../services/doctorService";
import type { Doctor } from "../../types/Doctor";
import type { PdfField, PdfFieldType } from "../../types/PdfField";
import { getApiErrorMessage, isRequestCanceled } from "../../utils/apiError";
import { formatCpf, formatPhone, isValidCpf } from "../../utils/masks";
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
    doctor: ["doctor_specialty"],
};

const groupedFieldPrefixes = ["patient_", "guardian_", "doctor_"];

const signatureFieldKeys = new Set([
    "patient_signature",
    "guardian_signature",
    "witness_1_signature",
    "witness_2_signature",
]);
const backendManagedFields = new Set(["signature_date", "doctor_signature"]);
const doctorFieldKeys = new Set([
    "doctor_name",
    "doctor_crm",
    "doctor_specialty",
    "doctor_signature",
]);
const hiddenDoctorInputKeys = new Set([
    "doctor_name",
    "doctor_crm",
    "doctor_signature",
]);
const cpfFieldKeys = new Set(["patient_cpf", "guardian_cpf"]);
const dateFieldKeys = new Set(["patient_birth_date", "signature_date"]);
const phoneFieldKeys = new Set(["patient_phone"]);
const emailFieldKeys = new Set(["patient_email"]);
const requiredPatientFieldKeys = new Set(["patient_name", "patient_cpf"]);

type PatientFieldErrors = Partial<Record<"patient_name" | "patient_cpf", string>>;

type AppointmentFieldSection = {
    kind: "default" | "doctor";
    title: string;
    fields: PdfField[];
};

function isSignatureField(field: PdfField) {
    return field.type === "SIGNATURE" || signatureFieldKeys.has(field.key);
}

function isRenderableField(field: PdfField) {
    return !isSignatureField(field) && !backendManagedFields.has(field.key);
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
    ]);

    return fullWidthFields.has(field.key)
        ? "appointment-field full-width"
        : "appointment-field";
}

function hasDoctorFields(fields: PdfField[]) {
    return fields.some((field) => doctorFieldKeys.has(field.key));
}

function groupFieldsBySection(fields: PdfField[]): AppointmentFieldSection[] {
    const renderableFields = fields.filter(isRenderableField);
    const patientFields = sortFieldsByPreferredOrder(
        renderableFields.filter((field) => field.key.startsWith("patient_")),
        fieldOrders.patient,
    );
    const guardianFields = sortFieldsByPreferredOrder(
        renderableFields.filter((field) => field.key.startsWith("guardian_")),
        fieldOrders.guardian,
    );
    const doctorFields = sortFieldsByPreferredOrder(
        renderableFields.filter(
            (field) =>
                field.key.startsWith("doctor_") &&
                !hiddenDoctorInputKeys.has(field.key),
        ),
        fieldOrders.doctor,
    );
    const otherFields = renderableFields.filter(
        (field) =>
            !groupedFieldPrefixes.some((prefix) =>
                field.key.startsWith(prefix),
            ),
    );

    return [
        {
            kind: "default" as const,
            title: "Informações do paciente",
            fields: patientFields,
        },
        {
            kind: "default" as const,
            title: "Informações do responsável",
            fields: guardianFields,
        },
        hasDoctorFields(fields)
            ? {
                  kind: "doctor" as const,
                  title: "Informações do médico",
                  fields: doctorFields,
              }
            : null,
        {
            kind: "default" as const,
            title: "Outras informações",
            fields: otherFields,
        },
    ].filter((section): section is AppointmentFieldSection =>
        Boolean(
            section && (section.kind === "doctor" || section.fields.length > 0),
        ),
    );
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

function getSectionDescription(section: AppointmentFieldSection) {
    if (section.kind === "doctor" && section.fields.length > 0) {
        return "Selecione o médico responsável e complete as informações adicionais exigidas.";
    }

    if (section.kind === "doctor") {
        return "Selecione o médico responsável pelos documentos do atendimento.";
    }

    return "Preencha os campos encontrados nos termos de consentimento.";
}

function getPatientFieldErrors(
    fields: PdfField[],
    values: Record<string, string>,
): PatientFieldErrors {
    const errors: PatientFieldErrors = {};
    const fieldKeys = new Set(fields.map((field) => field.key));

    if (fieldKeys.has("patient_name") && !values.patient_name?.trim()) {
        errors.patient_name = "Nome do paciente é obrigatório.";
    }

    if (fieldKeys.has("patient_cpf") && !values.patient_cpf?.trim()) {
        errors.patient_cpf = "CPF do paciente é obrigatório.";
    } else if (
        fieldKeys.has("patient_cpf") &&
        !isValidCpf(values.patient_cpf)
    ) {
        errors.patient_cpf = "CPF inválido.";
    }

    return errors;
}

export function AppointmentFillPage() {
    const navigate = useNavigate();
    const {
        fields,
        selectedDoctorId,
        selectedTemplates,
        setSelectedDoctorId,
        setValues,
        values,
    } = useAppointment();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
    const [doctorLoadError, setDoctorLoadError] = useState<string | null>(null);
    const [doctorValidationError, setDoctorValidationError] = useState<
        string | null
    >(null);
    const [hasAttemptedToContinue, setHasAttemptedToContinue] = useState(false);
    const isLoadingDoctorsRef = useRef(false);
    const doctorsRequestIdRef = useRef(0);
    const hasAppointmentData =
        selectedTemplates.length > 0 && fields.length > 0;
    const requiresDoctor = useMemo(() => hasDoctorFields(fields), [fields]);
    const fieldSections = groupFieldsBySection(fields);
    const patientFieldErrors = hasAttemptedToContinue
        ? getPatientFieldErrors(fields, values)
        : {};

    async function loadDoctors(signal?: AbortSignal) {
        if (isLoadingDoctorsRef.current) {
            return;
        }

        const requestId = doctorsRequestIdRef.current + 1;

        doctorsRequestIdRef.current = requestId;

        try {
            isLoadingDoctorsRef.current = true;
            setIsLoadingDoctors(true);
            setDoctorLoadError(null);

            const doctorsResponse = await getDoctors(signal);

            if (signal?.aborted || requestId !== doctorsRequestIdRef.current) {
                return;
            }

            setDoctors(doctorsResponse);
        } catch (error) {
            if (isRequestCanceled(error)) {
                return;
            }

            if (requestId !== doctorsRequestIdRef.current) {
                return;
            }

            console.error(error);

            setDoctorLoadError(
                getApiErrorMessage(
                    error,
                    "Não foi possível carregar os médicos. Tente novamente.",
                ),
            );
        } finally {
            if (requestId === doctorsRequestIdRef.current) {
                isLoadingDoctorsRef.current = false;
                setIsLoadingDoctors(false);
            }
        }
    }

    useEffect(() => {
        if (!requiresDoctor) {
            return;
        }

        const controller = new AbortController();

        loadDoctors(controller.signal);

        return () => {
            isLoadingDoctorsRef.current = false;
            controller.abort();
        };
    }, [requiresDoctor]);

    function updateFieldValue(field: string, value: string) {
        setValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
    }

    function updateDoctorSelection(doctorId: string) {
        const doctor = doctors.find((doctorItem) => doctorItem.id === doctorId);

        setDoctorValidationError(null);

        if (!doctor) {
            setSelectedDoctorId(null);
            setValues((currentValues) => {
                const nextValues = { ...currentValues };

                delete nextValues.doctor_name;
                delete nextValues.doctor_crm;

                return nextValues;
            });
            return;
        }

        setSelectedDoctorId(doctor.id);
        setValues((currentValues) => ({
            ...currentValues,
            doctor_name: doctor.name,
            doctor_crm: doctor.crm,
        }));
    }

    function goToReviewStep() {
        if (!hasAppointmentData) {
            return;
        }

        setHasAttemptedToContinue(true);

        const hasPatientFieldErrors =
            Object.keys(getPatientFieldErrors(fields, values)).length > 0;

        if (requiresDoctor && !selectedDoctorId) {
            setDoctorValidationError("Selecione o médico responsável.");
        }

        if (
            hasPatientFieldErrors ||
            (requiresDoctor && !selectedDoctorId)
        ) {
            return;
        }

        navigate(appPaths.appointment.review);
    }

    function renderField(field: PdfField) {
        const fieldType = resolveFieldType(field);
        const isRequiredPatientField = requiredPatientFieldKeys.has(field.key);
        const fieldError =
            field.key === "patient_name" || field.key === "patient_cpf"
                ? patientFieldErrors[field.key]
                : undefined;
        const errorId = `appointment-field-${field.key}-error`;

        return (
            <div className={getFieldClassName(field)} key={field.key}>
                {fieldType === "DATE" ? (
                    <DateInput
                        id={`appointment-field-${field.key}`}
                        label={field.label}
                        maxDate={
                            field.key === "patient_birth_date"
                                ? new Date()
                                : undefined
                        }
                        onChange={(value) => updateFieldValue(field.key, value)}
                        value={values[field.key] ?? ""}
                    />
                ) : (
                    <>
                        <label htmlFor={`appointment-field-${field.key}`}>
                            {field.label}
                            {isRequiredPatientField ? (
                                <span
                                    aria-hidden="true"
                                    className="appointment-required-marker"
                                >
                                    {" *"}
                                </span>
                            ) : null}
                        </label>
                        <input
                            aria-describedby={fieldError ? errorId : undefined}
                            aria-invalid={Boolean(fieldError)}
                            autoComplete={getAutoComplete(fieldType)}
                            className={fieldError ? "invalid" : undefined}
                            id={`appointment-field-${field.key}`}
                            inputMode={getInputMode(fieldType)}
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
                        {fieldError ? (
                            <p className="appointment-field-error" id={errorId}>
                                {fieldError}
                            </p>
                        ) : null}
                    </>
                )}
            </div>
        );
    }

    function renderDoctorSection(section: AppointmentFieldSection) {
        return (
            <>
                <div className="doctor-selection-field">
                    <label>Médico responsável</label>
                    <DoctorSelect
                        doctors={doctors}
                        error={
                            doctorLoadError
                                ? "Não foi possível carregar os médicos."
                                : null
                        }
                        loading={isLoadingDoctors}
                        onChange={updateDoctorSelection}
                        value={selectedDoctorId ?? ""}
                    />

                    {doctorLoadError ? (
                        <ErrorMessage
                            actionDisabled={isLoadingDoctors}
                            actionLabel={
                                isLoadingDoctors
                                    ? "Carregando..."
                                    : "Tentar novamente"
                            }
                            message="Não foi possível carregar os médicos."
                            onAction={loadDoctors}
                        />
                    ) : null}
                    {doctorValidationError ? (
                        <p className="appointment-field-error">
                            {doctorValidationError}
                        </p>
                    ) : null}
                </div>

                {section.fields.length > 0 ? (
                    <div className="appointment-field-list doctor-extra-fields">
                        {section.fields.map(renderField)}
                    </div>
                ) : null}
            </>
        );
    }

    if (!hasAppointmentData) {
        return (
            <section className="appointment-flow-page appointment-fill-page">
                <div className="appointment-flow-empty-card appointment-fill-empty-card">
                    <h1>Nenhum dado de atendimento foi encontrado.</h1>
                    <button
                        className="generate-documents-button"
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
        <section className="appointment-flow-page appointment-fill-page">
            <div className="appointment-flow-heading appointment-fill-heading">
                <h1>Dados do atendimento</h1>
                <p>
                    Informe os dados que serão usados nos documentos
                    selecionados.
                </p>
            </div>

            <div className="appointment-field-sections">
                {fieldSections.map((section) => (
                    <div
                        className="appointment-flow-card appointment-fill-card"
                        key={section.title}
                    >
                        <div className="appointment-flow-card-header appointment-fill-card-header">
                            <h2>{section.title}</h2>
                            <p>{getSectionDescription(section)}</p>
                        </div>

                        {section.kind === "doctor" ? (
                            renderDoctorSection(section)
                        ) : (
                            <div className="appointment-field-list">
                                {section.fields.map(renderField)}
                            </div>
                        )}
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
                        disabled={requiresDoctor && Boolean(doctorLoadError)}
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

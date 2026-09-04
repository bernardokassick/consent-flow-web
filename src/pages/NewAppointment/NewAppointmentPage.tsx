import { useNavigate } from "react-router-dom";

import { useAppointment } from "../../hooks/useAppointment";
import { getPdfFields } from "../../services/pdfService";
import type { ConsentTemplate } from "../../types/consentTemplate";
import "./NewAppointmentPage.css";

const consentTemplates: ConsentTemplate[] = [
    {
        id: "template.pdf",
        name: "Termo de Consentimento 1",
        description: "Formulario com nome e endereco",
    },
    {
        id: "template2.pdf",
        name: "Termo de Consentimento 2",
        description: "Formulario com paciente e ocupacao",
    },
];

export function NewAppointmentPage() {
    const navigate = useNavigate();
    const { selectedTemplates, setFields, setSelectedTemplates } =
        useAppointment();

    function toggleTemplate(templateId: string) {
        setSelectedTemplates((currentTemplates) => {
            if (currentTemplates.includes(templateId)) {
                return currentTemplates.filter((id) => id !== templateId);
            }

            return [...currentTemplates, templateId];
        });
    }

    async function handleContinue() {
        const fields = await getPdfFields(selectedTemplates);

        setFields(fields);
        navigate("/agendamento/preenchimento");
    }

    return (
        <section className="new-appointment-page">
            <div className="new-appointment-heading">
                <h1>Novo Agendamento</h1>
                <p>
                    Crie um novo agendamento e selecione os termos de
                    consentimento.
                </p>
            </div>

            <div className="template-selection-card">
                <div className="template-selection-header">
                    <h2>Selecione os termos de consentimento</h2>
                    <p>
                        Escolha quais documentos serao usados neste agendamento.
                    </p>
                </div>

                <div className="template-list">
                    {consentTemplates.map((template) => {
                        const isSelected = selectedTemplates.includes(template.id);

                        return (
                            <label
                                className={
                                    isSelected
                                        ? "template-option selected"
                                        : "template-option"
                                }
                                key={template.id}
                            >
                                <input
                                    checked={isSelected}
                                    onChange={() => toggleTemplate(template.id)}
                                    type="checkbox"
                                />
                                <span className="template-option-content">
                                    <strong>{template.name}</strong>
                                    <span>{template.description}</span>
                                </span>
                            </label>
                        );
                    })}
                </div>

                <button
                    className="continue-button"
                    disabled={selectedTemplates.length === 0}
                    onClick={handleContinue}
                    type="button"
                >
                    Continuar
                </button>
            </div>
        </section>
    );
}

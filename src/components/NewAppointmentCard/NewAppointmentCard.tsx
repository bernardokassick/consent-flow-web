import { useNavigate } from "react-router-dom";

import { appPaths } from "../../routes/appPaths";
import "./NewAppointmentCard.css";

export function NewAppointmentCard() {
    const navigate = useNavigate();

    return (
        <section className="appointment-hero">
            <div>
                <h1>Novo atendimento</h1>
                <p>
                    Inicie um novo atendimento, preencha os dados do paciente e
                    gere os termos de consentimento necessários.
                </p>
            </div>
            <button
                className="new-appointment-button"
                onClick={() => navigate(appPaths.appointment.select)}
                type="button"
            >
                <span>Novo atendimento</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>
        </section>
    );
}

import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
    label?: string;
}

export function LoadingSpinner({ label = "Carregando" }: LoadingSpinnerProps) {
    return (
        <span
            aria-label={label}
            className="loading-spinner"
            role="status"
        />
    );
}

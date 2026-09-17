import "./ErrorMessage.css";

interface ErrorMessageProps {
    actionLabel?: string;
    message: string;
    onAction?: () => void;
    actionDisabled?: boolean;
}

export function ErrorMessage({
    actionDisabled = false,
    actionLabel,
    message,
    onAction,
}: ErrorMessageProps) {
    return (
        <div className="error-message" role="alert">
            <span aria-hidden="true" className="error-message-icon">
                !
            </span>
            <p>{message}</p>
            {actionLabel && onAction ? (
                <button
                    disabled={actionDisabled}
                    onClick={onAction}
                    type="button"
                >
                    {actionLabel}
                </button>
            ) : null}
        </div>
    );
}

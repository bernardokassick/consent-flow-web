import {
    type PointerEvent,
    useCallback,
    useEffect,
    useRef,
} from "react";

import "./SignatureField.css";

interface SignatureFieldProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
}

type CanvasCoordinates = {
    x: number;
    y: number;
};

function getCanvasContext(canvas: HTMLCanvasElement) {
    return canvas.getContext("2d");
}

function isValidSignatureDataUrl(value?: string): value is string {
    return Boolean(value?.startsWith("data:image/png;base64,"));
}

export function SignatureField({ label, value, onChange }: SignatureFieldProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);

    const configureCanvas = useCallback(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        const context = getCanvasContext(canvas);

        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;

        if (!context) {
            return;
        }

        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.lineWidth = 2;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "#111827";
    }, []);

    const restoreSignature = useCallback(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const context = getCanvasContext(canvas);
        const rect = canvas.getBoundingClientRect();

        if (!context) {
            return;
        }

        context.clearRect(0, 0, rect.width, rect.height);

        if (!isValidSignatureDataUrl(value)) {
            return;
        }

        const signatureImage = new Image();

        signatureImage.onload = () => {
            context.clearRect(0, 0, rect.width, rect.height);
            context.drawImage(signatureImage, 0, 0, rect.width, rect.height);
        };
        signatureImage.src = value;
    }, [value]);

    useEffect(() => {
        configureCanvas();
        restoreSignature();
    }, [configureCanvas, restoreSignature]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const resizeObserver = new ResizeObserver(() => {
            configureCanvas();
            restoreSignature();
        });

        resizeObserver.observe(canvas);

        return () => resizeObserver.disconnect();
    }, [configureCanvas, restoreSignature]);

    function getCanvasCoordinates(
        event: PointerEvent<HTMLCanvasElement>,
    ): CanvasCoordinates {
        const canvas = event.currentTarget;
        const rect = canvas.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
        const context = getCanvasContext(event.currentTarget);

        if (!context) {
            return;
        }

        const coordinates = getCanvasCoordinates(event);

        event.currentTarget.setPointerCapture(event.pointerId);
        isDrawingRef.current = true;
        context.beginPath();
        context.moveTo(coordinates.x, coordinates.y);
    }

    function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
        if (!isDrawingRef.current) {
            return;
        }

        const context = getCanvasContext(event.currentTarget);

        if (!context) {
            return;
        }

        const coordinates = getCanvasCoordinates(event);

        context.lineTo(coordinates.x, coordinates.y);
        context.stroke();
    }

    function finishDrawing(event: PointerEvent<HTMLCanvasElement>) {
        if (!isDrawingRef.current) {
            return;
        }

        const canvas = event.currentTarget;

        if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }

        isDrawingRef.current = false;
        onChange(canvas.toDataURL("image/png"));
    }

    function clearSignature() {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const context = getCanvasContext(canvas);
        const rect = canvas.getBoundingClientRect();

        context?.clearRect(0, 0, rect.width, rect.height);
        onChange("");
    }

    return (
        <div className="signature-field">
            <div className="signature-field-header">
                <label>{label}</label>
                <p>Assine no espaço abaixo usando o mouse ou toque.</p>
            </div>

            <canvas
                aria-label={label}
                className="signature-canvas"
                onPointerCancel={finishDrawing}
                onPointerDown={handlePointerDown}
                onPointerLeave={finishDrawing}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrawing}
                ref={canvasRef}
            />

            <button
                className="clear-signature-button"
                onClick={clearSignature}
                type="button"
            >
                Limpar assinatura
            </button>
        </div>
    );
}

import axios from "axios";

import type { ApiErrorResponse } from "../types/ApiErrorResponse";

export const defaultApiErrorMessage =
    "Não foi possível concluir a operação. Tente novamente.";
export const networkApiErrorMessage =
    "Não foi possível conectar ao sistema. Verifique sua conexão e tente novamente.";
export const forbiddenApiErrorMessage =
    "Você não tem permissão para realizar esta ação.";
export const invalidSignatureMessage =
    "Não foi possível processar a assinatura. Limpe e assine novamente.";

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    if (!value || typeof value !== "object") {
        return false;
    }

    const possibleError = value as ApiErrorResponse;

    return (
        typeof possibleError.message === "string" ||
        typeof possibleError.code === "string"
    );
}

export function getApiErrorStatus(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return undefined;
    }

    return error.response?.status;
}

export function isRequestCanceled(error: unknown) {
    return axios.isCancel(error);
}

export function getApiErrorCode(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return undefined;
    }

    const data = error.response?.data;

    if (!isApiErrorResponse(data)) {
        return undefined;
    }

    return data.code;
}

export function getApiErrorMessage(
    error: unknown,
    fallbackMessage = defaultApiErrorMessage,
) {
    if (!axios.isAxiosError(error)) {
        return fallbackMessage;
    }

    if (!error.response) {
        return networkApiErrorMessage;
    }

    if (error.response.status === 403) {
        return forbiddenApiErrorMessage;
    }

    const data = error.response.data;

    if (isApiErrorResponse(data)) {
        if (data.code === "INVALID_SIGNATURE") {
            return invalidSignatureMessage;
        }

        if (data.message) {
            return data.message;
        }
    }

    return fallbackMessage;
}

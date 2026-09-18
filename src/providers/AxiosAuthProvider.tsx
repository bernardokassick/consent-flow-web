import { useAuth, useClerk } from "@clerk/react";
import axios, { type InternalAxiosRequestConfig } from "axios";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { appPaths } from "../routes/appPaths";
import { api } from "../services/api";

interface AxiosAuthProviderProps {
    children: ReactNode;
}

type AuthRetryConfig = InternalAxiosRequestConfig & {
    _authRetry?: boolean;
};

export function AxiosAuthProvider({ children }: AxiosAuthProviderProps) {
    const { getToken, isLoaded, isSignedIn, sessionId } = useAuth();
    const { signOut } = useClerk();
    const [isReady, setIsReady] = useState(false);
    const isHandlingUnauthorizedRef = useRef(false);
    const refreshTokenPromiseRef = useRef<Promise<string | null> | null>(null);

    useEffect(() => {
        if (!isLoaded) {
            setIsReady(false);
            return;
        }

        if (!isSignedIn) {
            setIsReady(true);
            return;
        }

        const requestInterceptor = api.interceptors.request.use(async (config) => {
            const authConfig = config as AuthRetryConfig;
            const requestedAt = new Date().toISOString();

            if (authConfig._authRetry) {
                if (import.meta.env.DEV) {
                    console.debug("[auth] axios retry request token preserved", {
                        hasSessionId: Boolean(sessionId),
                        hasToken: Boolean(config.headers.Authorization),
                        isLoaded,
                        isSignedIn,
                        requestedAt,
                        url: config.url,
                    });
                }

                return config;
            }

            try {
                const token = await getToken();

                if (import.meta.env.DEV) {
                    console.debug("[auth] axios request token check", {
                        hasSessionId: Boolean(sessionId),
                        hasToken: Boolean(token),
                        isLoaded,
                        isSignedIn,
                        requestedAt,
                        tokenTimestamps: token
                            ? getJwtTimestamps(token)
                            : null,
                        url: config.url,
                    });
                }

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                } else {
                    delete config.headers.Authorization;
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.debug("[auth] axios getToken failed", {
                        error,
                        hasSessionId: Boolean(sessionId),
                        isLoaded,
                        isSignedIn,
                        requestedAt,
                        url: config.url,
                    });
                }

                delete config.headers.Authorization;
            }

            return config;
        });
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const status = error?.response?.status;
                const originalRequest = error?.config as
                    | AuthRetryConfig
                    | undefined;

                if (import.meta.env.DEV) {
                    console.debug("[auth] axios response error", {
                        hasSessionId: Boolean(sessionId),
                        isLoaded,
                        isSignedIn,
                        receivedAt: new Date().toISOString(),
                        status,
                        url: originalRequest?.url,
                    });
                }

                if (status !== 401) {
                    return Promise.reject(error);
                }

                if (import.meta.env.DEV) {
                    console.debug("[auth] 401 recebido", {
                        hasSessionId: Boolean(sessionId),
                        isLoaded,
                        isSignedIn,
                        url: originalRequest?.url,
                        wasRetried: Boolean(originalRequest?._authRetry),
                    });
                }

                if (!originalRequest) {
                    await handleInvalidSession();
                    return Promise.reject(error);
                }

                if (originalRequest._authRetry) {
                    if (import.meta.env.DEV) {
                        console.debug("[auth] retry retornou 401", {
                            url: originalRequest.url,
                        });
                    }

                    await handleInvalidSession();
                    return Promise.reject(error);
                }

                if (isLoaded && isSignedIn) {
                    if (import.meta.env.DEV) {
                        console.debug("[auth] Clerk ainda autenticado", {
                            hasSessionId: Boolean(sessionId),
                            url: originalRequest.url,
                        });
                        console.debug("[auth] solicitando token fresco", {
                            url: originalRequest.url,
                        });
                    }

                    let freshToken: string | null = null;

                    try {
                        freshToken = await getFreshToken();
                    } catch (refreshError) {
                        if (import.meta.env.DEV) {
                            console.debug("[auth] token fresco falhou", {
                                error: refreshError,
                                url: originalRequest.url,
                            });
                        }
                    }

                    if (freshToken) {
                        originalRequest._authRetry = true;
                        originalRequest.headers.Authorization = `Bearer ${freshToken}`;

                        if (import.meta.env.DEV) {
                            console.debug("[auth] retry da request", {
                                tokenTimestamps: getJwtTimestamps(freshToken),
                                url: originalRequest.url,
                            });
                        }

                        try {
                            const retryResponse = await api(originalRequest);

                            if (import.meta.env.DEV) {
                                console.debug("[auth] retry concluído", {
                                    status: retryResponse.status,
                                    url: originalRequest.url,
                                });
                            }

                            return retryResponse;
                        } catch (retryError) {
                            if (
                                import.meta.env.DEV &&
                                axios.isAxiosError(retryError) &&
                                retryError.response?.status === 401
                            ) {
                                console.debug("[auth] retry retornou 401", {
                                    url: originalRequest.url,
                                });
                            }

                            return Promise.reject(retryError);
                        }
                    } else if (import.meta.env.DEV) {
                        console.debug("[auth] token fresco ausente", {
                            url: originalRequest.url,
                        });
                    }
                } else if (import.meta.env.DEV) {
                    console.debug("[auth] Clerk não autenticado no 401", {
                        hasSessionId: Boolean(sessionId),
                        isLoaded,
                        isSignedIn,
                        url: originalRequest.url,
                    });
                }

                await handleInvalidSession();

                return Promise.reject(error);
            },
        );

        async function getFreshToken() {
            if (!refreshTokenPromiseRef.current) {
                refreshTokenPromiseRef.current = getToken({
                    skipCache: true,
                }).finally(() => {
                    refreshTokenPromiseRef.current = null;
                });
            }

            return refreshTokenPromiseRef.current;
        }

        async function handleInvalidSession() {
            if (isHandlingUnauthorizedRef.current) {
                return;
            }

            isHandlingUnauthorizedRef.current = true;

            if (import.meta.env.DEV) {
                console.debug("[auth] sessão realmente inválida", {
                    hasSessionId: Boolean(sessionId),
                    isLoaded,
                    isSignedIn,
                });
            }

            const loginUrl = `${appPaths.login}?sessionExpired=1`;

            try {
                await signOut({ redirectUrl: loginUrl });
            } catch (signOutError) {
                console.error(signOutError);
                window.location.assign(loginUrl);
            }
        }

        setIsReady(true);

        return () => {
            api.interceptors.request.eject(requestInterceptor);
            api.interceptors.response.eject(responseInterceptor);
            setIsReady(false);
        };
    }, [getToken, isLoaded, isSignedIn, sessionId, signOut]);

    if (!isReady) {
        return <div className="auth-loading">Carregando autenticação...</div>;
    }

    return children;
}

function getJwtTimestamps(token: string) {
    try {
        const [, payload] = token.split(".");

        if (!payload) {
            return null;
        }

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = atob(
            normalizedPayload.padEnd(
                normalizedPayload.length + ((4 - normalizedPayload.length % 4) % 4),
                "=",
            ),
        );
        const parsedPayload = JSON.parse(decodedPayload) as {
            exp?: unknown;
            iat?: unknown;
        };

        return {
            exp:
                typeof parsedPayload.exp === "number"
                    ? parsedPayload.exp
                    : null,
            iat:
                typeof parsedPayload.iat === "number"
                    ? parsedPayload.iat
                    : null,
        };
    } catch {
        return null;
    }
}

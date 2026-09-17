import { useAuth, useClerk } from "@clerk/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { useAppointment } from "../hooks/useAppointment";
import { appPaths } from "../routes/appPaths";
import { api } from "../services/api";

interface AxiosAuthProviderProps {
    children: ReactNode;
}

export function AxiosAuthProvider({ children }: AxiosAuthProviderProps) {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { signOut } = useClerk();
    const { resetAppointment } = useAppointment();
    const [isReady, setIsReady] = useState(false);
    const isHandlingUnauthorizedRef = useRef(false);

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
            const token = await getToken();

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        });
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (
                    error?.response?.status === 401 &&
                    !isHandlingUnauthorizedRef.current
                ) {
                    isHandlingUnauthorizedRef.current = true;
                    resetAppointment();

                    const loginUrl = `${appPaths.login}?sessionExpired=1`;

                    try {
                        await signOut({ redirectUrl: loginUrl });
                    } catch (signOutError) {
                        console.error(signOutError);
                        window.location.assign(loginUrl);
                    }
                }

                return Promise.reject(error);
            },
        );

        setIsReady(true);

        return () => {
            api.interceptors.request.eject(requestInterceptor);
            api.interceptors.response.eject(responseInterceptor);
            setIsReady(false);
        };
    }, [getToken, isLoaded, isSignedIn, resetAppointment, signOut]);

    if (!isReady) {
        return <div className="auth-loading">Carregando autenticação...</div>;
    }

    return children;
}

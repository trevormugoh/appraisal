"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from "react";

interface ToastCtx {
    toast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

interface ToastItem {
    id: number;
    message: string;
    type: "success" | "error";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    let idCounter = 0;

    const toast = useCallback((message: string, type: "success" | "error" = "success") => {
        const id = Date.now() + idCounter++;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[200] space-y-2">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

"use client";

import { useEffect, useState } from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    variant = "danger",
}: ConfirmationModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = "hidden";
        } else {
            const timer = setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = "unset";
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted && !isOpen) return null;

    const variantStyles = {
        danger: {
            bg: "bg-red-50",
            icon: "text-red-600",
            button: "bg-red-600 hover:bg-red-700 shadow-red-200",
            ring: "focus:ring-red-500/20",
        },
        warning: {
            bg: "bg-amber-50",
            icon: "text-amber-600",
            button: "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
            ring: "focus:ring-amber-500/20",
        },
        info: {
            bg: "bg-blue-50",
            icon: "text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
            ring: "focus:ring-blue-500/20",
        },
    };

    const style = variantStyles[variant];

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onCancel}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-6 md:p-8 transform transition-all duration-300 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
            >
                <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 ${style.bg} ${style.icon} rounded-2xl flex items-center justify-center mb-6`}>
                        {variant === "danger" && (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        )}
                        {variant === "warning" && (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {variant === "info" && (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-surface-dark mb-2 tracking-tight">{title}</h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 ${style.button} text-white rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-xl active:scale-95 outline-none focus:ring-4 ${style.ring}`}
                        >
                            {confirmLabel}
                        </button>
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-black transition-all active:scale-95 outline-none focus:ring-4 focus:ring-slate-100"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { MockUser, UserRole } from "@/lib/types";

export const MOCK_USERS: MockUser[] = [
    {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        name: "Sarah Wanjiku",
        email: "sarah@qwikpace.com",
        role: "hr",
        avatar: "SW",
    },
    {
        id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        name: "James Ochieng",
        email: "james@qwikpace.com",
        role: "employee",
        avatar: "JO",
    },
    {
        id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
        name: "Alice Muthoni",
        email: "alice@qwikpace.com",
        role: "manager",
        avatar: "AM",
    },
];

interface AuthContextType {
    currentUser: MockUser;
    switchRole: (role: UserRole) => void;
    allUsers: MockUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<MockUser>(MOCK_USERS[0]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedRole = localStorage.getItem("qwik-role") as UserRole | null;
        if (savedRole) {
            const user = MOCK_USERS.find((u) => u.role === savedRole);
            if (user) setCurrentUser(user);
        }
        setMounted(true);
    }, []);

    const switchRole = (role: UserRole) => {
        const user = MOCK_USERS.find((u) => u.role === role);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem("qwik-role", role);
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <AuthContext.Provider
            value={{ currentUser, switchRole, allUsers: MOCK_USERS }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, MOCK_USERS } from "@/context/auth-context";
import type { UserRole } from "@/lib/types";

const NAV_ITEMS: Record<UserRole, { label: string; href: string }[]> = {
    hr: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Appraisal Cycles", href: "/dashboard/cycles" },
        { label: "All Appraisals", href: "/dashboard/appraisals" },
    ],
    employee: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "My Appraisals", href: "/dashboard/appraisals" },
    ],
    manager: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Team Appraisals", href: "/dashboard/appraisals" },
    ],
};

const ROLE_LABELS: Record<UserRole, string> = {
    hr: "HR Admin",
    employee: "Employee",
    manager: "Manager",
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { currentUser, switchRole } = useAuth();
    const pathname = usePathname();
    const links = NAV_ITEMS[currentUser.role];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            <aside className={`fixed lg:static top-0 left-0 w-[280px] min-w-[280px] h-screen flex flex-col bg-[#f9fff5] text-[#004d24] overflow-y-auto border-r border-[#004d24]/10 shadow-xl z-50 shrink-0 transition-transform duration-300 transform ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}>
                {/* Logo & Close Button */}
                <div className="p-8 pb-6 border-b border-[#004d24]/5 flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-black tracking-tight text-[#004d24] uppercase">
                            qwik<span className="text-primary">pace</span>
                        </div>
                        <div className="text-[10px] font-black text-[#004d24]/30 uppercase tracking-[0.2em] mt-2">
                            Appraisal Suite
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-[#004d24]/50 hover:text-[#004d24] lg:hidden transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* User */}
                <div className="p-4 py-6">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#004d24]/5 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-white text-base shrink-0 shadow-lg shadow-primary/20">
                            {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-[#004d24] truncate">{currentUser.name}</div>
                            <div className="text-[10px] font-black text-primary uppercase tracking-wider mt-0.5">{ROLE_LABELS[currentUser.role]}</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 space-y-1">
                    <div className="text-[10px] font-black text-[#004d24]/20 uppercase tracking-[0.25em] px-4 mb-4">
                        Management
                    </div>
                    {links.map((link) => {
                        const isActive = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive
                                    ? "bg-[#e6e6e5] text-[#004d24] shadow-sm"
                                    : "text-[#004d24]/60 hover:text-[#004d24] hover:bg-[#e6e6e5]/50"
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? "bg-[#004d24] scale-100" : "bg-transparent scale-0 group-hover:bg-[#004d24] group-hover:scale-100"}`} />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Role Switcher */}
                <div className="p-4 border-t border-[#004d24]/5 mt-auto">
                    <div className="text-[10px] font-black text-[#004d24]/20 uppercase tracking-[0.25em] px-4 mb-4">
                        Role Simulation
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {MOCK_USERS.map((user) => {
                            const isSelected = currentUser.role === user.role;
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        switchRole(user.role);
                                        onClose();
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${isSelected
                                        ? "bg-white border-[#004d24]/10 text-[#004d24]"
                                        : "bg-transparent border-transparent text-[#004d24]/40 hover:text-[#004d24] hover:bg-white/50"
                                        }`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${isSelected ? "bg-primary text-white" : "bg-[#004d24]/10 text-[#004d24]/50"
                                        }`}>
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-bold truncate">{user.name}</div>
                                        <div className="text-[9px] font-black text-primary/70 uppercase tracking-tight">{user.role}</div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,77,36,0.3)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </>
    );
}

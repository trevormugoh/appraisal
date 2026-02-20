"use client";

import { useEffect, useState } from "react";
import { appraisalsApi, cyclesApi } from "@/lib/api";
import type { Appraisal, AppraisalCycle } from "@/lib/types";
import { AppraisalStatus } from "@/lib/types";
import { useAuth, MOCK_USERS } from "@/context/auth-context";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";

export default function AppraisalsPage() {
    const { currentUser } = useAuth();
    const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
    const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const [a, c] = await Promise.all([
                    currentUser.role === "employee" ? appraisalsApi.getByEmployee(currentUser.id) : appraisalsApi.getAll(),
                    cyclesApi.getAll(),
                ]);
                setAppraisals(Array.isArray(a) ? a : []);
                setCycles(Array.isArray(c) ? c : []);
            } catch {
                setError("Failed to fetch");
                setAppraisals([]);
                setCycles([]);
            }
            finally { setLoading(false); }
        }
        load();
    }, [currentUser]);

    const getCycleName = (id: string) => cycles.find((c) => c.id === id)?.name ?? "—";
    const getEmployeeName = (id: string) => MOCK_USERS.find((u) => u.id === id)?.name ?? id.slice(0, 8) + "...";

    const titles: Record<string, string> = {
        hr: "All Appraisals",
        employee: "My Appraisals",
        manager: "Team Appraisals",
    };

    if (loading) return (
        <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-4 w-96 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-[400px] bg-white rounded-[32px] border border-slate-100 shadow-sm animate-pulse" />
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-surface-dark tracking-tight">{titles[currentUser.role]}</h1>
                    <p className="text-base text-slate-500 font-medium">
                        {currentUser.role === "hr" && "Overview of all active and past appraisal records across the organization."}
                        {currentUser.role === "employee" && "View your performance history and current appraisal progress."}
                        {currentUser.role === "manager" && "Monitor and review performance submissions from your direct reports."}
                    </p>
                </div>

                {currentUser.role === "hr" && (
                    <Link
                        href="/dashboard/cycles"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-dark text-white rounded-xl text-xs font-bold hover:bg-primary transition-all duration-300 shadow-lg shadow-surface-dark/10"
                    >
                        Manage Cycles
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold border border-red-100 animate-fade-in flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {appraisals.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-surface-dark mb-2">No Appraisals Yet</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">
                        {currentUser.role === "hr" ? "You haven't initiated any appraisals for this cycle." : "No appraisals have been assigned to you at this time."}
                    </p>
                    {currentUser.role === "hr" && (
                        <Link href="/dashboard/cycles" className="mt-8 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                            Launch A Cycle
                        </Link>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-scale-in">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    {currentUser.role !== "employee" && (
                                        <th className="text-left px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                                    )}
                                    <th className="text-left px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Appraisal Cycle</th>
                                    <th className="text-left px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                                    <th className="text-left px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Overall Rating</th>
                                    <th className="text-right px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {appraisals.map((a) => (
                                    <tr key={a.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        {currentUser.role !== "employee" && (
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-black ring-1 ring-primary/10 shadow-sm">
                                                        {getEmployeeName(a.employeeId).charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-surface-dark group-hover:text-black transition-colors">{getEmployeeName(a.employeeId)}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-8 py-5">
                                            <div className="text-sm text-slate-600 font-bold">{getCycleName(a.appraisalCycleId)}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <StatusBadge status={a.status} />
                                        </td>
                                        <td className="px-8 py-5">
                                            {a.overallRating != null ? (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-base font-black ${a.overallRating >= 4 ? "text-primary" : a.overallRating >= 3 ? "text-amber-500" : "text-red-500"}`}>
                                                        {a.overallRating.toFixed(1)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">/ 5.0</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 font-black tracking-widest">—</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <Link
                                                href={`/dashboard/appraisals/${a.id}`}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-surface-dark hover:text-white transition-all duration-300 group/btn"
                                            >
                                                {currentUser.role === "employee" ? "Open Appraisal" : currentUser.role === "manager" ? "Review Now" : "View Details"}
                                                <svg className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

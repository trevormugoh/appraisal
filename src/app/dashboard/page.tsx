"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { cyclesApi, appraisalsApi } from "@/lib/api";
import type { AppraisalCycle, Appraisal } from "@/lib/types";
import { AppraisalStatus } from "@/lib/types";
import Link from "next/link";

export default function DashboardPage() {
    const { currentUser } = useAuth();
    const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
    const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [c, a] = await Promise.all([cyclesApi.getAll(), appraisalsApi.getAll()]);
                setCycles(Array.isArray(c) ? c : []);
                setAppraisals(Array.isArray(a) ? a : []);
            } catch {
                setCycles([]); setAppraisals([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const activeCycles = cycles.filter((c) => c.isActive);
    const pendingReview = appraisals.filter((a) => a.status === AppraisalStatus.KpisSubmitted);
    const selfReviewPending = appraisals.filter((a) => a.status === AppraisalStatus.KpisRespondedTo);
    const managerReviewPending = appraisals.filter((a) => a.status === AppraisalStatus.EmployeeReviewSubmitted);
    const completed = appraisals.filter((a) => a.status === AppraisalStatus.Completed || a.status === AppraisalStatus.HodReviewSubmitted);

    if (loading) {
        return (
            <div className="space-y-10 animate-fade-in">
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="h-5 w-96 bg-slate-100 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-white rounded-[32px] border border-slate-100 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const roleStats = currentUser.role === "hr"
        ? [
            { value: activeCycles.length, label: "Active Cycles", color: "text-[#48ad51]", bg: "bg-green-50" },
            { value: appraisals.length, label: "Total Appraisals", color: "text-[#364241]", bg: "bg-slate-50" },
            { value: pendingReview.length, label: "To Review", color: "text-amber-600", bg: "bg-amber-50" },
            { value: completed.length, label: "Archived", color: "text-slate-400", bg: "bg-slate-50" },
        ]
        : currentUser.role === "employee"
            ? [
                { value: appraisals.length, label: "My Reviews", color: "text-[#48ad51]", bg: "bg-green-50" },
                { value: selfReviewPending.length, label: "Action Items", color: "text-amber-600", bg: "bg-amber-50" },
                { value: completed.length, label: "Completed", color: "text-[#364241]", bg: "bg-slate-50" },
                { value: activeCycles.length, label: "Open Periods", color: "text-slate-400", bg: "bg-slate-50" },
            ]
            : [
                { value: appraisals.length, label: "Team Count", color: "text-[#48ad51]", bg: "bg-green-50" },
                { value: managerReviewPending.length, label: "Awaiting Me", color: "text-amber-600", bg: "bg-amber-50" },
                { value: completed.length, label: "Finalized", color: "text-[#364241]", bg: "bg-slate-50" },
                { value: activeCycles.length, label: "Active Cycles", color: "text-slate-400", bg: "bg-slate-50" },
            ];

    return (
        <div className="w-full space-y-8 md:space-y-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#364241] tracking-tight">
                        Welcome back, <span className="text-primary">{currentUser.name.split(" ")[0]}</span> 👋
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium tracking-tight">
                        {currentUser.role === "hr" && "Here's the organization-wide performance overview."}
                        {currentUser.role === "employee" && "Monitor your goals and performance review milestones."}
                        {currentUser.role === "manager" && "Oversee and support your team's development progress."}
                    </p>
                </div>
                <div className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm transition-all hover:shadow-md h-fit self-start sm:self-center">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        {currentUser.role === "hr" ? "Admin" : currentUser.role === "manager" ? "Manager" : "Employee"} Access
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
                {roleStats.map((stat, i) => (
                    <div key={i} className="group bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-7 border border-slate-100 shadow-sm transition-all duration-300 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 ${stat.bg} rounded-full translate-x-8 -translate-y-8 opacity-30 group-hover:scale-110 transition-transform duration-500`} />
                        <div className="relative z-10">
                            <div className={`text-3xl md:text-4xl font-black ${stat.color} tracking-tight leading-none mb-2`}>
                                {stat.value}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                {stat.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 w-full items-start">
                {/* Active Cycles Section */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6 w-full">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl md:text-2xl font-black text-[#364241] tracking-tight">Ongoing Review Periods</h2>
                        <Link href="/dashboard/cycles" className="text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                            Show All
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    </div>

                    <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 border border-slate-100 shadow-sm w-full">
                        {activeCycles.length === 0 ? (
                            <div className="py-12 md:py-16 flex flex-col items-center justify-center text-center opacity-40">
                                <div className="w-12 md:w-16 h-12 md:h-16 bg-slate-50 rounded-[20px] md:rounded-[24px] flex items-center justify-center mb-4">
                                    <svg className="w-6 md:w-8 h-6 md:h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-sm font-bold text-slate-400">No active cycles currently</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeCycles.map((cycle) => (
                                    <Link key={cycle.id} href={`/dashboard/cycles/${cycle.id}`} className="group p-4 md:p-5 bg-slate-50/50 rounded-[24px] border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-md transition-all duration-300 flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm md:text-base font-black text-[#364241] truncate">{cycle.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                    Ends {new Date(cycle.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-primary group-hover:text-primary transition-all ml-2">
                                            <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Column */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-6 w-full">
                    <h2 className="text-xl md:text-2xl font-black text-[#364241] tracking-tight px-2">Quick Access</h2>
                    <div className="bg-surface-dark rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-xl shadow-[#364241]/10 space-y-6 relative overflow-hidden group w-full">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full group-hover:scale-125 transition-transform duration-700" />

                        <div className="relative z-10 space-y-3">
                            {currentUser.role === "hr" && (
                                <>
                                    <Link href="/dashboard/cycles" className="group/item flex items-center justify-between p-3.5 bg-primary text-white rounded-[20px] hover:bg-white hover:text-[#364241] transition-all duration-300 w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                            </div>
                                            <span className="text-sm font-black">Configure Cycles</span>
                                        </div>
                                        <svg className="w-4 h-4 transform group-hover/item:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </Link>
                                    <Link href="/dashboard/appraisals" className="group/item flex items-center justify-between p-3.5 bg-white/10 text-white rounded-[20px] border border-white/5 hover:bg-white hover:text-surface-dark transition-all duration-300 w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover/item:bg-surface-dark/10 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                            </div>
                                            <span className="text-sm font-black">View Distribution</span>
                                        </div>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </Link>
                                </>
                            )}
                            {currentUser.role === "employee" && (
                                <Link href="/dashboard/appraisals" className="group/item flex items-center justify-between p-4 bg-primary text-white rounded-[24px] hover:bg-white hover:text-surface-dark transition-all duration-300 w-full">
                                    <span className="text-sm md:text-base font-black tracking-tight">My Appraisals</span>
                                    <svg className="w-5 h-5 transform group-hover/item:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </Link>
                            )}
                            {currentUser.role === "manager" && (
                                <Link href="/dashboard/appraisals" className="group/item flex items-center justify-between p-4 bg-primary text-white rounded-[24px] hover:bg-white hover:text-surface-dark transition-all duration-300 w-full">
                                    <span className="text-sm md:text-base font-black tracking-tight">Review Submissions</span>
                                    <svg className="w-5 h-5 transform group-hover/item:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </Link>
                            )}
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
}

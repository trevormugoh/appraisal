"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cyclesApi, appraisalsApi } from "@/lib/api";
import type { AppraisalCycle, Appraisal } from "@/lib/types";
import { useAuth, MOCK_USERS } from "@/context/auth-context";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import Link from "next/link";

export default function CycleDetailPage() {
    const params = useParams();
    const cycleId = params.id as string;
    const { currentUser } = useAuth();
    const { toast } = useToast();

    const [cycle, setCycle] = useState<AppraisalCycle | null>(null);
    const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Create appraisal form
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [comments, setComments] = useState("");

    const employees = MOCK_USERS.filter((u) => u.role === "employee");

    const loadData = async () => {
        setLoading(true);
        try {
            const [c, allAppraisals] = await Promise.all([
                cyclesApi.getById(cycleId),
                appraisalsApi.getAll(),
            ]);
            setCycle(c);
            const cycleAppraisals = (Array.isArray(allAppraisals) ? allAppraisals : []).filter(
                (a) => a.appraisalCycleId === cycleId
            );
            setAppraisals(cycleAppraisals);
        } catch {
            setCycle(null);
            setAppraisals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [cycleId]);

    const handleCreateAppraisal = async () => {
        if (!selectedEmployee) return;
        setCreating(true);
        try {
            await appraisalsApi.create({
                employeeId: selectedEmployee,
                appraisalCycleId: cycleId,
                comments: comments || null,
            });
            toast("Appraisal created successfully");
            setShowCreateModal(false);
            setSelectedEmployee("");
            setComments("");
            loadData();
        } catch (e: unknown) {
            toast(e instanceof Error ? e.message : "Failed to create appraisal", "error");
        } finally {
            setCreating(false);
        }
    };

    const getEmployeeName = (empId: string) => {
        const user = MOCK_USERS.find((u) => u.id === empId);
        return user ? user.name : empId.slice(0, 8) + "...";
    };

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return d;
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="h-6 w-32 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-[200px] bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse" />
                <div className="space-y-4">
                    <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-[400px] bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse" />
                </div>
            </div>
        );
    }

    if (!cycle) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 animate-fade-in">
                <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-8">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#364241] mb-2">Cycle Not Found</h1>
                <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium">The appraisal cycle you're looking for doesn't exist or has been removed.</p>
                <Link href="/dashboard/cycles" className="px-6 py-2.5 bg-[#364241] text-white rounded-xl text-xs font-bold hover:bg-[#48ad51] transition-all">
                    Back to All Cycles
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header & Back Action */}
            <div className="space-y-6">
                <Link
                    href="/dashboard/cycles"
                    className="group inline-flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-[#48ad51] transition-colors"
                >
                    <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to All Cycles
                </Link>

                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-32 -translate-y-32 group-hover:bg-[#48ad51]/5 transition-colors duration-700" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold text-[#364241] tracking-tight">{cycle.name}</h1>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100">
                                    <svg className="w-4 h-4 text-[#48ad51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(cycle.startDate)}
                                    <span className="text-slate-300 mx-1">—</span>
                                    {formatDate(cycle.endDate)}
                                </div>
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${cycle.isActive ? "bg-[#e8f5e9] text-[#2d7535]" : "bg-slate-100 text-slate-500"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${cycle.isActive ? "bg-[#48ad51] animate-pulse" : "bg-slate-400"}`} />
                                    {cycle.isActive ? "Active Period" : "Complete"}
                                </span>
                            </div>
                        </div>

                        {currentUser.role === "hr" && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-[#48ad51] text-white rounded-xl text-xs font-bold hover:bg-[#3a9142] transition-all duration-300 shadow-xl shadow-[#48ad51]/20 group/btn"
                            >
                                <svg className="w-4 h-4 transform group-hover/btn:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Appraisal
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Appraisals Grid/List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-[#364241] tracking-tight">Cycle Participants</h2>
                    <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] shadow-sm">
                        Total: {appraisals.length}
                    </div>
                </div>

                {appraisals.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] py-32 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-[#364241] mb-2">No Participants Assigned</h3>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium mb-10">
                            {currentUser.role === 'hr' ? 'Assign employees to this cycle to start their performance reviews.' : 'There are no active appraisals in this cycle yet.'}
                        </p>
                        {currentUser.role === 'hr' && (
                            <button onClick={() => setShowCreateModal(true)} className="px-8 py-2.5 bg-white border border-slate-200 text-[#364241] rounded-xl text-xs font-bold hover:border-[#48ad51] hover:text-[#48ad51] transition-all shadow-sm">
                                Add Participant
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-scale-in">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                                        <th className="text-left px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                                        <th className="text-left px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Overall Score</th>
                                        <th className="text-right px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {appraisals.map((a) => (
                                        <tr key={a.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[#48ad51]/10 text-[#48ad51] flex items-center justify-center text-sm font-bold shadow-sm ring-1 ring-[#48ad51]/10">
                                                        {getEmployeeName(a.employeeId).charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-[#364241] group-hover:text-black transition-colors">
                                                        {getEmployeeName(a.employeeId)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <StatusBadge status={a.status} />
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-[#364241]">
                                                {a.overallRating != null ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-base font-bold ${a.overallRating >= 4 ? 'text-[#48ad51]' : a.overallRating >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                                                            {a.overallRating.toFixed(1)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">/ 5.0</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Pending Review</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <Link
                                                    href={`/dashboard/appraisals/${a.id}`}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-[#364241] hover:text-white transition-all duration-300 group/btn"
                                                >
                                                    Open Details
                                                    <svg className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
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

            {/* Create Appraisal Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 bg-[#364241]/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in px-4"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div className="bg-white rounded-[40px] shadow-2xl p-10 w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-[#364241] tracking-tight">Initiate Appraisal</h2>
                                <p className="text-sm text-slate-500 font-medium tracking-tight">Select an employee and add initial briefing notes.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Assign to Employee</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-[#48ad51] focus:ring-4 focus:ring-[#48ad51]/5 transition-all outline-none appearance-none cursor-pointer"
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                >
                                    <option value="">Select an employee...</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} — {emp.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Initial Brief / Comments</label>
                                <textarea
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-[#48ad51] focus:ring-4 focus:ring-[#48ad51]/5 transition-all min-h-[120px] resize-none"
                                    placeholder="Enter initial briefing notes or instructions for this appraisal cycle..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-50">
                                <button
                                    onClick={handleCreateAppraisal}
                                    disabled={creating || !selectedEmployee}
                                    className="flex-1 py-3 bg-[#48ad51] text-white rounded-xl text-xs font-bold hover:bg-[#3a9142] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-[#48ad51]/20"
                                >
                                    {creating ? "Launching..." : "Launch Appraisal"}
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

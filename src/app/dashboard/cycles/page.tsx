"use client";

import { useEffect, useState } from "react";
import { cyclesApi } from "@/lib/api";
import type { AppraisalCycle, CreateAppraisalCycleCommand } from "@/lib/types";
import Link from "next/link";
import { ConfirmationModal } from "@/components/confirmation-modal";

export default function CyclesPage() {
    const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCycle, setEditingCycle] = useState<AppraisalCycle | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cycleToDelete, setCycleToDelete] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(true);

    const loadCycles = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await cyclesApi.getAll();
            setCycles(Array.isArray(data) ? data : []);
        } catch {
            setError("Failed to fetch");
            setCycles([]);
        }
        finally { setLoading(false); }
    };

    useEffect(() => { loadCycles(); }, []);

    const openCreate = () => {
        setEditingCycle(null); setName(""); setStartDate(""); setEndDate(""); setIsActive(true);
        setModalError(null);
        setShowModal(true);
    };

    const openEdit = (cycle: AppraisalCycle) => {
        setEditingCycle(cycle); setName(cycle.name);
        setStartDate(cycle.startDate.split("T")[0]); setEndDate(cycle.endDate.split("T")[0]);
        setIsActive(cycle.isActive);
        setModalError(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!name || !startDate || !endDate) return;
        setSaving(true);
        setModalError(null);
        try {
            if (editingCycle) {
                await cyclesApi.update(editingCycle.id, { id: editingCycle.id, name, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), isActive });
            } else {
                const cmd: CreateAppraisalCycleCommand = { name, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), isActive };
                await cyclesApi.create(cmd);
            }
            setShowModal(false); loadCycles();
        } catch (e: unknown) {
            setModalError(e instanceof Error ? e.message : "Failed to save");
        } finally { setSaving(false); }
    };

    const handleDeleteClick = (id: string) => {
        setCycleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!cycleToDelete) return;
        setIsDeleteModalOpen(false);
        setError(null);
        try {
            await cyclesApi.delete(cycleToDelete);
            loadCycles();
            setCycleToDelete(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to delete");
        }
    };

    const fmt = (d: string) => {
        try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
        catch { return d; }
    };

    if (loading) return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
            </div>
            <div className="h-[300px] bg-white rounded-[32px] border border-slate-100 shadow-sm animate-pulse" />
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-surface-dark tracking-tight">Appraisal Cycles</h1>
                    <p className="text-base text-slate-500 font-medium tracking-tight">Manage the timeline and status of your performance review periods.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary-dark transition-all duration-300 shadow-xl shadow-primary/20 group"
                >
                    <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    New Cycle
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold border border-red-100 animate-fade-in flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {/* Table */}
            {cycles.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-surface-dark mb-2">No Cycles Found</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium mb-10">
                        Get started by creating your first performance appraisal cycle to define the review timeline.
                    </p>
                    <button
                        onClick={openCreate}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-surface-dark rounded-xl text-xs font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
                    >
                        Create First Cycle
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-scale-in">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Cycle Name</th>
                                    <th className="text-left px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Duration</th>
                                    <th className="text-left px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="text-right px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {cycles.map((cycle) => (
                                    <tr key={cycle.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-5">
                                            <Link href={`/dashboard/cycles/${cycle.id}`} className="font-bold text-surface-dark hover:text-primary transition-all flex items-center gap-3">
                                                {cycle.name}
                                                <svg className="w-3.5 h-3.5 transform translate-x-[-4px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </Link>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm text-slate-600 font-bold whitespace-nowrap">
                                                {fmt(cycle.startDate)}
                                                <span className="text-slate-300 mx-2 uppercase tracking-widest text-[10px]">to</span>
                                                {fmt(cycle.endDate)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cycle.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cycle.isActive ? "bg-primary animate-pulse" : "bg-slate-400"}`} />
                                                {cycle.isActive ? "Active Period" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(cycle)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-[#48ad51] hover:bg-[#e8f5e9] transition-all" title="Edit Parameters">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => handleDeleteClick(cycle.id)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Archive Cycle">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#364241]/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in px-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-[40px] shadow-2xl p-10 w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-surface-dark tracking-tight">{editingCycle ? "Update Parameters" : "Launch New Cycle"}</h2>
                                <p className="text-sm text-slate-500 font-medium">Define the timeframe for this review period.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cycle Branding / Name</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="e.g. Annual Performance Review 2026"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Starts On</label>
                                    <input
                                        type="date"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ends On</label>
                                    <input
                                        type="date"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white hover:border-primary/30 hover:shadow-sm transition-all group">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isActive ? "bg-primary border-primary" : "border-slate-200"}`}>
                                    {isActive && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    <input type="checkbox" className="hidden" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-surface-dark">Set as Active Cycle</div>
                                    <div className="text-[10px] text-slate-400 font-medium">This will make it the default for new appraisals.</div>
                                </div>
                            </label>

                            {modalError && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {modalError}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !name || !startDate || !endDate}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/20"
                                >
                                    {saving ? "Processing..." : editingCycle ? "Update Period" : "Launch Cycle"}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Archive Appraisal Cycle?"
                message="This will hide the cycle and all its associated appraisals. This action is high-impact and cannot be easily undone."
                confirmLabel="Archive Cycle"
                cancelLabel="Keep Cycle"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setCycleToDelete(null);
                }}
            />
        </div>
    );
}

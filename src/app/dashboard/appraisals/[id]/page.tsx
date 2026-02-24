"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { appraisalsApi, kpisApi } from "@/lib/api";
import type {
    Appraisal,
    Kpi,
    KpiEmployeeReviewDto,
    KpiHodReviewDto,
} from "@/lib/types";
import { AppraisalStatus } from "@/lib/types";
import { useAuth, MOCK_USERS } from "@/context/auth-context";
import Link from "next/link";

const STATUS_MAP: Record<number, { label: string; color: string }> = {
    [AppraisalStatus.Draft]: { label: "Draft", color: "bg-slate-100 text-slate-600" },
    [AppraisalStatus.KpisSubmitted]: { label: "KPIs Submitted", color: "bg-blue-50 text-blue-700" },
    [AppraisalStatus.KpisRespondedTo]: { label: "KPIs Accepted", color: "bg-purple-50 text-purple-700" },
    [AppraisalStatus.EmployeeReviewSubmitted]: { label: "Self-Review Done", color: "bg-orange-50 text-orange-700" },
    [AppraisalStatus.HodReviewSubmitted]: { label: "Manager Done", color: "bg-green-50 text-green-700" },
    [AppraisalStatus.Completed]: { label: "Completed", color: "bg-primary text-white" },
};

export default function AppraisalDetailPage() {
    const params = useParams();
    const appraisalId = params.id as string;
    const { currentUser } = useAuth();

    const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
    const [kpis, setKpis] = useState<Kpi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Form states
    const [showKpiModal, setShowKpiModal] = useState(false);
    const [kpiTitle, setKpiTitle] = useState("");
    const [kpiDesc, setKpiDesc] = useState("");
    const [kpiWeight, setKpiWeight] = useState("");
    const [savingKpi, setSavingKpi] = useState(false);

    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [responding, setResponding] = useState(false);

    const [selfReview, setSelfReview] = useState("");
    const [selfRating, setSelfRating] = useState("");
    const [employeeKpiScores, setEmployeeKpiScores] = useState<Record<string, { score: string; comment: string }>>({});
    const [submittingSelfReview, setSubmittingSelfReview] = useState(false);

    const [managerComment, setManagerComment] = useState("");
    const [overallRating, setOverallRating] = useState("");
    const [managerKpiScores, setManagerKpiScores] = useState<Record<string, { score: string; comment: string }>>({});
    const [submittingHodReview, setSubmittingHodReview] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "kpis" | "final">("overview");

    const isHR = currentUser.role === "hr";
    const isEmployee = currentUser.role === "employee";
    const isManager = currentUser.role === "manager";

    const kpiProgress = kpis.length > 0
        ? Math.round((kpis.filter(k => (isEmployee ? k.employeeScore : (k as any).hodScore || (k as any).HodScore) != null).length / kpis.length) * 100)
        : 0;
    const completedKpisCount = kpis.filter(k => (isEmployee ? k.employeeScore : (k as any).hodScore || (k as any).HodScore) != null).length;

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [a, k] = await Promise.all([
                appraisalsApi.getById(appraisalId),
                kpisApi.getByAppraisal(appraisalId),
            ]);
            setAppraisal(a);
            const kpiList = Array.isArray(k) ? k : [];
            setKpis(kpiList);

            const empScores: Record<string, { score: string; comment: string }> = {};
            const mgrScores: Record<string, { score: string; comment: string }> = {};
            kpiList.forEach((kpi) => {
                empScores[kpi.id] = { score: kpi.employeeScore?.toString() ?? "", comment: kpi.employeeComment ?? "" };
                mgrScores[kpi.id] = { score: kpi.hodScore?.toString() ?? "", comment: kpi.hodComment ?? "" };
            });
            setEmployeeKpiScores(empScores);
            setManagerKpiScores(mgrScores);
            if (a.employeeSelfReview) setSelfReview(a.employeeSelfReview);
            if (a.employeeSelfRating) setSelfRating(a.employeeSelfRating.toString());
            if (a.comments) setManagerComment(a.comments);
            if (a.overallRating) setOverallRating(a.overallRating.toString());

        } catch { setAppraisal(null); }
        finally { setLoading(false); }
    }, [appraisalId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAddKpi = async () => {
        if (!kpiTitle || !kpiWeight) return;
        setSavingKpi(true);
        setActionError(null);
        try {
            await kpisApi.create({ appraisalId, title: kpiTitle, description: kpiDesc || null, weight: parseFloat(kpiWeight) });
            setShowKpiModal(false); setKpiTitle(""); setKpiDesc(""); setKpiWeight(""); loadData();
        } catch (e: any) { setActionError(e.message || "Error adding KPI"); }
        finally { setSavingKpi(false); }
    };

    const handleSubmitKpis = async () => {
        setActionError(null);
        try {
            await appraisalsApi.submitKpis(appraisalId);
            loadData();
        } catch (e: any) {
            setActionError(e.message || "Error submitting KPIs");
        }
    };

    const handleAcceptKpis = async () => {
        setResponding(true);
        setActionError(null);
        try {
            await appraisalsApi.respondToKpis(appraisalId, { appraisalId, accepted: true, rejectionReason: null });
            loadData();
        } catch (e: any) { setActionError(e.message || "Error accepting KPIs"); }
        finally { setResponding(false); }
    };

    const handleSubmitSelfReview = async () => {
        setSubmittingSelfReview(true);
        setActionError(null);
        try {
            const kpiUpdates: KpiEmployeeReviewDto[] = kpis.map(k => ({
                kpiId: k.id,
                employeeScore: employeeKpiScores[k.id]?.score ? parseFloat(employeeKpiScores[k.id].score) : null,
                employeeComment: employeeKpiScores[k.id]?.comment || null
            }));
            await appraisalsApi.submitEmployeeReview(appraisalId, { appraisalId, employeeSelfReview: selfReview, employeeSelfRating: parseFloat(selfRating), kpiUpdates });
            loadData();
        } catch (e: any) { setActionError(e.message || "Error submitting review"); }
        finally { setSubmittingSelfReview(false); }
    };

    const handleSubmitManagerReview = async () => {
        setSubmittingHodReview(true);
        setActionError(null);
        try {
            const kpiUpdates: KpiHodReviewDto[] = kpis.map(k => ({
                kpiId: k.id,
                hodScore: managerKpiScores[k.id]?.score ? parseFloat(managerKpiScores[k.id].score) : null,
                hodComment: managerKpiScores[k.id]?.comment || null
            }));
            await appraisalsApi.submitHodReview(appraisalId, { appraisalId, overallRating: parseFloat(overallRating), comments: managerComment, kpiUpdates });
            loadData();
        } catch (e: any) { setActionError(e.message || "Error submitting review"); }
        finally { setSubmittingHodReview(false); }
    };

    if (loading) return <div className="p-10 animate-pulse text-slate-500 font-medium">Loading appraisal details...</div>;
    if (error || !appraisal) return (
        <div className="p-20 text-center animate-fade-in">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-surface-dark mb-2">Failed to fetch</h2>
            <p className="text-slate-500 font-medium mb-8">We couldn't retrieve the appraisal details at this time.</p>
            <button onClick={() => loadData()} className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all">Retry Now</button>
        </div>
    );

    const statusInfo = STATUS_MAP[appraisal.status] || STATUS_MAP[0];

    const hasActions = (
        (isHR && appraisal.status === AppraisalStatus.Draft) ||
        (isEmployee && appraisal.status === AppraisalStatus.KpisSubmitted) ||
        (isEmployee && appraisal.status === AppraisalStatus.KpisRespondedTo) ||
        (isManager && appraisal.status === AppraisalStatus.EmployeeReviewSubmitted)
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="space-y-6">
                <Link href="/dashboard/appraisals" className="inline-flex items-center gap-2 text-slate-400 text-xs font-bold hover:text-primary transition-colors uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    Back to List
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-surface-dark tracking-tight">Performance Appraisal</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            For <span className="text-surface-dark font-bold">{MOCK_USERS.find(u => u.id === appraisal.employeeId)?.name || appraisal.employeeId}</span>
                        </p>
                    </div>
                    {appraisal.overallRating != null && (
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Score</div>
                            <div className="text-3xl font-bold text-primary leading-none mt-1">{appraisal.overallRating.toFixed(1)} <span className="text-xs text-slate-300 font-bold">/ 5.0</span></div>
                        </div>
                    )}
                </div>

                {actionError && (
                    <div className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-fade-in">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {actionError}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit">
                    {[
                        { id: "overview", label: "Overview", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                        { id: "kpis", label: "KPI Review", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
                        { id: "final", label: "Final Calibration", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                {/* Main Content Area */}
                <div className="min-h-[400px]">
                    {activeTab === "overview" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cycle Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-xs text-slate-500 font-medium">Department</span>
                                            <span className="text-xs font-bold text-surface-dark">{MOCK_USERS.find(u => u.id === appraisal.employeeId)?.role.toUpperCase() || "General"}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-xs text-slate-500 font-medium">Current Status</span>
                                            <span className="text-xs font-bold text-primary">{statusInfo.label}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-xs text-slate-500 font-medium">KPI Progress</span>
                                            <span className="text-xs font-bold text-surface-dark">{kpiProgress}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Appraisal Timeline</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {[
                                            { label: "Drafting", status: AppraisalStatus.Draft },
                                            { label: "KPI Setup", status: AppraisalStatus.KpisSubmitted },
                                            { label: "KPI Review", status: AppraisalStatus.KpisRespondedTo },
                                            { label: "Self-Review", status: AppraisalStatus.EmployeeReviewSubmitted },
                                            { label: "Completed", status: AppraisalStatus.HodReviewSubmitted },
                                        ].map((step, idx, arr) => {
                                            const isPassed = appraisal.status >= step.status || appraisal.status === AppraisalStatus.Completed;
                                            const isCurrent = appraisal.status < AppraisalStatus.HodReviewSubmitted &&
                                                idx < arr.length - 1 && (
                                                    (appraisal.status === AppraisalStatus.Draft && idx === 0) ||
                                                    (idx > 0 && appraisal.status === arr[idx - 1].status)
                                                );

                                            return (
                                                <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isPassed ? "bg-primary/5 border-primary/20 text-primary" : isCurrent ? "bg-white border-primary ring-2 ring-primary/5 text-primary" : "bg-slate-50 border-slate-100 text-slate-300"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isPassed ? "bg-primary" : isCurrent ? "bg-primary animate-pulse" : "bg-slate-200"}`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-tight">{step.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "kpis" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Progress Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-surface-dark tracking-tight">KPI Performance</h3>
                                    <p className="text-xs text-slate-500 font-medium">Review and evaluate achievements.</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</p>
                                        <p className="text-sm font-bold text-primary">{completedKpisCount} / {kpis.length} Done</p>
                                    </div>
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${kpiProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* KPIs Section */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-surface-dark tracking-tight">Defined KPIs</h2>
                                    {isHR && appraisal.status === AppraisalStatus.Draft && (
                                        <button
                                            onClick={() => setShowKpiModal(true)}
                                            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                                        >
                                            + Add KPI
                                        </button>
                                    )}
                                </div>

                                {kpis.length === 0 ? (
                                    <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center text-slate-400 font-medium">
                                        No KPIs defined yet.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {kpis.map((k) => (
                                            <div key={k.id} className="bg-white rounded-2xl p-6 border border-slate-100 transition-all hover:border-slate-200">
                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="font-bold text-surface-dark leading-tight">{k.title}</h3>
                                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{k.weight}%</span>
                                                            {((isEmployee ? k.employeeScore : (k as any).hodScore || (k as any).HodScore) != null) && (
                                                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                    Done
                                                                </span>
                                                            )}
                                                        </div>
                                                        {k.description && <p className="text-sm text-slate-500 font-medium">{k.description}</p>}
                                                        {k.target && (
                                                            <p className="text-xs text-slate-400 font-medium">
                                                                Target: <span className="text-slate-600 font-bold">{k.target}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-slate-50">
                                                    {/* Employee Review */}
                                                    <div>
                                                        {isEmployee && appraisal.status === AppraisalStatus.KpisRespondedTo ? (
                                                            <div className="space-y-3">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Self Review</p>
                                                                <input
                                                                    type="number" min="1" max="5" placeholder="Score (1-5)"
                                                                    value={employeeKpiScores[k.id]?.score || ""}
                                                                    onChange={(e) => setEmployeeKpiScores({ ...employeeKpiScores, [k.id]: { ...employeeKpiScores[k.id], score: e.target.value } })}
                                                                    className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all"
                                                                />
                                                                <textarea
                                                                    placeholder="Self comment..."
                                                                    value={employeeKpiScores[k.id]?.comment || ""}
                                                                    onChange={(e) => setEmployeeKpiScores({ ...employeeKpiScores, [k.id]: { ...employeeKpiScores[k.id], comment: e.target.value } })}
                                                                    className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all min-h-[60px] resize-none"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Employee</span>
                                                                    <span className="text-xs font-bold text-surface-dark">{k.employeeScore || "—"} / 5</span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                                    {k.employeeComment || "No comment provided"}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Manager Review */}
                                                    <div>
                                                        {isManager && appraisal.status === AppraisalStatus.EmployeeReviewSubmitted ? (
                                                            <div className="space-y-3">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Manager Feedback</p>
                                                                <input
                                                                    type="number" min="1" max="5" placeholder="Rating"
                                                                    value={managerKpiScores[k.id]?.score || ""}
                                                                    onChange={(e) => setManagerKpiScores({ ...managerKpiScores, [k.id]: { ...managerKpiScores[k.id], score: e.target.value } })}
                                                                    className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all"
                                                                />
                                                                <textarea
                                                                    placeholder="Feedback..."
                                                                    value={managerKpiScores[k.id]?.comment || ""}
                                                                    onChange={(e) => setManagerKpiScores({ ...managerKpiScores, [k.id]: { ...managerKpiScores[k.id], comment: e.target.value } })}
                                                                    className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all min-h-[60px] resize-none"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Manager</span>
                                                                    <span className="text-xs font-bold text-primary">{(k as any).hodScore ?? (k as any).HodScore ?? "—"} / 5</span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                                    {(k as any).hodComment ?? (k as any).HodComment ?? "Awaiting review"}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Phase Specific Actions */}
                            {((isHR && appraisal.status === AppraisalStatus.Draft) || (isEmployee && appraisal.status === AppraisalStatus.KpisSubmitted)) && (
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                                    {isHR && appraisal.status === AppraisalStatus.Draft && (
                                        <div className="text-center space-y-6">
                                            <p className="text-sm text-slate-500 font-medium">Finalize these KPIs and send them to the employee for acknowledgement.</p>
                                            <button
                                                onClick={handleSubmitKpis}
                                                disabled={kpis.length === 0}
                                                className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 outline-none disabled:opacity-50 disabled:shadow-none"
                                            >
                                                Submit KPIs for Employee Review
                                            </button>
                                        </div>
                                    )}
                                    {isEmployee && appraisal.status === AppraisalStatus.KpisSubmitted && (
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                            <button
                                                onClick={handleAcceptKpis}
                                                className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 outline-none"
                                            >
                                                Accept KPIs
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                className="w-full sm:w-auto px-8 py-3 bg-slate-50 text-red-500 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all outline-none"
                                            >
                                                Request Changes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "final" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="border-b border-slate-100 pb-6">
                                <h3 className="text-lg font-bold text-surface-dark tracking-tight">Final Narrative & Scoring</h3>
                                <p className="text-xs text-slate-500 font-medium">Summarize the performance period calibrations.</p>
                            </div>

                            {isEmployee && appraisal.status === AppraisalStatus.KpisRespondedTo && (
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Overall Career Narrative</label>
                                            <textarea
                                                value={selfReview}
                                                onChange={e => setSelfReview(e.target.value)}
                                                placeholder="Reflect on your achievements and growth..."
                                                className="w-full px-5 py-4 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:border-primary outline-none transition-all min-h-[160px] font-medium leading-relaxed"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Final Self-Rating (1-5)</label>
                                            <input
                                                type="number" min="1" max="5"
                                                value={selfRating}
                                                onChange={e => setSelfRating(e.target.value)}
                                                className="w-20 px-4 py-2.5 text-base font-bold text-center bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSubmitSelfReview}
                                        disabled={submittingSelfReview || kpiProgress < 100}
                                        className="w-full py-3.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 outline-none disabled:opacity-50"
                                    >
                                        {kpiProgress < 100 ? "Complete all KPI scores first" : submittingSelfReview ? "Submitting..." : "Submit Final Self-Review"}
                                    </button>
                                </div>
                            )}

                            {isManager && appraisal.status === AppraisalStatus.EmployeeReviewSubmitted && (
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Manager Calibrated Narrative</label>
                                            <textarea
                                                value={managerComment}
                                                onChange={e => setManagerComment(e.target.value)}
                                                placeholder="Summary feedback..."
                                                className="w-full px-5 py-4 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:border-primary outline-none transition-all min-h-[160px] font-medium leading-relaxed"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Final Calibration Rating (1-5)</label>
                                            <input
                                                type="number" min="1" max="5"
                                                value={overallRating}
                                                onChange={e => setOverallRating(e.target.value)}
                                                className="w-20 px-4 py-2.5 text-base font-bold text-center bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSubmitManagerReview}
                                        disabled={submittingHodReview || kpiProgress < 100}
                                        className="w-full py-3.5 bg-surface-dark text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-xl shadow-surface-dark/10 outline-none disabled:opacity-50"
                                    >
                                        {kpiProgress < 100 ? "Complete all KPI feedbacks first" : submittingHodReview ? "Processing..." : "Finalize Appraisal"}
                                    </button>
                                </div>
                            )}

                            {appraisal.status === AppraisalStatus.Completed && (
                                <div className="space-y-8">
                                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Self Review Reference</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold text-surface-dark">{appraisal.employeeSelfRating?.toFixed(1) || "—"}</span>
                                                <span className="text-xs text-slate-300 font-bold">/ 5.0</span>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                {appraisal.employeeSelfReview || "No self-review narrative provided."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 rounded-3xl p-8 border border-green-700/10 shadow-sm space-y-6">
                                        <h4 className="text-sm font-bold text-green-700/40 uppercase tracking-widest">Manager Final Calibration</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold text-green-700">{appraisal.overallRating?.toFixed(1) || "—"}</span>
                                                <span className="text-xs text-green-700/30 font-bold">/ 5.0</span>
                                            </div>
                                            <p className="text-sm text-green-700/80 font-medium leading-relaxed">
                                                {appraisal.comments || "No final manager comments provided."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {showKpiModal && (
                <div className="fixed inset-0 bg-surface-dark/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-[24px] p-8 md:p-10 w-full max-w-md shadow-xl animate-scale-in border border-slate-100">
                        <h2 className="text-xl font-bold text-surface-dark mb-6 tracking-tight">New KPI</h2>
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Title</label>
                                <input
                                    value={kpiTitle}
                                    onChange={e => setKpiTitle(e.target.value)}
                                    placeholder="e.g. Sales Growth"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Weight (%)</label>
                                <input
                                    type="number"
                                    value={kpiWeight}
                                    onChange={e => setKpiWeight(e.target.value)}
                                    placeholder="0-100"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                                <textarea
                                    value={kpiDesc}
                                    onChange={e => setKpiDesc(e.target.value)}
                                    placeholder="Expectations..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-primary outline-none transition-all font-medium text-sm min-h-[80px] resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleAddKpi}
                                    disabled={savingKpi}
                                    className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all outline-none text-[10px] uppercase tracking-wider"
                                >
                                    {savingKpi ? "Saving..." : "Save KPI"}
                                </button>
                                <button
                                    onClick={() => setShowKpiModal(false)}
                                    className="px-6 py-2.5 bg-slate-50 text-slate-400 rounded-xl font-bold hover:bg-slate-100 transition-all outline-none text-[10px] uppercase tracking-wider"
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

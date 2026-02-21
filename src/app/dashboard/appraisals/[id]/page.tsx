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
            <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-black text-surface-dark mb-2">Failed to fetch</h2>
            <p className="text-slate-500 font-medium mb-8">We couldn't retrieve the appraisal details at this time.</p>
            <button onClick={() => loadData()} className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all">Retry Now</button>
        </div>
    );

    const statusInfo = STATUS_MAP[appraisal.status] || STATUS_MAP[0];
    const isHR = currentUser.role === "hr";
    const isEmployee = currentUser.role === "employee";
    const isManager = currentUser.role === "manager";

    const hasActions = (
        (isHR && appraisal.status === AppraisalStatus.Draft) ||
        (isEmployee && appraisal.status === AppraisalStatus.KpisSubmitted) ||
        (isEmployee && appraisal.status === AppraisalStatus.KpisRespondedTo) ||
        (isManager && appraisal.status === AppraisalStatus.EmployeeReviewSubmitted)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            {/* Header */}
            <div className="space-y-6">
                <Link href="/dashboard/appraisals" className="inline-flex items-center gap-2 text-slate-400 text-xs font-bold hover:text-primary transition-colors uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    Back to List
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-surface-dark tracking-tight">Performance Appraisal</h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium">
                            Employee: <span className="text-surface-dark font-bold">{MOCK_USERS.find(u => u.id === appraisal.employeeId)?.name || appraisal.employeeId}</span>
                        </p>
                    </div>
                    {appraisal.overallRating != null && (
                        <div className="bg-green-50 border border-green-700/10 px-5 py-3 rounded-2xl flex flex-col items-end shadow-sm">
                            <div className="text-2xl font-black text-green-700 leading-none">{appraisal.overallRating.toFixed(1)}</div>
                            <div className="text-[9px] font-black text-green-700/60 uppercase tracking-widest mt-1">Overall Score</div>
                        </div>
                    )}
                </div>

                {actionError && (
                    <div className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-fade-in">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {actionError}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 items-start">
                {/* Main Content */}
                <div className="space-y-8">
                    {/* KPIs Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-surface-dark tracking-tight">Key Performance Indicators</h2>
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
                                    <div key={k.id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-primary text-sm shrink-0">
                                                {k.weight}%
                                            </div>
                                            <div className="space-y-1 pt-1">
                                                <h3 className="font-bold text-surface-dark leading-tight">{k.title}</h3>
                                                {k.description && <p className="text-sm text-slate-500 font-medium">{k.description}</p>}
                                                {k.target && (
                                                    <div className="mt-2 flex items-start gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-wider mt-0.5">Target:</span>
                                                        <p className="text-xs text-slate-600 font-bold leading-tight">{k.target}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Review Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                                            {/* Employee Column */}
                                            <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Self-Review</div>
                                                {isEmployee && appraisal.status === AppraisalStatus.KpisRespondedTo ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="5"
                                                            placeholder="Score (1-5)"
                                                            value={employeeKpiScores[k.id]?.score || ""}
                                                            onChange={(e) => setEmployeeKpiScores({ ...employeeKpiScores, [k.id]: { ...employeeKpiScores[k.id], score: e.target.value } })}
                                                            className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                                        />
                                                        <textarea
                                                            placeholder="Comments on your performance..."
                                                            value={employeeKpiScores[k.id]?.comment || ""}
                                                            onChange={(e) => setEmployeeKpiScores({ ...employeeKpiScores, [k.id]: { ...employeeKpiScores[k.id], comment: e.target.value } })}
                                                            className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[80px] resize-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-lg font-black text-surface-dark">{k.employeeScore || "—"}</span>
                                                            <span className="text-xs text-slate-300 font-bold">/ 5</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                            {k.employeeComment || "No comment provided"}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Manager Column */}
                                            <div className="bg-green-50 rounded-2xl p-4 space-y-4">
                                                <div className="text-[10px] font-black text-green-700/60 uppercase tracking-widest">Manager Assessment</div>
                                                {isManager && appraisal.status === AppraisalStatus.EmployeeReviewSubmitted ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="5"
                                                            placeholder="Score (1-5)"
                                                            value={managerKpiScores[k.id]?.score || ""}
                                                            onChange={(e) => setManagerKpiScores({ ...managerKpiScores, [k.id]: { ...managerKpiScores[k.id], score: e.target.value } })}
                                                            className="w-full px-4 py-2 text-sm bg-white border border-green-700/20 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                                        />
                                                        <textarea
                                                            placeholder="Feedback on employee's work..."
                                                            value={managerKpiScores[k.id]?.comment || ""}
                                                            onChange={(e) => setManagerKpiScores({ ...managerKpiScores, [k.id]: { ...managerKpiScores[k.id], comment: e.target.value } })}
                                                            className="w-full px-4 py-2 text-sm bg-white border border-green-700/20 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[80px] resize-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-lg font-black text-green-700">{(k as any).hodScore ?? (k as any).HodScore ?? "—"}</span>
                                                            <span className="text-xs text-green-700/30 font-bold">/ 5</span>
                                                        </div>
                                                        <p className="text-xs text-green-700/70 font-medium leading-relaxed">
                                                            {(k as any).hodComment ?? (k as any).HodComment ?? (appraisal.status < AppraisalStatus.HodReviewSubmitted ? "Awaiting manager review" : "No comment provided")}
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

                    {/* Action Cards */}
                    {hasActions && (
                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                            {isHR && appraisal.status === AppraisalStatus.Draft && (
                                <div className="text-center space-y-6">
                                    <p className="text-base text-slate-500 font-medium">Finalize these KPIs and send them to the employee for acknowledgement.</p>
                                    <button
                                        onClick={handleSubmitKpis}
                                        disabled={kpis.length === 0}
                                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 outline-none disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Submit KPIs for Review
                                    </button>
                                </div>
                            )}
                            {isEmployee && appraisal.status === AppraisalStatus.KpisSubmitted && (
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <button
                                        onClick={handleAcceptKpis}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 outline-none"
                                    >
                                        Accept KPIs
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-50 text-red-500 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all outline-none"
                                    >
                                        Request Changes
                                    </button>
                                </div>
                            )}
                            {isEmployee && appraisal.status === AppraisalStatus.KpisRespondedTo && (
                                <div className="space-y-8 max-w-xl mx-auto">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-surface-dark tracking-tight">Overall Career Narrative</label>
                                            <textarea
                                                value={selfReview}
                                                onChange={e => setSelfReview(e.target.value)}
                                                placeholder="Reflect on your achievements and growth during this period..."
                                                className="w-full px-5 py-4 text-sm bg-slate-50 border border-slate-100 rounded-[20px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[160px] font-medium leading-relaxed"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-surface-dark tracking-tight">Final Self-Rating (1-5)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                value={selfRating}
                                                onChange={e => setSelfRating(e.target.value)}
                                                className="w-24 px-4 py-3 text-lg font-black text-center bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSubmitSelfReview}
                                        className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 outline-none"
                                    >
                                        Submit Final Self-Review
                                    </button>
                                </div>
                            )}
                            {isManager && appraisal.status === AppraisalStatus.EmployeeReviewSubmitted && (
                                <div className="space-y-8 max-w-xl mx-auto">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-surface-dark tracking-tight">Manager Calibrated Narrative</label>
                                            <textarea
                                                value={managerComment}
                                                onChange={e => setManagerComment(e.target.value)}
                                                placeholder="Provide final calibrated feedback and summary..."
                                                className="w-full px-5 py-4 text-sm bg-green-50/50 border border-green-700/10 rounded-[20px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[160px] font-medium leading-relaxed"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-surface-dark tracking-tight">Final Calibration Rating (1-5)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                value={overallRating}
                                                onChange={e => setOverallRating(e.target.value)}
                                                className="w-24 px-4 py-3 text-lg font-black text-center bg-green-50/50 border border-green-700/10 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSubmitManagerReview}
                                        className="w-full py-2.5 bg-surface-dark text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-xl shadow-surface-dark/10 outline-none"
                                    >
                                        Finalize Appraisal
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="sticky top-10 space-y-6">
                    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
                        <h4 className="text-sm font-bold text-surface-dark tracking-tight">Appraisal Timeline</h4>
                        <div className="space-y-4">
                            {[
                                { label: "Drafting", status: AppraisalStatus.Draft },
                                { label: "KPI Setup", status: AppraisalStatus.KpisSubmitted },
                                { label: "KPI Review", status: AppraisalStatus.KpisRespondedTo },
                                { label: "Self-Review", status: AppraisalStatus.EmployeeReviewSubmitted },
                                { label: "Completed", status: AppraisalStatus.HodReviewSubmitted },
                            ].map((step, idx, arr) => {
                                const isPassed = appraisal.status >= step.status || appraisal.status === AppraisalStatus.Completed;
                                // Current stage logic: only show if not completed and not the last step
                                const isCurrent = appraisal.status < AppraisalStatus.HodReviewSubmitted &&
                                    idx < arr.length - 1 && (
                                        (appraisal.status === AppraisalStatus.Draft && idx === 0) ||
                                        (idx > 0 && appraisal.status === arr[idx - 1].status)
                                    );

                                return (
                                    <div key={idx} className="flex items-center gap-4 group/step">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${isPassed ? "bg-primary border-primary shadow-lg shadow-primary/20" : isCurrent ? "bg-white border-primary ring-4 ring-primary/10" : "bg-white border-slate-100"}`}>
                                            {isPassed ? (
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <div className={`w-2 h-2 rounded-full ${isCurrent ? "bg-primary animate-pulse" : "bg-slate-200"}`} />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-black transition-colors ${isPassed ? "text-surface-dark" : isCurrent ? "text-primary" : "text-slate-300"}`}>
                                                {step.label}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-[9px] font-black text-primary/60 uppercase tracking-tighter">Current Action</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Modal */}
            {showKpiModal && (
                <div className="fixed inset-0 bg-surface-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-[40px] p-8 md:p-12 w-full max-w-lg shadow-2xl animate-scale-in">
                        <h2 className="text-2xl font-black text-surface-dark mb-8 tracking-tight">New KPI</h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Title</label>
                                <input
                                    value={kpiTitle}
                                    onChange={e => setKpiTitle(e.target.value)}
                                    placeholder="e.g. Sales Quarter Growth"
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Weight (%)</label>
                                <input
                                    type="number"
                                    value={kpiWeight}
                                    onChange={e => setKpiWeight(e.target.value)}
                                    placeholder="0-100"
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                                <textarea
                                    value={kpiDesc}
                                    onChange={e => setKpiDesc(e.target.value)}
                                    placeholder="Briefly describe expectation..."
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium min-h-[100px] resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={handleAddKpi}
                                    disabled={savingKpi}
                                    className="py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 outline-none text-xs"
                                >
                                    {savingKpi ? "Saving..." : "Save KPI"}
                                </button>
                                <button
                                    onClick={() => setShowKpiModal(false)}
                                    className="py-3 bg-slate-50 text-slate-500 rounded-xl font-bold hover:bg-slate-100 transition-all outline-none text-xs"
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

"use client";

import { AppraisalStatus, AppraisalStatusLabels } from "@/lib/types";

const statusClasses: Record<AppraisalStatus, string> = {
    [AppraisalStatus.Draft]: "bg-slate-100 text-slate-600",
    [AppraisalStatus.KpisSubmitted]: "bg-blue-50 text-blue-700",
    [AppraisalStatus.KpisRespondedTo]: "bg-purple-50 text-purple-700",
    [AppraisalStatus.EmployeeReviewSubmitted]: "bg-orange-50 text-orange-700",
    [AppraisalStatus.HodReviewSubmitted]: "bg-green-50 text-green-700",
    [AppraisalStatus.Completed]: "bg-primary text-white",
};

export function StatusBadge({ status }: { status: AppraisalStatus }) {
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight transition-all duration-300 ${statusClasses[status] ?? "bg-slate-100 text-slate-600"}`}>
            <span
                className={`w-1.5 h-1.5 rounded-full ${status === AppraisalStatus.Completed ? "bg-white/40" : "bg-current opacity-40"}`}
            />
            {AppraisalStatusLabels[status] ?? "Unknown"}
        </span>
    );
}

import type {
    AppraisalCycle,
    Appraisal,
    Kpi,
    CreateAppraisalCycleCommand,
    UpdateAppraisalCycleCommand,
    CreateAppraisalCommand,
    UpdateAppraisalCommand,
    CreateKpiCommand,
    UpdateKpiCommand,
    RespondToKpisCommand,
    SubmitEmployeeReviewCommand,
    SubmitHodReviewCommand,
} from "./types";

const BASE_URL = "https://qwik-kpi-api.qwikpace.com/api";

async function request<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`API Error ${res.status}: ${errorText}`);
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
}

// ── Appraisal Cycles ──

export const cyclesApi = {
    getAll: () => request<AppraisalCycle[]>("/AppraisalCycles"),

    getById: (id: string) => request<AppraisalCycle>(`/AppraisalCycles/${id}`),

    create: (data: CreateAppraisalCycleCommand) =>
        request<AppraisalCycle>("/AppraisalCycles", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UpdateAppraisalCycleCommand) =>
        request<AppraisalCycle>(`/AppraisalCycles/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<void>(`/AppraisalCycles/${id}`, { method: "DELETE" }),
};

// ── Appraisals ──

export const appraisalsApi = {
    getAll: () => request<Appraisal[]>("/Appraisals"),

    getById: (id: string) => request<Appraisal>(`/Appraisals/${id}`),

    getByEmployee: (employeeId: string) =>
        request<Appraisal[]>(`/Appraisals/employee/${employeeId}`),

    create: (data: CreateAppraisalCommand) =>
        request<Appraisal>("/Appraisals", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UpdateAppraisalCommand) =>
        request<Appraisal>(`/Appraisals/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<void>(`/Appraisals/${id}`, { method: "DELETE" }),

    submitKpis: (id: string) =>
        request<void>(`/Appraisals/${id}/submit-kpis`, { method: "POST" }),

    respondToKpis: (id: string, data: RespondToKpisCommand) =>
        request<void>(`/Appraisals/${id}/respond-kpis`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    submitEmployeeReview: (id: string, data: SubmitEmployeeReviewCommand) =>
        request<void>(`/Appraisals/${id}/employee-review`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    submitHodReview: (id: string, data: SubmitHodReviewCommand) =>
        request<void>(`/Appraisals/${id}/hod-review`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ── KPIs ──

export const kpisApi = {
    getByAppraisal: (appraisalId: string) =>
        request<Kpi[]>(`/Kpis/appraisal/${appraisalId}`),

    create: (data: CreateKpiCommand) =>
        request<Kpi>("/Kpis", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UpdateKpiCommand) =>
        request<Kpi>(`/Kpis/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<void>(`/Kpis/${id}`, { method: "DELETE" }),
};

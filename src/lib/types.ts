// === Enums ===

export enum AppraisalStatus {
  Draft = 0,
  KpisSubmitted = 1,
  KpisRespondedTo = 2,
  EmployeeReviewSubmitted = 3,
  HodReviewSubmitted = 4,
  Completed = 5,
}

export const AppraisalStatusLabels: Record<AppraisalStatus, string> = {
  [AppraisalStatus.Draft]: "Draft",
  [AppraisalStatus.KpisSubmitted]: "KPIs Submitted",
  [AppraisalStatus.KpisRespondedTo]: "KPIs Reviewed",
  [AppraisalStatus.EmployeeReviewSubmitted]: "Self-Review Done",
  [AppraisalStatus.HodReviewSubmitted]: "Manager Reviewed",
  [AppraisalStatus.Completed]: "Completed",
};

export type UserRole = "hr" | "employee" | "manager";

// === Models ===

export interface AppraisalCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Appraisal {
  id: string;
  employeeId: string;
  appraisalCycleId: string;
  status: AppraisalStatus;
  overallRating: number | null;
  comments: string | null;
  employeeSelfReview?: string | null;
  employeeSelfRating?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Kpi {
  id: string;
  appraisalId: string;
  title: string;
  description: string | null;
  target?: string | null;
  weight: number;
  employeeScore: number | null;
  hodScore: number | null;
  employeeComment: string | null;
  hodComment: string | null;
}

// === Commands ===

export interface CreateAppraisalCycleCommand {
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UpdateAppraisalCycleCommand {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CreateAppraisalCommand {
  employeeId: string;
  appraisalCycleId: string;
  comments: string | null;
}

export interface UpdateAppraisalCommand {
  id: string;
  status: AppraisalStatus;
  overallRating: number | null;
  comments: string | null;
}

export interface CreateKpiCommand {
  appraisalId: string;
  title: string;
  description: string | null;
  weight: number;
}

export interface UpdateKpiCommand {
  id: string;
  title: string;
  description: string | null;
  target?: string | null;
  weight: number;
  employeeScore: number | null;
  hodScore: number | null;
  employeeComment: string | null;
  hodComment: string | null;
}

export interface RespondToKpisCommand {
  appraisalId: string;
  accepted: boolean;
  rejectionReason: string | null;
}

export interface KpiEmployeeReviewDto {
  kpiId: string;
  employeeScore: number | null;
  employeeComment: string | null;
}

export interface SubmitEmployeeReviewCommand {
  appraisalId: string;
  employeeSelfReview: string | null;
  employeeSelfRating: number | null;
  kpiUpdates: KpiEmployeeReviewDto[];
}

export interface KpiHodReviewDto {
  kpiId: string;
  hodScore: number | null;
  hodComment: string | null;
}

export interface SubmitHodReviewCommand {
  appraisalId: string;
  overallRating: number;
  comments: string | null;
  kpiUpdates: KpiHodReviewDto[];
}

// === Mock Users ===

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

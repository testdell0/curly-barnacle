// ── Auth ──────────────────────────────────────────────────────────────────

export interface CurrentUser {
  userId: number
  employeeCode: string
  fullName: string
  email: string
  role: 'Admin' | 'User'
  mustChangePassword: boolean
}

export interface LoginRequest {
  employeeCode: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

// ── Users ─────────────────────────────────────────────────────────────────

export interface UserListItem {
  userId: number
  employeeCode: string
  fullName: string
  email: string
  role: 'Admin' | 'User'
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string
}

export interface CreateUserRequest {
  employeeCode: string
  fullName: string
  email: string
  role: 'Admin' | 'User'
  tempPassword: string
}

export interface AdminResetPasswordRequest {
  tempPassword: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSheets: number
  draftSheets: number
  finalSheets: number
  totalTemplates?: number
  totalUsers?: number
}

export interface RecentSheet {
  sheetId: number
  name: string
  daType: string
  status: 'Draft' | 'Final'
  version: number
  templateName: string
  creatorName: string
  createdAt: string
  updatedAt: string
}

// ── Templates ─────────────────────────────────────────────────────────────

export interface TemplateListItem {
  templateId: number
  name: string
  daType: string
  description?: string
  status: 'Draft' | 'Published'
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface TemplateDetail {
  templateId: number
  name: string
  daType: string
  description?: string
  status: 'Draft' | 'Published'
  createdByName: string
  createdAt: string
  updatedAt: string
  categories: TemplateCategoryDto[]
}

export interface TemplateCategoryDto {
  categoryId: number
  name: string
  sortOrder: number
  parameters: TemplateParamDto[]
}

export interface TemplateParamDto {
  paramId: number
  name: string
  weightage: number
  sortOrder: number
}

export interface CreateCategoryRequest {
  name: string
  sortOrder: number
  parameters: CreateParamRequest[]
}

export interface CreateParamRequest {
  name: string
  weightage: number
  sortOrder: number
}

export interface CreateTemplateRequest {
  name: string
  daType: string
  description?: string
  categories: CreateCategoryRequest[]
}

export interface UpdateCategoryRequest {
  categoryId?: number
  name: string
  sortOrder: number
  parameters: UpdateParamRequest[]
}

export interface UpdateParamRequest {
  paramId?: number
  name: string
  weightage: number
  sortOrder: number
}

export interface UpdateTemplateRequest {
  name: string
  daType: string
  description?: string
  categories: UpdateCategoryRequest[]
}

// ── DA Sheets ─────────────────────────────────────────────────────────────

export interface SheetListItem {
  sheetId: number
  name: string
  daType: string
  status: 'Draft' | 'Final'
  version: number
  sourceTemplateName: string
  createdByName: string
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SheetSearchParams {
  search?: string
  daType?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface SheetCategoryDto {
  sheetCategoryId: number
  name: string
  sortOrder: number
  parameters: SheetParamDto[]
}

export interface SheetParamDto {
  sheetParamId: number
  name: string
  weightage: number
  sortOrder: number
}

export interface VendorDto {
  vendorId: number
  name: string
  sortOrder: number
}

export interface SharedAccessDto {
  shareId: number
  sharedWithEmail: string
  sharedWithName?: string
  accessLevel: 'view' | 'edit'
  sharedAt: string
}

export interface SheetDetail {
  sheetId: number
  name: string
  daType: string
  status: 'Draft' | 'Final'
  sourceTemplateId: number
  sourceTemplateName: string
  version: number
  notes?: string
  createdByName: string
  createdBy: number
  createdAt: string
  updatedAt: string
  categories: SheetCategoryDto[]
  vendors: VendorDto[]
  sharedWith: SharedAccessDto[]
}

export interface CreateSheetRequest {
  name: string
  sourceTemplateId: number
}

// ── Vendors ───────────────────────────────────────────────────────────────

export interface AddVendorRequest {
  name: string
}

// ── Evaluations ───────────────────────────────────────────────────────────

export interface EvaluationDto {
  evalId: number
  vendorId: number
  sheetParamId: number
  evalScore?: number
  result: number
  vendorComment?: string
  hasFile: boolean
  fileName?: string
}

export interface EvaluationEntry {
  vendorId: number
  sheetParamId: number
  evalScore: number | null
  vendorComment: string | null
}

export interface BulkSaveEvaluationsRequest {
  evaluations: EvaluationEntry[]
}

// ── Scores ────────────────────────────────────────────────────────────────

export interface ParamScoreDto {
  sheetParamId: number
  paramName: string
  weightage: number
  evalScore?: number
  result: number
  vendorComment?: string
}

export interface CategoryScoreDto {
  sheetCategoryId: number
  categoryName: string
  subTotal: number
  paramScores: ParamScoreDto[]
}

export interface VendorScoreSummary {
  vendorId: number
  vendorName: string
  overallScore: number
  isWinner: boolean
  categoryScores: CategoryScoreDto[]
}

// ── Sharing ───────────────────────────────────────────────────────────────

export interface CreateShareRequest {
  email: string
  accessLevel: 'view' | 'edit'
}

export interface UpdateShareRequest {
  accessLevel: 'view' | 'edit'
}

// ── Files ─────────────────────────────────────────────────────────────────

export interface FileDto {
  fileId: number
  evalId: number
  originalFilename: string
  contentType: string
  fileSizeBytes: number
  uploadedBy: number
  uploadedAt: string
}

// ── History / Audit ───────────────────────────────────────────────────────

export interface AuditLogDto {
  logId: number
  sheetId: number
  action: string
  summary?: string
  changedByName: string
  changedAt: string
}

// ── API errors ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
}

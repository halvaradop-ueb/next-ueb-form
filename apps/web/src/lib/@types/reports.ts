export interface Report {
  id: string;
  title: string;
  professor_id: string | null;
  subject_id: string | null;
  evaluation_criteria?: string | null;
  analysis?: string | null;
  comments?: string | null;
  recommendations?: string | null;
  created_at: string;
  professor_name?: string | null;
  subject_name?: string | null;
  professor?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  subject?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface CreateReportDto {
  title: string;
  professor_id: string;
  subject_id: string;
  evaluation_criteria?: string;
  analysis?: string;
  comments?: string;
  recommendations?: string;
}

export interface UpdateReportDto {
  title?: string;
  professor_id?: string;
  subject_id?: string;
  evaluation_criteria?: string | null;
  analysis?: string | null;
  comments?: string | null;
  recommendations?: string | null;
}

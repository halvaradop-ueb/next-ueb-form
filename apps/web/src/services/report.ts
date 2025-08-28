import { supabase } from '@/lib/supabase/client';
import { any } from 'zod';
export interface Report {
  id: string;
  title: string;
  professor_id: string | null;
  subject_id: string | null;
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
type SupabaseReportResponse = {
  id: string;
  title: string;
  professor_id: string | null;
  subject_id: string | null;
  comments?: string | null;
  recommendations?: string | null;
  created_at: string;
  professor?:
    | {
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
      }[]
    | null;
  subject?:
    | {
        id: string;
        name: string;
        description?: string;
      }[]
    | null;
};
const mapReport = (item: SupabaseReportResponse): Report => {
  const professorObj = item.professor?.[0];
  const subjectObj = item.subject?.[0];

  const professorName = professorObj
    ? `${professorObj.first_name} ${professorObj.last_name}`
    : 'Profesor desconocido';

  const subjectName = subjectObj ? subjectObj.name : 'Materia desconocida';

  return {
    id: item.id,
    title: item.title || 'Sin título',
    professor_id: item.professor_id || '',
    subject_id: item.subject_id || '',
    comments: item.comments || undefined,
    recommendations: item.recommendations || undefined,
    created_at: item.created_at,
    professor_name: professorName,
    subject_name: subjectName,
    professor: professorObj
      ? {
          id: professorObj.id,
          first_name: professorObj.first_name,
          last_name: professorObj.last_name,
          email: professorObj.email,
        }
      : undefined,
    subject: subjectObj
      ? {
          id: subjectObj.id,
          name: subjectObj.name,
          description: subjectObj.description,
        }
      : undefined,
  };
};
export const getReports = async (): Promise<Report[]> => {
  try {
    const { data, error } = await supabase
      .from('report')
      .select(
        `
                id,
                title,
                professor_id,
                subject_id,
                comments,
                recommendations,
                created_at,
                professor:professor_id (
                    id,
                    first_name,
                    last_name,
                    email
                ),
                subject:subject_id (
                    id,
                    name,
                    description
                )
            `
      )
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data
      ? data.map((item) => {
          const professorObj = item.professor?.[0];
          const subjectObj = item.subject?.[0];

          const professorName = professorObj
            ? `${professorObj.first_name} ${professorObj.last_name}`
            : 'Profesor desconocido';

          const subjectName = subjectObj
            ? subjectObj.name
            : 'Materia desconocida';

          return {
            id: item.id,
            title: item.title || 'Sin título',
            professor_id: item.professor_id || '',
            subject_id: item.subject_id || '',
            comments: item.comments || undefined,
            recommendations: item.recommendations || undefined,
            created_at: item.created_at,
            professor_name: professorName,
            subject_name: subjectName,
            professor: professorObj
              ? {
                  id: professorObj.id,
                  first_name: professorObj.first_name,
                  last_name: professorObj.last_name,
                  email: professorObj.email,
                }
              : undefined,
            subject: subjectObj
              ? {
                  id: subjectObj.id,
                  name: subjectObj.name,
                  description: subjectObj.description,
                }
              : undefined,
          } as Report;
        })
      : [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};
export const createReport = async (
  reportData: CreateReportDto
): Promise<Report | null> => {
  try {
    const { data: professorData, error: professorError } = await supabase
      .from('User')
      .select('first_name, last_name')
      .eq('id', reportData.professor_id)
      .single();

    if (professorError) throw professorError;
    if (!professorData) throw new Error('Profesor no encontrado');

    const { data: subjectData, error: subjectError } = await supabase
      .from('subject')
      .select('name')
      .eq('id', reportData.subject_id)
      .single();

    if (subjectError) throw subjectError;
    if (!subjectData) throw new Error('Materia no encontrada');

    const { data: newReport, error: insertError } = await supabase
      .from('report')
      .insert({
        title: reportData.title,
        professor_id: reportData.professor_id,
        subject_id: reportData.subject_id,
        comments: reportData.comments || null,
        recommendations: reportData.recommendations || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    if (!newReport) throw new Error('No se pudo crear el reporte');

    const { data: fullReport, error: fullReportError } = await supabase
      .from('report')
      .select(
        `
                *,
                professor:professor_id (*),
                subject:subject_id (*)
            `
      )
      .eq('id', newReport.id)
      .single();

    if (fullReportError) throw fullReportError;
    if (!fullReport) throw new Error('No se pudo obtener el reporte completo');

    const mappedReport: Report = {
      id: fullReport.id,
      title: fullReport.title,
      professor_id: fullReport.professor_id || '',
      subject_id: fullReport.subject_id || '',
      comments: fullReport.comments || undefined,
      recommendations: fullReport.recommendations || undefined,
      created_at: fullReport.created_at,
      professor_name: fullReport.professor
        ? `${fullReport.professor.first_name} ${fullReport.professor.last_name}`
        : `${professorData.first_name} ${professorData.last_name}`,
      subject_name: fullReport.subject?.name || subjectData.name,
      professor: fullReport.professor
        ? {
            id: fullReport.professor.id,
            first_name: fullReport.professor.first_name,
            last_name: fullReport.professor.last_name,
            email: fullReport.professor.email,
          }
        : {
            id: reportData.professor_id,
            first_name: professorData.first_name,
            last_name: professorData.last_name,
          },
      subject: fullReport.subject
        ? {
            id: fullReport.subject.id,
            name: fullReport.subject.name,
            description: fullReport.subject.description,
          }
        : {
            id: reportData.subject_id,
            name: subjectData.name,
          },
    };

    return mappedReport;
  } catch (error: any) {
    console.error(
      'Error creating report:',
      error?.message || error || 'Error desconocido'
    );
    return null;
  }
};

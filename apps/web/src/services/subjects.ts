import { supabase } from '@/lib/supabase/client';
import type {
  SubjectAssignmentService,
  SubjectAssignmentWithProfessorService,
  SubjectService,
} from '@/lib/@types/services';

export const getSubjects = async (): Promise<SubjectService[]> => {
  try {
    const { data, error } = await supabase.from('subject').select('*');
    if (error) {
      throw new Error(`Error fetching subjects: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
};

export const getSubjectsByProfessorId = async (
  professorId: string
): Promise<SubjectService[]> => {
  try {
    const { data, error } = await supabase
      .from('subjectassignment')
      .select(
        `
                subject (
                    id,
                    name,
                    description
                )
            `
      )
      .eq('professor_id', professorId);
    if (error) {
      throw new Error(
        `Error fetching subjects by professor ID: ${error.message}`
      );
    }
    return data.map(
      (relation) => relation.subject
    ) as unknown as SubjectService[];
  } catch (error) {
    console.error('Error fetching subjects by professor ID:', error);
    return [];
  }
};

export const addAssignment = async (
  professorId: string,
  subjectId: string
): Promise<SubjectAssignmentService[]> => {
  try {
    const { data: relation, error: checkError } = await supabase
      .from('subjectassignment')
      .select('*')
      .eq('professor_id', professorId)
      .eq('subject_id', subjectId)
      .maybeSingle();
    if (relation) {
      return relation;
    }
    const { data, error } = await supabase
      .from('subjectassignment')
      .insert({ professor_id: professorId, subject_id: subjectId })
      .select();

    if (error) {
      throw new Error(`Error adding assignment: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error('Error adding assignment:', error);
    return [];
  }
};

export const getProfessorsBySubject = async (
  subjectId: string
): Promise<SubjectAssignmentWithProfessorService[]> => {
  try {
    const { data, error } = await supabase
      .from('subjectassignment')
      .select(
        `
                id,
                subject_id,
                Subject: subject_id (
                    id,
                    name
                ),
                User: professor_id (
                    id,
                    first_name,
                    last_name,
                    email
                )
            `
      )
      .eq('subject_id', subjectId);
    if (error) {
      throw new Error(
        `Error fetching professors by subject ID: ${error.message}`
      );
    }
    return data.map((relation) => ({
      id: relation.id,
      subject_id: relation.subject_id,
      user: relation.User,
      subject: relation.Subject,
    })) as unknown as SubjectAssignmentWithProfessorService[];
  } catch (error) {
    console.error('Error fetching professors by subject ID:', error);
    return [];
  }
};

export const deleteAssignment = async (
  assignmentId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('subjectassignment')
      .delete()
      .eq('id', assignmentId);
    if (error) {
      throw new Error(`Error deleting assignment: ${error.message}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return false;
  }
};

export const addSubject = async (
  subject: Omit<SubjectService, 'id' | 'professor_id'>
): Promise<SubjectService> => {
  try {
    const { data, error } = await supabase
      .from('subject')
      .insert(subject)
      .select()
      .single();
    if (error) {
      throw new Error(`Error adding subject: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error('Error adding subject:', error);
    return {} as SubjectService;
  }
};

export const deleteSubject = async (subjectId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('subject')
      .delete()
      .eq('id', subjectId);
    if (error) {
      throw new Error(`Error deleting subject: ${error.message}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting subject:', error);
    return false;
  }
};

import { z } from 'zod';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Feedback, Question } from './@types/services';
import { supabase } from './supabase/client';
import { hashPassword } from '@/services/auth';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const defaultAnswer = (question: Question) => {
  switch (question.question_type) {
    case 'text':
      return '';
    case 'single_choice':
      return '';
    case 'multiple_choice':
      return [];
    case 'numeric':
      return 0;
    default:
      return '';
  }
};

export const updateDatabase = async (role: string, value: string) => {
  const hash = await hashPassword(value);
  const { data, error } = await supabase
    .from('User')
    .update({ password: hash })
    .eq('role', role);

  if (error) {
    console.error('Error updating admin password:', error);
  } else {
    console.log('Admin password updated successfully:', data);
  }
};

export const ratingFeedback = (feedback: Feedback[] = []) => {
  const n = feedback.length;
  const groupBy = Object.groupBy(feedback, (item) => item.rating);
  return Array.from({ length: 10 }).map((_, index) => {
    const quantity = groupBy[index + 1]?.length || 0;
    const percentage = (quantity / n) * 100;
    return {
      rating: index + 1,
      percentage: percentage ? percentage.toFixed(2) : '0',
    };
  });
};

export const getAverageRatings = (feedback: Feedback[]) => {
  const n = feedback.length;
  return n
    ? feedback.reduce((previous, now) => previous + now.rating, 0) / n
    : 0;
};

export const createPeriods = (start: Date) => {
  const periods = [];
  const now = new Date();
  const startDate = new Date(start);
  while (startDate < now) {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 6);
    endDate.setDate(endDate.getDate() - 1);
    const period = startDate.getMonth() === 0 ? 1 : 2;
    const name = `Periodo ${startDate.getFullYear()} - ${period}`;
    periods.unshift({
      start: new Date(startDate),
      end: new Date(endDate),
      name,
    });
    startDate.setMonth(startDate.getMonth() + 6);
  }
  periods.unshift({
    start: new Date(start),
    end: new Date('2050-01-01'),
    name: 'Todos los periodos',
  });
  return periods;
};

export const filterByPeriod = (feedback: Feedback[], date: string) => {
  return feedback.filter((item) => {
    const dateItem = new Date(item.feedback_date);
    const split = date.split(' - ');
    const start = new Date(split[0]);
    const end = new Date(split[1]);
    return dateItem >= start && dateItem <= end;
  });
};
export const createQuestionSchema = (type: Pick<Question, 'question_type'>) => {
  switch (type.question_type) {
    case 'text':
      return z
        .string()
        .min(1, 'Este campo es obligatorio y debe contener texto.');
    case 'numeric':
      return z
        .string({
          errorMap: () => ({
            message:
              'Este campo es obligatorio y debe ser un número mayor o igual a 1.',
          }),
        })
        .regex(
          /^(10|[1-9])$/,
          'Este campo es obligatorio y debe ser un número mayor o igual a 1.'
        );
    case 'single_choice':
      return z.string().min(1, 'Por favor selecciona una opción.');
    case 'multiple_choice':
      return z
        .array(z.string())
        .min(1, 'Por favor selecciona al menos una opción.');
    default:
      return z.string().optional();
  }
};

export const generateSchema = (
  questions: Question[] = []
): z.ZodObject<{}, 'strip', z.ZodTypeAny, {}, {}> => {
  const shema = questions.reduce(
    (previous, now) => ({
      ...previous,
      [now.id]: createQuestionSchema(now),
    }),
    {}
  );
  return z.object(shema);
};

-- Add student_id column to studenevalua table to distinguish student evaluations from auto-evaluations
ALTER TABLE studenevalua ADD COLUMN IF NOT EXISTS student_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_studenevalua_student_id ON studenevalua(student_id);
CREATE INDEX IF NOT EXISTS idx_studenevalua_professor_subject ON studenevalua(id_professor, id_subject);

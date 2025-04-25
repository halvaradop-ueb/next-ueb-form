import { StudentStepForm } from "@/ui/dashboard/evaluations/students/student-form";

const EvaluationsPage = () => {
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Evaluation Docente</h1>
                <p className="text-gray-600">Evaluación de los docentes por parte de los estudiantes</p>
            </div>
            <StudentStepForm />
        </div>
    );
};

export default EvaluationsPage;

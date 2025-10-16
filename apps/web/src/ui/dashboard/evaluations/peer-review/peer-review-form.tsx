"use client"
import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ProfessorService, SubjectService } from "@/lib/@types/services"
import { getSubjectsByProfessorId } from "@/services/subjects"
import {
    addCoevaluation,
    getAllCoevaluations,
    getProfessors,
    updateCoevaluation,
    deleteCoevaluation,
} from "@/services/professors"
import { Save, Edit, Trash2, X } from "lucide-react"
import { createPeriods } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"
import { ConfirmAction } from "@/ui/common/confirm-action"
import { PeerReviewFormProps } from "@/lib/@types/props"

export interface PeerReviewState {
    professor: string
    subject: string
    timeframe?: string
    comments?: string
    findings?: string
}
const timeframes = createPeriods(new Date("2024-01-01"))

const initialselectedOptionsState: PeerReviewState = {
    professor: "",
    subject: "",
    timeframe: "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z",
    comments: "",
    findings: "",
}

export const PeerReviewForm = ({ session }: PeerReviewFormProps) => {
    const [activeTab, setActiveTab] = useState("new")
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [selectedOptions, setSelectedOptions] = useState<PeerReviewState>(initialselectedOptionsState)
    const [isLoading, startTransition] = useTransition()
    const [coevaluations, setCoevaluations] = useState([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmText, setConfirmText] = useState("")
    const [evaluationToDelete, setEvaluationToDelete] = useState<any>(null)

    const handleChange = (key: keyof PeerReviewState, value: any) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [key]: value,
        }))
    }

    const resetForm = () => {
        setSubjects([])
        setSelectedOptions(initialselectedOptionsState)
        setEditingId(null)
        setIsEditing(false)
    }

    const handleAddPeerReview = async () => {
        if (isEditing && editingId) {
            const professorId = selectedOptions.professor
            await updateCoevaluation(professorId, editingId, selectedOptions)
        } else {
            await addCoevaluation(selectedOptions, session.user?.id!)
        }
        await loadCoevaluations()
        resetForm()
    }

    const handleEditPeerReview = (evaluation: any) => {
        setSelectedOptions({
            professor: evaluation.professor.id,
            subject: evaluation.subject.id,
            timeframe: "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z",
            comments: evaluation.improvement_plan || "",
            findings: evaluation.findings || "",
        })
        setEditingId(evaluation.id)
        setIsEditing(true)
        setActiveTab("new")
    }

    const handleDeletePeerReview = async (evaluation: any) => {
        setEvaluationToDelete(evaluation)
        setConfirmOpen(true)
    }

    const confirmDeletePeerReview = async () => {
        if (evaluationToDelete) {
            await deleteCoevaluation(evaluationToDelete.professor.id, evaluationToDelete.id)
            await loadCoevaluations()
            setEvaluationToDelete(null)
        }
    }

    const handleCancelEdit = () => {
        resetForm()
    }

    const loadCoevaluations = async () => {
        const coevaluations = await getAllCoevaluations()
        setCoevaluations(coevaluations)
    }

    useEffect(() => {
        const loadInitialData = async () => {
            const [professors, coevaluations] = await Promise.all([getProfessors(), getAllCoevaluations()])
            setProfessors(professors)
            setCoevaluations(coevaluations)
        }

        loadInitialData()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedOptions.professor) {
                setSubjects([])
                return
            }
            const data = await getSubjectsByProfessorId(selectedOptions.professor)
            setSubjects(data)
        }

        fetchSubjects()
    }, [selectedOptions.professor])

    return (
        <section>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">Crear Nueva Coevaluación</TabsTrigger>
                    <TabsTrigger value="saved">Coevaluaciones Guardadas</TabsTrigger>
                </TabsList>
                <TabsContent value="new">
                    <Card>
                        <CardHeader className="text-left">
                            <CardTitle className="justify-start flex items-center gap-2">
                                {isEditing ? "Editar Coevaluación" : "Coevalulación"}
                                {isEditing && (
                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardTitle>
                            <CardDescription className="justify-start">
                                {isEditing ? "Modifica la coevaluación existente" : "Desarrollo de la coevaluación"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="professor">Profesor *</Label>
                                    <Select
                                        onValueChange={(value) => handleChange("professor", value)}
                                        value={selectedOptions.professor}
                                        disabled={isEditing}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un docente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {professors.map((prof) => (
                                                <SelectItem key={prof.id} value={prof.id}>
                                                    {prof.first_name} {prof.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Materia *</Label>
                                    <Select
                                        onValueChange={(value) => handleChange("subject", value)}
                                        value={selectedOptions.subject}
                                        disabled={!selectedOptions.professor || isEditing}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una materia" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.length > 0 &&
                                                subjects.map((subject) => (
                                                    <SelectItem key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </SelectItem>
                                                ))}
                                            {subjects.length === 0 && (
                                                <SelectItem disabled value="empty">
                                                    No hay materias disponibles
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timeframe">Periodo de Tiempo</Label>
                                    <Select
                                        value={selectedOptions.timeframe}
                                        onValueChange={(value) => handleChange("timeframe", value)}
                                    >
                                        <SelectTrigger id="timeframe">
                                            <SelectValue placeholder="Selecciona un periodo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeframes.map(({ name, start, end }) => (
                                                <SelectItem
                                                    key={`timeframe-${name}`}
                                                    value={`${start.toISOString()} - ${end.toISOString()}`}
                                                >
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="findings">Hallazgos</Label>
                                <Textarea
                                    className="min-h-[100px]"
                                    id="findings"
                                    placeholder="Ingresa tus hallazgos..."
                                    value={selectedOptions.findings}
                                    onChange={(e) => handleChange("findings", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="comments">Plan de Mejoramiento y Realimentación</Label>
                                <Textarea
                                    className="min-h-[100px]"
                                    id="comments"
                                    placeholder="Ingresa tus comentarios..."
                                    value={selectedOptions.comments}
                                    onChange={(e) => handleChange("comments", e.target.value)}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end">
                            <Button
                                disabled={isLoading || !selectedOptions.professor || !selectedOptions.subject}
                                onClick={handleAddPeerReview}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {isEditing ? "Actualizar Coevaluación" : "Guardar Coevaluación"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="saved">
                    <Card>
                        <CardHeader className="text-left">
                            <CardTitle>Coevaluaciones Guardadas</CardTitle>
                            <CardDescription>Accede y gestiona las coevaluaciones guardadas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {coevaluations.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No hay coevaluaciones guardadas</p>
                            ) : (
                                coevaluations.map((evaluation: any) => (
                                    <Card className="p-4 items-start text-left" key={evaluation.id}>
                                        <CardHeader className="w-full px-0 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>{evaluation.subject.name}</CardTitle>
                                                    <CardDescription>
                                                        {evaluation.professor.first_name} {evaluation.professor.last_name}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditPeerReview(evaluation)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeletePeerReview(evaluation)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="w-full px-0">
                                            <div>
                                                <h4 className="font-semibold">Hallazgos</h4>
                                                <p className="line-clamp-3 text-muted-foreground">{evaluation.findings}</p>
                                            </div>
                                            <div className="mt-4">
                                                <h4 className="font-semibold">Plan de Mejoramiento y Realimentación</h4>
                                                <p className="line-clamp-3 text-muted-foreground">
                                                    {evaluation.improvement_plan ?? ""}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <ConfirmAction
                title="coevaluación"
                text={confirmText}
                setText={setConfirmText}
                open={confirmOpen}
                setOpen={setConfirmOpen}
                onDelete={confirmDeletePeerReview}
            />
        </section>
    )
}

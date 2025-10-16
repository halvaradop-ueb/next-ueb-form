"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChartComponent, PieChartComponent, LineChartComponent, HorizontalBarChartComponent, ChartDataPoint } from "./charts"
import { TrendingUp, TrendingDown, Users, BookOpen, Award, Target } from "lucide-react"

export interface EvaluationSummary {
    totalEvaluations: number
    averageScore: number
    subjectBreakdown: ChartDataPoint[]
    professorBreakdown: ChartDataPoint[]
    timeSeriesData: ChartDataPoint[]
    scoreDistribution: ChartDataPoint[]
    topPerformers: ChartDataPoint[]
    trends: {
        direction: "up" | "down" | "stable"
        percentage: number
        description: string
    }
}

interface EvaluationMetricsProps {
    summary: EvaluationSummary
    title?: string
    description?: string
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#d084d0"]

export const EvaluationMetrics = ({
    summary,
    title = "Métricas de Evaluación",
    description = "Análisis visual de los resultados de evaluación docente",
}: EvaluationMetricsProps) => {
    const getTrendIcon = (direction: string) => {
        switch (direction) {
            case "up":
                return <TrendingUp className="h-4 w-4 text-green-500" />
            case "down":
                return <TrendingDown className="h-4 w-4 text-red-500" />
            default:
                return <Target className="h-4 w-4 text-gray-500" />
        }
    }

    const getTrendColor = (direction: string) => {
        switch (direction) {
            case "up":
                return "text-green-600 bg-green-50"
            case "down":
                return "text-red-600 bg-red-50"
            default:
                return "text-gray-600 bg-gray-50"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getTrendColor(summary.trends.direction)}`}>
                    {getTrendIcon(summary.trends.direction)}
                    <span className="text-sm font-medium">
                        {summary.trends.percentage > 0 ? "+" : ""}
                        {summary.trends.percentage}% {summary.trends.description}
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalEvaluations}</div>
                        <p className="text-xs text-muted-foreground">Evaluaciones completadas</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.averageScore.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Puntaje promedio de 10</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Materias</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.subjectBreakdown.length}</div>
                        <p className="text-xs text-muted-foreground">Materias evaluadas</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profesores</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.professorBreakdown.length}</div>
                        <p className="text-xs text-muted-foreground">Profesores evaluados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Subject Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Desempeño por Materia</CardTitle>
                        <CardDescription>Comparación de calificaciones promedio por materia</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HorizontalBarChartComponent data={summary.subjectBreakdown} height={250} color="#8884d8" />
                    </CardContent>
                </Card>

                {/* Professor Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Desempeño por Profesor</CardTitle>
                        <CardDescription>Comparación de calificaciones promedio por profesor</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HorizontalBarChartComponent data={summary.professorBreakdown} height={250} color="#82ca9d" />
                    </CardContent>
                </Card>

                {/* Score Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución de Calificaciones</CardTitle>
                        <CardDescription>Distribución de las calificaciones obtenidas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PieChartComponent data={summary.scoreDistribution} height={250} colors={COLORS} />
                    </CardContent>
                </Card>

                {/* Time Series Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tendencia Temporal</CardTitle>
                        <CardDescription>Evolución de las calificaciones a lo largo del tiempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LineChartComponent data={summary.timeSeriesData} height={250} color="#ffc658" />
                    </CardContent>
                </Card>
            </div>

            {/* Top Performers */}
            <Card>
                <CardHeader>
                    <CardTitle>Mejores Desempeños</CardTitle>
                    <CardDescription>Profesores con las mejores calificaciones promedio</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {summary.topPerformers.slice(0, 5).map((performer, index) => (
                            <div key={performer.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">{performer.name}</p>
                                        <p className="text-sm text-muted-foreground">{performer.category || "Profesor"}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="font-mono">
                                    {performer.value.toFixed(1)}/10
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

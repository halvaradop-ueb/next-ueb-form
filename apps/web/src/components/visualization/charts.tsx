"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart,
} from "recharts"

export interface ChartDataPoint {
    name: string
    value: number
    [key: string]: any
}

interface BaseChartProps {
    data: ChartDataPoint[]
    width?: number | string
    height?: number
}

interface BarChartProps extends BaseChartProps {
    xAxisKey?: string
    yAxisKey?: string
    color?: string
}

interface PieChartProps extends BaseChartProps {
    colors?: string[]
}

interface LineChartProps extends BaseChartProps {
    xAxisKey?: string
    yAxisKey?: string
    color?: string
}

interface AreaChartProps extends BaseChartProps {
    xAxisKey?: string
    yAxisKey?: string
    color?: string
}

const DEFAULT_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#d084d0", "#ffb347", "#87ceeb"]

export const BarChartComponent = ({
    data,
    width = "100%",
    height = 300,
    xAxisKey = "name",
    yAxisKey = "value",
    color = "#8884d8",
}: BarChartProps) => {
    return (
        <ResponsiveContainer width={width} height={height}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={yAxisKey} fill={color} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export const PieChartComponent = ({ data, width = "100%", height = 300, colors = DEFAULT_COLORS }: PieChartProps) => {
    return (
        <ResponsiveContainer width={width} height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    )
}

export const LineChartComponent = ({
    data,
    width = "100%",
    height = 300,
    xAxisKey = "name",
    yAxisKey = "value",
    color = "#8884d8",
}: LineChartProps) => {
    return (
        <ResponsiveContainer width={width} height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={yAxisKey} stroke={color} strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    )
}

export const AreaChartComponent = ({
    data,
    width = "100%",
    height = 300,
    xAxisKey = "name",
    yAxisKey = "value",
    color = "#8884d8",
}: AreaChartProps) => {
    return (
        <ResponsiveContainer width={width} height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey={yAxisKey} stroke={color} fill={color} fillOpacity={0.6} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export const HorizontalBarChartComponent = ({
    data,
    width = "100%",
    height = 300,
    xAxisKey = "value",
    yAxisKey = "name",
    color = "#8884d8",
}: BarChartProps) => {
    return (
        <ResponsiveContainer width={width} height={height}>
            <BarChart layout="horizontal" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey={yAxisKey} type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey={xAxisKey} fill={color} />
            </BarChart>
        </ResponsiveContainer>
    )
}

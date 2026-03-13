import {PLOTLY_COLORS} from "../../../../genui";
import 'chart.js/auto';
import {Chart} from 'react-chartjs-2';
import React from "react"

export function MetricCurvePlot(props) {
    if (props.curves.length === 0) {
        return null
    }
    const axes_names = {x: "Independent", y: "Dependent"};
    let baseline_data;
    if (props.name === "roc_curve") {
        axes_names.x = "False Positive Rate";
        axes_names.y = "True Positive Rate";
        baseline_data = [
            {
                x: 0,
                y: 0,
            },
            {
                x: 1,
                y: 1,
            }
        ]
    } else if (props.name === "precision_recall_curve") {
        axes_names.x = "Recall";
        axes_names.y = "Precision";
        baseline_data = [
            {
                x: 0,
                y: 0,
            },
            {
                x: 0,
                y: 0,
            }
        ]
    } else if (props.name === "det_curve") {
        axes_names.x = "False Positive Rate";
        axes_names.y = "False Negative Rate";
        baseline_data = [
            {
                x: 1,
                y: 0,
            },
            {
                x: 0,
                y: 1,
            }
        ]
    }
    let datasets;
    if (props.name === "precision_recall_curve") {
        datasets = [{
            label: 'Baseline',
            showLine: true,
            fill: false,
            pointRadius: 0,
            data: baseline_data,
        }].concat(props.curves.map((curve, index) => {
            if (index >= PLOTLY_COLORS.length) {
                index = index % PLOTLY_COLORS.length;
            }
            const color = PLOTLY_COLORS[index];
            const lastDependentValue = curve.dependent[0];

            // Create the main curve dataset
            const mainCurve = {
                label: curve.label,
                showLine: true,
                lineTension: 0,
                fill: false,
                data: curve.independent.map((independent, index) => ({
                    x: independent,
                    y: curve.dependent[index]
                })),
                pointRadius: 0,
                backgroundColor: color,
                borderColor: color
            };

            const horizontalLine = {
                label: `${curve.label} Baseline`,
                showLine: true,
                lineTension: 0,
                fill: false,
                data: [
                    {x: 0, y: lastDependentValue},
                    {x: 1, y: lastDependentValue}
                ],
                pointRadius: 0,
                backgroundColor: color,
                borderColor: color,
                borderDash: [5, 5],
                hidden: false
            };

            return [mainCurve, horizontalLine];
        }).flat());
    } else {
        datasets = [{
            label: 'Baseline',
            showLine: true,
            fill: false,
            pointRadius: 0,
            data: baseline_data,
        }].concat(props.curves.map((curve, index) => {
            if (index >= PLOTLY_COLORS.length) {
                index = index % PLOTLY_COLORS.length;
            }
            const color = PLOTLY_COLORS[index];

            return {
                label: curve.label,
                showLine: true,
                lineTension: 0,
                fill: false,
                data: curve.independent.map((independent, index) => ({
                    x: curve.dependent[index],
                    y: independent
                })),
                pointRadius: 0,
                backgroundColor: color,
                borderColor: color
            }
        }));
    }
    const data = {
        datasets: datasets
    };

    return (
        <div style={{marginBottom: '20px'}}>
            <h5 style={{textAlign: 'center'}}>{props.name}</h5>
            <Chart
                type='scatter'
                data={data}
                options={{
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: axes_names.x
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: axes_names.y
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: props.title
                    },
                    // aspectRatio: 1
                }
                }
            />
        </div>
    );
}
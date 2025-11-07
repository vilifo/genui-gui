import {PLOTLY_COLORS} from "../../../../genui";
import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';
import React from "react";

export function MetricCurvePlot(props) {
    if (props.curves.length === 0) {
        return null
    }
    const axes_names = {x: "Independent", y: "Dependent"};
    if (props.name === "roc_curve"){
        axes_names.x = "False Positive Rate";
        axes_names.y = "True Positive Rate";
    } else if (props.name === "precision_recall_curve"){
        axes_names.x = "Recall";
        axes_names.y = "Precision";
    } else if (props.name === "det_curve"){
        axes_names.x = "False Positive Rate";
        axes_names.y = "False Negative Rate";
    }

    const datasets = [{
        label: 'Baseline',
        showLine: true,
        fill: false,
        pointRadius: 0,
        data: [
            {
                x: 0,
                y: 0,
            },
            {
                x: 1,
                y: 1,
            }
        ]
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
    const data = {
        datasets: datasets
    };

    return (
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
    );
}
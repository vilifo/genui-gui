import React from 'react';
import {Table} from 'reactstrap';
import {TableDataFromItems, TableFromItems} from '../../../../genui';
import {MetricCurvePlot} from "./Plots";

function parseCVData(perfMatrix) {
    const ret = {};
    ret[''] = [
        {
            id: 'MIN',
            value: 'MIN'
        },
        {
            id: 'MAX',
            value: 'MAX'
        },
        {
            id: 'AVG',
            value: 'AVG'
        },
        {
            id: 'SD',
            value: 'SD'
        },
    ];
    Object.keys(perfMatrix).forEach(key => ret[key] = []);
    Object.keys(perfMatrix).forEach(key => {
        const tmp = {id: `MIN_${key}`};
        const arr = perfMatrix[key].map(x => x.value);
        tmp['value'] = Math.min(...arr).toPrecision(4);
        ret[key].push(tmp);
    });
    Object.keys(perfMatrix).forEach(key => {
        const tmp = {id: `MAX_${key}`};
        const arr = perfMatrix[key].map(x => x.value);
        tmp['value'] = Math.max(...arr).toPrecision(4);
        ret[key].push(tmp);
    });
    Object.keys(perfMatrix).forEach(key => {
        const tmp = {id: `AVG_${key}`};
        const arr = perfMatrix[key].map(x => x.value);
        tmp['value'] = (arr.reduce((a, b) => a + b, 0) / arr.length).toPrecision(4);
        ret[key].push(tmp);
    });
    Object.keys(perfMatrix).forEach(key => {
        const tmp = {id: `SD_${key}`};
        const arr = perfMatrix[key].map(x => x.value);
        const m = arr.reduce((a, b) => a + b, 0) / arr.length;
        tmp['value'] = (Math.sqrt(arr.reduce((sq, n) => {
            return sq + Math.pow(n - m, 2);
        }, 0) / (arr.length - 1))).toPrecision(4);
        ret[key].push(tmp);
    });
    return ret;
}

function CVOverview(props) {
    const metrics = props.model.trainingStrategy.validationStrategies[props.index].metrics;
    const validationStrategyIndex = props.index;
    const cvPerf = props.getPerfMatrix(props.performance, 'ModelPerformanceCV', metrics, validationStrategyIndex);
    const curves = metrics.filter(metric => metric.includes("curve"))
    const curves_data = props.getPerfValuesForMetric(props.performance, "MetricCurvePoint", curves[0], validationStrategyIndex);
    const curves_points = {};
    curves.forEach(curve => {
        if (cvPerf[curve]) {
            curves_points[curve] = {};
            cvPerf[curve].forEach(auc => {
                curves_points[curve][auc.id] = []
            });
            curves_data.forEach(point => {
                if (curves_points[curve].hasOwnProperty(point.extraArgs.auc)) {
                    curves_points[curve][point.extraArgs.auc].push(point);
                }
            });
        }
    })
    const curves_lists = {};
    Object.keys(curves_points).forEach((metric) => {
        curves_lists[metric] = [];
        Object.keys(curves_points[metric]).forEach((key, index) => {
            curves_lists[metric].push({
                label: `Fold ${index + 1}`,
                dependent: curves_points[metric][key].map(point => point.value),
                independent: curves_points[metric][key].map(point => point.extraArgs.independent),
            })
        })
    });
    return (
        <React.Fragment>
            <h4>Cross-Validation</h4>

            {
                Object.keys(cvPerf).length > 0 ? (
                    <React.Fragment>
                        {
                            curves_lists ? Object.keys(curves_lists).map(metric => (
                                <MetricCurvePlot
                                    key={metric}
                                    curves={curves_lists[metric]}
                                    title={`Cross-Validation ${metric} Curves`}
                                    name={metric}
                                />
                            )) : null
                        }

                        <h5>Metrics Summary</h5>
                        <Table size="sm" hover>
                            <TableFromItems
                                items={parseCVData(cvPerf)}
                                parseHeaderItem={item => item.includes("curve") ? (item + " (AUC)") : item}
                            />
                        </Table>
                    </React.Fragment>
                ) : <div>No cross-validation data available.</div>
            }
        </React.Fragment>
    )
}

function IndependentTestSetOverview(props) {
    const metrics = props.model.trainingStrategy.validationStrategies[props.index].metrics;
    let validSetPerf = props.getPerfMatrix(props.performance, 'ModelPerformance', metrics);
    for (const metric of Object.keys(validSetPerf)) {
        if (validSetPerf[metric].length === 0) {
            return null;
        }
    }
    const curves = metrics.filter(metric => metric.includes("curve"))
    const curves_data = Object.fromEntries(
        curves.map(curve => [curve, props.getPerfValuesForMetric(props.performance, "MetricCurvePoint", curve)])
    );
    const curves_points = {};
    curves.forEach(curve => {
        if (validSetPerf[curve]) {
            curves_points[curve] = {};
            validSetPerf[curve].forEach(auc => {
                curves_points[curve][auc.id] = []
            });
            curves_data[curve].forEach(point => {
                if (curves_points[curve].hasOwnProperty(point.extraArgs.auc)) {
                    curves_points[curve][point.extraArgs.auc].push(point);
                }
            });
        }
    })
    const curves_lists = {};
    Object.keys(curves_points).forEach((metric) => {
        curves_lists[metric] = [];
        Object.keys(curves_points[metric]).forEach((key, index) => {
            curves_lists[metric].push({
                dependent: curves_points[metric][key].map(point => point.value),
                independent: curves_points[metric][key].map(point => point.extraArgs.independent),
                label: "Independent Set"
            })
        })
    });
    validSetPerf = Object.keys(validSetPerf).map((x) => validSetPerf[x].length > 0 ? validSetPerf[x][0] : null);
    return (
        <React.Fragment>
            <h4>Independent Validation Set</h4>

            {
                validSetPerf[0] !== null ? (
                    <React.Fragment>
                        {
                            curves_lists ? Object.keys(curves_lists).map(metric => (
                                <MetricCurvePlot
                                    key={metric}
                                    curves={curves_lists[metric]}
                                    name={metric}
                                    title={`${metric} (Independent Test Set)`}/>
                            )) : null
                        }

                        <h5>Metrics Summary</h5>
                        <Table size="sm" hover>
                            <TableDataFromItems
                                items={validSetPerf}
                                dataProps={['value']}
                                conversion={(item) => typeof item === 'number' ? item.toPrecision(4) : item.toString()}
                                rowHeaderProp="metric"
                                parseRowHeader={header => header.includes("curve") ? (header + " (AUC)") : header}
                            />
                        </Table>
                    </React.Fragment>
                ) : <div>No data.</div>
            }
        </React.Fragment>
    )
}

const QSARPerformanceOverview = (props) => {
    if (!props.model.trainingStrategy.validationStrategies) {
        return <p>No performance data for this model is available.</p>
    }
    const validationStrategies = props.model.trainingStrategy.validationStrategies;
    return (
        <div className="qsar-models-performance-overview">
            {validationStrategies.map((strategy, index) => (
                <div key={`qsar-models-performance-overview-strategy-${index}`}>
                    <h3>Validation strategy {index + 1}</h3>
                    <div className={"border rounded p-3"}>
                        <IndependentTestSetOverview {...props} index={index}/>
                        <CVOverview {...props} index={index}/>
                    </div>
                </div>
            ))}

        </div>
    );
}

export default QSARPerformanceOverview;
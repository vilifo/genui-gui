import React from 'react';
import {Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import FieldErrorMessage from './forms/FieldErrorMessage';

export function AlgorithmsField(props) {
    const algorithmPrefix = "trainingStrategy.parameters";
    const currentMode = props.modes[0].name || null;
    const [loading, setLoading] = React.useState(false);
    const [allAlgorithms, setAllAlgorithms] = React.useState(props.allAlgorithms || []);
    const [loadingAlgorithms, setLoadingAlgorithms] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};
    const fetchedRef = React.useRef({});

    // Fetch available algorithms when component mounts
    const fetchAlgorithms = React.useCallback(async () => {
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (allAlgorithms.length > 0) {
            return;
        }

        setLoadingAlgorithms(true);
        try {
            const url = new URL(`models/qsprpred/sklearn/mode/${currentMode}/`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch algorithms: ${response.statusText}`);
            }

            const data = await response.json();
            setAllAlgorithms(data);
        } catch (error) {
            console.error("Error fetching algorithms:", error);
        } finally {
            setLoadingAlgorithms(false);
        }
    }, [props.apiUrls, allAlgorithms.length, setAllAlgorithms, currentMode]);

    // Fetch algorithm parameters when an algorithm is selected and set their values
    const fetchAlgorithmParameters = React.useCallback(async (alg_name) => {
        if (!alg_name) return;
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (fetchedRef.current[alg_name]) {
            return;
        }

        setLoading(true);
        try {
            const url = new URL(`models/qsprpred/sklearn/${alg_name}/params`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch algorithm parameters: ${response.statusText}`);
            }

            const data = await response.json();
            fetchedRef.current[alg_name] = true;

            if (values && setFieldValue) {
                const updatedParameters = {
                    alg: alg_name,
                    parameters: Object.fromEntries(Object.entries(data).map(([paramName, paramValue]) => [
                        paramName, {
                            value: paramValue.default,
                            constraints: paramValue.constraints,
                        }
                    ]))
                };
                setFieldValue('trainingStrategy.parameters', updatedParameters);
            }

        } catch (error) {
            console.error("Error fetching algorithm parameters:", error);
        } finally {
            setLoading(false);
        }
    }, [props.apiUrls, values, setFieldValue]);

    const handleAlgorithmChange = (event) => {
        const selectedAlgorithmId = event.target.value;

        if (values && setFieldValue) {
            const updatedAlgorithm = {alg: selectedAlgorithmId, parameters: {}};
            setFieldValue('trainingStrategy.parameters', updatedAlgorithm);
        }

        if (selectedAlgorithmId) {
            fetchedRef.current[selectedAlgorithmId] = false;
        }

        fetchAlgorithmParameters(selectedAlgorithmId);
    };

    const renderParamInput = (paramName, paramValue) => {
        const constraints = paramValue && paramValue.constraints ? paramValue.constraints : null;
        const type = constraints ? Object.entries(constraints)[0] : null;
        const value = paramValue && paramValue.value ? paramValue.value : null;
        if (paramValue && (type === "int" || type === "float")) {
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Col sm={8}>
                        <Field name={`${algorithmPrefix}.parameters.parameters.${paramName}.value`} as={Input}
                               type="number"/>
                    </Col>
                </div>
            );
        } else if (paramValue && type === "bool") {
            return (
                <div key={paramName} className="form-check" style={{margin: '5px'}}>
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id={`${algorithmPrefix}-parameters-${paramName}`}
                        value={paramName}
                        checked={value}
                        onChange={(e) => {
                            setFieldValue(`${algorithmPrefix}.parameters.parameters.${paramName}.value`, e.target.checked);
                        }}
                    />
                    <label className="form-check-label" htmlFor={`${algorithmPrefix}-parameters-${paramName}`}>
                        {paramName}
                    </label>
                </div>
            );
        } else if (paramValue && type === "str") {
            const choices = constraints.str || [];
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Field
                        name={`${algorithmPrefix}-parameters-${paramName}`}
                        as={Input}
                        type="select"
                        onChange={(e) => {
                            setFieldValue(`${algorithmPrefix}.parameters.parameters.${paramName}.value`, e.target.checked);
                        }}>
                        {choices.map((choice) => (<option key={`${algorithmPrefix}-parameters-${paramName}-${choice}`}
                                                          value={choice}>{choice}</option>))}
                    </Field>
                </div>
            );

        }
    };

    const currentAlgorithmId = values && values.trainingStrategy && values.trainingStrategy.parameters
        ? values.trainingStrategy.parameters.alg
        : null;

    React.useEffect(() => {
        fetchAlgorithms();
    }, [fetchAlgorithms]);

    React.useEffect(() => {
        if (currentAlgorithmId) {
            fetchAlgorithmParameters(currentAlgorithmId);
        }
    }, [currentAlgorithmId, fetchAlgorithmParameters]);

    return (
        <React.Fragment>
            <FormGroup>
                <Field
                    name={`${algorithmPrefix}.alg`}
                    as={Input}
                    type="select"
                    onChange={handleAlgorithmChange}
                    disabled={loadingAlgorithms}
                >
                    {loadingAlgorithms ? (
                        <option value="" disabled>Loading algorithms...</option>
                    ) : (
                        allAlgorithms.map((alg) => (
                            <option key={alg} value={alg}>{alg}</option>
                        ))
                    )}
                </Field>
            </FormGroup>
            <FieldErrorMessage name={`${algorithmPrefix}.alg`}/>

            {/* Display algorithm parameters if available */}
            {loading ? (
                <p>Loading parameters...</p>
            ) : values && values.trainingStrategy && values.trainingStrategy.parameters ? (
                <div className="mt-3">
                    <h5>Parameters</h5>
                    <div style={{maxHeight: '250px', overflowY: 'auto'}}>
                        {values.trainingStrategy.parameters.parameters &&
                            Object.entries(values.trainingStrategy.parameters.parameters).map(([paramName, paramValue]) => (
                                <div key={paramName} className="mb-3">
                                    {renderParamInput(paramName, paramValue)}
                                </div>
                            ))}
                    </div>
                </div>
            ) : (
                values && values.trainingStrategy && values.trainingStrategy.parameters &&
                values.trainingStrategy.parameters.alg &&
                <p>No parameters available for this algorithm.</p>
            )}
        </React.Fragment>
    );
}

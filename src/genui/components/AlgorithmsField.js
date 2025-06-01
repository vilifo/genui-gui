import React from 'react';
import {Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import {useLocalStorageWithExpiry} from "../../genui";
// import FieldErrorMessage from './forms/FieldErrorMessage';

const algorithmsListKey = 'algorithmsCache_list';
const algorithmsParametersKey = 'algorithmsCache_parameters';

export function AlgorithmsField(props) {
    const algorithmPrefix = "trainingStrategy.parameters";
    const currentMode = props.modes[0].name || null;
    const [loading, setLoading] = React.useState(false);
    const [allAlgorithms, setAllAlgorithms] = useLocalStorageWithExpiry(algorithmsListKey, [], 24);
    const [internalParameters, setInternalParameters] = useLocalStorageWithExpiry(algorithmsParametersKey, {}, 24);
    const [loadingAlgorithms, setLoadingAlgorithms] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};
    const [selectedAlgorithm, setSelectedAlgorithm] = React.useState(values?.trainingStrategy?.parameters?.alg);
    const fetchedRef = React.useRef({});

    const fetchAlgorithms = React.useCallback(async () => {
        if (!props.apiUrls?.qsarRoot || allAlgorithms.length > 0) {
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

    const fetchAlgorithmParameters = React.useCallback(async (alg_name) => {
        if (!alg_name || !props.apiUrls?.qsarRoot) {
            return;
        }

        setLoading(true);
        if (!internalParameters?.[alg_name]) {
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
                const updatedParams = internalParameters;
                updatedParams[alg_name] = data;
                setInternalParameters(updatedParams);
            } catch (error) {
                console.error("Error fetching algorithm parameters:", error);
            }
        }
        if (internalParameters?.[alg_name] && setFieldValue) {
            const params = Object.fromEntries(
                Object.entries(internalParameters[alg_name]).map(
                    ([key, value]) => [key, value.value]));
            const newParameters = {alg: alg_name, parameters: params};
            setFieldValue(algorithmPrefix, newParameters);
        }
        setLoading(false);
    }, [props.apiUrls, setInternalParameters, internalParameters, setFieldValue]);

    const handleAlgorithmChange = (event) => {
        const selectedAlgorithmId = event.target.value;
        setSelectedAlgorithm(selectedAlgorithmId);
        setFieldValue(`${algorithmPrefix}.parameters`, {
            alg: selectedAlgorithmId,
            parameters: {}
        });
        fetchedRef.current[selectedAlgorithmId] = false;
        fetchAlgorithmParameters(selectedAlgorithmId);
    };

    const renderParamInput = (paramName, paramValue) => {
        const currentParameters = internalParameters && internalParameters[selectedAlgorithm] ? internalParameters[selectedAlgorithm] : {};
        const constraint = currentParameters && currentParameters[paramName] ? currentParameters[paramName].constraint : [];
        const type = constraint ? constraint.type : null;

        const validateInterval = (x) => {
            if (!Number.parseFloat(x)) {
                return "This field must be a number.";
            } else if (!Number.parseInt(x) && type === "int") {
                return "This field must be an integer.";
            } else {
                if (constraint.min) {
                    if (x <= constraint.min && constraint.leq === "b") {
                        return `This field must be greater than ${constraint.min}.`;
                    } else if (x < constraint && constraint.leq === "bq") {
                        return `This field must be greater than or equal to ${constraint.min}.`;
                    }
                }
                if (constraint.max) {
                    if (x >= constraint.max && constraint.geq === "s") {
                        return `This field must be less than ${constraint.max}.`;
                    } else if (x > constraint && constraint.geq === "sq") {
                        return `This field must be less than or equal to ${constraint.max}.`;
                    }
                }
            }
        }
        if (type === null) {
            return null;
        } else if (type === "int" || type === "float") {
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Col sm={8}>
                        <Field
                            name={`${algorithmPrefix}.parameters.${paramName}`}
                            type="number"
                            validate={validateInterval}
                            as={Input}
                            {...constraint.min ? {min: constraint.min} : {}}
                            {...constraint.max ? {max: constraint.max} : {}}
                        />
                    </Col>
                </div>
            );
        } else if (type === "bool") {
            return (
                <div key={paramName} className="form-check" style={{margin: '5px'}}>
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id={`${algorithmPrefix}-parameters-${paramName}`}
                        value={paramName}
                        checked={paramValue || false}
                        onChange={(e) => setFieldValue(`${algorithmPrefix}.parameters.${paramName}`, e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`${algorithmPrefix}-parameters-${paramName}`}>
                        {paramName}
                    </label>
                </div>
            );
        } else if (type === "str") {
            const choices = constraint.choices || [""];
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Field
                        name={`${algorithmPrefix}.parameters.${paramName}`}
                        as={Input}
                        type="select"
                        value={paramValue || choices[0]}
                        onChange={(e) => setFieldValue(`${algorithmPrefix}.parameters.${paramName}`, e.target.value)}
                    >
                        {choices.map((choice) => (
                            <option key={`${algorithmPrefix}-parameters-${paramName}-${choice}`} value={choice}>
                                {choice}
                            </option>
                        ))}
                    </Field>
                </div>
            );
        } else if (Number.parseInt(paramValue) || Number.parseFloat(paramValue)) {
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Col sm={8}>
                        <Field
                            name={`${algorithmPrefix}.parameters.${paramName}`}
                            as={Input}
                            type="number"
                        />
                    </Col>
                </div>
            );
        } else {
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Field
                        name={`${algorithmPrefix}.parameters.${paramName}`}
                        as={Input}
                        type="string"
                        value={paramValue || ""}
                        onChange={(e) => setFieldValue(`${algorithmPrefix}.parameters.${paramName}`, e.target.value)}
                    >
                    </Field>
                </div>
            );
        }
    };

    React.useEffect(() => {
        fetchAlgorithms();
    }, [fetchAlgorithms]);

    return (
        <React.Fragment>
            <FormGroup>
                <Label>Algorithm</Label>
                <Input
                    type="select"
                    value={selectedAlgorithm}
                    onChange={handleAlgorithmChange}
                    disabled={loadingAlgorithms}
                >
                    <option value="" disabled={selectedAlgorithm !== ""}>Select an algorithm</option>
                    {loadingAlgorithms ? (
                        <option value="" disabled>Loading algorithms...</option>
                    ) : (
                        allAlgorithms.map((alg) => (
                            <option key={alg} value={alg}>{alg}</option>
                        ))
                    )}
                </Input>
            </FormGroup>

            {loading ? (
                <p>Loading parameters...</p>
            ) : values && values.trainingStrategy && values.trainingStrategy.parameters && values.trainingStrategy.parameters.alg ? (
                <div className="mt-3">
                    <h5>Parameters</h5>
                    <div className="mb-3 border p-3 rounded">
                        {values && values.trainingStrategy && values.trainingStrategy.parameters && values.trainingStrategy.parameters.parameters &&
                            Object.entries(values.trainingStrategy.parameters.parameters).map(([paramName, paramValue]) => (
                                <div key={paramName} className="mb-3">
                                    {renderParamInput(paramName, paramValue)}
                                </div>
                            ))}
                    </div>
                </div>
            ) : (
                selectedAlgorithm && <p>No parameters available for this algorithm.</p>
            )}
        </React.Fragment>
    );
}
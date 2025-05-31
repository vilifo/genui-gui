import React from 'react';
import {Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
// import FieldErrorMessage from './forms/FieldErrorMessage';

const algorithmsCache = {
    list: null,
    parameters: {},
    fetchingList: false,
};

// Initialize cache from localStorage if available
try {
    const storedList = localStorage.getItem('algorithmsCache_list');
    if (storedList) {
        algorithmsCache.list = JSON.parse(storedList);
    }

    const storedParameters = localStorage.getItem('algorithmsCache_parameters');
    if (storedParameters) {
        algorithmsCache.parameters = JSON.parse(storedParameters);
    }
} catch (error) {
    console.error("Error reading from localStorage:", error);
}


export function AlgorithmsField(props) {
    const algorithmPrefix = "trainingStrategy.parameters";
    const currentMode = props.modes[0].name || null;
    const [loading, setLoading] = React.useState(false);
    const [allAlgorithms, setAllAlgorithms] = React.useState([]);
    const [loadingAlgorithms, setLoadingAlgorithms] = React.useState(false);
    const [internalParameters, setInternalParameters] = React.useState({});
    const fetchedRef = React.useRef({});
    const {values, setFieldValue} = props.formikProps || {};
    const [selectedAlgorithm, setSelectedAlgorithm] = React.useState(values.trainingStrategy.parameters.alg);

    const setAlgorithmParameters = React.useCallback(async (params) => {
        const parameters = {};
        Object.entries(params.parameters || {}).forEach(([paramName, paramValue]) => {
            parameters[paramName] = paramValue.value;
        });
        const updatedParams = {
            alg: params.alg,
            parameters: parameters
        };
        setFieldValue(`${algorithmPrefix}`, updatedParams);
        setInternalParameters(params.parameters || {});
    }, [setFieldValue])

    const fetchAlgorithms = React.useCallback(async () => {
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (allAlgorithms.length > 0) {
            return;
        }

        if (algorithmsCache.list) {
            setAllAlgorithms(algorithmsCache.list);
        }

        if (algorithmsCache.fetchingList) {
            setLoadingAlgorithms(true);
            const checkCache = () => {
                if (algorithmsCache.list) {
                    setAllAlgorithms(algorithmsCache.list);
                    setLoadingAlgorithms(false);
                    return true;
                }
                if (!algorithmsCache.fetchingList) {
                    setLoadingAlgorithms(false);
                    return true;
                }
                return false;
            };

            const intervalId = setInterval(() => {
                if (checkCache()) {
                    clearInterval(intervalId);
                }
            }, 100);

            return;
        }

        algorithmsCache.fetchingList = true;
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
            algorithmsCache.list = data;
            try {
                localStorage.setItem('algorithmsCache_list', JSON.stringify(data));
            } catch (error) {
                console.error("Error storing algorithms list in localStorage:", error);
            }
            setAllAlgorithms(data);
        } catch (error) {
            console.error("Error fetching algorithms:", error);
        } finally {
            setLoadingAlgorithms(false);
        }
    }, [props.apiUrls, allAlgorithms.length, setAllAlgorithms, currentMode]);

    const fetchAlgorithmParameters = React.useCallback(async (alg_name) => {
        if (!alg_name) return;
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (fetchedRef.current[alg_name]) {
            return;
        }

        if (algorithmsCache.parameters[alg_name]) {
            const parameters = {alg: alg_name, parameters: algorithmsCache.parameters[alg_name]};
            setAlgorithmParameters(parameters);
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
            setAlgorithmParameters({alg: alg_name, parameters: data});
            algorithmsCache.parameters[alg_name] = data;
            try {
                localStorage.setItem('algorithmsCache_parameters', JSON.stringify(algorithmsCache.parameters));
            } catch (error) {
                console.error("Error storing algorithm parameters in localStorage:", error);
            }

        } catch (error) {
            console.error("Error fetching algorithm parameters:", error);
        } finally {
            setLoading(false);
        }
    }, [props.apiUrls, setAlgorithmParameters]);

    const handleAlgorithmChange = (event) => {
        const selectedAlgorithmId = event.target.value;

        setSelectedAlgorithm(selectedAlgorithmId);
        setAlgorithmParameters({
            alg: selectedAlgorithmId,
            parameters: algorithmsCache.parameters[selectedAlgorithmId] || {}
        });

        if (selectedAlgorithmId && !algorithmsCache.parameters[selectedAlgorithmId]) {
            fetchedRef.current[selectedAlgorithmId] = false;
        }

        fetchAlgorithmParameters(selectedAlgorithmId);
    };

    const renderParamInput = (paramName, paramValue) => {
        const constraint = internalParameters[paramName] ? internalParameters[paramName].constraint : [];
        const type = constraint ? constraint.type : null;

        const validateInterval = (x) => {
            if (!Number.parseFloat(x)){
                return "This field must be a number.";
            } else if (! Number.parseInt(x) && type === "int"){
                return "This field must be an integer.";
            } else {
                if (constraint.min){
                    if (x <= constraint.min && constraint.leq === "b") {
                        return `This field must be greater than ${constraint.min}.`;
                    } else if (x < constraint && constraint.leq === "bq") {
                        return `This field must be greater than or equal to ${constraint.min}.`;
                    }
                }
                if (constraint.max){
                    if (x >= constraint.max && constraint.geq === "s") {
                        return `This field must be less than ${constraint.max}.`;
                    } else if (x > constraint && constraint.geq === "sq") {
                        return `This field must be less than or equal to ${constraint.max}.`;
                    }
                }
            }
        }
        if (type === null){
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
                            {...constraint.min? {min: constraint.min} : {}}
                            {...constraint.max? {max: constraint.max} : {}}
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

    React.useEffect(() => {
        if (selectedAlgorithm) {
            fetchAlgorithmParameters(selectedAlgorithm);
        }
    }, [selectedAlgorithm, fetchAlgorithmParameters]);

    React.useEffect(() => {
        if (props.onChange) {
            props.onChange(values[`${algorithmPrefix}.parameters`] || {});
        }
    }, [props.onChange, values, props]);

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
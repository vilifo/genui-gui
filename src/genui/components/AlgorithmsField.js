import React from 'react';
import {Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import {FieldErrorMessage, useLocalStorageWithExpiry} from "../../genui";

export const algorithmsListKey = 'algorithmsCache_list';
export const algorithmsParametersKey = 'algorithmsCache_parameters';

export function AlgorithmsField(props) {
    const algorithmPrefix = "trainingStrategy.parameters";
    const currentMode = props.modes[0].name || null;
    const [loading, setLoading] = React.useState(false);
    const [allAlgorithms, setAllAlgorithms] = useLocalStorageWithExpiry(algorithmsListKey,
        Object.fromEntries(props.chosenAlgorithm.validModes.map(mode => [mode.name, []])));
    const [internalParameters, setInternalParameters] = useLocalStorageWithExpiry(algorithmsParametersKey, {});
    const [loadingAlgorithms, setLoadingAlgorithms] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};
    const fetchResource = props.fetchResource;

    const fetchAlgorithms = React.useCallback(
        async () => {
            setLoadingAlgorithms(true);
            const data = await fetchResource(`models/qsprpred/sklearn/mode/${currentMode}/`);
            if (data) {
                setAllAlgorithms({...allAlgorithms, [currentMode]: data});
            }
            setLoadingAlgorithms(false);
        },
        [fetchResource, allAlgorithms, setAllAlgorithms, currentMode]
    );

    const fetchAlgorithmParameters = React.useCallback(async (alg_name) => {
        setLoading(true);
        let params;
        if (!internalParameters[alg_name]) {
            const data = await fetchResource(`models/qsprpred/sklearn/${alg_name}/params`)
            if (!data) return;
            setInternalParameters({...internalParameters, [alg_name]: data});
            params = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, value.value]));
        } else{
            params = Object.fromEntries(
                Object.entries(internalParameters[alg_name]).map(([key, value]) => [key, value.value]));
        }
        const newParameters = {alg: alg_name, parameters: params};
        setFieldValue(algorithmPrefix, newParameters);
        setLoading(false);
    }, [fetchResource, setInternalParameters, internalParameters, setFieldValue]);

    const handleAlgorithmChange = (event) => {
        const selectedAlgorithmId = event.target.value;
        if (selectedAlgorithmId === values.trainingStrategy.parameters.alg) return;
        setFieldValue(`${algorithmPrefix}`, {
            alg: selectedAlgorithmId,
            parameters: {}
        });
        setFieldValue(`hyperParamOptStrategy`, {"resourcetype": "None"});
    };

    const renderParamInput = (paramName, paramValue) => {
        const selectedAlgorithm = values.trainingStrategy.parameters.alg;
        const currentParameters = internalParameters[selectedAlgorithm] ? internalParameters[selectedAlgorithm] : {};
        const constraint = currentParameters && currentParameters[paramName] ? currentParameters[paramName].constraint : [];
        const type = constraint ? constraint.type : null;

        const validateInterval = (x) => {
            if (isNaN(x) && type === "float") {
                return "This field must be a number.";
            } else if (isNaN(x) && type === "int") {
                return "This field must be an integer.";
            } else {
                if (constraint.min) {
                    if (x <= constraint.min && constraint.leq === "b") {
                        return `This field must be greater than ${constraint.min}.`;
                    } else if (x < constraint.min && constraint.leq === "bq") {
                        return `This field must be greater than or equal to ${constraint.min}.`;
                    }
                }
                if (constraint.max) {
                    if (x >= constraint.max && constraint.geq === "s") {
                        return `This field must be less than ${constraint.max}.`;
                    } else if (x > constraint.max && constraint.geq === "sq") {
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
                        <FieldErrorMessage name={`${algorithmPrefix}.parameters.${paramName}`}/>
                    </Col>
                </div>
            );
        } else if (type === "bool") {
            return (
                <div key={paramName} className="form-check" style={{margin: '5px'}}>
                    <Field>
                        {({field}) => (
                            <input
                                {...field}
                                type="checkbox"
                                className="form-check-input"
                                id={`${algorithmPrefix}-parameters-${paramName}`}
                                checked={field.value || false}
                            />
                        )}
                    </Field>
                    <label className="form-check-label" htmlFor={`${algorithmPrefix}-parameters-${paramName}`}>
                        {paramName}
                    </label>
                    <FieldErrorMessage name={`${algorithmPrefix}.parameters.${paramName}`}/>
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
                    <FieldErrorMessage name={`${algorithmPrefix}.parameters.${paramName}`}/>
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
                        <FieldErrorMessage name={`${algorithmPrefix}.parameters.${paramName}`}/>
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
                    <FieldErrorMessage name={`${algorithmPrefix}.parameters.${paramName}`}/>
                </div>
            );
        }
    };

    React.useEffect(() => {
        if (allAlgorithms[currentMode].length === 0) fetchAlgorithms();
    }, [fetchAlgorithms, allAlgorithms, currentMode]);

    React.useEffect(() => {
        const selectedAlgorithm = values.trainingStrategy.parameters.alg;
        if (selectedAlgorithm) {
            fetchAlgorithmParameters(selectedAlgorithm);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.trainingStrategy.parameters.alg]);

    return (
        <React.Fragment>
            <FormGroup>
                <Label>Algorithm</Label>
                <Field
                    as={Input}
                    type="select"
                    name={`${algorithmPrefix}.alg`}
                    onChange={handleAlgorithmChange}
                    disabled={loadingAlgorithms}
                >
                    {loadingAlgorithms ? (
                        <option value="" disabled>Loading algorithms...</option>
                    ) : (
                        allAlgorithms[currentMode].map((alg) => (
                            <option key={alg} value={alg}>{alg}</option>
                        ))
                    )}
                </Field>
                <FieldErrorMessage name={`${algorithmPrefix}.alg`}/>
            </FormGroup>

            {loading ? (
                <p>Loading parameters...</p>
            ) : values && values.trainingStrategy && values.trainingStrategy.parameters && values.trainingStrategy.parameters.alg ? (
                <div className="mt-3">
                    <h5>Parameters</h5>
                    <div className="mb-3 border p-3 rounded">
                        {values && values.trainingStrategy && values.trainingStrategy.parameters &&
                            Object.entries(values.trainingStrategy.parameters.parameters).map(([paramName, paramValue]) => (
                                <div key={paramName} className="mb-3">
                                    {renderParamInput(paramName, paramValue)}
                                </div>
                            ))}
                    </div>
                </div>
            ) : (
                values.trainingStrategy.parameters.alg && <p>No parameters available for this algorithm.</p>
            )}
        </React.Fragment>
    );
}

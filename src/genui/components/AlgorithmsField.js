import React from 'react';
import {Col, FormGroup, Input, Label, Row, Button} from 'reactstrap';
import {Field} from 'formik';
import {FieldErrorMessage, useLocalStorageWithExpiry} from "../../genui";

export const algorithmsListKey = 'algorithmsCache_list';
export const algorithmsParametersKey = 'algorithmsCache_parameters';


export function ParametersField(props) {
    const {values, setFieldValue} = props.formikProps || {};
    const algorithmPrefix = "trainingStrategy.parameters";
    const availableParameters = props.availableParameters || {};
    const currentParameters = typeof values.trainingStrategy.parameters.parameters === "string" ?
        {} : values.trainingStrategy.parameters.parameters;
    const remainingParameters = Object.entries(availableParameters).filter(([key, _]) =>
        !(key in currentParameters)).map(([key, _]) => key);

    const handleRemoveItem = (paramName) => {
        const updatedParameters = {...currentParameters};
        delete updatedParameters[paramName];
        setFieldValue(`${algorithmPrefix}.parameters`, updatedParameters);
    }

    const DeleteButton = ({paramName, handleRemoveItem}) => (
        <Col sm={1} className="align-content-center">
            <Button
                type="button"
                onClick={() => handleRemoveItem(paramName)}
                className="text-red-600 hover:text-red-800 text-lg font-bold px-2 py-1 rounded transition"
                title="Delete"
            >
                ✖
            </Button>
        </Col>
    );

    const renderParamInput = (paramName, paramValue) => {
        const constraint = availableParameters[paramName] ? availableParameters[paramName].constraint : [];
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
                <Row>
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
                    <DeleteButton paramName={paramName} handleRemoveItem={handleRemoveItem}/>
                </Row>
            );
        } else if (type === "bool") {
            return (
                <Row>
                    <Col>
                        <div key={paramName} className="form-check" style={{margin: '5px'}}>
                            <Field name={`${algorithmPrefix}.parameters.${paramName}`}>
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
                    </Col>
                    <DeleteButton paramName={paramName} handleRemoveItem={handleRemoveItem}/>
                </Row>
            );
        } else if (type === "str") {
            const choices = constraint.choices || [""];
            return (
                <Row>
                    <Label>{paramName}</Label>
                    <Col>
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
                    </Col>
                    <DeleteButton paramName={paramName} handleRemoveItem={handleRemoveItem}/>
                </Row>
            );
        } else if (Number.parseInt(paramValue) || Number.parseFloat(paramValue)) {
            return (
                <Row>
                    <Label>{paramName}</Label>
                    <Col>
                        <Col sm={8}>
                            <Field
                                name={`${algorithmPrefix}.parameters.${paramName}`}
                                as={Input}
                                type="number"
                            />
                            <FieldErrorMessage name={`${algorithmPrefix}.parameters.${paramName}`}/>
                        </Col>
                    </Col>
                    <DeleteButton paramName={paramName} handleRemoveItem={handleRemoveItem}/>
                </Row>
            );
        } else {
            return (
                <Row>
                    <Label>{paramName}</Label>
                    <Col>
                        <Field
                            name={`${algorithmPrefix}.parameters.${paramName}`}
                            as={Input}
                            type="string"
                            value={paramValue || ""}
                            onChange={(e) => setFieldValue(`${algorithmPrefix}.parameters.${paramName}`, e.target.value)}
                        >
                        </Field>
                        <FieldErrorMessage name={`${algorithmPrefix}.parameters.${paramName}`}/>
                    </Col>
                    <DeleteButton paramName={paramName} handleRemoveItem={handleRemoveItem}/>
                </Row>
            );
        }
    };

    const handleAddItem = (item) => {
        const newParameters = {...currentParameters, [item]: availableParameters[item].value};
        setFieldValue(`${algorithmPrefix}.parameters`, newParameters);
    }

    return (
        <React.Fragment>
            <FormGroup>
                <Row>
                    <Col sm={6}>
                        <label>Available Items</label>
                        <div className="p-4 rounded border" style={{height: '400px', overflowY: 'auto'}}>
                            {remainingParameters.map((item) => (
                                <div key={item} className="mb-3">
                                    <Row className="align-items-center">
                                        <Col sm={1} className="text-left">
                                            <Button
                                                onClick={() => handleAddItem(item)}
                                                className="text-green-600 hover:text-green-800 text-lg font-bold px-2 py-1 rounded transition"
                                                title="Add"
                                            >
                                                ➕
                                            </Button>
                                        </Col>
                                        <Col sm={10} className="text-left">
                                            <Label className="ml-2"
                                                   htmlFor={`${algorithmPrefix}.parameters.${item}`}>{item}</Label>
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                        </div>
                    </Col>

                    <Col sm={6}>
                        <label>Selected Items</label>
                        <div className="p-4 rounded border" style={{
                            height: '400px',
                            overflowY: 'auto',
                            gap: '4px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {Object.entries(currentParameters).map(([key, value]) => (
                                <React.Fragment key={key}>
                                    {renderParamInput(key, value)}
                                </React.Fragment>
                            ))}
                        </div>
                    </Col>
                </Row>
            </FormGroup>
        </React.Fragment>

    );
}


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
        if (!internalParameters[alg_name]) {
            const data = await fetchResource(`models/qsprpred/sklearn/${alg_name}/params`)
            if (!data) {
                setLoading(false);
                return;
            }
            setInternalParameters({...internalParameters, [alg_name]: data});
        }
        setLoading(false);
    }, [fetchResource, setInternalParameters, internalParameters]);

    const handleAlgorithmChange = (event) => {
        const selectedAlgorithmId = event.target.value;
        if (selectedAlgorithmId === values.trainingStrategy.parameters.alg) return;
        setFieldValue(`${algorithmPrefix}`, {
            alg: selectedAlgorithmId,
            parameters: {}
        });
        setFieldValue(`hyperParamOptStrategy`, {"resourcetype": "None"});
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
                        <ParametersField
                            formikProps={props.formikProps}
                            availableParameters={internalParameters[values.trainingStrategy.parameters.alg]}
                        />
                    </div>
                </div>
            ) : (
                values.trainingStrategy.parameters.alg && <p>No parameters available for this algorithm.</p>
            )}
        </React.Fragment>
    );
}

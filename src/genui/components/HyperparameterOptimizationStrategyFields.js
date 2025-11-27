import React from 'react';
import {Button, Col, FormGroup, Input, Label, Row} from 'reactstrap';
import {Field} from 'formik';
import {algorithmsParametersKey} from './AlgorithmsField'
import {useLocalStorageWithExpiry} from './LocalStorageWithExpiry';
import {FieldErrorMessage} from '../../genui';

const hyperGreen = '#57dc86';

const SearchSpace = (props) => {
    const {values, setFieldValue} = props.formikProps || {};
    const searchSpace = values.hyperParamOptStrategy.searchSpace;
    const [internalParameters,] = useLocalStorageWithExpiry(algorithmsParametersKey, {});
    const possibleParameters = internalParameters[values.trainingStrategy.parameters.alg];
    const remainingParameters = Object.entries(possibleParameters || {}).filter(([key, _]) => !(key in searchSpace)).map(([key, _]) => key);
    const searchSpacePrefix = props.searchSpacePrefix;
    const [inputType, setInputType] = React.useState({});

    const getType = (name) => {
        const constraint = possibleParameters[name].constraint;
        if (constraint) {
            return constraint.type;
        }
        return null;
    }

    const minValue = (constraint) => {
        if (constraint?.interval?.leq) {
            const interval = constraint.interval;
            return interval.leq === "bq" ? interval.min : interval.min + (interval.type === "int" ? 1 : 0.01);
        } else {
            return undefined;
        }
    }

    const maxValue = (constraint) => {
        if (constraint?.interval?.req) {
            const interval = constraint.interval;
            return interval.req === "sq" ? interval.max : interval.max - (interval.type === "int" ? 1 : 0.01);
        } else {
            return undefined;
        }
    }

    const handleAddItem = (name) => {
        const constraint = possibleParameters[name].constraint;
        const type = getType(name);
        const newItem = {};
        if (type === "bool") {
            newItem[name] = props.newItem("bool");
        } else if (type === "int") {
            const min = minValue(constraint);
            const max = maxValue(constraint);
            newItem[name] = props.newItem("int", min ? min : 0, max ? max : 10);
            setInputType(prevState => ({...prevState, [name]: "manual"}))
        } else if (type === "float") {
            const min = minValue(constraint);
            const max = maxValue(constraint);
            newItem[name] = props.newItem("float", min ? min : 0, max ? max : 1);
            setInputType(prevState => ({...prevState, [name]: "manual"}))
        } else if (type === "str") {
            newItem[name] = props.newItem("str", [constraint.choices[0]] || []);
        } else {
            console.warn(`Unknown type for ${name}: ${type}`);
        }
        const updatedSearchSpace = {...values.hyperParamOptStrategy.searchSpace, ...newItem};
        setFieldValue(`${searchSpacePrefix}`, updatedSearchSpace);
    }

    const handleRemoveItem = (name) => {
        const updatedSearchSpace = {...values.hyperParamOptStrategy.searchSpace};
        delete updatedSearchSpace[name];
        setFieldValue(`${searchSpacePrefix}`, updatedSearchSpace);
    }

    const renderItem = (name) => {
        const type = getType(name);
        const constraint = possibleParameters[name].constraint;
        if (type === "bool") {  // Boolean parameter ###############################################################
            return (
                <div key={`${name}-bool`} className="p-2 rounded" style={{background: hyperGreen}}>
                    <Row>
                        <Col className="align-center">
                            <h5>{name}:</h5>
                        </Col>
                        <Col className="align-center">
                            <p>True/False</p>
                        </Col>
                        <Col sm={1} className="align-content-center">
                            <Button
                                type="button"
                                onClick={() => handleRemoveItem(name)}
                                className="text-red-600 hover:text-red-800 text-lg font-bold px-2 py-1 rounded transition"
                                title="Delete"
                            >
                                ✖
                            </Button>
                        </Col>
                    </Row>
                </div>
            );
        } else if (type === "int" || type === "float") { // Numeric parameter ######################################
            return props.renderNumericItem(type, name, handleRemoveItem, inputType, setInputType, minValue(constraint), maxValue(constraint));
        } else if (type === "str") {  // Categorical parameter #####################################################
            const choices = possibleParameters[name].constraint.choices || [];
            const categoricalName = props.categoricalName(searchSpacePrefix, name);
            return (
                <div key={`${name}-str`} className="p-2 border rounded" style={{background: hyperGreen}}>
                    <Row>
                        <Col sm={2} className="align-self-lg-baseline">
                            <h5>{name}:</h5>
                        </Col>
                        <Col>
                            <Field
                                name={`${categoricalName}`}
                                type="select" multiple
                                as={Input}
                                className="border px-2 py-1 rounded"
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    props.handleChangeValue(name, selected, "categorical", minValue(constraint), maxValue(constraint));
                                }}
                            >
                                {
                                    choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)
                                }
                            </Field>
                            <FieldErrorMessage name={`${categoricalName}`}/>
                        </Col>
                        <Col sm={1} className="align-content-center">
                            <Button
                                type="button"
                                onClick={() => handleRemoveItem(name)}
                                className="text-red-600 hover:text-red-800 text-lg font-bold px-2 py-1 rounded transition"
                                title="Delete"
                            >
                                ✖
                            </Button>
                        </Col>
                    </Row>
                </div>);
        } else {
            return null;
        }
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
                                                   htmlFor={`${searchSpacePrefix}.searchSpace.${item}`}>{item}</Label>
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
                            {Object.entries(searchSpace).map(([key, value]) => (
                                renderItem(key)
                            ))}
                        </div>
                    </Col>
                </Row>
            </FormGroup>
        </React.Fragment>

    );
}

const hyperparamStrategiesCacheKey = 'qsarHyperparamStrategiesCache';
const valueAggregationCacheKey = 'qsarValueAggregationCache';

export function QSARHyperparameterOptimizationStrategyFields(props) {
    const hyperparamStrategyPrefix = props.hyperparamStrategyPrefix;
    const [hyperparamStrategies, setHyperparamStrategies] = useLocalStorageWithExpiry(hyperparamStrategiesCacheKey, [])
    const [valueAggregations, setValueAggregations] = useLocalStorageWithExpiry(valueAggregationCacheKey, []);
    const [loadingHyperparamStrategies, setLoadingHyperparamStrategies] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};
    const fetchedRef = React.useRef({});
    const metrics = props.metrics;
    const fetchResource = props.fetchResource;

    const fetchHyperparamStrategies = React.useCallback(async () => {
        if (hyperparamStrategies.length > 0) {
            return;
        }

        setLoadingHyperparamStrategies(true);
        const data = await fetchResource(`hyper-parameters/list/`);
        if (!data) return
        if (!data.includes("None")) {
            data.unshift("None");
        }
        setHyperparamStrategies(data);
        setLoadingHyperparamStrategies(false);

    }, [fetchResource, hyperparamStrategies, setHyperparamStrategies]);

    const fetchValueAggregations = React.useCallback(async () => {
        if (valueAggregations.length > 0) {
            return;
        }
        const data = await fetchResource(`aggregation-functions/`);
        if (! data) return
        setValueAggregations(data);

    }, [fetchResource, valueAggregations, setValueAggregations]);

    const initParameters = React.useCallback((strategyName) => {
        if (!valueAggregations.length || !metrics.length) return null;

        return {
            resourcetype: strategyName,
            searchSpace: {},
            scoreAggregation: valueAggregations[0],
            metric: metrics[0],
            ...(strategyName === "OptunaOptimization" ? {nTrials: 10} : {})
        };
    }, [metrics, valueAggregations]);

    const setHyperParamOptStrategyParameters = React.useCallback(async (strategyName) => {
        if (!strategyName) return;
        if (strategyName === "None") {
            if (values?.hyperParamOptStrategy) {
                setFieldValue(`${hyperparamStrategyPrefix}`, {resourcetype: "None"});
            }
            return;
        }
        setFieldValue(`${hyperparamStrategyPrefix}`, initParameters(strategyName));
    }, [setFieldValue, hyperparamStrategyPrefix, values, initParameters]);

    const handleHyperparamStrategyChange = (event) => {
        const selectedStrategy = event.target.value;
        if (selectedStrategy) {
            fetchedRef.current[selectedStrategy] = false;
        }
        if (values.searchSpace) {
            delete values.searchSpace;
        }

        setHyperParamOptStrategyParameters(selectedStrategy);
    }

    const currentStrategy = values && values?.hyperParamOptStrategy
        ? values.hyperParamOptStrategy.resourcetype
        : "None";

    React.useEffect(() => {
        const fetchInitialData = async () => {
            if (hyperparamStrategies.length === 0) {
                await fetchHyperparamStrategies();
            }
            if (Object.keys(valueAggregations).length === 0) {
                await fetchValueAggregations();
            }
        };

        fetchInitialData();
    }, [fetchHyperparamStrategies,
        fetchValueAggregations,
        hyperparamStrategies,
        valueAggregations,
        values.trainingStrategy?.parameters?.alg
    ]);


    React.useEffect(() => {
        if (currentStrategy && !fetchedRef.current[currentStrategy]) {
            fetchedRef.current[currentStrategy] = true;
            setHyperParamOptStrategyParameters(currentStrategy);
        }
    }, [currentStrategy, setHyperParamOptStrategyParameters]);

    const newItemOptuna = (type, min = 0, max = 10) => {
        if (type === "bool") {
            return ["categorical", [true, false]];
        } else if (type === "int" || type === "float") {
            return [type, min, max];
        } else if (type === "str") {
            return ["categorical", min];
        }
    }
    const newItemGridSearch = (type, min = 0, max = 10) => {
        if (type === "bool") {
            return [true, false];
        } else if (type === "int" || type === "float") {
            return "";
        } else if (type === "str") {
            return min;
        }
    }
    const handleChangeValueOptuna = (name, value, type, minValue, maxValue) => {
        if (Number.isInteger(type) && (type === 1 || type === 2)) {
            let numValue = Number.parseFloat(value);
            if (type === 1) {
                numValue = minValue ? (minValue > numValue ? minValue : numValue) : numValue;
            }
            if (type === 2) {
                numValue = maxValue ? (maxValue < numValue ? maxValue : numValue) : numValue;
            }
            setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}[${type}]`, numValue);
        } else if (type === "categorical") {
            const currentValue = values.hyperParamOptStrategy.searchSpace[name][1] || [];
            const newValue = Array.isArray(value)
                ? [
                    ...currentValue.filter(v => !value.includes(v)),
                    ...value.filter(v => !currentValue.includes(v))
                ]
                : currentValue.includes(value)
                    ? currentValue.filter(v => v !== value)
                    : [...currentValue, value];
            const newEntry = ["categorical", newValue];
            setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}`, newEntry);
        }
    };

    const handleChangeValueGridSearch = (name, value, type, minValue, maxValue) => {
        if (type === "int" || type === "float") {
            const strValue = String(value);
            if (strValue.endsWith(";")) {
                let filteredValues = strValue.split(';').map(v => Number.parseFloat(v.trim())).filter(v => !isNaN(v));
                if (minValue !== undefined) {
                    filteredValues = filteredValues.filter(v => minValue <= v)
                }
                if (maxValue !== undefined) {
                    filteredValues = filteredValues.filter(v => maxValue >= v)
                }
                filteredValues = filteredValues.join(";") + ";";
                setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}`, filteredValues);
            } else {
                setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}`, value);
            }
        } else if (type === "categorical") {
            const currentValue = values.hyperParamOptStrategy.searchSpace[name] || [];
            const newValue = Array.isArray(value)
                ? [
                    ...currentValue.filter(v => !value.includes(v)),
                    ...value.filter(v => !currentValue.includes(v))
                ]
                : currentValue.includes(value)
                    ? currentValue.filter(v => v !== value)
                    : [...currentValue, value];
            setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}`, newValue);
        } else if (type === "min" || type === "max" || type === "step") {
            setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}.${type}`, value);
        }
    };


    const renderNumericItemOptuna = (type, name, handleRemoveItem, inputType, setInputType, minValue, maxValue) => {
        return (
            <div key={`${name}-number`} className="p-2 rounded" style={{background: hyperGreen}}>
                <Row className="align-items-left">
                    <Col className="align-self-lg-baseline">
                        <h5>{name}:</h5>
                    </Col>
                    <Col className="align-self-lg-baseline">
                        <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${name}[1]`}
                               className="mb-0 mr-2">Min:</Label>
                        <Field
                            name={`${hyperparamStrategyPrefix}.searchSpace.${name}[1]`}
                            type="number"
                            as={Input}
                            className="border px-2 py-1 rounded mr-2"
                            onChange={(e) => handleChangeValueOptuna(name, e.target.value, 1, minValue, maxValue)}
                            style={{width: "100px", display: "inline-block"}}
                        />
                        <FieldErrorMessage name={`${hyperparamStrategyPrefix}.searchSpace.${name}[1]`}/>
                    </Col>
                    <Col className="align-content-center">
                        <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${name}[2]`}
                               className="mb-0 mr-2">Max:</Label>
                        <Field
                            name={`${hyperparamStrategyPrefix}.searchSpace.${name}[2]`}
                            type="number"
                            as={Input}
                            className="border px-2 py-1 rounded mr-2"
                            onChange={(e) => handleChangeValueOptuna(name, e.target.value, 2, minValue, maxValue)}
                            style={{width: "100px", display: "inline-block"}}
                        />
                        <FieldErrorMessage name={`${hyperparamStrategyPrefix}.searchSpace.${name}[2]`}/>
                    </Col>
                    <Col sm={1} className="align-content-center">
                        <Button
                            type="button"
                            onClick={() => handleRemoveItem(name)}
                            className="text-red-600 hover:text-red-800 text-lg font-bold px-2 py-1 rounded transition"
                            title="Delete"
                        >
                            ✖
                        </Button>
                    </Col>
                </Row>
            </div>
        );
    }

    const renderNumericItemGridSearch = (type, name, handleRemoveItem, inputType, setInputType, minValue, maxValue) => {
        return (
            <div key={`${name}-number`} className="p-2 rounded" style={{background: hyperGreen}}>
                <Row className="align-items-left">
                    <Col className="align-self-center">
                        <h5>{name}:</h5>
                    </Col>
                    <Col className="align-self-lg-baseline">
                        <div style={{display: "flex", flexDirection: "column"}}>
                            <div>
                                <Label className="mb-0 mr-2">Input type:</Label>
                                <Input
                                    type="select"
                                    name={`searchSpace.${name}.inputType`}
                                    value={inputType[name]}
                                    onChange={e => {
                                        setInputType(prev => ({...prev, [name]: e.target.value}));
                                        if (e.target.value === "manual") {
                                            setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}`, "");
                                        } else if (e.target.value === "range") {
                                            setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}`,
                                                {
                                                    min: minValue ? minValue : (type === "int" ? 1 : 0.0),
                                                    max: maxValue ? maxValue : (type === "int" ? 10 : 1.0),
                                                    step: type === "int" ? 1 : 0.1
                                                });
                                        }
                                    }}
                                    style={{width: "120px", display: "inline-block", marginRight: "10px"}}
                                >
                                    <option value="manual">Manual</option>
                                    <option value="range">Range</option>
                                </Input>
                            </div>
                        </div>
                    </Col>
                    <Col className="align-self-lg-baseline">
                        {(inputType[name] === "manual") && (
                            <div style={{marginTop: "8px"}}>
                                <Label className="mb-0 mr-2">
                                    Values (separated by ;):
                                </Label>
                                <Field
                                    name={`${hyperparamStrategyPrefix}.searchSpace.${name}`}
                                    type="text"
                                    as={Input}
                                    onChange={e => handleChangeValueGridSearch(name, e.target.value, type, minValue, maxValue)}
                                    className="border px-2 py-1 rounded mr-2"
                                    style={{width: "200px", display: "inline-block"}}
                                />
                            </div>
                        )}
                    </Col>
                    <Col className="align-self-lg-baseline">
                        {inputType[name] === "range" && (
                            <div style={{marginTop: "8px", display: "flex", gap: "8px"}}>
                                <div>
                                    <Label htmlFor={`searchSpace.${name}.min`}
                                           className="mb-0 mr-2">Min:</Label>
                                    <Field
                                        name={`${hyperparamStrategyPrefix}.searchSpace.${name}.min`}
                                        as={Input}
                                        type="number"
                                        className="border px-2 py-1 rounded mr-2"
                                        onChange={e => handleChangeValueGridSearch(name, e.target.value, 'min', minValue, maxValue)}
                                        style={{width: "80px", display: "inline-block"}}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${name}.max`}
                                           className="mb-0 mr-2">Max:</Label>
                                    <Field
                                        name={`${hyperparamStrategyPrefix}.searchSpace.${name}.max`}
                                        type="number"
                                        as={Input}
                                        className="border px-2 py-1 rounded mr-2"
                                        onChange={e => handleChangeValueGridSearch(name, e.target.value, 'max', minValue, maxValue)}
                                        style={{width: "80px", display: "inline-block"}}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${name}.step`}
                                           className="mb-0 mr-2">Step:</Label>
                                    <Field
                                        name={`${hyperparamStrategyPrefix}.searchSpace.${name}.step`}
                                        as={Input}
                                        type="number"
                                        className="border px-2 py-1 rounded mr-2"
                                        onChange={e => handleChangeValueGridSearch(name, e.target.value, 'step', minValue, maxValue)}
                                        style={{width: "80px", display: "inline-block"}}
                                    />
                                </div>
                            </div>
                        )}
                    </Col>
                    <Col sm={1} className="align-content-center">
                        <Button
                            type="button"
                            onClick={() => handleRemoveItem(name)}
                            className="text-red-600 hover:text-red-800 text-lg font-bold px-2 py-1 rounded transition"
                            title="Delete"
                        >
                            ✖
                        </Button>
                    </Col>
                    {(inputType[name] === "manual") &&
                        <FieldErrorMessage name={`${hyperparamStrategyPrefix}.searchSpace.${name}`}/>}
                    {inputType[name] === "range" && (
                        <div>
                            <FieldErrorMessage name={`${hyperparamStrategyPrefix}.searchSpace.${name}.min`}/>
                            <FieldErrorMessage name={`${hyperparamStrategyPrefix}.searchSpace.${name}.max`}/>
                            <FieldErrorMessage name={`${hyperparamStrategyPrefix}.searchSpace.${name}.step`}/>
                        </div>
                    )}
                </Row>
            </div>
        );
    }

    return (
        <React.Fragment>
            <h4>Hyperparameter Optimization</h4>
            <FormGroup>
                <Label htmlFor={`${hyperparamStrategyPrefix}.resourcetype`} sm={4}>Strategy</Label>
                <Col sm={8}>
                    <Field
                        name={`${hyperparamStrategyPrefix}.resourcetype`}
                        as={Input}
                        type="select"
                        onChange={handleHyperparamStrategyChange}
                        disabled={loadingHyperparamStrategies}
                    >
                        {loadingHyperparamStrategies ? (
                            <option value="" disabled>Loading hyperparameter optimization strategies...</option>
                        ) : (
                            hyperparamStrategies.map((hpos) => (
                                <option key={hpos} value={hpos}>{hpos}</option>
                            ))
                        )}
                    </Field>
                    <FieldErrorMessage name={`${hyperparamStrategyPrefix}.resourcetype`}/>
                </Col>
            </FormGroup>
            <FieldErrorMessage name={`${hyperparamStrategyPrefix}.resourcetype`}/>

            {currentStrategy && currentStrategy !== "None" && values && (
                <>
                    <h5>Hyperparameter optimization parameters</h5>
                    <div className='p-3 border rounded'>
                        {values?.hyperParamOptStrategy?.searchSpace && (
                            <React.Fragment>
                                <FormGroup row>
                                    <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace`} sm={4}>Search
                                        space</Label>
                                    {currentStrategy === "OptunaOptimization" ?
                                        <SearchSpace
                                            {...props}
                                            searchSpacePrefix={`${hyperparamStrategyPrefix}.searchSpace`}
                                            newItem={newItemOptuna}
                                            categoricalName={(prefix, name) => `${prefix}.${name}[1]`}
                                            handleChangeValue={handleChangeValueOptuna}
                                            renderNumericItem={renderNumericItemOptuna}
                                        /> :
                                        <SearchSpace
                                            {...props}
                                            searchSpacePrefix={`${hyperparamStrategyPrefix}.searchSpace`}
                                             newItem={newItemGridSearch}
                                            categoricalName={(prefix, name) => `${prefix}.${name}`}
                                            handleChangeValue={handleChangeValueGridSearch}
                                            renderNumericItem={renderNumericItemGridSearch}
                                        />}
                                </FormGroup>
                            </React.Fragment>
                        )}
                        {values?.hyperParamOptStrategy?.nTrials && (
                            <React.Fragment>
                                <FormGroup row>
                                    <Label htmlFor={`${hyperparamStrategyPrefix}.nTrials`} sm={4}>Number of
                                        trials</Label>
                                    <Col sm={8}>
                                        <Field
                                            name={`${hyperparamStrategyPrefix}.nTrials`}
                                            as={Input}
                                            value={values.hyperParamOptStrategy.nTrials}
                                            type="number"
                                        />
                                    </Col>
                                </FormGroup>
                                <FieldErrorMessage name={`${hyperparamStrategyPrefix}.nTrials`}/>
                            </React.Fragment>
                        )}

                        {metrics && (
                            <React.Fragment>
                                <FormGroup row>
                                    <Label htmlFor={`${hyperparamStrategyPrefix}.metrics`} sm={4}>Validation
                                        Metrics</Label>
                                    <Col sm={8}>
                                        <Field name={`${hyperparamStrategyPrefix}.metrics`} as={Input} type="select">
                                            {metrics.map(metric => (
                                                <option key={metric} value={metric}>
                                                    {metric}
                                                </option>
                                            ))}
                                        </Field>
                                    </Col>
                                </FormGroup>
                                <FieldErrorMessage name={`${hyperparamStrategyPrefix}.metrics`}/>
                            </React.Fragment>
                        )}

                        {valueAggregations && (
                            <React.Fragment>
                                <FormGroup row>
                                    <Label htmlFor={`${hyperparamStrategyPrefix}.scoreAggregation`} sm={4}>
                                        Value aggregation function
                                    </Label>
                                    <Col sm={8}>
                                        <Field
                                            name={`${hyperparamStrategyPrefix}.scoreAggregation`}
                                            as={Input}
                                            type="select"
                                        >
                                            {valueAggregations.map(agg => (
                                                <option key={agg} value={agg}>
                                                    {agg}
                                                </option>
                                            ))}
                                        </Field>
                                    </Col>
                                </FormGroup>
                                <FieldErrorMessage name={`${hyperparamStrategyPrefix}.scoreAggregation`}/>
                            </React.Fragment>
                        )}
                    </div>
                </>
            )}
        </React.Fragment>
    );
}

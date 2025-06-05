import React from 'react';
import {Button, Col, FormGroup, Input, Label, Row} from 'reactstrap';
import {Field} from 'formik';
import {algorithmsParametersKey} from './AlgorithmsField'
import {useLocalStorageWithExpiry} from './LocalStorageWithExpiry';
import {FieldErrorMessage} from '../../genui';

const hyperparamStrategiesCacheKey = 'qsarHyperparamStrategiesCache';
const valueAggregationCacheKey = 'qsarValueAggregationCache';

export function QSARHyperparameterOptimizationStrategyFields(props) {
    const hyperparamStrategyPrefix = props.hyperparamStrategyPrefix;
    const [hyperparamStrategies, setHyperparamStrategies] = useLocalStorageWithExpiry(hyperparamStrategiesCacheKey, [])
    const [valueAggregations, setValueAggregations] = useLocalStorageWithExpiry(valueAggregationCacheKey, {});
    const [loadingHyperparamStrategies, setLoadingHyperparamStrategies] = React.useState(false);
    const [internalParameters] = useLocalStorageWithExpiry(algorithmsParametersKey, {}); // Must be fetched by AlgorithmsField
    const {values, setFieldValue} = props.formikProps || {};
    const fetchedRef = React.useRef({});
    const metrics = props.metrics;

    const fetchHyperparamStrategies = React.useCallback(async () => {
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (hyperparamStrategies.length > 0) {
            return;
        }

        setLoadingHyperparamStrategies(true);
        try {
            const url = new URL(`hyper-parameters/list/`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch strategies: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.includes("None")) {
                data.unshift("None");
            }
            setHyperparamStrategies(data);
        } catch (error) {
            console.error("Error fetching strategies:", error);
        } finally {
            setLoadingHyperparamStrategies(false);
        }

    }, [props.apiUrls, hyperparamStrategies, setHyperparamStrategies]);

    const fetchValueAggregations = React.useCallback(async () => {
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (valueAggregations.length > 0) {
            return;
        }

        try {
            const url = new URL(`aggregation-functions/`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch value aggregations: ${response.statusText}`);
            }

            const data = await response.json();
            setValueAggregations(data);
        } catch (error) {
            console.error("Error fetching algorithms:", error);
        }

    }, [props.apiUrls, valueAggregations, setValueAggregations]);

    const initParameters = React.useCallback((strategyName) => {
        if (!valueAggregations.length || !metrics.length) return null;

        return {
            resourcetype: strategyName,
            searchSpace: {},
            scoreAggregation: valueAggregations[0].id,
            metric: metrics[0].id,
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

        setHyperParamOptStrategyParameters(selectedStrategy);
    }
    const renderSearchSpaceOptuna = () => {
        const searchSpace = values.hyperParamOptStrategy.searchSpace;
        const possibleParameters = internalParameters[values.trainingStrategy.parameters.alg];
        const remainingParameters = Object.entries(possibleParameters).filter(([key, value]) => !(key in searchSpace)).map(([key, value]) => key);

        const getType = (name) => {
            const constraint = possibleParameters[name].constraint;
            if (constraint) {
                return constraint.type;
            }
            return null;
        }

        const minValue = (constraint) => {
            if (constraint.leq) {
                return constraint.leq === "bq" ? constraint.min : constraint.min + (constraint.type === "int" ? 1 : 0.01);
            } else {
                return 0
            }
        }

        const maxValue = (constraint) => {
            if (constraint.req) {
                return constraint.req === "sq" ? constraint.max : constraint.max - (constraint.type === "int" ? 1 : 0.01);
            } else {
                return 10
            }
        }

        const handleAddItem = (item) => {
            const constraint = possibleParameters[item].constraint;
            const type = getType(item);
            const newItem = {};
            if (type === "bool") {
                newItem[item] = ["categorical", [true, false]];
            } else if (type === "int") {
                newItem[item] = ["int", minValue(constraint), maxValue(constraint)];
            } else if (type === "float") {
                newItem[item] = ["float", minValue(constraint), maxValue(constraint)];
            } else if (type === "str") {
                newItem[item] = ["categorical", []];
            } else {
                console.warn(`Unknown type for ${item}: ${type}`);
            }
            const updatedSearchSpace = {...values.hyperParamOptStrategy.searchSpace, ...newItem};
            setFieldValue(`${hyperparamStrategyPrefix}.searchSpace`, updatedSearchSpace);
        }

        const handleRemoveItem = (name) => {
            const updatedSearchSpace = {...values.hyperParamOptStrategy.searchSpace};
            delete updatedSearchSpace[name];
            setFieldValue(`${hyperparamStrategyPrefix}.searchSpace`, updatedSearchSpace);
        }

        const handleChangeValue = (name, value, type) => {
            if (Number.isInteger(type) && (type === 1 || type === 2)) {
                setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}[${type}]`, value);
            } else if (type === "categorical") {
                const currentValue = values.hyperParamOptStrategy.searchSpace[name] || [];
                const newValue = currentValue.includes(value) ? currentValue.filter(v => v !== value) : [...currentValue, value];
                setFieldValue(`${hyperparamStrategyPrefix}.searchSpace.${name}`, newValue);
            }
        }

        const renderItem = (name) => {
            const type = getType(name);
            if (type === "bool") {
                return (
                    <div key={`${name}-bool`} className="p-4 rounded">
                        <Row>
                            <Col sm={5}>
                                <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${name}`}>{name}</Label>
                            </Col>
                            <Col sm={5}>
                                <p>True/False</p>
                            </Col>
                            <Col sm={2}>
                                <Button
                                    onClick={() => handleRemoveItem(name)}
                                    className="btn btn-danger"
                                >
                                    ×
                                </Button>
                            </Col>
                        </Row>
                    </div>
                );
            } else if (type === "int" || type === "float") {
                return (
                    <div key={`${name}-number`} className="p-4 rounded">
                        <Row className="align-items-left">
                            <Col sm={3} className="align-content-center">
                                <h5>{name}:</h5>
                            </Col>
                            <Col sm={1} className="align-content-center">
                                <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${name}[1]`}>Min:</Label>
                            </Col>
                            <Col sm={2} className="align-content-center">
                                <Field name={`${hyperparamStrategyPrefix}.searchSpace.${name}[1]`}>
                                    {({field}) => (
                                        <Input
                                            {...field}
                                            type="number"
                                            className="border px-2 py-1 rounded"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                handleChangeValue(name, e.target.value, 1);
                                            }}
                                        />
                                    )}
                                </Field>
                            </Col>
                            <Col sm={1} className="align-content-center">
                                <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${name}[2]`}>Max:</Label>
                            </Col>
                            <Col sm={2} className="align-content-center">
                                <Input
                                    name={`${hyperparamStrategyPrefix}.searchSpace.${name}[2]`}
                                    type="number"
                                    className="border px-2 py-1 rounded"
                                    onChange={(e) => handleChangeValue(name, e.target.value, 2)}
                                />
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
            } else if (type === "str") {
                const choices = possibleParameters[name].choices || [];
                return (
                    <div key={`${name}-str`} className="p-4 rounded">
                        <Label htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${name}`}>{name}</Label>
                        <Input
                            name={`${hyperparamStrategyPrefix}.searchSpace.${name}`}
                            type="select" multiple
                            className="border px-2 py-1 rounded"
                            onChange={(e) => handleChangeValue(name, e.target.value, "categorical")}
                        >
                            {
                                choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)
                            }
                        </Input>
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
                            <div className="p-4 rounded border" style={{height: '500px', overflowY: 'auto'}}>
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
                                                       htmlFor={`${hyperparamStrategyPrefix}.searchSpace.${item}`}>{item}</Label>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </div>
                        </Col>

                        <Col sm={6}>
                            <label>Selected Items</label>
                            <div className="p-4 rounded border" style={{height: '500px', overflowY: 'auto'}}>
                                {Object.entries(searchSpace).map(([key, value]) => (
                                    renderItem(key)
                                ))}
                            </div>
                        </Col>
                    </Row>
                </FormGroup>
            </React.Fragment>

        );
    };

    const renderSearchSpaceGridSearch = () => {
        return null;
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
    }, [fetchHyperparamStrategies, fetchValueAggregations, hyperparamStrategies.length, valueAggregations]);


    React.useEffect(() => {
        if (currentStrategy && !fetchedRef.current[currentStrategy]) {
            fetchedRef.current[currentStrategy] = true;
            setHyperParamOptStrategyParameters(currentStrategy);
        }
    }, [currentStrategy, setHyperParamOptStrategyParameters]);

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
                                    {currentStrategy === "OptunaOptimization" ? renderSearchSpaceOptuna() : renderSearchSpaceGridSearch()}
                                </FormGroup>
                                <FieldErrorMessage name={`${hyperparamStrategyPrefix}.searchSpace`}/>
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
                                                <option key={metric.id} value={metric.id}>
                                                    {metric.name}
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
                                                <option key={agg.id} value={agg.id}>
                                                    {agg.name}
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

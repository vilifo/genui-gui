import React from 'react';
import {Button, Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import {FieldErrorMessage, EmbeddingsField, AlgorithmsField, useLocalStorageWithExpiry, QSARHyperparameterOptimizationStrategyFields} from '../../../genui';

const dataSplitsCacheKey = 'qsarDataSplitsCache';
const dataSplitsParametersCacheKey = 'qsarDataSplitParametersCache';
const scaffoldsCacheKey = 'qsarScaffoldsCache';

export function PredictionsFields(props) {
    return (
        <React.Fragment>
            <FormGroup>
                <Label htmlFor="predictionsType">Activity Type for Predictions</Label>
                <p>
                    This will be the activity type for the output values of this QSAR model.
                    It is recommended to leave this at the default value. If you are uploading a model,
                    this value should be set to the activity type value of the uploaded model.
                </p>
                <Field name="predictionsType" as={Input} type="text"/>
            </FormGroup>
            <FieldErrorMessage name="predictionsType"/>

            <FormGroup>
                <Label htmlFor="predictionsUnits">Activity Units for Predictions</Label>
                <p>
                    Use this to specify the dimension of the model output activity type.
                    Leave it blank to determine this automatically or if the activity type has no dimension.
                </p>
                <Field name="predictionsUnits" as={Input} type="text"/>
            </FormGroup>
            <FieldErrorMessage name="predictionsUnits"/>
        </React.Fragment>
    )
}

export function QSARTrainingFields(props) {
    const trainingStrategyPrefix = props.trainingStrategyPrefix;
    const formikProps = props.formikProps;
    const parameters = props.parameters;

    return (
        <React.Fragment>
            <FormGroup>
                <Label htmlFor={`${trainingStrategyPrefix}.activitySet`}>Activity Set</Label>
                <Field name={`${trainingStrategyPrefix}.activitySet`} as={Input} type="select">
                    {
                        props.activitySets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)
                    }
                </Field>
            </FormGroup>
            <FieldErrorMessage name={`${trainingStrategyPrefix}.activitySet`}/>

            <FormGroup>
                <Label htmlFor={`${trainingStrategyPrefix}.activityType`}>Activity Type</Label>
                <Field name={`${trainingStrategyPrefix}.activityType`} as={Input} type="select">
                    {
                        props.activityTypes.map(type => <option key={type.id} value={type.id}>{type.value}</option>)
                    }
                </Field>
            </FormGroup>
            <FieldErrorMessage name={`${trainingStrategyPrefix}.activityType`}/>

            {
                props.modes.find(mode => mode.name === "classification") ? (
                    <React.Fragment>
                        <FormGroup>
                            <Label htmlFor={`${trainingStrategyPrefix}.activityThreshold`}>Activity Threshold</Label>
                            <p>
                                This is only relevant in classification mode.
                                Molecules with their primary activity measure
                                higher than or equal to this value will be considered active.
                            </p>
                            <Field name={`${trainingStrategyPrefix}.activityThreshold`} as={Input} type="number"
                                   step={0.01}/>
                        </FormGroup>
                        <FieldErrorMessage name={`${trainingStrategyPrefix}.activityThreshold`}/>
                    </React.Fragment>
                ) : null
            }
            <FormGroup>
                <Label htmlFor={`${trainingStrategyPrefix}.embeddings`}>Descriptor Sets</Label>
                <p>
                    Choose one or more descriptor sets to use in the calculations.
                </p>
                <EmbeddingsField
                    {...props}
                    description="Choose one or more descriptor sets to use in the calculations."
                    trainingStrategyPrefix={trainingStrategyPrefix}
                    formikProps={formikProps}
                />
            </FormGroup>
            {parameters.length > 0 ? <h4>{props.chosenAlgorithm.name} Parameters</h4> : null}
            <FormGroup>
                <p>
                    Choose one or more algorithms to use in model.
                </p>
                <AlgorithmsField
                    {...props}
                    description="Choose one or more descriptor sets to use in the calculations."
                    trainingStrategyPrefix={trainingStrategyPrefix}
                    formikProps={formikProps}
                />
            </FormGroup>
            <FormGroup>
                <QSARHyperparameterOptimizationStrategyFields
                    {...props}
                    hyperparamStrategyPrefix={`hyperParamOptStrategy`}
                    formikProps={formikProps}
                    metrics={props.metrics}
                />
            </FormGroup>
        </React.Fragment>
    )
}

export function QSARValidationStrategies(props) {
    const validationStrategiesPrefix = props.validationStrategiesPrefix;
    const currentIndex = validationStrategiesPrefix?.match(/\[(\d+)]/)?.at(1) ? parseInt(validationStrategiesPrefix.match(/\[(\d+)]/)[1]) : null;
    const [loading, setLoading] = React.useState(false);
    const fetchedRef = React.useRef({});
    const [loadingDataSplits, setLoadingDataSplits] = React.useState(false);
    const [allDataSplits, setAllDataSplits] = useLocalStorageWithExpiry(dataSplitsCacheKey, []);
    const [dataSplitsParameters, setDataSplitsParameters] = useLocalStorageWithExpiry(dataSplitsParametersCacheKey, {});
    const [loadingScaffolds, setLoadingScaffolds] = React.useState(false);
    const [scaffolds, setScaffolds] = useLocalStorageWithExpiry(scaffoldsCacheKey, []);
    const {values, setFieldValue} = props.formikProps || {};
    const metrics = props.metrics;

    const addValidationStrategy = () => {
        if (values && setFieldValue) {
            const currentValidationStrategies = values.validationStrategies || [];
            const defaultMetric = metrics && metrics.length > 0 ? [metrics[0].id] : [];
            const defaultDataSplit = allDataSplits && allDataSplits.length > 0 ? allDataSplits[0] : null;
            setFieldValue('validationStrategies', [
                ...currentValidationStrategies,
                {cvFolds: 3, metrics: defaultMetric, dataSplit: {name: defaultDataSplit}}
            ]);
        }
    };

    const removeValidationStrategy = (index) => {
        if (values && setFieldValue) {
            const currentValidationStrategies = [...(values.validationStrategies || [])];
            currentValidationStrategies.splice(index, 1);
            setFieldValue('validationStrategies', currentValidationStrategies);
        }
    };

    const fetchScaffolds = React.useCallback(async () => {
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (scaffolds.length > 0) {
            return;
        }
        setLoadingScaffolds(true);
        try {
            const url = new URL(`data-splits/scaffolds/list/`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch data splits: ${response.statusText}`);
            }

            const data = await response.json();
            setScaffolds(data);
        } catch (error) {
            console.error("Error fetching scaffolds:", error);
        } finally {
            setLoadingScaffolds(false);
        }
    }, [props.apiUrls, scaffolds, setScaffolds]);

    const fetchDataSplits = React.useCallback(async () => {
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (allDataSplits.length > 0) {
            return;
        }

        setLoadingDataSplits(true);
        try {
            const url = new URL(`data-splits/list/`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch data splits: ${response.statusText}`);
            }

            const data = await response.json();
            setAllDataSplits(data);
        } catch (error) {
            console.error("Error fetching algorithms:", error);
        } finally {
            setLoadingDataSplits(false);
        }
    }, [props.apiUrls, allDataSplits, setAllDataSplits]);

    const fetchDataSplitParameters = React.useCallback(async (dataSplitName) => {
        if (!dataSplitName) return;
        if (!props.apiUrls || !props.apiUrls.qsarRoot || fetchedRef.current[dataSplitName]) {
            return;
        }

        const processParameters = (data) => {
            const params = Object.fromEntries(
                Object.entries(data).map(
                    ([key, value]) => [key, value.value]));
            params["name"] = dataSplitName;
            return params;
        }

        const setDataSplitParameters = (data) => {
            fetchedRef.current[dataSplitName] = true;
            if (values && setFieldValue) {
                const currentValidationStrategies = values.validationStrategies || [];
                const index = currentIndex;
                if (index !== null && index >= 0 && index < currentValidationStrategies.length) {
                    const updatedDataSplit = processParameters(data);
                    const updatedValidationStrategies = [...currentValidationStrategies];
                    updatedValidationStrategies[index] = {
                        ...updatedValidationStrategies[index],
                        dataSplit: updatedDataSplit
                    };
                    setFieldValue('validationStrategies', updatedValidationStrategies);
                }
            }
        }

        if (dataSplitsParameters[dataSplitName]) {
            setDataSplitParameters(dataSplitsParameters[dataSplitName]);
            return;
        }

        setLoading(true);
        try {
            const url = new URL(`data-splits/${dataSplitName}/params`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data split params: ${response.statusText}`);
            }

            const data = await response.json();
            const updatedDataSplitsParameters = {...dataSplitsParameters};
            updatedDataSplitsParameters[dataSplitName] = data;
            setDataSplitsParameters(updatedDataSplitsParameters);
            setDataSplitParameters(updatedDataSplitsParameters[dataSplitName]);
        } catch (error) {
            console.error("Error fetching data split params:", error);
        } finally {
            setLoading(false);
        }
    }, [props.apiUrls, values, setFieldValue, currentIndex, dataSplitsParameters, setDataSplitsParameters]);

    const handleDataSplitChange = (event) => {
        const selectedDataSplitId = event.target.value;
        if (selectedDataSplitId) {
            fetchedRef.current[selectedDataSplitId] = false;
        }

        fetchDataSplitParameters(selectedDataSplitId);
    };

    const renderParamInput = (paramName, paramValue) => {
        const currentDataSplitName = values?.validationStrategies?.[currentIndex]?.dataSplit.name;
        const currentDataSplit = dataSplitsParameters?.[currentDataSplitName];
        const type = currentDataSplit?.[paramName] ? currentDataSplit[paramName].type : null;
        // console.log(paramName, paramValue, type);
        if (paramName === "name" || paramValue === null || paramValue === undefined) {
            return null;
        } else if (paramName === "scaffold") {
            return (
                <FormGroup row>
                    <Label htmlFor={`${validationStrategiesPrefix}.scaffold`} sm={4}>Scaffold</Label>
                    <Col sm={8}>
                        <Field
                            name={`${validationStrategiesPrefix}.scaffold`}
                            as={Input} type="select"
                            disabled={loadingScaffolds}
                        >
                            {loadingScaffolds ? (
                                <option value="" disabled>Loading scaffolds...</option>
                            ) : (
                                scaffolds.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))
                            )}
                        </Field>
                        <FieldErrorMessage name={`${validationStrategiesPrefix}.scaffold`}/>
                    </Col>
                </FormGroup>
            );
        } else if (type === "int" || type === "float") {
            return (
                <FormGroup row>
                    <Label htmlFor={`${validationStrategiesPrefix}.${paramName}`} sm={4}>{paramName}</Label>
                    <Col sm={8}>
                        <Field name={`${validationStrategiesPrefix}.dataSplit.${paramName}`}
                               as={Input}
                               type="number"
                               value={paramValue}
                        />
                        <FieldErrorMessage name={`${validationStrategiesPrefix}.dataSplit.${paramName}`}/>
                    </Col>
                </FormGroup>
            );
        }
    };

    const currentDataSplitId = values && values.validationStrategies && currentIndex !== null
        ? values.validationStrategies[currentIndex].dataSplit.name
        : null;

    React.useEffect(() => {
        fetchDataSplits();
    }, [fetchDataSplits]);

    React.useEffect(() => {
        fetchScaffolds()
    }, [fetchScaffolds])

    React.useEffect(() => {
        if (currentDataSplitId) {
            fetchDataSplitParameters(currentDataSplitId);
        }
    }, [currentDataSplitId, fetchDataSplitParameters]);

    if (validationStrategiesPrefix && validationStrategiesPrefix.includes('[')) {
        return (
            <React.Fragment>
                <FormGroup>
                    <Label htmlFor={`${validationStrategiesPrefix}.dataSplit`} sm={4}>Data Split</Label>
                    <Col sm={8}>
                        <Field
                            name={`${validationStrategiesPrefix}.dataSplit.name`}
                            as={Input}
                            type="select"
                            value={values?.validationStrategies?.[currentIndex]?.dataSplit?.name || ""}
                            onChange={handleDataSplitChange}
                            disabled={loadingDataSplits}
                        >
                            {loadingDataSplits ? (
                                <option value="" disabled>Loading data splits...</option>
                            ) : (
                                allDataSplits.map((desc) => (
                                    <option key={desc} value={desc}>{desc}</option>
                                ))
                            )}
                        </Field>
                    </Col>
                </FormGroup>
                <FieldErrorMessage name={`${validationStrategiesPrefix}.dataSplit.name`}/>
                {loading ? (
                    <p>Loading parameters...</p>
                ) : values && values.validationStrategies && currentIndex !== null ? (
                    <div className="mt-3">
                        <h5>Data split parameters</h5>
                        <div className='p-3 border rounded' style={{maxHeight: '250px', overflowY: 'auto'}}>
                            {values.validationStrategies[currentIndex].dataSplit &&
                                Object.entries(values.validationStrategies[currentIndex].dataSplit).map(([paramName, paramValue]) => (
                                    <div key={paramName} className="mb-3">
                                        {renderParamInput(paramName, paramValue)}
                                    </div>
                                ))}
                        </div>
                    </div>
                ) : (
                    values && values.validationStrategies && currentIndex !== null &&
                    <p>No arguments available for this data split.</p>
                )}
                <FormGroup row>
                    <Label htmlFor={`${validationStrategiesPrefix}.cvFolds`} sm={4}>Cross-Validation Folds</Label>
                    <Col sm={8}>
                        <Field name={`${validationStrategiesPrefix}.cvFolds`}
                               as={Input}
                               value={values.validationStrategies[currentIndex]?.cvFolds || 3}
                               type="number"/>
                    </Col>
                </FormGroup>
                <FieldErrorMessage name={`${validationStrategiesPrefix}.cvFolds`}/>

                {metrics && (
                    <React.Fragment>
                        <FormGroup row>
                            <Label htmlFor={`${validationStrategiesPrefix}.metrics`} sm={4}>Validation Metrics</Label>
                            <Col sm={8}>
                                <Field name={`${validationStrategiesPrefix}.metrics`} as={Input} type="select" multiple>
                                    {
                                        metrics.map(metric => (
                                            <option key={metric.id} value={metric.id}>
                                                {metric.name}
                                            </option>
                                        ))
                                    }
                                </Field>
                            </Col>
                        </FormGroup>
                        <FieldErrorMessage name={`${validationStrategiesPrefix}.metrics`}/>
                    </React.Fragment>
                )}
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <div className="row">
                {values && values.validationStrategies && values.validationStrategies.map((strategy, index) => (
                    <div key={index} className="col-md-4 mb-4">
                        <div className="p-3 border rounded"
                             style={{backgroundColor: `hsl(${index * 137.5}, 90%, 90%)`}}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Validation Strategy {index + 1}</h5>
                                {values.validationStrategies.length > 1 && (
                                    <Button color="danger" size="sm" onClick={() => removeValidationStrategy(index)}>
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <QSARValidationStrategies
                                {...props}
                                validationStrategiesPrefix={`validationStrategies[${index}]`}
                                formikProps={props.formikProps}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <Button color="primary" onClick={addValidationStrategy} className="mt-2">
                Add Validation Strategy
            </Button>
        </React.Fragment>
    );
}

export function QSARExtraFields(props) {
    const molsets = props.molsets;

    return (
        <React.Fragment>
            <FormGroup>
                <Label htmlFor="molset">Compound Set</Label>
                <p>Compounds from this set and their bioactivity data will be used for training.</p>
                <Field name="molset" as={Input} type="select">
                    {
                        molsets.map((molset) => <option key={molset.id} value={molset.id}>{molset.name}</option>)
                    }
                </Field>
            </FormGroup>
            <FieldErrorMessage name="molset"/>

            <PredictionsFields {...props}/>
        </React.Fragment>
    )
}

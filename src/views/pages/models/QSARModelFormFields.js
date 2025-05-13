import React from 'react';
import {Button, Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import {FieldErrorMessage, EmbeddingsField} from '../../../genui';

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

            <EmbeddingsField
                {...props}
                description="Choose one or more descriptor sets to use in the calculations."
                trainingStrategyPrefix={trainingStrategyPrefix}
                formikProps={formikProps}
            />
        </React.Fragment>
    )
}

export function QSARValidationFields(props) {
    const validationStrategyPrefix = props.validationStrategyPrefix;
    const {values, setFieldValue} = props.formikProps || {};
    const metrics = props.metrics;
    const dataSplits = props.dataSplits;

    const addValidationStrategy = () => {
        if (values && setFieldValue) {
            const currentValidationStrategies = values.validationStrategy || [];
            const defaultMetrics = metrics && metrics.length > 0 ? [metrics[0].id] : [];
            const defaultDataSplits = dataSplits && dataSplits.length > 0 ? [dataSplits] : [];
            setFieldValue('validationStrategy', [
                ...currentValidationStrategies,
                {validSetSize: 0.2, metrics: defaultMetrics, dataSplits: defaultDataSplits}
            ]);
        }
    };

    const removeValidationStrategy = (index) => {
        if (values && setFieldValue) {
            const currentValidationStrategies = [...(values.validationStrategy || [])];
            currentValidationStrategies.splice(index, 1);
            setFieldValue('validationStrategy', currentValidationStrategies);
        }
    };

    if (validationStrategyPrefix && validationStrategyPrefix.includes('[')) {
        return (
            <React.Fragment>
                <FormGroup row>
                    <Label htmlFor={`${validationStrategyPrefix}.dataSplit`} sm={4}>Data Split</Label>
                    <Col sm={8}>
                        <Field name={`${validationStrategyPrefix}.dataSplit`} as={Input} type="select" multiple>
                            {
                                dataSplits.map(dataSplit => (
                                    <option key={dataSplit} value={dataSplit}>
                                        {dataSplit}
                                    </option>
                                ))
                            }
                        </Field>
                    </Col>
                </FormGroup>
                <FieldErrorMessage name={`${validationStrategyPrefix}.validSetSize`}/>

                <FormGroup row>
                    <Label htmlFor={`${validationStrategyPrefix}.cvFolds`} sm={4}>Cross-Validation Folds</Label>
                    <Col sm={8}>
                        <Field name={`${validationStrategyPrefix}.cvFolds`} as={Input} type="number"/>
                    </Col>
                </FormGroup>
                <FieldErrorMessage name={`${validationStrategyPrefix}.cvFolds`}/>

                {metrics && (
                    <React.Fragment>
                        <FormGroup row>
                            <Label htmlFor={`${validationStrategyPrefix}.metrics`} sm={4}>Validation Metrics</Label>
                            <Col sm={8}>
                                <Field name={`${validationStrategyPrefix}.metrics`} as={Input} type="select" multiple>
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
                        <FieldErrorMessage name={`${validationStrategyPrefix}.metrics`}/>
                    </React.Fragment>
                )}
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            {values && values.validationStrategy && values.validationStrategy.map((strategy, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Validation Strategy {index + 1}</h5>
                        {values.validationStrategy.length > 1 && (
                            <Button color="danger" size="sm" onClick={() => removeValidationStrategy(index)}>
                                Remove
                            </Button>
                        )}
                    </div>
                    <QSARValidationFields
                        {...props}
                        validationStrategyPrefix={`validationStrategy[${index}]`}
                        formikProps={props.formikProps}
                    />
                </div>
            ))}
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

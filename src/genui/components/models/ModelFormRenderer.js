import React from 'react';
import * as Yup from 'yup';
import {SimpleDropDownToggle} from '../../index';
import {CardBody} from 'reactstrap';

const ModelFormRenderer = (props) => {
    const CTYPE_TO_VALIDATOR = {
        string: Yup.string().required(),
        integer: Yup.number().required(),
        float: Yup.number().required(),
        bool: Yup.bool().required(),
        object: Yup.object().required(),
        array: Yup.array().of(Yup.mixed().nullable()).required(),
    };

    const chosenAlgorithm = props.chosenAlgorithm;
    const parameters = !props.omitAlgParams ? props.chosenAlgorithm.parameters : null;
    const enableFileUploads = props.enableFileUploads;
    const disabledModelFormFields = props.disabledModelFormFields ? props.disabledModelFormFields : [];

    const initMetrics = (metrics) => {
        const ret = [];
        metrics.forEach(metric => {
            if (metric.validAlgorithms.length === 0 || metric.validAlgorithms.find(alg => chosenAlgorithm.id === alg)) {
                ret.push(metric);
            }
        });
        return ret;
    };

    const [metrics, setMetrics] = React.useState(props.omitValidation && props.metrics ? initMetrics(props.metrics) : null)
    const [modes, setModes] = React.useState(chosenAlgorithm.validModes);
    const [initialValues, setInitialValues] = React.useState(null);
    const [schema, setSchema] = React.useState(null);
    const [formDataReady, setFormDataReady] = React.useState(false);

    React.useEffect(() => {
        if (modes.length === 1) {
            initFormData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])



    const initFormData = () => {
        setInitialValues(generateInit());
        setSchema(generateSchema());
        setFormDataReady(true);
    };

    const handleModeSelect = (mode) => {
        if (metrics) {
            const metrics = [];
            metrics.forEach(metric => {
                if (metric.validModes.find(item => mode.id === item.id)) {
                    metrics.push(metric);
                }
            });
            setMetrics(metrics);
            setModes([mode]);
        } else {
            setModes([mode]);
        }
    };

    const generateInit = () => {
        const trainingStrategyDefaultInit = {
            algorithm: chosenAlgorithm.id,
            mode: modes.length > 0 ? modes[0].id : [],
        };
        const trainingStrategyInit = Object.assign(trainingStrategyDefaultInit, props.trainingStrategyInit ? props.trainingStrategyInit : {});
        // Handle validation strategy initialization
        let validationStrategiesInit;

        // Check if validationStrategiesInit is provided as an array
        if (props.validationStrategiesInit && Array.isArray(props.validationStrategiesInit)) {
            // If it's an array, map over each item and merge with default metrics if needed
            validationStrategiesInit = props.validationStrategiesInit.map(strategy => {
                const defaultInit = metrics && !disabledModelFormFields.includes('validationStrategy.metrics') ? {
                    metrics: metrics.length > 0 ? [metrics[0].id] : [],
                    cvFolds: 3,
                } : {};
                return Object.assign({}, defaultInit, strategy);
            });
        } else {
            // If it's not an array, create a single strategy object
            const validationStrategyDefaultInit = metrics && !disabledModelFormFields.includes('validationStrategy.metrics') ? {
                metrics: metrics.length > 0 ? [metrics[0].id] : []
            } : {};
            validationStrategiesInit = Object.assign({}, validationStrategyDefaultInit, props.validationStrategyInit ? props.validationStrategyInit : {});
            // Convert to array if it's not empty
            if (Object.keys(validationStrategiesInit).length !== 0) {
                validationStrategiesInit = [validationStrategiesInit];
            }
        }

        let initialValues = {
            name: `New ${chosenAlgorithm.name} Model`,
            description: '',
            project: props.project.id,
            trainingStrategy: trainingStrategyInit
        };
        if (enableFileUploads) {
            initialValues.modelFile = undefined;
        }

        // validation
        if (validationStrategiesInit && validationStrategiesInit.length > 0) {
            initialValues.validationStrategies = validationStrategiesInit;
        }

        // extra parameters
        initialValues = Object.assign(initialValues, props.extraParamsInit ? props.extraParamsInit : {});

        // default parameters
        if (parameters) {
            const parameterDefaults = {};
            for (const param of parameters) {
                parameterDefaults[param.name] = param.defaultValue;
            }
            initialValues.trainingStrategy.parameters = parameterDefaults;
        }

        if (props.onValuesInit) {
            initialValues = props.onValuesInit(initialValues, {
                metrics: metrics,
                modes: modes,
                initialValues:initialValues,
                schema: schema,
                formDataReady: formDataReady,
            });
        }

        // console.log(initialValues);

        return initialValues;
    };

    const generateSchema = () => {
        const trainingStrategyDefault = {
            algorithm: Yup.number().integer().positive("Algorithm ID needs to be a positive number").required('Algorithm ID must be supplied'),
            mode: Yup.number().integer()
                .max(256, 'Mode must be 256 characters or less.').required('You must specify a mode.'),
        };

        // parameters
        if (parameters) {
            const parameterValidators = {};
            for (const param of parameters) {
                console.log(param);
                parameterValidators[param.name] = CTYPE_TO_VALIDATOR[param.contentType]
            }

            trainingStrategyDefault.parameters = Yup.object().shape({
                ...parameterValidators,
                // alg: Yup.string().required,
                // parameters: Yup.object().nullable()
            });
        }

        const trainingStrategy = Object.assign(trainingStrategyDefault, props.trainingStrategySchema);
        // the main schema object
        let validationObj = {
            name: Yup.string()
                .max(256, 'Name must be less than 256 characters long.')
                .required('Name is required.'),
            description: Yup.string()
                .max(10000, 'Description must be 10,000 characters or less.'),
            project: Yup.number().integer().positive("Project ID needs to be a positive number").required('Project ID must be supplied'),
            trainingStrategy: Yup.object().shape(
                trainingStrategy
            )
        };
        if (enableFileUploads) {
            validationObj.modelFile = Yup.mixed().required("Model file is required.");
        }

        // validation added only if there is something to add
        // Check if validationStrategiesSchema is already an array validator
        if (props.validationStrategiesSchema && props.validationStrategiesSchema._subType === 'array') {
            // If it's already an array validator, use it directly
            validationObj.validationStrategies = props.validationStrategiesSchema;
        } else {
            // Otherwise, create a validation schema for a single strategy and wrap it in an array
            const validationStrategyDefault = metrics && !disabledModelFormFields.includes('validationStrategies.metrics') ? {
                metrics: Yup.array().of(Yup.number().positive('Metric ID must be a positive integer.')).required('You need to supply at least one metric for validation.'),
            } : {};

            const validationStrategies = Object.assign({}, validationStrategyDefault, props.validationStrategiesSchema || {});

            if (Object.keys(validationStrategies).length !== 0) {
                // Create an array validator for validation strategies
                validationObj.validationStrategy = Yup.array().of(
                    Yup.object().shape(validationStrategies)
                ).min(1, 'At least one validation strategy is required');
            }
        }

        // extra parameters
        validationObj = Object.assign(validationObj, props.extraParamsSchema);

        if (props.onSchemaInit) {
            validationObj = props.onSchemaInit(validationObj, {
                metrics: metrics,
                modes: modes,
                initialValues:initialValues,
                schema: schema,
                formDataReady: formDataReady,
            });
        }

        // console.log(validationObj);
        return Yup.object().shape(validationObj);
    };

    if (!formDataReady) {
        return (
            <CardBody>
                <SimpleDropDownToggle
                    items={modes}
                    onSelect={handleModeSelect}
                    message={() => (
                        <p>
                            {chosenAlgorithm.name} model can be built
                            in {modes.length} modes. {!enableFileUploads ? "Select the desired one below." : "Select the correct mode for the uploaded model below."}
                        </p>
                    )}
                    title="Choose Mode"
                    header="Available Modes"
                />
            </CardBody>
        )
    } else {
        const FormComponent = props.component;
        return (
            <FormComponent
                {...props}
                initialValues={initialValues}
                validationSchema={schema}
                modes={modes}
                metrics={metrics}
                parameters={parameters}
            />
        );
    }
}

export default ModelFormRenderer;

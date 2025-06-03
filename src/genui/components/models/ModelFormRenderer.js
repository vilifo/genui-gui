import React from 'react';
import * as Yup from 'yup';
import {SimpleDropDownToggle} from '../../index';
import {CardBody} from 'reactstrap';
// import {ArraySchema, ObjectSchema} from "yup";

const ModelFormRenderer = (props) => {
    const CTYPE_TO_VALIDATOR = React.useMemo(() => ({
        string: Yup.string().required(),
        integer: Yup.number().required(),
        float: Yup.number().required(),
        bool: Yup.bool().required(),
        object: Yup.object().required(),
        array: Yup.array().of(Yup.mixed().nullable()).required(),
    }), []);


    // const printYupSchema = (schema, indent = 0, path = '') => {
    //     if (!schema) return;
    //     const spacing = '  '.repeat(indent);
    //     const type = schema.constructor.name.replace('Schema', '').toLowerCase();
    //
    //     if (path) {
    //         console.log(`${spacing}${path}: ${type}`);
    //     }
    //
    //     if (schema instanceof ObjectSchema) {
    //         const fields = schema.fields;
    //         for (const key in fields) {
    //             if (fields.hasOwnProperty(key)) {
    //                 printYupSchema(fields[key], indent + 1, key);
    //             }
    //         }
    //     } else if (schema instanceof ArraySchema) {
    //         const innerType = schema.innerType;
    //         if (innerType) {
    //             printYupSchema(innerType, indent + 1, '[ ]');
    //         }
    //     }
    // };

    const chosenAlgorithm = props.chosenAlgorithm;
    const parameters = !props.omitAlgParams ? props.chosenAlgorithm.parameters : null;
    const enableFileUploads = props.enableFileUploads;
    const disabledModelFormFields = React.useMemo(() => (props.disabledModelFormFields ? props.disabledModelFormFields : []), [props]);

    const initMetrics = (metrics_array) => {
        const ret = [];
        metrics_array.forEach(metric => {
            if (metric.validAlgorithms.length === 0 || metric.validAlgorithms.find(alg => chosenAlgorithm.id === alg)) {
                ret.push(metric);
            }
        });
        return ret;
    };

    const [metrics, setMetrics] = React.useState(!props.omitValidation && props.metrics ? initMetrics(props.metrics) : null)
    const [modes, setModes] = React.useState(chosenAlgorithm.validModes);
    const [initialValues, setInitialValues] = React.useState(null);
    const [schema, setSchema] = React.useState(null);
    const [formDataReady, setFormDataReady] = React.useState(false);

    const generateInit = React.useCallback(() => {
        const trainingStrategyDefaultInit = {
            algorithm: chosenAlgorithm.id,
            mode: modes.length > 0 ? modes[0].id : [],
        };
        const trainingStrategyInit = Object.assign(trainingStrategyDefaultInit, props.trainingStrategyInit ? props.trainingStrategyInit : {});

        const validationStrategiesDefaultInit = metrics && !disabledModelFormFields.includes('validationStrategy.metrics') ?
            [{metrics: metrics.length > 0 ? [metrics[0].id] : [], cvFolds: 3}] : [];

        const validationStrategiesInit = props.validationStrategiesInit ? props.validationStrategiesInit : validationStrategiesDefaultInit;

        let initialValues = {
            name: `New ${chosenAlgorithm.name} Model`,
            description: '',
            project: props.project.id,
            trainingStrategy: trainingStrategyInit
        };
        if (enableFileUploads) {
            initialValues.modelFile = undefined;
        }

        if (validationStrategiesInit && validationStrategiesInit.length > 0) {
            initialValues.validationStrategies = validationStrategiesInit;
        }

        initialValues = Object.assign(initialValues, props.extraParamsInit ? props.extraParamsInit : {});

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
                initialValues: initialValues,
                schema: schema,
                formDataReady: formDataReady,
            });
        }

        return initialValues;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chosenAlgorithm, disabledModelFormFields, modes, metrics, parameters, props, enableFileUploads]);

    const generateSchema = React.useCallback(() => {
        const trainingStrategyDefault = {
            algorithm: Yup.number().integer().positive("Algorithm ID needs to be a positive number").required('Algorithm ID must be supplied'),
            mode: Yup.number().integer()
                .max(256, 'Mode must be 256 characters or less.').required('You must specify a mode.'),
        };

        if (parameters) {
            const parameterValidators = {};
            for (const param of parameters) {
                if (param.defaultValue === '{}') {
                    param.contentType = 'object';
                }
                parameterValidators[param.name] = CTYPE_TO_VALIDATOR[param.contentType]
            }

            trainingStrategyDefault.parameters = Yup.object().shape({
                ...parameterValidators
            });
        }

        const trainingStrategy = Object.assign(trainingStrategyDefault, props.trainingStrategySchema);
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

        if (props.validationStrategiesSchema) {
            validationObj.validationStrategies = props.validationStrategiesSchema;
        }

        validationObj = Object.assign(validationObj, props.extraParamsSchema);

        if (props.onSchemaInit) {
            validationObj = props.onSchemaInit(validationObj, {
                metrics: metrics,
                modes: modes,
                initialValues: initialValues,
                schema: schema,
                formDataReady: formDataReady,
            });
        }
        // printYupSchema(Yup.object().shape(validationObj));
        return Yup.object().shape(validationObj);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [CTYPE_TO_VALIDATOR, disabledModelFormFields, enableFileUploads, metrics, modes, parameters, props]);

    const initFormData = React.useCallback(() => {
        setInitialValues(generateInit());
        setSchema(generateSchema());
        setFormDataReady(true);
    }, [generateSchema, generateInit]);

    React.useEffect(() => {
        if (modes.length === 1) {
            initFormData();
        }
    }, [modes.length, initFormData])

    const handleModeSelect = (mode) => {
        if (metrics) {
            const metrics_array = [];
            metrics.forEach(metric => {
                if (metric.validModes.find(item => mode.id === item.id)) {
                    metrics_array.push(metric);
                }
            });
            setMetrics(metrics_array);
        }
        setModes([mode]);
        initFormData();
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

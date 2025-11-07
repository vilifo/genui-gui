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

    const chosenAlgorithm = props.chosenAlgorithm;
    const parameters = !props.omitAlgParams ? props.chosenAlgorithm.parameters : null;
    const enableFileUploads = props.enableFileUploads;
    const disabledModelFormFields = React.useMemo(() => (props.disabledModelFormFields ? props.disabledModelFormFields : []), [props]);
    const [modes, setModes] = React.useState(chosenAlgorithm.validModes);
    const [metrics, setMetrics] = React.useState(props.metrics[modes[0].name]);
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
            [{metrics: metrics.length > 0 ? [metrics[0]] : [], cvFolds: 3}] : [];

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
            mode: Yup.number().transform(v => (v === '' || v == null ? undefined : Number(v))).integer().required('You must specify a mode.'),
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
    }, [modes, initFormData])

    const handleModeSelect = (mode) => {
        setMetrics(props.metrics[mode.name]);
        setModes([mode]);
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

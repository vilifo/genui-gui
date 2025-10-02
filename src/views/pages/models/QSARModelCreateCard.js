import * as Yup from 'yup';
import {
    MolsetActivitiesSummary,
    ModelCardNew,
    SimpleDropDownToggle,
    convertEmbeddingsArgumentsObjectsToArrays
} from '../../../genui';
import React from 'react';
import {QSARExtraFields, QSARTrainingFields, QSARValidationStrategies} from './QSARModelFormFields';
import {Button, CardBody, CardHeader, Col, Row, CardFooter} from 'reactstrap';

function EndpointSelector(props) {
    return <MolsetActivitiesSummary {...props} selectable={true}
                                    message="Choose the desired activity endpoint by clicking the corresponding row in the table below. The chosen activity type from the given activity set will be used as the output variable for the resulting model."/>
}

function floatRange(start, end, step = 1.0) {
    const parsedStart = Number.parseFloat(start);
    const parsedEnd = Number.parseFloat(end);
    const parsedStep = Number.parseFloat(step);
    const output = [];
    for (let i = parsedStart; i < parsedEnd; i += parsedStep) {
        output.push(Number(i.toFixed(12)));
    }
    return output;
}

export default function QSARModelCreateCard(props) {
    let molsets = [];
    const fetchingList = [];

    const fetchResource = async (resourceURL) => {
        if (!resourceURL || fetchingList.includes(resourceURL)) {
            return null;
        }
        fetchingList.push(resourceURL);
        try {
            const url = new URL(resourceURL, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });
            if (!response.ok) {
                console.error(`Error fetching resource: ${response.status} ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching resource:", error);
            return null;
        }
    }

    Object.keys(props.compoundSets).forEach(
        (key) => molsets = molsets.concat(props.compoundSets[key])
    );

    const [molset, setMolset] = React.useState(null);
    const [endpointData, setEndpointData] = React.useState(null);
    const [dataReady, setDataReady] = React.useState(false);

    const trainingStrategyInit = {
        activityThreshold: 6.5,
        embeddings: [{
            name: "MorganFP",
            arguments: {}
        }],
        parameters: {
            alg: "RandomForestClassifier",
            parameters: {}
        }
    };
    const validationStrategiesInit = [{
        cvFolds: 3,
        metrics: [props.metrics[0].id],
        dataSplit: {name: "RandomSplit"},
    }];
    const extraParamInit = {
        molset: molset ? molset.id : undefined,
        predictionsType: endpointData ? endpointData.type.value : undefined,
        predictionsUnits: ""
    };

    const trainingStrategySchema = {
        activityThreshold: Yup.number().min(0, 'Activity threshold must be zero or positive.').required('Activity threshold is a required parameter.'),
        embeddings: Yup.array().of(Yup.object().shape({
            name: Yup.string(),
            arguments: Yup.object()
        })).required('You need to supply one or more descriptor sets for training.'),
        parameters: Yup.object().shape({
            alg: Yup.string().required('You need to select an algorithm.'),
            parameters: Yup.object()
        }).required()
    };
    const validationStrategiesSchema = Yup.array().of(
        Yup.object().shape({
            cvFolds: Yup.number().integer().min(0, 'Number of CV folds must be at least 0.'),
            dataSplit: Yup.object(),
            metrics: Yup.array().of(Yup.number().positive('Metric ID must be a positive integer.'))
        })
    );

    const extraParamsSchema = {
        molset: Yup.number().integer().positive('Molecule set ID must be a positive integer.').required('You need to supply a training set of compounds.'),
        predictionsType: Yup.string().required('Predictions activity type has to be set.').min(1, "Predictions type cannot be empty.").max(128, 'Predictions type name cannot be longer than 128 characters.'),
        predictionsUnits: Yup.string().max(128, 'Predictions units name cannot be longer than 128 characters.')
    };

    if (endpointData) {
        trainingStrategyInit.activityType = endpointData.type.id;
        trainingStrategyInit.activitySet = endpointData.activitySet.id;

        trainingStrategySchema.activityType = Yup.number().integer().positive('Activity type ID must be a positive integer.').required('You need to select an activity type for modelling.');
        trainingStrategySchema.activitySet = Yup.number().integer().positive('Activity set ID must be a positive integer.').required('You need to supply a set of activities to use for modelling.');
    }

    return !dataReady ? (
        <React.Fragment>
            <CardHeader>QSAR Training Set and Activity Endpoint</CardHeader>
            <CardBody className="scrollable">
                <SimpleDropDownToggle
                    items={molsets}
                    onSelect={setMolset}
                    message={() => <p>You have to choose a training set. You can choose any compound set in the current
                        project.</p>}
                    title="Choose Training Set"
                    header="Available Compound Sets"
                />

                {
                    molset ? (
                        <React.Fragment>
                            <hr/>
                            <Row>
                                <Col sm={12}>
                                    <EndpointSelector {...props} molset={molset} onSelect={setEndpointData}/>
                                </Col>
                            </Row>
                        </React.Fragment>
                    ) : null
                }
            </CardBody>

            {
                molset && endpointData ? (
                    <CardFooter>
                        <Row>
                            <Col sm={8}>
                                <p>Selected endpoint: {endpointData.name}</p>
                            </Col>
                            <Col sm={4}>
                                <Button color="primary" onClick={() => setDataReady(true)}>Next: Model
                                    Parameters</Button>
                            </Col>
                        </Row>
                    </CardFooter>
                ) : null
            }
        </React.Fragment>
    ) : (
        <ModelCardNew
            {...props}
            molsets={[molset]}
            activitySets={[endpointData.activitySet]}
            activityTypes={[endpointData.type]}
            endpointData={endpointData}
            trainingStrategyInit={trainingStrategyInit}
            validationStrategiesInit={validationStrategiesInit}
            extraParamsInit={extraParamInit}
            trainingStrategySchema={trainingStrategySchema}
            validationStrategiesSchema={validationStrategiesSchema}
            extraParamsSchema={extraParamsSchema}
            fetchResource={fetchResource}
            trainingStrategyFields={QSARTrainingFields}
            validationStrategiesFields={QSARValidationStrategies}
            extraFields={QSARExtraFields}
            onValuesInit={(values, state) => {
                if (state.modes) {
                    const mode = state.modes[0];
                    if (mode.name === "classification") {
                        values.predictionsType = "Active Probability"
                    }
                }
                return values;
            }}
            prePost={(data) => {
                if (data.predictionsUnits === "") {
                    data.predictionsUnits = null;
                }
                data = convertEmbeddingsArgumentsObjectsToArrays(data);
                data.trainingStrategy.parameters = {
                    alg: data.trainingStrategy.parameters.alg,
                    parameters: JSON.stringify(data.trainingStrategy.parameters.parameters)
                };
                if (data.validationStrategies && data.validationStrategies.length > 0) {
                    const updatedValidationStrategies = [];
                    data.validationStrategies.forEach((vs) => {
                        vs["resourcetype"] = "BasicValidationStrategy";
                        if (vs.dataSplit.name === "ScaffoldSplit") {
                            vs.dataSplit = {
                                ...vs.dataSplit,
                                scaffold: {name: vs.dataSplit.scaffold}
                            };
                        }
                        updatedValidationStrategies.push(vs);
                    });
                    delete data.validationStrategies;
                    data.trainingStrategy["validationStrategies"] = updatedValidationStrategies;
                }
                if (data.hyperParamOptStrategy) {
                    if (data.hyperParamOptStrategy.resourcetype !== "None") {
                        if (data.hyperParamOptStrategy.resourcetype === "GridSearchOptimization") {
                            data.hyperParamOptStrategy.searchSpace = Object.fromEntries(
                                Object.entries(data.hyperParamOptStrategy.searchSpace).map(([key, value]) => {
                                    if (Array.isArray(value)) {
                                        return [key, value];
                                    } else if (typeof value === "object") {
                                        return [key, floatRange(value.min, value.max, value.step)];
                                    } else if (typeof value === "string") {
                                        return [key, value.split(';').map(v => Number.parseFloat(v.trim())).filter(v => !isNaN(v))];
                                    }
                                    return [key, value];
                                }));
                        }
                        data.trainingStrategy["hyperParamOptStrategies"] = [data.hyperParamOptStrategy]
                    }
                    delete data.hyperParamOptStrategy;
                    if (data.searchSpace) {
                        delete data.searchSpace;
                    }
                }
                return data;
            }}
        />
    )
}

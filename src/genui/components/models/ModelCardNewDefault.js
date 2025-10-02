import React from 'react';
import {
    CardBody,
    Input,
    Label,
    CardFooter,
    Button,
} from 'reactstrap';
import {Field, Formik, Form} from "formik";
import useLocalStorageWithExpiry from "../LocalStorageWithExpiry";
import {
    embeddingsListKey,
    processArguments,
} from "../EmbeddingField"
import {algorithmsListKey} from "../AlgorithmsField"

const ModelCardNewDefault = (props) => {
    const [allEmbeddings, setAllEmbeddings] = useLocalStorageWithExpiry(embeddingsListKey, [])
    const [allAlgorithms, setAllAlgorithms] = useLocalStorageWithExpiry(algorithmsListKey,
        Object.fromEntries(props.chosenAlgorithm.validModes.map(mode => [mode.name, []])));
    const [formIsSubmitting, setFormIsSubmitting] = React.useState(false);
    const validationStrategies = {"Random": "RandomSplit", "Scaffold": "ScaffoldSplit"};
    const fetchingList = React.useState([]);

    const fetchResource = React.useCallback(async (resourceURL) => {
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
    }, [props.apiUrls, fetchingList]);

    const fetchEmbeddings = React.useCallback(async () => {
        if (allEmbeddings.length > 0) {
            return;
        }
        const data = await fetchResource('embeddings/list/')
        if (!data) return
        setAllEmbeddings(data);
    }, [fetchResource, allEmbeddings, setAllEmbeddings]);

    const fetchAlgorithms = React.useCallback(async () => {
        for (const mode of Object.keys(allAlgorithms)) {
            const data = await fetchResource(`models/qsprpred/sklearn/mode/${mode}/`);
            if (!data) return
            setAllAlgorithms({...allAlgorithms, [mode]: data});
        }
    }, [fetchResource, allAlgorithms, setAllAlgorithms]);

    React.useEffect(() => {
        if (allEmbeddings.length === 0) {
            fetchEmbeddings();
        }
        if (Object.keys(allAlgorithms).length === 0) {
            fetchAlgorithms();
        }
    }, [fetchEmbeddings, allEmbeddings, fetchAlgorithms, allAlgorithms]);


    const newModelFromFormData = async (data) => {
        const embeddingsArguments = {};
        for (const emb of data.embeddings) {
            const args = processArguments(await fetchResource(`embeddings/${emb}/arguments`));
            if (!args) return
            embeddingsArguments[emb] = args[emb];
        }
        const accuracy = props.metrics.find(m => m.name === "Accuracy");
        const rmse = props.metrics.find(m => m.name === "RMSE");
        const mode = props.chosenAlgorithm.validModes.find(m => m.name === data.task);

        for (const alg of data.algorithms) {
            postModelData({
                    name: `Default_${data.embeddings.join("_")}_${alg}_model`,
                    description: "Model created from default settings with selected embeddings and algorithm.",
                    project: props.currentProject.id,
                    molset: props.molsets[0].id,
                    trainingStrategy: {
                        algorithm: props.chosenAlgorithm.id,
                        parameters: {
                            alg: alg,
                            parameters: "{}"
                        },
                        mode: mode.id,
                        embeddings:
                            data.embeddings.map(emb => {
                                return {
                                    name: emb,
                                    arguments: embeddingsArguments[emb]
                                }
                            })
                        ,
                        activityThreshold: 6.5,
                        activitySet: props.activitySets[0].id,
                        activityType: props.activityTypes[0].id,
                        validationStrategies:
                            [{
                                resourcetype: "BasicValidationStrategy",
                                dataSplit: data.validationStrategy === "RandomSplit" ?
                                    {
                                        "name": "RandomSplit",
                                        "testFraction": 0.2,
                                        "seed": 42,
                                    } :
                                    {
                                        "name": "ScaffoldSplit",
                                        "scaffold": {"name": "BemisMurckoRDKit"},
                                        "testFraction": 0.2
                                    },
                                cvFolds: 3,
                                metrics: [mode.name === "classification" ? accuracy.id : rmse.id]
                            }
                            ],
                        hyperParamOptStrategies:
                            []
                    }

                }
            );
        }
    };

    const postModelData = (data, afterModelPOST) => {
        fetch(
            props.listURL
            , {
                method: 'POST'
                , body: JSON.stringify(data)
                , headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include",
            }
        ).then((data) => props.handleResponseErrors(data, "Creating model failed. Data wrong or incomplete?"))
            .then(modelData => {
                if (afterModelPOST) {
                    return afterModelPOST(modelData);
                }
                return modelData;
            })
            .then(
                modelData => {
                    props.handleCreate(props.modelClass, modelData);
                }
            ).catch(
            error => console.log(error)
        );
    };

    return (
        <React.Fragment>
            <CardBody>
                <Formik
                    initialValues={{
                        embeddings: ["MorganFP"],
                        task: "classification",
                        algorithms: ["RandomForestClassifier"],
                        validationStrategy: "RandomSplit"
                    }}
                    onSubmit={values => {
                        setFormIsSubmitting(true);
                        newModelFromFormData(values)
                        // TODO: Add scaffolds...
                        setFormIsSubmitting(false);
                    }}
                >
                    {({values, setFieldValue}) => (
                        <Form id={`${props.chosenAlgorithm.name}-${props.formNameSuffix}-form`}>
                            <Label>Embeddings</Label>
                            <Field
                                name="embeddings"
                                as={Input}
                                type="select"
                                multiple
                                value={values.embeddings}
                                onChange={e => {
                                    const options = Array.from(e.target.selectedOptions, option => option.value);
                                    setFieldValue('embeddings', options);
                                }}
                            >
                                {allEmbeddings.map(choice => (
                                    <option key={choice} value={choice}>{choice}</option>
                                ))}
                            </Field>
                            <Label>Tasks</Label>
                            <Field
                                name="task"
                                as={Input}
                                type="select"
                                value={values.task}
                                onChange={e => {
                                    setFieldValue('task', e.target.value);
                                    if (e.target.value === "classification") {
                                        setFieldValue('algorithms', ["RandomForestClassifier"]);
                                    } else {
                                        setFieldValue('algorithms', ["RandomForestRegressor"]);
                                    }
                                }}
                            >
                                {props.chosenAlgorithm.validModes.map(choice => (
                                    <option key={choice.name} value={choice.name}>{choice.name}</option>
                                ))}
                            </Field>
                            <Label>Algorithms</Label>
                            <Field
                                name="algorithms"
                                as={Input}
                                type="select"
                                multiple
                                value={values.algorithms}
                                onChange={e => {
                                    const options = Array.from(e.target.selectedOptions, option => option.value);
                                    setFieldValue('algorithms', options);
                                }}
                            >
                                {(values.task === "classification" && allAlgorithms["classification"] ? allAlgorithms["classification"].map(choice => (
                                    <option key={choice} value={choice}>{choice}</option>
                                )) : null)}
                                {(values.task === "regression" && allAlgorithms["regression"] ? allAlgorithms["regression"].map(choice => (
                                    <option key={choice} value={choice}>{choice}</option>
                                )) : null)}
                            </Field>
                            <Label>Validation strategy</Label>
                            <Field
                                name="validationStrategy"
                                as={Input}
                                type="select"
                                value={values.validationStrategy}
                                onChange={e => setFieldValue('validationStrategy', e.target.value)}
                            >
                                {Object.entries(validationStrategies).map(([key, value]) => (
                                    <option key={key} value={value}>{key}</option>
                                ))}
                            </Field>

                        </Form>
                    )}
                </Formik>
            </CardBody>

            <CardFooter>
                <Button form={`${props.chosenAlgorithm.name}-${props.formNameSuffix}-form`} type="submit"
                        color="primary"
                        disabled={formIsSubmitting}>{formIsSubmitting ? "Creating..." : "Create"}</Button>
            </CardFooter>
        </React.Fragment>
    )
};

export default ModelCardNewDefault;

import React from 'react';
import {Button, Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import FieldErrorMessage from './forms/FieldErrorMessage';

export function AlgorithmsField(props) {
    const algorithmPrefix = props.algorithmPrefix;
    const currentIndex = algorithmPrefix ? parseInt(algorithmPrefix.split('[')[1].split(']')[0]) : null;
    const [loading, setLoading] = React.useState(false);
    const [allAlgorithms, setAllAlgorithms] = React.useState(props.allAlgorithms || []);
    const [loadingAlgorithms, setLoadingAlgorithms] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};
    const fetchedRef = React.useRef({});
    console.log(props);

    const addAlgorithm = () => {
        if (values && setFieldValue) {
            const currentAlgorithms = values.trainingStrategy.embeddings || [];
            setFieldValue('trainingStrategy.embeddings', [
                ...currentAlgorithms,
                {name: allAlgorithms, arguments: {}}
            ]);
        }
    };

    const removeAlgorithm = (index) => {
        if (values && setFieldValue) {
            const currentAlgorithm = [...(values.trainingStrategy.embeddings || [])];
            currentAlgorithm.splice(index, 1);
            setFieldValue('trainingStrategy.embeddings', currentAlgorithm);
        }
    };

    // Fetch available embeddings when component mounts
    const fetchAlgorithms = React.useCallback(async () => {
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (allAlgorithms.length > 0) {
            return;
        }

        setLoadingAlgorithms(true);
        try {
            const url = new URL(`models/qsprpred/sklearn/mode/${props.modes.name}/`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch embeddings: ${response.statusText}`);
            }

            const data = await response.json();
            setAllAlgorithms(data);
        } catch (error) {
            console.error("Error fetching embeddings:", error);
        } finally {
            setLoadingAlgorithms(false);
        }
    }, [props.apiUrls, allAlgorithms.length, setAllAlgorithms, props.modes.name]);

    // Fetch embedding arguments when an embedding is selected and set their values
    const fetchAlgorithmParameters = React.useCallback(async (alg_name) => {
        if (!alg_name) return;
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (fetchedRef.current[alg_name]) {
            return;
        }

        setLoading(true);
        try {
            const url = new URL(`models/qsprpred/sklearn/${alg_name}/arguments`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch embedding arguments: ${response.statusText}`);
            }

            const data = await response.json();
            fetchedRef.current[alg_name] = true;

            if (values && setFieldValue) {
                const currentEmbeddings = values.trainingStrategy.embeddings || [];
                const index = currentIndex;
                if (index !== null && index >= 0 && index < currentEmbeddings.length) {
                    const processedData = {};
                    Object.entries(data).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            const array_data = {};
                            Object.entries(value).forEach(([subkey, subvalue]) => {
                                array_data[subvalue] = false;
                            });
                            processedData[key] = array_data;
                        } else {
                            processedData[key] = value;
                        }
                    });

                    const updatedEmbedding = {
                        ...currentEmbeddings[index],
                        arguments: processedData
                    };
                    const updatedEmbeddings = [...currentEmbeddings];
                    updatedEmbeddings[index] = updatedEmbedding;
                    setFieldValue('trainingStrategy.embeddings', updatedEmbeddings);
                }
            }
        } catch (error) {
            console.error("Error fetching embedding arguments:", error);
        } finally {
            setLoading(false);
        }
    }, [props.apiUrls, values, setFieldValue, currentIndex]);

    const handleEmbeddingChange = (event) => {
        const selectedEmbeddingId = event.target.value;

        if (values && setFieldValue) {
            const currentEmbeddings = values.trainingStrategy.embeddings || [];
            const index = currentIndex;
            if (index !== null && index >= 0 && index < currentEmbeddings.length) {
                const updatedEmbedding = {name: selectedEmbeddingId, arguments: {}};
                const updatedEmbeddings = [...currentEmbeddings];
                updatedEmbeddings[index] = updatedEmbedding;
                setFieldValue('trainingStrategy.embeddings', updatedEmbeddings);
            }
        }

        if (selectedEmbeddingId) {
            fetchedRef.current[selectedEmbeddingId] = false;
        }

        fetchAlgorithmParameters(selectedEmbeddingId);
    };

    const handleListItemChange = (paramName, itemName, checked) => {
        if (!values || !setFieldValue) return;

        const currentEmbeddings = values.trainingStrategy.embeddings || [];
        const index = currentIndex;
        if (index === null || index < 0 || index >= currentEmbeddings.length) return;

        const currentEmbedding = currentEmbeddings[index];
        const currentArguments = currentEmbedding.arguments || {};
        const currentItem = currentArguments[paramName] || {};

        const updatedItem = {
            ...currentItem,
            [itemName]: checked
        }

        const updatedArguments = {
            ...currentArguments,
            [paramName]: updatedItem
        };

        const updatedEmbedding = {
            ...currentEmbedding,
            arguments: updatedArguments
        };

        const updatedEmbeddings = [...currentEmbeddings];
        updatedEmbeddings[index] = updatedEmbedding;

        setFieldValue('trainingStrategy.embeddings', updatedEmbeddings);
    };

    const renderParamInput = (paramName, paramValue) => {
        if (paramValue && typeof paramValue === "object") {
            return (
                <div className="mt-2">
                    {Object.entries(paramValue).map(([key, value]) => (
                        <div key={key} className="form-check" style={{margin: '5px'}}>
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id={`${algorithmPrefix}-${paramName}-${key}`}
                                value={key}
                                checked={value}
                                onChange={(e) => {
                                    handleListItemChange(paramName, key, e.target.checked);
                                }}
                            />
                            <label className="form-check-label" htmlFor={`${algorithmPrefix}-${paramName}-${key}`}>
                                {key}
                            </label>
                        </div>
                    ))}
                </div>
            );
        } else {
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Col sm={8}>
                        <Field name={`${algorithmPrefix}.arguments.${paramName}`} as={Input} type="number"/>
                    </Col>
                </div>
            );
        }
    };

    const currentEmbeddingId = values && values.trainingStrategy && values.trainingStrategy.embeddings && currentIndex !== null
        ? values.trainingStrategy.embeddings[currentIndex].name
        : null;

    const currentEmbeddings = values.trainingStrategy.embeddings || [];
    const availableEmbeddings = [...allAlgorithms.filter(embedding => !currentEmbeddings.some(current => current.name === embedding)),
        currentEmbeddingId];


    React.useEffect(() => {
        fetchAlgorithms();
    }, [fetchAlgorithms]);

    React.useEffect(() => {
        if (currentEmbeddingId) {
            fetchAlgorithmParameters(currentEmbeddingId);
        }
    }, [currentEmbeddingId, fetchAlgorithmParameters]);

    if (algorithmPrefix && algorithmPrefix.includes('[')) {
        return (
            <React.Fragment>
                <FormGroup>
                    <Field
                        name={`${algorithmPrefix}.name`}
                        as={Input}
                        type="select"
                        onChange={handleEmbeddingChange}
                        disabled={loadingAlgorithms}
                    >
                        {loadingAlgorithms ? (
                            <option value="" disabled>Loading embeddings...</option>
                        ) : (
                            availableEmbeddings.map((desc) => (
                                <option key={desc} value={desc}>{desc}</option>
                            ))
                        )}
                    </Field>
                </FormGroup>
                <FieldErrorMessage name={`${algorithmPrefix}.name`}/>

                {/* Display embedding arguments if available */}
                {loading ? (
                    <p>Loading arguments...</p>
                ) : values && values.trainingStrategy && values.trainingStrategy.embeddings && currentIndex !== null ? (
                    <div className="mt-3">
                        <h5>Arguments</h5>
                        <div style={{maxHeight: '250px', overflowY: 'auto'}}>
                            {values.trainingStrategy.embeddings[currentIndex].arguments &&
                                Object.entries(values.trainingStrategy.embeddings[currentIndex].arguments).map(([paramName, paramValue]) => (
                                    <div key={paramName} className="mb-3">
                                        {renderParamInput(paramName, paramValue)}
                                    </div>
                                ))}
                        </div>
                    </div>
                ) : (
                    values && values.trainingStrategy && values.trainingStrategy.embeddings &&
                    currentIndex !== null && values.trainingStrategy.embeddings[currentIndex].name &&
                    <p>No arguments available for this embedding.</p>
                )}
            </React.Fragment>
        )
    }

    return (
        <React.Fragment>
            <div className="row">
                {values && values.trainingStrategy.embeddings && values.trainingStrategy.embeddings.map((embedding, index) => (
                    <div key={index} className="col-md-4 mb-4">
                        <div
                            className="p-3 border rounded"
                            style={{
                                backgroundColor: `hsl(${index * 137.5}, 70%, 85%)`
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Embedding {index + 1}</h5>
                                {values.trainingStrategy.embeddings.length > 1 && (
                                    <Button color="danger" size="sm" onClick={() => removeAlgorithm(index)}>
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <AlgorithmsField
                                {...props}
                                algorithmPrefix={`trainingStrategy.algorithm[${index}]`}
                                formikProps={props.formikProps}
                                allAlgorithms={allAlgorithms}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <Button color="primary" onClick={addAlgorithm} className="mt-2">
                Add Embedding
            </Button>
        </React.Fragment>
    );
}
// {/*{*/}
// {/*  parameters.map(param => {*/}
// {/*    const name = `${trainingStrategyPrefix}.parameters.${param.name}`;*/}
// {/*    return (*/}
// {/*      <FormGroup key={name} row>*/}
// {/*        <Label htmlFor={name} sm={4}>{param.name}</Label>*/}
// {/*        <Col sm={8}>*/}
// {/*          <ParameterField parameter={param} name={name}/>*/}
// {/*          <FieldErrorMessage name={name}/>*/}
// {/*        </Col>*/}
// {/*      </FormGroup>*/}
// {/*    )})*/}
// {/*}*/}
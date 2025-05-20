import React from 'react';
import {Button, Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import FieldErrorMessage from './forms/FieldErrorMessage';

export function EmbeddingsField(props) {
    const embeddingPrefix = props.embeddingPrefix;
    const currentIndex = embeddingPrefix ? parseInt(embeddingPrefix.split('[')[1].split(']')[0]) : null;
    const [loading, setLoading] = React.useState(false);
    const [allEmbeddings, setAllEmbeddings] = React.useState(props.allEmbeddings || []);
    const [loadingEmbeddings, setLoadingEmbeddings] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};
    const fetchedRef = React.useRef({});

    const addEmbedding = () => {
        if (values && setFieldValue) {
            const currentEmbeddings = values.trainingStrategy.embeddings || [];
            const availableEmbeddings = allEmbeddings.filter(embedding => !currentEmbeddings.some(current => current.name === embedding));
            if (availableEmbeddings.length === 0) {
                return;
            }
            setFieldValue('trainingStrategy.embeddings', [
                ...currentEmbeddings,
                {name: availableEmbeddings[0], arguments: {}}
            ]);
        }
    };

    const removeEmbedding = (index) => {
        if (values && setFieldValue) {
            const currentEmbeddings = [...(values.trainingStrategy.embeddings || [])];
            currentEmbeddings.splice(index, 1);
            setFieldValue('trainingStrategy.embeddings', currentEmbeddings);
        }
    };

    // Fetch available embeddings when component mounts
    const fetchEmbeddings = React.useCallback(async () => {
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (allEmbeddings.length > 0) {
            return;
        }

        setLoadingEmbeddings(true);
        try {
            const url = new URL('embeddings/list/', props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch embeddings: ${response.statusText}`);
            }

            const data = await response.json();
            setAllEmbeddings(data);
        } catch (error) {
            console.error("Error fetching embeddings:", error);
        } finally {
            setLoadingEmbeddings(false);
        }
    }, [props.apiUrls, allEmbeddings.length, setAllEmbeddings]);

    // Fetch embedding arguments when an embedding is selected and set their values
    const fetchEmbeddingArguments = React.useCallback(async (emb_name) => {
        if (!emb_name) return;
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        if (fetchedRef.current[emb_name]) {
            return;
        }

        setLoading(true);
        try {
            const url = new URL(`embeddings/${emb_name}/arguments`, props.apiUrls.qsarRoot);
            const response = await fetch(url.toString(), {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch embedding arguments: ${response.statusText}`);
            }

            const data = await response.json();
            fetchedRef.current[emb_name] = true;

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

        fetchEmbeddingArguments(selectedEmbeddingId);
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
                                id={`${embeddingPrefix}-${paramName}-${key}`}
                                value={key}
                                checked={value}
                                onChange={(e) => {
                                    handleListItemChange(paramName, key, e.target.checked);
                                }}
                            />
                            <label className="form-check-label" htmlFor={`${embeddingPrefix}-${paramName}-${key}`}>
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
                        <Field name={`${embeddingPrefix}.arguments.${paramName}`} as={Input} type="number"/>
                    </Col>
                </div>
            );
        }
    };

    const currentEmbeddingId = values && values.trainingStrategy && values.trainingStrategy.embeddings && currentIndex !== null
        ? values.trainingStrategy.embeddings[currentIndex].name
        : null;

    const currentEmbeddings = values.trainingStrategy.embeddings || [];
    const availableEmbeddings = [...allEmbeddings.filter(embedding => !currentEmbeddings.some(current => current.name === embedding)),
        currentEmbeddingId];


    React.useEffect(() => {
        fetchEmbeddings();
    }, [fetchEmbeddings]);

    React.useEffect(() => {
        if (currentEmbeddingId) {
            fetchEmbeddingArguments(currentEmbeddingId);
        }
    }, [currentEmbeddingId, fetchEmbeddingArguments]);

    if (embeddingPrefix && embeddingPrefix.includes('[')) {
        return (
            <React.Fragment>
                <FormGroup>
                    <Field
                        name={`${embeddingPrefix}.name`}
                        as={Input}
                        type="select"
                        onChange={handleEmbeddingChange}
                        disabled={loadingEmbeddings}
                    >
                        {loadingEmbeddings ? (
                            <option value="" disabled>Loading embeddings...</option>
                        ) : (
                            availableEmbeddings.map((desc) => (
                                <option key={desc} value={desc}>{desc}</option>
                            ))
                        )}
                    </Field>
                </FormGroup>
                <FieldErrorMessage name={`${embeddingPrefix}.name`}/>

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
                                    <Button color="danger" size="sm" onClick={() => removeEmbedding(index)}>
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <EmbeddingsField
                                {...props}
                                embeddingPrefix={`trainingStrategy.embeddings[${index}]`}
                                formikProps={props.formikProps}
                                allEmbeddings={allEmbeddings}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <Button color="primary" onClick={addEmbedding} className="mt-2">
                Add Embedding
            </Button>
        </React.Fragment>
    );
}

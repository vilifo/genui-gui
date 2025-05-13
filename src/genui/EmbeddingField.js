import React from 'react';
import {Button, Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import {FieldErrorMessage} from '../genui';

export function EmbeddingsField(props) {
    const embeddingPrefix = props.embeddingPrefix;
    console.log(embeddingPrefix);
    const currentIndex = embeddingPrefix ? parseInt(embeddingPrefix.split('[')[1].split(']')[0]) : null;
    const [loading, setLoading] = React.useState(false);
    const [embeddings, setEmbeddings] = React.useState([]);
    const [loadingEmbeddings, setLoadingEmbeddings] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};
    const fetchedRef = React.useRef({});
    console.log(values);

    const addEmbedding = () => {
        if (values && setFieldValue) {
            const currentEmbeddings = values.trainingStrategy.embeddings || [];
            setFieldValue('trainingStrategy.embeddings', [
                ...currentEmbeddings,
                {name: "MorganFP", arguments: {}}
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
        console.log("Fetching embeddings...");
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
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
            setEmbeddings(data);
        } catch (error) {
            console.error("Error fetching embeddings:", error);
        } finally {
            setLoadingEmbeddings(false);
        }
    }, [props.apiUrls, setEmbeddings]);

    // Fetch embedding arguments when an embedding is selected and set their values
    const fetchEmbeddingArguments = React.useCallback(async (emb_name) => {
        console.log("Fetching embedding arguments for:", emb_name);
        if (!emb_name) return;
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
            return;
        }

        // Check if we've already fetched this embedding's arguments
        if (fetchedRef.current[emb_name]) {
            console.log("Already fetched arguments for:", emb_name);
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
            // Mark this embedding as fetched
            fetchedRef.current[emb_name] = true;

            if (values && setFieldValue) {
                // Get the current embeddings array
                const currentEmbeddings = values.trainingStrategy.embeddings || [];
                // Find the current embedding index
                const index = currentIndex;
                if (index !== null && index >= 0 && index < currentEmbeddings.length) {
                    // Create a new embedding object with the updated arguments
                    const updatedEmbedding = {
                        ...currentEmbeddings[index],
                        arguments: data
                    };
                    // Create a new embeddings array with the updated embedding
                    const updatedEmbeddings = [...currentEmbeddings];
                    updatedEmbeddings[index] = updatedEmbedding;
                    // Update the embeddings array in the form values
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
            // Get the current embeddings array
            const currentEmbeddings = values.trainingStrategy.embeddings || [];
            // Find the current embedding index
            const index = currentIndex;
            if (index !== null && index >= 0 && index < currentEmbeddings.length) {
                // Create a new embedding object with the updated name
                const updatedEmbedding = {name: selectedEmbeddingId, arguments: {}};
                // Create a new embeddings array with the updated embedding
                const updatedEmbeddings = [...currentEmbeddings];
                updatedEmbeddings[index] = updatedEmbedding;
                // Update the embeddings array in the form values
                setFieldValue('trainingStrategy.embeddings', updatedEmbeddings);
            }
        }

        // Reset the fetched status for this embedding to force a new fetch
        if (selectedEmbeddingId) {
            fetchedRef.current[selectedEmbeddingId] = false;
        }

        fetchEmbeddingArguments(selectedEmbeddingId);
    };

    const handleListItemChange = (paramName, checked) => {
        if (!values || !setFieldValue) return;

        const currentEmbeddings = values.trainingStrategy.embeddings || [];
        const index = currentIndex;
        if (index === null || index < 0 || index >= currentEmbeddings.length) return;

        const currentEmbedding = currentEmbeddings[index];
        const currentArguments = currentEmbedding.arguments || {};
        const paramList = currentArguments.arguments?.descriptors || [];

        let updatedList;
        if (checked) {
            updatedList = [...paramList, paramName];
        } else {
            updatedList = paramList.filter(val => val !== paramName);
        }

        let updatedArguments;
        if (updatedList.length) {
            updatedArguments = {descriptors: updatedList};
        } else {
            updatedArguments = {};
        }

        const updatedEmbedding = {
            ...currentEmbedding,
            arguments: updatedArguments
        };

        const updatedEmbeddings = [...currentEmbeddings];
        updatedEmbeddings[index] = updatedEmbedding;

        setFieldValue('trainingStrategy.embeddings', updatedEmbeddings);
    };

    const renderParamInput = (paramValue, paramName) => {
        if (!Number.isNaN(parseInt(paramName))) {
            const currentEmbeddings = values?.trainingStrategy?.embeddings || [];
            const currentEmbedding = currentIndex !== null && currentIndex >= 0 && currentIndex < currentEmbeddings.length
                ? currentEmbeddings[currentIndex]
                : null;
            const descriptors = currentEmbedding?.arguments?.descriptors || [];
            const isChecked = descriptors.includes(paramValue);

            return (
                <div className="mt-2">
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`${embeddingPrefix}-${paramValue}`}
                            value={paramValue}
                            checked={isChecked}
                            onChange={(e) => handleListItemChange(paramValue, e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor={`${embeddingPrefix}-${paramName}`}>
                            {paramValue}
                        </label>
                    </div>
                </div>
            );
        } else {
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Col sm={8}>
                        <Field name={paramName} as={Input} value={paramValue} type="number"/>
                    </Col>
                </div>
            );
        }
    };

    const currentEmbeddingId = values && values.trainingStrategy && values.trainingStrategy.embeddings && currentIndex !== null
        ? values.trainingStrategy.embeddings[currentIndex].name
        : null;

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
                        <option value="">Select an embedding</option>
                        {loadingEmbeddings ? (
                            <option value="" disabled>Loading embeddings...</option>
                        ) : (
                            embeddings.map((desc) => (
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
                        <div>
                            {values.trainingStrategy.embeddings[currentIndex].arguments && 
                             Object.entries(values.trainingStrategy.embeddings[currentIndex].arguments).map(([paramName, paramValue]) => (
                                <div key={paramName} className="mb-3">
                                    {renderParamInput(paramValue, paramName)}
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
            {values && values.trainingStrategy.embeddings && values.trainingStrategy.embeddings.map((embedding, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
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
                    />
                </div>
            ))}
            <Button color="primary" onClick={addEmbedding} className="mt-2">
                Add Embedding
            </Button>
        </React.Fragment>
    );
}

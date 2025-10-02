import React from 'react';
import {Button, Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import FieldErrorMessage from './forms/FieldErrorMessage';
import useLocalStorageWithExpiry from "./LocalStorageWithExpiry";

export const embeddingsListKey = 'embeddingsCache_list';
export const embeddingsArgumentsKey = 'embeddingsCache_arguments';

export const processArguments = (data) => {
    const processedData = {};
    Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            const array_data = {};
            Object.entries(value).forEach(([subkey, subvalue]) => {
                array_data[subvalue] = true;
            });
            processedData[key] = array_data;
        } else {
            processedData[key] = value;
        }
    });
    return processedData;
};

export function EmbeddingsField(props) {
    const embeddingPrefix = props.embeddingPrefix;
    const currentIndex = embeddingPrefix ? parseInt(embeddingPrefix.split('[')[1].split(']')[0]) : null;
    const [loading, setLoading] = React.useState(false);
    const [allEmbeddings, setAllEmbeddings] = useLocalStorageWithExpiry(embeddingsListKey, [], 24);
    const [embeddingsArguments, setEmbeddingsArguments] = useLocalStorageWithExpiry(embeddingsArgumentsKey, {}, 24);
    const [loadingEmbeddings, setLoadingEmbeddings] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};
    const fetchedRef = React.useRef({});
    const fetchResource = props.fetchResource;

    const addEmbedding = () => {
        if (values && setFieldValue) {
            const currentEmbeddings = values.trainingStrategy.embeddings || [];
            const availableEmbeddings = allEmbeddings.filter(embedding => !currentEmbeddings.some(current => current.name === embedding));
            if (availableEmbeddings.length === 0) {
                return;
            }
            setFieldValue('trainingStrategy.embeddings', [
                ...currentEmbeddings,
                {name: availableEmbeddings[0], arguments: embeddingsArguments[availableEmbeddings[0]]}
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

    const fetchEmbeddings = React.useCallback(async () => {
        if (allEmbeddings.length > 0) {
            return;
        }
        setLoadingEmbeddings(true);
        const data = await fetchResource('embeddings/list/')
        if (data) setAllEmbeddings(data);
        setLoadingEmbeddings(false);
    }, [fetchResource, allEmbeddings, setAllEmbeddings]);

    const fetchEmbeddingArguments = React.useCallback(async (emb_name) => {
        if (!emb_name) return;
        const setArguments = (data) => {
            fetchedRef.current[emb_name] = true;
            if (values && setFieldValue) {
                const currentEmbeddings = values.trainingStrategy.embeddings || [];
                const index = currentIndex;
                if (index !== null && index >= 0 && index < currentEmbeddings.length) {
                    const updatedEmbedding = {
                        name: emb_name,
                        arguments: data
                    };
                    const updatedEmbeddings = [...currentEmbeddings];
                    updatedEmbeddings[index] = updatedEmbedding;
                    setFieldValue('trainingStrategy.embeddings', updatedEmbeddings);
                }
            }
        };

        if (embeddingsArguments[emb_name]) {
            setArguments(embeddingsArguments[emb_name]);
            return;
        }

        setLoading(true);
        let data = await fetchResource(`embeddings/${emb_name}/arguments`);
        if (!data) return
        data = processArguments(data);
        const updateEmbeddingsArguments = {...embeddingsArguments};
        updateEmbeddingsArguments[emb_name] = data;
        setEmbeddingsArguments(updateEmbeddingsArguments);
        setLoading(false);
    }, [fetchResource, values, setFieldValue, currentIndex, embeddingsArguments, setEmbeddingsArguments]);

    const handleEmbeddingChange = (event) => {
        const selectedEmbeddingId = event.target.value;

        if (values && setFieldValue) {
            const currentEmbeddings = values.trainingStrategy.embeddings || [];
            const index = currentIndex;
            if (index !== null && index >= 0 && index < currentEmbeddings.length) {
                const updatedEmbedding = {
                    name: selectedEmbeddingId,
                    arguments: embeddingsArguments[selectedEmbeddingId] || {}
                };
                const updatedEmbeddings = [...currentEmbeddings];
                updatedEmbeddings[index] = updatedEmbedding;
                setFieldValue('trainingStrategy.embeddings', updatedEmbeddings);
            }
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
                            <Field
                                as={Input}
                                name={`${embeddingPrefix}.arguments.${paramName}.${key}`}
                                type="checkbox"
                                onChange={(e) => {
                                handleListItemChange(paramName, key, e.target.checked);}}
                            />
                            <FieldErrorMessage name={`${embeddingPrefix}.arguments.${paramName}`}/>
                            <label className="form-check-label" htmlFor={`${embeddingPrefix}-${paramName}-${key}`}>
                                {key}
                            </label>
                        </div>
                    ))}
                </div>
            );
        } else if (values.trainingStrategy.embeddings[currentIndex].arguments[paramName] !== null) {
            return (
                <div>
                    <Label>{paramName}</Label>
                    <Col sm={8}>
                        <Field name={`${embeddingPrefix}.arguments.${paramName}`} as={Input} type="number"/>
                        <FieldErrorMessage name={`${embeddingPrefix}.arguments.${paramName}`}/>
                    </Col>
                </div>
            );
        } else {
            return null;
        }
    };

    const currentEmbeddingId = values && values.trainingStrategy && values.trainingStrategy.embeddings && currentIndex !== null
        ? values.trainingStrategy.embeddings[currentIndex].name
        : null;

    const currentEmbeddings = values && values.trainingStrategy.embeddings ? values.trainingStrategy.embeddings : [];
    const availableEmbeddings = [...allEmbeddings.filter(embedding => !currentEmbeddings.some(current => current.name === embedding)),
        currentEmbeddingId];


    React.useEffect(() => {
        if (allEmbeddings.length === 0) {
            fetchEmbeddings();
        }
    }, [fetchEmbeddings, allEmbeddings.length]);

    React.useEffect(() => {
        if (currentEmbeddingId) {
            if (embeddingsArguments[currentEmbeddingId] && fetchedRef.current[currentEmbeddingId]) {
                return;
            }
            fetchEmbeddingArguments(currentEmbeddingId);
        }
    }, [embeddingsArguments, currentEmbeddingId, fetchEmbeddingArguments]);

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

export function convertEmbeddingsArgumentsObjectsToArrays(data) {
    const new_embeddings = [...data?.trainingStrategy?.embeddings];
    const embeddings = data?.trainingStrategy?.embeddings;

    embeddings.forEach(function (embedding, index) {
        const name = embedding.name;
        const new_arguments = {};
        Object.entries(embedding.arguments).forEach(([key, value]) => {
            if (typeof value === "object") {
                let new_items = [];
                Object.entries(value).forEach(([key, value]) => {
                    if (value) {
                        new_items = [...new_items, key];
                    }
                })
                new_arguments[key] = new_items;
            } else {
                new_arguments[key] = value;
            }
        })
        new_embeddings[index] = {
            name: name,
            arguments: new_arguments
        }
    });
    data.trainingStrategy.embeddings = new_embeddings;
    return data;
}

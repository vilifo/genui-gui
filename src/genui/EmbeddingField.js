import React from 'react';
import {Button, Col, FormGroup, Input, Label} from 'reactstrap';
import {Field} from 'formik';
import {FieldErrorMessage} from '../genui';

export function EmbeddingsField(props) {
    const embeddingPrefix = props.embeddingPrefix;
    const [embeddingArguments, setEmbeddingArguments] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [embeddings, setEmbeddings] = React.useState([]);
    const [loadingEmbeddings, setLoadingEmbeddings] = React.useState(false);
    const {values, setFieldValue} = props.formikProps || {};

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
            const currentEmbeddings = values.trainingStrategy.embeddings || [];
            currentEmbeddings.splice(index, 1);
            setFieldValue('trainingStrategy.embeddings', currentEmbeddings);
        }
    };

    const fetchEmbeddings = React.useCallback(async () => {
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
    }, [props.apiUrls]);

    const fetchEmbeddingParams = React.useCallback(async (emb_name) => {
        if (!emb_name) return;
        if (!props.apiUrls || !props.apiUrls.qsarRoot) {
            console.error("API URLs not provided");
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
            setEmbeddingArguments(data);
        } catch (error) {
            console.error("Error fetching embedding arguments:", error);
        } finally {
            setLoading(false);
        }
    }, [props.apiUrls, setLoading, setEmbeddingArguments]);

    const handleEmbeddingChange = (event) => {
        const selectedEmbeddingId = event.target.value;

        if (values && setFieldValue) {
            setFieldValue(`${embeddingPrefix}.id`, selectedEmbeddingId);
            setFieldValue(`${embeddingPrefix}.arguments`, {});
        }

        fetchEmbeddingParams(selectedEmbeddingId);
    };

    const handleListItemChange = (paramName, checked) => {
        if (!values || !setFieldValue) return;

        const currentParams = values[`${embeddingPrefix}.arguments`] || {};
        const paramList = Object.values(currentParams)[0] || [];

        let updatedList;
        if (checked) {
            updatedList = [...paramList, paramName];
        } else {
            updatedList = paramList.filter(val => val !== paramName);
        }

        if (updatedList.length) {
            setFieldValue(`${embeddingPrefix}.arguments`, {
                arguments: updatedList
            });
        } else {
            setFieldValue(`${embeddingPrefix}.arguments`, {});
        }
    };

    const renderParamInput = (paramValue, paramName) => {
        if (! Number.isNaN(parseInt(paramName))) {
            return (
                <div className="mt-2">
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`${embeddingPrefix}-${paramValue}`}
                            value={paramValue}
                            checked={false}
                            onChange={(e) => handleListItemChange(paramValue, paramName, e.target.checked)}
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

    const currentEmbeddingId = values && values[`${embeddingPrefix}.id`];

    React.useEffect(() => {
        fetchEmbeddings();
    }, [fetchEmbeddings]);

    React.useEffect(() => {
        if (currentEmbeddingId) {
            fetchEmbeddingParams(currentEmbeddingId);
        }
    }, [currentEmbeddingId, fetchEmbeddingParams]);

    return (
        <React.Fragment>
            <FormGroup>
                <Label htmlFor={`${embeddingPrefix}.id`}>Descriptor Set</Label>
                <Field
                    name={`${embeddingPrefix}.id`}
                    as={Input}
                    type="select"
                    onChange={handleEmbeddingChange}
                    disabled={loadingEmbeddings}
                >
                    <option value="">Select a descriptor set</option>
                    {loadingEmbeddings ? (
                        <option value="" disabled>Loading embeddings...</option>
                    ) : (
                        embeddings.map((desc) => (
                            <option key={desc} value={desc}>{desc}</option>
                        ))
                    )}
                </Field>
            </FormGroup>
            <FieldErrorMessage name={`${embeddingPrefix}.id`}/>

            {/* Display embedding arguments if available */}
            {loading ? (
                <p>Loading arguments...</p>
            ) : embeddingArguments ? (
                <div className="mt-3">
                    <h5>Parameters</h5>
                    <div>
                        {Object.entries(embeddingArguments).map(([paramName, paramValue]) => (
                            <div key={paramName} className="mb-3">
                                {renderParamInput(paramValue, paramName)}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                values && values[`${embeddingPrefix}.id`] && <p>No arguments available for this embedding.</p>
            )}
            <Button color="primary" onClick={addEmbedding} className="mt-2">
                Add Embedding
            </Button>
        </React.Fragment>
    )
}
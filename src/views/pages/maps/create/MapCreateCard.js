import React from 'react';
import {ModelCardNew} from '../../../../genui';
import * as Yup from 'yup';
import {MapExtraFields, MapTrainFields} from './MapFormFields';

export default function MapCreateCard(props) {
    let molsets = [];
    Object.keys(props.compoundSets).forEach(
        (key) => molsets = molsets.concat(props.compoundSets[key])
    );

    const trainingStrategyInit = {
        embeddings: [{name: "MorganFP", arguments: {}}],
    };
    const extraParamInit = {
        molsets: [molsets[0].id],
    };

    const trainingStrategySchema = {
        activityThreshold: Yup.number().min(0, 'Activity threshold must be zero or positive.'),
        embeddings: Yup.array().of(Yup.object()).required('You need to supply one or more descriptor sets for training.'),
    };

    const extraParamsSchema = {
        molsets: Yup.array().of(
            Yup.number().positive(
                'Molecule set ID must be a positive integer.'
            )).required('You have to select at least one compound set to map.'),
    };

    const convertEmbeddingsArgumentsObjectsToArrays = (data) => {
        const new_embeddings = [...data?.trainingStrategy?.embeddings];
        const embeddings = data?.trainingStrategy?.embeddings;

        embeddings.forEach(function (embedding, index) {
            const name = embedding.name;
            const new_arguments= {};
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

    return (
        <ModelCardNew
            {...props}
            molsets={molsets}
            trainingStrategyInit={trainingStrategyInit}
            extraParamsInit={extraParamInit}
            trainingStrategySchema={trainingStrategySchema}
            extraParamsSchema={extraParamsSchema}
            trainingStrategyFields={MapTrainFields}
            extraFields={MapExtraFields}
            prePost={convertEmbeddingsArgumentsObjectsToArrays}
        />)
}
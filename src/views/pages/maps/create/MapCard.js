import React from 'react';
import {ModelCard, ModelInfoTab} from '../../../../genui';

export default function MapCard(props) {
    const model = props.model;
    const trainingStrategy = model.trainingStrategy;

    const trainingParams = [
        {
            name: "Training Set",
            value: model.molsets.map(molset => `${molset.name}`).join(";")
        },
        {
            name: "Embeddings",
            value: trainingStrategy.embeddings.map((desc) => {
                const args = desc.arguments
                    ? Object.entries(desc.arguments).map(([key, val]) => `${key}=${val}`).join(", ")
                    : "";
                return args ? `${desc.name}(${args})` : `${desc.name}()`;
            }).join("; ")
        }
    ];

    const tabs = [
        {
            title: "Info",
            renderedComponent: (props) =>
                <ModelInfoTab
                    {...props}
                    extraTrainingParams={trainingParams}
                    extraInfoComponent={(props) => {
                        const pointsUrl = `${props.modelUrl.toString()}points/`
                        return (
                            <React.Fragment>
                                <br/>
                                <a href={pointsUrl} target="_blank" rel="noopener noreferrer">{pointsUrl}</a>
                            </React.Fragment>
                        )
                    }
                    }
                />
        }
    ];

    return <ModelCard {...props} tabs={tabs}/>
}
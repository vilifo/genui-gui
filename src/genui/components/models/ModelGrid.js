import React from "react";
import { ComponentWithResources, ResponsiveGrid, TaskAwareComponent } from '../../index';
import { Card } from 'reactstrap';

const ModelGrid = (props) => {
  const { 
    chosenAlgorithm, 
    models, 
    newCardSetup: propNewCardSetup, 
    cardSetup: propCardSetup,
    modelComponent: ModelComponent,
    newModelComponent: NewModelComponent,
    modelClass,
    handleResponseErrors,
    listURL,
    handleModelDelete,
  } = props;

  const newCardSetup = propNewCardSetup || {
    h : {"md" : 15, "sm" : 15},
    w : {"md" : 1, "sm" : 1},
    minH : {"md" : 3, "sm" : 3},
  };

  const cardSetup = propCardSetup || {
    h : {"md" : 12, "sm" : 12},
    w : {"md" : 1, "sm" : 1},
    minH : {"md" : 3, "sm" : 3},
  };

  if (models.length === 0 && !chosenAlgorithm) {
    return <p>Start by selecting a model to build. See the menu in the top right.</p>
  }

  const existing_cards = models.map(model => (Object.assign({
    id : model.id,
    data : model
  }, cardSetup)));

  const new_card = Object.assign({
    id : "new-model",
  }, newCardSetup);

  return (
    <div className="models-grid">
      <ResponsiveGrid
        items={(chosenAlgorithm ? [new_card] : []).concat(existing_cards)}
        rowHeight={75}
        mdCols={2}
        smCols={1}
        gridID={`${modelClass}-grid-layout`}
      >
        {
          (chosenAlgorithm ? [(
            <Card key={new_card.id} id={new_card.id}>
              <NewModelComponent {...props}/>
            </Card>
          )] : []).concat(existing_cards.map(
            item => (
              <Card key={item.id}>
                <TaskAwareComponent
                  handleResponseErrors={handleResponseErrors}
                  tasksURL={new URL(`${item.data.id}/tasks/all/`, listURL)}
                  render={
                    (taskInfo, onTaskUpdate) => (
                      // <LiveObject {...props} url={new URL(`${item.data.id}/`, listURL)}>
                      <ComponentWithResources
                        definition={{
                          model : new URL(`${item.data.id}/`, listURL),
                        }}
                      >
                        {
                          (loaded, resources) => loaded ? (
                            <ModelComponent
                              {...props}
                              {...taskInfo}
                              onTaskUpdate={onTaskUpdate}
                              model={resources.model}
                              modelUrl={new URL(`${item.data.id}/`, listURL)}
                              modelClass={modelClass}
                              onModelDelete={handleModelDelete}
                            />
                          ) : <div>Loading...</div>
                        }
                      </ComponentWithResources>
                      // </LiveObject>
                    )
                  }
                />
              </Card>
            ))
          )
        }
      </ResponsiveGrid>
    </div>
  );
};

export default ModelGrid

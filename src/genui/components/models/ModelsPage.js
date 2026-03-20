import React from 'react';
import { ComponentWithObjects } from '../../index';
import ObjectGroupsList from '../ObjectSelectionList';

const ModelsPage = (props) => {
  const {
    definitions,
    algorithmChoices,
    // selectedToAdd: initialSelectedToAdd,
    // newModelComponent: initialNewModelComponent,
    // newCardSetup: initialNewCardSetup,
    // cardSetup: initialCardSetup,
  } = props;

  // const [selectedToAdd, setSelectedToAdd] = useState(initialSelectedToAdd);
  // const [newModelComponent, setNewModelComponent] = useState(initialNewModelComponent);
  //
  // const [newCardSetup, setNewCardSetup] = useState(
  //     initialNewCardSetup || {
  //       h: { md: 15, sm: 15 },
  //       w: { md: 1, sm: 1 },
  //       minH: { md: 3, sm: 3 },
  //     }
  // );
  //
  // const [cardSetup, setCardSetup] = useState(
  //     initialCardSetup || {
  //       h: { md: 12, sm: 12 },
  //       w: { md: 1, sm: 1 },
  //       minH: { md: 3, sm: 3 },
  //     }
  // );
  //
  // const handleAddNew = (model, newComp, cardStp) => {
  //   setSelectedToAdd(model);
  //   if (newComp) setNewModelComponent(newComp);
  //   if (cardStp) setNewCardSetup(cardStp);
  // };

  const modelClass = Object.keys(definitions)[0];

  return (
      <div className="models-page">
        <ComponentWithObjects
            {...props}
            emptyClassName={modelClass}
            objectListURL={definitions[modelClass].url}
            render={(
                models,
                handleAddModelList,
                handleAddModel,
                handleModelDelete,
                handleModelUpdate
            ) => {
              return (
                  <ObjectGroupsList
                      {...props}
                      chosenAlgorithm={
                        algorithmChoices.length === 1 ? algorithmChoices[0] : null
                      }
                      models={models[modelClass]}
                      id="models-list"
                      objects={models}
                      objectProp="model"
                      groupNameProp="modelClass"
                      urlProp="listURL"
                      createProp="handleCreate"
                      deleteProp="onModelDelete"
                      updateProp="onModelUpdate"
                      onCreate={handleAddModel}
                      onDelete={handleModelDelete}
                      onUpdate={handleModelUpdate}
                      focusGroup={modelClass}
                      tasksUrlRoot={definitions[modelClass].url}
                      groupDefinitions={definitions}
                  />
              );
            }}
        />
      </div>
  );
};

export default ModelsPage;
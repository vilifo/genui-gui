import React from 'react';
import { ComponentWithObjects, ComponentWithResources, ModelsPage } from '../../../../genui';
import MapCreateCard from './MapCreateCard';
import MapCard from './MapCard';


const MapDisplay = (props) => {
  const resources = {
    algorithmChoices : new URL('algorithms/', props.apiUrls.mapsRoot),
    embeddings: new URL('embeddings/', props.apiUrls.mapsRoot),
    metrics: new URL('metrics/', props.apiUrls.qsarRoot),
  };
  const definitions = {
    Map: {
      name: "Chemical Space Maps",
      url: props.apiUrls.mapsRoot,
      newComponents: [
        {
          label: "Add",
          component: MapCreateCard
        }
      ],
      listComponent: MapCard,
    }
  }
  const defaultClassName = "Map";
  return (
    <ComponentWithResources definition={resources}>
      {
        (allLoaded, resources) => (
          allLoaded ? <ComponentWithObjects
            {...props}
            objectListURL={new URL('all/', props.apiUrls.compoundSetsRoot)}
            emptyClassName={defaultClassName}
            render={
              (
                ...args
              ) => {
                const [compoundSets] = [...args];
                const compoundSetsAvailable = !(Object.keys(compoundSets).length === 1 && compoundSets[defaultClassName].length === 0 && compoundSets.constructor === Object);
                return (compoundSetsAvailable ? <ModelsPage
                  {...props}
                  {...resources}
                  definitions={definitions}
                  compoundSets={compoundSets}
                /> : <div><p>There are currently no compound sets. You need to create one before you can create a map.</p></div>)
              }
            }
          /> : <div>Loading...</div>
        )
      }
    </ComponentWithResources>
  );
};

export default MapDisplay;

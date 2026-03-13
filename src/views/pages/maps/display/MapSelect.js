import React, { useState, useEffect } from 'react';
import HeaderNav from './HeaderNav';
import { ComponentWithResources, IDsToResources } from '../../../../genui';
import MapTabs from './MapTabs';

function MapSelect(props) {
  const [selectedMap, setSelectedMap] = useState(null);

  useEffect(() => {
    const maps = props.maps;
    if (maps.length > 0 && !selectedMap) {
      props.setPageHeader(
        <HeaderNav
          {...props}
          maps={maps}
          onMapChoice={map => {
            setSelectedMap(map);
          }}/>
      );

      setSelectedMap(maps[0]);
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.maps, selectedMap, props.setPageHeader]);

  const maps = props.maps;
  const selected = selectedMap;

  if (selected) {
    const molsets = selected.molsets;
    if (molsets.length === 0) {
      return <div>{selected.name} has no compounds associated with it. Maybe you deleted the compound sets associated with this map?</div>;
    }

    const molsetsToColor = {};
    molsets.forEach((molset, index) => {
      if (index >= props.molsetColorList.length) {
        index = index % props.molsetColorList.length;
      }
      molsetsToColor[molset.id] = props.molsetColorList[index];
    });
    const resourcesDef = {};
    molsets.forEach(molset => {
      Object.assign(resourcesDef, IDsToResources(props.apiUrls.activitySetsRoot, molset.activities));
    });
    return (
      <ComponentWithResources
        selected={selected}
        definition={resourcesDef}
        updateCondition={
          (prevProps, nextProps) => prevProps.selected.id !== nextProps.selected.id
        }
      >
        {
          (allLoaded, activitySets) => {
            return (
              <MapTabs
                {...props}
                selectedMap={selected}
                maps={maps}
                molsets={molsets}
                molsetsToColor={molsetsToColor}
                activitySets={activitySets}
              />
            );
          }
        }
      </ComponentWithResources>
    );
  } else {
    return <div>Select a map from the menu above.</div>;
  }
}

export default MapSelect;
import { groupBy, GroupedViolinPlot } from '../../../../genui';
import React, { useState, useEffect } from 'react';

const ActivitySummaryPlotter = (props) => {
  const initTraces = () => {
    const molsets = props.molsets;
    const actsets = props.activitySets;
    const activities = props.activities;
    const mols = props.mols;

    const plotTraces = {};
    const bySource = groupBy(activities, 'source');
    bySource.forEach(group => {
      const actset = actsets[group[0].source];
      if (!actset) {
        // console.error(`Cannot find activity set: ${group[0].source}.`);
        return;
      }
      const molset = molsets.find(item => item.id === actset.molecules);
      if (!molset) {
        // console.error(`Cannot find molecule set ${actset.molecules} for activity set: ${actset.id}`);
        return;
      }

      if (!plotTraces.hasOwnProperty(molset.id)) {
        plotTraces[molset.id] = {};
        plotTraces[molset.id].name = molset.name;
        plotTraces[molset.id].x = [];
        plotTraces[molset.id].y = [];
        plotTraces[molset.id].customdata = [];
        plotTraces[molset.id].marker = {
          color: props.molsetsToColor[molset.id],
        }
      }

      const values = group.map(item => item.value);
      const groups = group.map(item => actset.name);
      const customdata = group.map(item => mols.find(mol => mol.id === item.molecule));
      plotTraces[molset.id].x = plotTraces[molset.id].x.concat(groups);
      plotTraces[molset.id].y = plotTraces[molset.id].y.concat(values);
      plotTraces[molset.id].customdata = plotTraces[molset.id].customdata.concat(customdata);
    });

    return plotTraces;
  };

  const [traces, setTraces] = useState(initTraces());
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setTraces(initTraces());
    setRevision(prev => prev + 1);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedMolsRevision]);

  return (
    <GroupedViolinPlot
      title={`Distributions of ${props.type.value}`}
      traces={traces}
      tracesRev={revision}
      onHover={(eventData) => eventData ? props.onMolHover(eventData.points[0].customdata) : null}
      onSelect={(eventData) => {
        if (eventData) {
          props.onMolsSelect(eventData.points.map(point => point.customdata));
        }
      }}
      onDeselect={props.onMolsDeselect}
    />
  );
};

export default ActivitySummaryPlotter;
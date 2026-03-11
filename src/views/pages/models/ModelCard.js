import React from 'react';
import { ModelCard, ModelInfoTab, ModelPerformance, ModelPreds } from '../../../genui';
import QSARPerformanceOverview from './tabs/PerformanceOverview';

const QSARModelCard = (props) => {
    const model =  props.model;
    const trainingStrategy = model.trainingStrategy;

    const modelData = [
      {
        name : "Compound Set",
        value : model.molset ? model.molset.name : "--"
      },
      {
        name : "Predictions Activity Type",
        value : model.predictionsType ? model.predictionsType.value : "--"
      },
      {
        name : "Predictions Activity Units",
        value : model.predictionsUnits ? model.predictionsUnits.value : "--"
      },
    ];

    const trainingParams = [
      {
        name : "Activity Set",
        value : trainingStrategy.activitySet ? trainingStrategy.activitySet.name : "--"
      },
      {
        name : "Activity Type",
        value : trainingStrategy.activityType ? trainingStrategy.activityType.value : "--"
      },
      {
        name : "Activity Threshold",
        value : trainingStrategy.activityThreshold && trainingStrategy.mode.name === 'classification'  ? trainingStrategy.activityThreshold : "--"
      },
      {
        name : "Embeddings",
        value : trainingStrategy.embeddings.map((desc) => `${desc.name}`).join(";")
      }
    ];
    if (trainingStrategy.modelledActivityType) {
      trainingParams.push({
        name : "Modelled Activity Type",
        value : trainingStrategy.modelledActivityType.value
      });
      trainingParams.push({
        name : "Modelled Activity Units",
        value : trainingStrategy.modelledActivityUnits ? trainingStrategy.modelledActivityUnits.value : 'No dimension.'
      })
    }

    const validationStrategies = model.validationStrategies;
    const validationParams = [];
    if (validationStrategies) {
      validationParams.push({
        name : "CV-folds",
        value : validationStrategies.cvFolds
      });
      validationParams.push({
          name : "Validation Set Size",
          value : validationStrategies.validSetSize
      });
    }

    const tabs = [
      {
        title : "Info",
        renderedComponent : (props) =>
          <ModelInfoTab
            {...props}
            extraTrainingParams={trainingParams}
            extraValidationParams={validationParams}
            modelData={modelData}
          />
      },
      {
        title: "Performance"
        , renderedComponent : (props) =>
          <ModelPerformance
            {...props}
            component={QSARPerformanceOverview}
          />
      },
      {
        title: "Predictions"
        , renderedComponent : ModelPreds
      }
    ];

    return <ModelCard {...props} tabs={tabs}/>
}

export default QSARModelCard;
import React from "react";
import { Col, Row} from 'reactstrap';
import {ComponentWithPagedResources} from "../../../index";

const ModelPerformance = (props) => {
  const getPerfValuesForMetric = (performanceInfo, className, metric, index) => {
    const ret = [];
    performanceInfo.forEach(
      perf => {
        if ((metric ? (perf.metric === metric || perf.metric === (metric + "_score")) : true)
            && (className === "ModelPerformanceCV" ? perf.extraArgs.validationStrategyIndex === index : true)
          && perf.className === className) {
          ret.push(perf);
        }
      }
    );
    return ret;
  };

  const getPerfMatrix = (performanceInfo, className, metrics, index) => {
    const ret = {};
    metrics.forEach(
      metric => {
        ret[metric] = getPerfValuesForMetric(performanceInfo, className, metric, index);
      });
    return ret;
  };

  const SummaryComponent = props.component;

  return (
    <Row>
      <Col sm="12">
        <ComponentWithPagedResources
          definition={{
            performance: new URL('performance', props.modelUrl)
          }}
          updateInterval={2000}
          updateCondition={() => {
            return props.tasks.running.length > 0;
          }}
        >
          {
            (data, allLoaded, revision) => {
              if (!SummaryComponent) {
                return props.render(data.performance, allLoaded, revision, getPerfMatrix, getPerfValuesForMetric)
              } else {
                return (
                  <SummaryComponent
                    {...props}
                    {...data}
                    performanceDataComplete={allLoaded}
                    performanceDataRevision={revision}
                    getPerfMatrix={getPerfMatrix}
                    getPerfValuesForMetric={getPerfValuesForMetric}
                  />
                )
              }
            }
          }
        </ComponentWithPagedResources>
      </Col>
    </Row>
  );
};

export default ModelPerformance;

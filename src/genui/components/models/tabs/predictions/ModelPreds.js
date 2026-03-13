import React from "react"
import { Button, Col, Row, Table } from 'reactstrap';
import { ComponentWithObjects } from '../../../../index';
import PredictionsCreateForm from './PredictionsCreateForm';

function PredsList(props) {
  const activitySets = props.activitySets;
  const molsets = props.molsets;
  return (
    activitySets.length > 0 ? (
      <div className="model-predictions-list">
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Compounds</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {
            activitySets.map(set => {
              const molset = molsets.find(item => item.id === set.molecules);
              return (
                <tr key={set.id}>
                  <th scope="row">{set.name}</th>
                  <td>{molset.name}</td>
                  <td>
                    <Button color="danger" onClick={() => props.handleDeleteActivitySet(set.className, set)}> <i className="fa fa-close"/>Delete</Button>
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </Table>

    </div>
    ) : <p>No predictions, yet. You can create one below.</p>
  )
}

function ModelPredsPage(props) {
  return (
    <React.Fragment>
      <Row>
        <Col sm="12">
          <h4>Existing Predictions</h4>
          <PredsList {...props}/>
        </Col>
      </Row>
      <Row>
        <Col sm="12">
          <h4>Create New Predictions</h4>
          <PredictionsCreateForm {...props}/>
        </Col>
      </Row>
    </React.Fragment>
  )
}

function ModelPreds(props) {
  let molsets = [];
  Object.keys(props.compoundSets).forEach(csetClass => {
    molsets = molsets.concat(props.compoundSets[csetClass]);
  });
  const defaultClass = "ModelActivitySet";
  const listUrl = new URL(`models/${props.model.id}/predictions/`, props.apiUrls.qsarRoot);
  return (
    <ComponentWithObjects
      objectListURL={listUrl}
      emptyClassName={defaultClass}
      currentProject={props.currentProject}
      customDelete={(className, toDelete) => {
        const url = new URL(`${toDelete.id}/`, props.apiUrls.activitySetsRoot);
        fetch(url, {method: 'DELETE', credentials: "include",})
          .catch(
            (error) => console.log(error)
          );
      }}
      render={
        (
          activitySets,
          handleAddActivitySetList,
          handleAddActivitySet,
          handleDeleteActivitySet,
        ) => {
          return (<ModelPredsPage
            {...props}
            molsets={molsets}
            predictionsListUrl={listUrl}
            defaultClass={defaultClass}
            activitySets={activitySets[defaultClass]}
            handleAddActivitySet={handleAddActivitySet}
            handleDeleteActivitySet={handleDeleteActivitySet}
          />)
        }
      }
    />
  );
}
export default ModelPreds;
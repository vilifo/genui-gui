import {
    MolsetActivitiesSummary,
    ModelCardNewDefault,
    SimpleDropDownToggle,
} from '../../../genui';
import React from 'react';
import {Button, CardBody, CardHeader, Col, Row, CardFooter} from 'reactstrap';

function EndpointSelector(props) {
    return <MolsetActivitiesSummary {...props} selectable={true}
                                    message="Choose the desired activity endpoint by clicking the corresponding row in the table below. The chosen activity type from the given activity set will be used as the output variable for the resulting model."/>
}

export default function QSARModelCreateDefaultCard(props) {
    let molsets = [];
    Object.keys(props.compoundSets).forEach(
        (key) => molsets = molsets.concat(props.compoundSets[key])
    );

    const [molset, setMolset] = React.useState(null);
    const [endpointData, setEndpointData] = React.useState(null);
    const [dataReady, setDataReady] = React.useState(false);

    return !dataReady ? (
        <React.Fragment>
            <CardHeader>QSAR Training Set and Activity Endpoint</CardHeader>
            <CardBody className="scrollable">
                <SimpleDropDownToggle
                    items={molsets}
                    onSelect={setMolset}
                    message={() => <p>You have to choose a training set. You can choose any compound set in the current
                        project.</p>}
                    title="Choose Training Set"
                    header="Available Compound Sets"
                />

                {
                    molset ? (
                        <React.Fragment>
                            <hr/>
                            <Row>
                                <Col sm={12}>
                                    <EndpointSelector {...props} molset={molset} onSelect={setEndpointData}/>
                                </Col>
                            </Row>
                        </React.Fragment>
                    ) : null
                }
            </CardBody>

            {
                molset && endpointData ? (
                    <CardFooter>
                        <Row>
                            <Col sm={8}>
                                <p>Selected endpoint: {endpointData.name}</p>
                            </Col>
                            <Col sm={4}>
                                <Button color="primary" onClick={() => setDataReady(true)}>Next: Model
                                    Parameters</Button>
                            </Col>
                        </Row>
                    </CardFooter>
                ) : null
            }
        </React.Fragment>
    ) : (
        <ModelCardNewDefault
            {...props}
            molsets={[molset]}
            activitySets={[endpointData.activitySet]}
            activityTypes={[endpointData.type]}
            endpointData={endpointData}
            onValuesInit={(values, state) => {
                if (state.modes) {
                    const mode = state.modes[0];
                    if (mode.name === "classification") {
                        values.predictionsType = "Active Probability"
                    }
                }
                return values;
            }
        }
        />
    )
}

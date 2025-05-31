import {Col, Progress, Row} from 'reactstrap';
import SelectedList from './SelectedList';
import React from 'react';

const SelectedListPage = (props) => {
    //eslint-disable-next-line no-unused-vars
    const shouldUpdate = (prevProps, nextProps) => {
        return nextProps.moleculeSelection.revision !== prevProps.moleculeSelection.revision
            || nextProps.selectedMolsInMap.length !== prevProps.selectedMolsInMap.length;
    };

    return (
        <React.Fragment>
            <Row>
                <Col sm={12}>
                    {
                        props.moleculeSelection.mols.length > 0 ? (
                            props.selectedMolsInMapLoaded ? (
                                <SelectedList {...props} mols={props.selectedMolsInMap}/>
                            ) : (
                                <React.Fragment>
                                    <div>Fetching selected
                                        compounds: {props.selectedMolsInMap.length}/{props.moleculeSelection.molsCount}</div>
                                    <Progress color="info"
                                              value={100 * props.selectedMolsInMap.length / props.moleculeSelection.molsCount}/>
                                </React.Fragment>
                            )
                        ) : <p>No compounds selected in the map.</p>
                    }
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default SelectedListPage
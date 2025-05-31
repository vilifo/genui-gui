import {Card, CardBody, Col, Row} from 'reactstrap';
import React from 'react';
import {CompoundOverview, MoleculeProvider} from '../../../../genui';
import ChemSpacePlotFromFile from "./ChemSpacePlotFromFile";

function MapPage(props) {
    const [hoverMol, setHoverMol] = React.useState(null);
    const [hoverOverview, setHoverOverview] = React.useState(null);

    const handleMolHover = (mol, point) => {
        if (!hoverMol || (mol !== hoverMol)) {
            setHoverMol(mol);
            setHoverOverview(() => {
                return (currentProps) => (
                        <MoleculeProvider {...currentProps} molID={mol}>
                            {(mol) => <CompoundOverview {...currentProps} mol={mol} showImage={true}/>}
                        </MoleculeProvider>
                    );
            });
        }
    };
    const selectedMap = props.selectedMap;
    const HoverOverview = hoverOverview;
    return (
        selectedMap ? (
            <Row>
                <Col md={8} sm={8}>
                    <Card>
                        <CardBody>
                            <ChemSpacePlotFromFile
                                {...props}
                                map={selectedMap}
                                onMolHover={handleMolHover}
                            />
                        </CardBody>
                    </Card>
                </Col>

                <Col md={4} sm={4}>
                    {hoverOverview ? (
                        <HoverOverview {...props} map={ selectedMap} />
                    ) : <div><p>Hover over a point in the map to see compound details. If there is only one molecule
                        in your selection, it will also be shown here.</p></div>}
                </Col>
            </Row>
        ) : <div>Select a map to display from the menu.</div>
    );
}
export default MapPage;
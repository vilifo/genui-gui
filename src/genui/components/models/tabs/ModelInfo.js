import React from "react";
import {Col, ListGroup, ListGroupItem, Row, Table} from 'reactstrap';
import {
    TableDataFromItems,
    TableHeaderFromItems,
    DownloadFile,
    ComponentWithResources,
} from '../../../index';

function FileList(props) {
    const files = props.files;
    const mainFile = files.find(file => file.kind === "main");

    return (
        <Row>
            <Col sm={files.length > 1 ? 6 : 12}>
                {
                    mainFile && mainFile.file ? (
                        <React.Fragment>
                            <h4>Model File</h4>
                            <ListGroup>
                                <ListGroupItem>
                                    <DownloadFile
                                        file={mainFile.file}
                                        name={`${mainFile.note}_${mainFile.file.split("_").slice(-1)[0]}`}
                                    />
                                </ListGroupItem>
                            </ListGroup>
                        </React.Fragment>
                    ) : null
                }
            </Col>
            <Col sm={6}>
                {
                    files.length > 1 ? (
                        <React.Fragment>
                            <h4>Auxiliary Files</h4>
                            <ListGroup>
                                {
                                    files.map((file) => {
                                        if (file.kind === "aux") {
                                            return (
                                                <ListGroupItem key={file.id}>
                                                    <DownloadFile
                                                        file={file.file}
                                                        name={`${file.note}_${file.file.split("_").slice(-1)[0]}`}
                                                    />
                                                </ListGroupItem>
                                            )
                                        } else {
                                            return null;
                                        }
                                    })
                                }
                            </ListGroup>
                        </React.Fragment>
                    ) : null
                }
            </Col>
        </Row>
    )
}

function ModelFiles(props) {
    return (
        <ComponentWithResources
            definition={{files: new URL(`${props.model.id}/files/`, props.listURL)}}
            updateInterval={5000}
            fetchCondition={() => props.tasksRunning}
        >
            {
                (filesLoaded, files) => {
                    return filesLoaded ? <FileList files={files.files}/> : null
                }
            }
        </ComponentWithResources>
    )
}

function ModelInfo({
                       model,
                       modelData,
                       extraTrainingParams,
                       extraValidationParams,
                       modelUrl,
                       extraInfoComponent,
                       ...props
                   }) {
    const trainingStrategy = model.trainingStrategy;

    const trainingParams = (trainingStrategy ? [
        {
            name: "Algorithm",
            value: trainingStrategy.algorithm.name
        },
        {
            name: "Parameters",
            value: trainingStrategy.parameters.map((param) => `${param.parameter.name}=${param.value}`).join(";")
        },
        {
            name: "Mode",
            value: trainingStrategy.mode.name
        },
    ] : []).concat(extraTrainingParams || []);

    const validationStrategies = model.trainingStrategy.validationStrategies;
    const validationParams = (validationStrategies ? validationStrategies.map((validationStrategy) => [
        {
            name: "Data Split",
            value: `${validationStrategy.dataSplit}`
        },
        {
            name: "Cross Validation Folds",
            value: validationStrategy.cvFolds
        },
        {
            name: "Metrics",
            value: validationStrategy.metrics.map((metric) => `${metric.name}`).join(";")
        }
    ]) : []).concat(extraValidationParams || []);

    const ExtraInfoComponent = extraInfoComponent;

    return (
        <Row>
            <Col sm="12">
                {model.description && (
                    <React.Fragment>
                        <h4>Description</h4>
                        <p>{model.description}</p>
                    </React.Fragment>
                )}

                {modelData && (
                    <React.Fragment>
                        <h4>Model Data</h4>
                        <div style={{overflowX: "auto", maxWidth: "90%"}}>
                        <Table size="sm">
                            <TableHeaderFromItems
                                items={["Item", "Value"]}
                            />
                            <TableDataFromItems
                                items={modelData}
                                dataProps={["value"]}
                                rowHeaderProp="name"
                            />
                        </Table>
                        </div>
                    </React.Fragment>
                )}

                <h4>Training Settings</h4>
                <div style={{overflowX: "auto", maxWidth: "90%"}}>
                    <Table size="sm">
                        <TableHeaderFromItems
                            items={["Parameter", "Value"]}
                        />
                        <TableDataFromItems
                            items={trainingParams}
                            dataProps={["value"]}
                            rowHeaderProp="name"
                        />
                    </Table>
                </div>

                <h4>Validation Settings</h4>
                <div style={{overflowX: "auto", maxWidth: "90%"}}>
                {validationParams.length > 0 ? (
                    validationParams.map((validationParams, index) => (
                        <React.Fragment key={index}>
                            <h5>Validation Strategy {index + 1}</h5>
                            <Table size="sm">
                                <TableHeaderFromItems
                                    items={["Parameter", "Value"]}
                                />
                                <TableDataFromItems
                                    items={validationParams}
                                    dataProps={["value"]}
                                    rowHeaderProp="name"
                                />
                            </Table>
                        </React.Fragment>
                    ))
                ) : (
                    <p>No validation data available for this model.</p>
                )}
                </div>

                <ModelFiles
                    model={model}
                    {...props}
                />
                <br/>

                <h4>Useful API URLs</h4>
                <a href={modelUrl.toString()} target="_blank" rel="noopener noreferrer">{modelUrl.toString()}</a>

                {extraInfoComponent && <ExtraInfoComponent model={model} modelUrl={modelUrl} {...props} />}
            </Col>
        </Row>
    );
}

export default ModelInfo;
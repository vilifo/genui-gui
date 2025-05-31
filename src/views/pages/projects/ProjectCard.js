import React from 'react';
import {Button, CardBody, CardFooter, CardHeader, CardSubtitle} from 'reactstrap';

export const ProjectCard = (props) => {
    const [project] = React.useState(props.project);
    const [created] = React.useState(new Date(project.created));
    const [updated] = React.useState(new Date(project.updated));

    return (
        <React.Fragment>
            <CardHeader>{project.name}</CardHeader>
            <CardBody className="scrollable">
                <CardSubtitle>
                    <p>
                        Created: {
                        created.toLocaleDateString()
                        + ' – ' + created.toLocaleTimeString()
                    }
                        <br/>
                        Last Update: {
                        updated.toLocaleDateString()
                        + ' – ' + updated.toLocaleTimeString()
                    }
                    </p>
                </CardSubtitle>
                <p>
                    {project.description}
                </p>
            </CardBody>
            <CardFooter>
                <Button color="success" onClick={() => {
                    props.openProject(project);
                }}>Open</Button> <Button color="danger"
                                         onClick={() => props.deleteProject(project)}>Delete</Button>
            </CardFooter>
        </React.Fragment>
    );
}
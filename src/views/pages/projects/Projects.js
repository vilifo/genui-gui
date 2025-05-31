import React from 'react';
import {Card, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown} from 'reactstrap';
import {ResponsiveGrid} from '../../../genui/';
import {CreateNewCard} from './CreateNewCard';
import {ProjectCard} from './ProjectCard';

function HeaderNav(props) {
    return (<UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
            Actions
        </DropdownToggle>
        <DropdownMenu>
            <DropdownItem onClick={() => document.getElementById("new-proj-card").scrollIntoView()}>New
                Project</DropdownItem>
            <DropdownItem divider/>
            <UncontrolledDropdown>
                <DropdownToggle nav>Open...</DropdownToggle>
                <DropdownMenu>
                    {
                        props.projects.map(project =>
                            (<DropdownItem
                                key={project.id}
                                onClick={() => {
                                    props.openProject(project)
                                }}
                            >
                                {project.name}
                            </DropdownItem>)
                        )
                    }
                </DropdownMenu>
            </UncontrolledDropdown>
        </DropdownMenu>
    </UncontrolledDropdown>)
}

const Projects = React.forwardRef((props, ref) => {
    const [projects, setProjects] = React.useState([]);
    const [creating, setCreating] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetchUpdates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchUpdates = () => {
        fetch(props.apiUrls.projectList, {
            credentials: "include",
            "headers": {
                "Accept": "application/json",
            },
            "method": "GET"
        })
            .then(response => response.json())
            .then(updateProjectRoutes)
    };

    const updateProjectRoutes = (data) => {
        const projectsInner = [];
        data.forEach(
            (project) => {
                const url = '/projects/' + project.id + '/';
                projectsInner.push(Object.assign({url: url}, project))
            }
        );

        // activateProject(projects[0]);

        setProjects(projectsInner);
        setIsLoading(false);
        props.setPageHeader(<HeaderNav {...props} projects={projects}/>);
    };

    const handleCreate = (values) => {
        setCreating(true);
        fetch(
            props.apiUrls.projectList
            , {
                method: 'POST'
                , body: JSON.stringify(values)
                , headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include"
            }
        ).then(response => response.json()).then(
            data => {
                let new_project = Object.assign({url: `/projects/${data.id}`}, data);
                setCreating(false);
                props.openProject(new_project);
            }
        )
        ;
    };

    if (isLoading) {
        return <div>Loading...</div>
    }

    const project_cards = projects.map(project => ({
        id: project.id,
        h: {"md": 3, "sm": 3},
        w: {"md": 1, "sm": 1},
        minH: {"md": 3, "sm": 3},
        data: project
    }));
    const new_project_card = {
        id: "new-project",
        h: {"md": 4, "sm": 4},
        w: {"md": 1, "sm": 1},
        minH: {"md": 4, "sm": 4},
        data: {}
    };
    // console.log(project_cards.concat(new_project_card));
    return (
        creating ? <div>Loading...</div> : <ResponsiveGrid
            items={project_cards.concat(new_project_card)}
            rowHeight={75}
            mdCols={2}
            smCols={1}
            gridID="projects-grid-layout"
            ref={ref}
        >
            {
                project_cards.map(item =>
                    <div key={item.id.toString()}>
                        <Card>
                            <ProjectCard {...props} project={item.data} deleteProject={project => {
                                props.deleteProject(project, fetchUpdates)
                            }}/>
                        </Card>
                    </div>
                ).concat([
                    (
                        <div key="new-project" id="new-proj-card">
                            <Card>
                                <CreateNewCard handleCreate={handleCreate}/>
                            </Card>
                        </div>
                    )
                ])
            }
        </ResponsiveGrid>
    )
});

export default Projects;
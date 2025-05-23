import React, { useState } from 'react';
import { Button, CardBody, CardFooter, CardHeader } from 'reactstrap';
import {ProjectItemSubTitle, TabWidget} from '../../index';

const ModelCard = (props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const { model, listURL, taskInfo, tasks, apiUrls, modelClass, onModelDelete, tabs } = props;
  const modelUrl = new URL(`${model.id}/`, listURL);

  return (
    <React.Fragment>
      <CardHeader>{model.name}</CardHeader>

      <CardBody className="scrollable">
        <ProjectItemSubTitle
          tasks={taskInfo.tasksExist ? tasks : null}
          progressURL={apiUrls.celeryProgress}
          item={model}
        />
        <TabWidget {...props} modelUrl={modelUrl} tabs={tabs}/>
      </CardBody>

      <CardFooter>
        <Button color="danger" disabled={isDeleting} onClick={() => {
          setIsDeleting(true);
          onModelDelete(modelClass, model);
        }}>Delete</Button>
      </CardFooter>
    </React.Fragment>
  );
};

export default ModelCard;

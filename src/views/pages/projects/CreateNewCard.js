import React from 'react';
import { CardBody, CardHeader } from 'reactstrap';
import { CreateNewForm } from './CreateNewForm';

export const CreateNewCard = (props) => {
    return (
      <React.Fragment>
        <CardHeader>Create New Project</CardHeader>
        <CardBody className="scrollable">
          <CreateNewForm {...props}/>
        </CardBody>
      </React.Fragment>
    );
}
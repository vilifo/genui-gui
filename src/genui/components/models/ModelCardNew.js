import React, { useState } from 'react';
import { CardBody, CardHeader, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import ModelFormRenderer from './ModelFormRenderer';
import ModelFormCardBody from './ModelFormCardBody';
import FormikModelForm from './FormikModelForm';

const ModelCardNew = (props) => {
  const [algorithm, setAlgorithm] = useState(props.chosenAlgorithm);

  const newModelFromFormData = (data) => {
    if (props.prePost) {
      data = props.prePost(data);
    }
    if (data.hasOwnProperty("modelFile")) {
      data.build = false;
      postModelData(data, postFiles(data));
    } else {
      data.build = true;
      postModelData(data);
    }
  };

  const postFiles = (originalFormData) => {
    // console.log(originalFormData);
    return (modelData) => {
      const modelID = modelData.id;

      const datas = [];
      // let nFiles = 0;
      for (let name in originalFormData) {
        if (originalFormData.hasOwnProperty(name)) {
          const data = originalFormData[name];

          if (data instanceof File) {
            // nFiles++;
            let formData = new FormData();
            // TODO: add support for file notes to the form
            if (name === "modelFile") {
              formData.append("kind", "main");
            } else {
              formData.append("kind", "aux");
            }
            formData.append("file", data);
            formData.append("model", modelID);
            if (originalFormData[`${name}_note`]) {
              formData.append("note", originalFormData[`${name}_note`]);
            }

            datas.push(formData);
            // console.log(formData);
          }
        }
      }

      const filesUrl = new URL(`${modelID}/files/`, props.listURL);
      datas.forEach((data) => {
        fetch(filesUrl, {
          method: 'POST',
          body: data,
          credentials: "include",
        })
          .then(resp => props.handleResponseErrors(resp, "Uploading file failed."))
          // .then(data => {
            // TODO: use this to inform the user about upload progress before elevating the state change to parent with "props.handleAddModel"
          // })
          .catch(err => console.log(err)); // TODO: record an error for this file in state
      });

      return modelData;
    }
  };

  const postModelData = (data, afterModelPOST) => {
    fetch(
      props.listURL
      , {
        method: 'POST'
        , body: JSON.stringify(data)
        , headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      }
    ).then((data) => props.handleResponseErrors(data, "Creating model failed. Data wrong or incomplete?"))
      .then(modelData => {
        if (afterModelPOST) {
          return afterModelPOST(modelData);
        }
        return modelData;
      })
      .then(
        modelData => {
          props.handleCreate(props.modelClass, modelData); // TODO: check if uploads finished fine before delegating
        }
      ).catch(
      error => console.log(error)
    );
  };

  // if (nUploads > 0 && !uploadFinished) {
  //   return <div>Uploading files...</div>
  // }

  return (
    algorithm ? (
      <React.Fragment>
        <CardHeader>Create New {algorithm.name} Model</CardHeader>
        <ModelFormRenderer
          {...props}
          chosenAlgorithm={algorithm}
          component={props => <ModelFormCardBody {...props} form={props.form ? props.form : FormikModelForm}/>}
          handleCreate={newModelFromFormData}
          project={props.currentProject}
          formNameSuffix="create"
        />
      </React.Fragment>
    ) : (
      <React.Fragment>
        <CardHeader>Select Algorithm</CardHeader>
        <CardBody>
          <UncontrolledDropdown>
            <DropdownToggle caret color="primary">Choose Algorithm</DropdownToggle>
            <DropdownMenu>
              {
                props.algorithmChoices.map(item => <DropdownItem key={item.id} onClick={() => setAlgorithm(item)}>{item.name}</DropdownItem>)
              }
            </DropdownMenu>
          </UncontrolledDropdown>
        </CardBody>
      </React.Fragment>
    )
  );
};

export default ModelCardNew;

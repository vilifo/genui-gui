import React from 'react';
import { Col, FormGroup, Input, Label } from 'reactstrap';
import { Field } from 'formik';
import {EmbeddingsField, FieldErrorMessage} from '../../../../genui';

export function MapTrainFields(props) {
  const trainingStrategyPrefix = props.trainingStrategyPrefix;
  const formikProps = props.formikProps;

  return (
    <React.Fragment>
      <FormGroup>
        <Label htmlFor={`${trainingStrategyPrefix}.embeddings`}>Embeddings</Label>
        <p>
          Choose one or more embeddings to use in the calculations.
        </p>
          <EmbeddingsField
              {...props}
              description="Choose one or more embeddings to use in the calculations."
              trainingStrategyPrefix={trainingStrategyPrefix}
              formikProps={formikProps}
          />
      </FormGroup>
      <FieldErrorMessage name={`${trainingStrategyPrefix}.embeddings`}/>
    </React.Fragment>
  )
}

export function MapExtraFields(props) {
  const molsets = props.molsets;

  return (
    <React.Fragment>
      <FormGroup row>
        <Label htmlFor="molsets" sm={4}>Compound Sets</Label>
        <Col sm={8}>
          <Field name="molsets" as={Input} type="select" multiple>
            {
              molsets.map(molset => (
                <option key={molset.id} value={molset.id}>
                  {molset.name}
                </option>
              ))
            }
          </Field>
        </Col>
      </FormGroup>
      <FieldErrorMessage name="molsets"/>
    </React.Fragment>
  )
}
import React from 'react';
import {Button, CardBody, CardFooter} from 'reactstrap';

const ModelFormCardBody = (props) => {
    const [formIsSubmitting, setFormIsSubmitting] = React.useState(false);
    const Form = props.form;

    return (
        <React.Fragment>
            <CardBody className="scrollable">
                <Form
                    {...props}
                    onSubmit={
                        (values) => {
                            setFormIsSubmitting(true);
                            props.handleCreate(values);
                        }
                    }
                />
            </CardBody>
            <CardFooter>
                <Button form={`${props.modelClass}-${props.formNameSuffix}-form`} type="submit" color="primary"
                        disabled={formIsSubmitting}>{formIsSubmitting ? "Creating..." : "Create"}</Button>
            </CardFooter>
        </React.Fragment>
    )
}

export default ModelFormCardBody;
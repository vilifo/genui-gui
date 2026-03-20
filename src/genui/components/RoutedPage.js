import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import PageAlertContext from '../../vibe/components/PageAlert/PageAlertContext';
import '../styles.css';

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const RoutedPage = (props) => {
  const {
    component: ComponentToRender,
    setPageHeader,
    setPageTitle,
    title,
    setPageHeaderTitle,
    currentProject,
  } = props;

  const [notFound, setNotFound] = useState(false);
  const { setAlert } = useContext(PageAlertContext);

  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const projectName = currentProject && title !== 'Projects' ? ` (${currentProject.name})` : '';

  useEffect(() => {
    setPageTitle(title + projectName);
    setPageHeaderTitle(title + projectName);
    setPageHeader(null);
  }, [title, setPageHeader, setPageTitle, setPageHeaderTitle, projectName]);

  const showAlert = useCallback((message, severity = 'danger') => {
    if (setAlert) {
      setAlert(message, severity);
    }
  }, [setAlert]);

  const handleResponseErrors = useCallback((
      response,
      message = 'Failed to fetch data from backend.',
      shouldShowAlert = false,
      callback = null
  ) => {
    if (!response.ok) {
      if (shouldShowAlert) {
        showAlert(message);
      }
      response.json()
          .then(data => {
            if (callback) {
              callback(data);
            }
          })
          .catch(e => console.log(e));
      throw new Error(message);
    } else {
      return response.json();
    }
  }, [showAlert]);

  const retryAction = useCallback((action, message = '', severity = 'danger', interval = 5000) => {
    if (message) {
      showAlert(`${message} (retrying in ${interval / 1000} seconds)`, severity);
    }
    console.log(`${message} Retrying in ${interval / 1000} seconds...`);

    sleep(interval).then(action);
  }, [showAlert]);

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  const routerProps = { params, navigate, location };

  return (
      <ComponentToRender
          {...props}
          router={routerProps}
          retryAction={retryAction}
          handleResponseErrors={handleResponseErrors}
          setNotFound={setNotFound}
      />
  );
};

export default RoutedPage;
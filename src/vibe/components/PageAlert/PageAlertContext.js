import React, { useState } from 'react';

const PageAlertContext = React.createContext();

export const PageAlertProvider = ({ children }) => {
  const [alert, setAlertState] = useState(null);

  const setAlert = (message, type) => {
    const newAlert = { message, type };
    setAlertState(newAlert);
  };

  const closeAlert = () => {
    setAlertState(null);
  };

  return (
    <PageAlertContext.Provider
      value={{
        alert,
        closeAlert,
        setAlert,
      }}
    >
      {children}
    </PageAlertContext.Provider>
  );
};

export default PageAlertContext;

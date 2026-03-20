import React, { useState } from 'react';

const PageLoaderContext = React.createContext();

export function PageLoaderProvider (props){
  const [percent, setPercent] = useState(0);

  const loadPage = () => {
    setPercent(1);
    setTimeout(() => {
      setPercent(5);
    }, 500);
    setTimeout(() => {
      setPercent(10);
    }, 1000);
    setTimeout(() => {
      setPercent(12);
    }, 1500);
    setTimeout(() => {
      setPercent(20);
    }, 2000);
    setTimeout(() => {
      setPercent(100);
    }, 2400);
  };

    return (
      <PageLoaderContext.Provider
        value={{
          percent: percent,
          setPercent: setPercent,
          loadPage: loadPage
        }}>
        {props.children}
      </PageLoaderContext.Provider>
    );
}

export default PageLoaderContext;

import React from 'react';
import withUnmounted from '@ishawnwang/withunmounted';

const ComponentWithResources = React.forwardRef((props, ref) => {
  const [allLoaded, setAllLoaded] = React.useState(false);
  const [data, setData] = React.useState({});
  const intervalIDs = React.useRef({});
  const prevDefinitionRef = React.useRef(props.definition);
  const abortControllers = React.useRef({});
  const hasUnmounted = React.useRef(false);
  const method = props.method ? props.method : 'GET';
  const interval = props.updateInterval ? props.updateInterval : null;

  React.useEffect(() => {
    const currentIntervals = intervalIDs.current;
    const currentAbortControllers = abortControllers.current;

    updateResources();

    return () => {
      Object.keys(currentIntervals).forEach(ID => clearTimeout(currentIntervals[ID]));
      Object.values(currentAbortControllers).forEach(controller => controller.abort());
      hasUnmounted.current = true;
    };
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (props.updateCondition && props.updateCondition(props, props)) {
      updateResources();
    }

    if (Object.keys(prevDefinitionRef.current).length !== Object.keys(props.definition).length) {
      // TODO: add a more sophisticated comparison
      updateResources();
    }
    prevDefinitionRef.current = props.definition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  const updateResources = () => {
    setAllLoaded(false);
    setData({});

    for (let [name, url] of Object.entries(props.definition)) {
      fetchResource(name, url);
      if (interval) {
        clearTimeout(intervalIDs.current[name]);
        intervalIDs.current[name] = null;
        checkForUpdates(name);
      }
    }
  };

  const checkForUpdates = (name) => {
    intervalIDs.current[name] = setTimeout(() => checkForUpdates(name), interval);

    if (props.fetchCondition && !props.fetchCondition(props)) {
      return;
    }

    if (allLoaded) {
      // console.log(name, "fetching");
      fetchResource(name, props.definition[name]);
    }
  };

  const fetchResource = (name, url) => {
    // Abort previous request if exists
    if (abortControllers.current[name]) {
      abortControllers.current[name].abort();
    }

    // Create new controller for this request
    abortControllers.current[name] = new AbortController();

    fetch(url, {
      signal: abortControllers.current[name].signal,
      credentials: "include",
      method: method
    })
        .then(response => response.json())
        .then((newData) => {
          if (hasUnmounted.current) {
            return;
          }

          setData(prevData => {
            const updatedData = { ...prevData, [name]: newData };
            if (Object.keys(updatedData).length === Object.keys(props.definition).length) {
              setAllLoaded(true);
            }
            return updatedData;
          });
        })
        .catch(e => {
          if (e.name === 'AbortError') {
            return; // Ignore abort errors
          }
          console.error(e);
        });
  };

  return props.children(allLoaded, data, name => fetchResource(name, props.definition[name]));
});

export default withUnmounted(ComponentWithResources);
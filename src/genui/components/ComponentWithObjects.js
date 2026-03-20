import React, { useState, useEffect, useRef, useCallback } from "react";

const ComponentWithObjects = (props) => {
  const {
    objectListURL,
    emptyClassName,
    commitObjects,
    currentProject,
    customDelete,
    render,
  } = props;

  if (!emptyClassName) {
    throw new Error(
        "Unspecified empty class name for ComponentWithObjects. This is required. Specify a default name if class cannot be determined from data."
    );
  }

  const [objects, setObjects] = useState({ [emptyClassName]: [] });

  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);
  const stableURL = objectListURL ? objectListURL.toString() : "";
  const projectId = currentProject ? currentProject.id : null;

  const fetchObjects = useCallback(
      (projId) => {
        if (!projId) return;

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const params = new URLSearchParams();
        params.append("project_id", projId);

        fetch(`${stableURL}?${params.toString()}`, {
          signal: controller.signal,
          credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
              if (!isMounted.current) return;

              const newObjects = { [emptyClassName]: [] };

              for (const obj of data) {
                const className = obj.className || emptyClassName;
                if (!newObjects[className]) {
                  newObjects[className] = [];
                }
                newObjects[className].push(obj);
              }

              setObjects(newObjects);
            })
            .catch((error) => {
              if (error.name !== "AbortError") {
                console.log(error);
              }
            });
      },
      [stableURL, emptyClassName]
  );

  useEffect(() => {
    isMounted.current = true;

    if (projectId) {
      fetchObjects(projectId);
    }

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId, fetchObjects]);

  const addToObjects = (className, data) => {
    setObjects((prev) => ({
      ...prev,
      [className]: [data, ...(prev[className] || [])],
    }));
  };

  const handleAddObject = (className, data) => {
    if (commitObjects) {
      fetch(objectListURL.toString(), {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      })
          .then((response) => response.json())
          .then((addedData) => {
            addToObjects(className, addedData);
          })
          .catch((error) => console.log(error));
    } else {
      addToObjects(className, data);
    }
  };

  const handleAddObjectList = (className, objectList, overwrite = false) => {
    setObjects((prev) => {
      const updatedObjects = { ...prev };

      if (overwrite || !updatedObjects[className]) {
        updatedObjects[className] = [...objectList];
      } else {
        // Emulates the old .concat() safely
        updatedObjects[className] = [...objectList, ...updatedObjects[className]];
      }

      return updatedObjects;
    });
  };

  const deleteFromState = (className, object) => {
    setObjects((prev) => {
      if (!prev[className]) return prev;

      // Emulates the old .splice() safely using .filter()
      const filteredItems = prev[className].filter((item) => item.id !== object.id);

      return {
        ...prev,
        [className]: filteredItems,
      };
    });
  };

  const handleObjectDelete = (className, object) => {
    if (customDelete) {
      customDelete(className, object);
      deleteFromState(className, object);
    } else {
      fetch(`${objectListURL}${object.id}/`, {
        method: "DELETE",
        credentials: "include",
      })
          .then(() => {
            deleteFromState(className, object);
          })
          .catch((error) => console.log(error));
    }
  };

  const requestObjectsUpdate = () => {
    if (projectId) {
      fetchObjects(projectId);
    }
  };

  // 6. Render
  if (!objects) {
    return <div>Loading...</div>;
  }

  return (
      <React.Fragment>
        {render(
            objects,
            handleAddObjectList,
            handleAddObject,
            handleObjectDelete,
            requestObjectsUpdate
        )}
      </React.Fragment>
  );
};

export default ComponentWithObjects;
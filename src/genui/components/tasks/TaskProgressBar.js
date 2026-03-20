import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Progress } from 'reactstrap';

const TaskProgressBar = ({ tasks, progressURL }) => {
  const [progressData, setProgressData] = useState([]);

  const isMounted = useRef(true);
  const abortControllers = useRef(new Set());

  const updateProgress = useCallback(async () => {
    if (!tasks || tasks.length === 0) return;

    const controller = new AbortController();
    abortControllers.current.add(controller);

    try {
      const fetchPromises = tasks.map((task) => {
        const url = new URL(`${task.task_id}/`, progressURL);

        return fetch(url, {
          credentials: "include",
          signal: controller.signal
        })
            .then((response) => response.json())
            .then((data) => ({
              ...data,
              task: task,
            }))
            .catch((e) => {
              if (e.name !== 'AbortError') console.error(e);
              return null;
            });
      });

      const results = await Promise.all(fetchPromises);

      if (isMounted.current) {
        const validResults = results.filter(Boolean);
        setProgressData(validResults);
      }
    } finally {
      abortControllers.current.delete(controller);
    }
  }, [tasks, progressURL]);

  useEffect(() => {
    isMounted.current = true;
    const currentControllers = abortControllers.current;

    updateProgress();

    const intervalId = setInterval(updateProgress, 2000);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      currentControllers.forEach((controller) => controller.abort());
    };
  }, [updateProgress]);

  if (!tasks || tasks.length === 0) {
    return null;
  }

  const sortedProgress = [...progressData].sort((a, b) =>
      a.task.task_id > b.task.task_id ? 1 : -1
  );

  return (
      <React.Fragment>
        {sortedProgress.map((data) => (
            <React.Fragment key={data.task.task_id}>
              <div className="text-center">
                {data.task.task_name} ({data.progress?.percent ?? 0}%)
              </div>
              <Progress value={data.progress?.percent ?? 0} />
            </React.Fragment>
        ))}
      </React.Fragment>
  );
};

export default TaskProgressBar;
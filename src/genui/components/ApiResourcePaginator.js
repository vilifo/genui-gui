import React, { useState, useEffect, useRef, useCallback } from 'react';
import Pagination from 'react-js-pagination';

const ApiResourcePaginator = (props) => {
  const { updateCondition, children } = props;

  const [activePage, setActivePage] = useState(1);
  const [activePageItems, setActivePageItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  const prevPropsRef = useRef(props);
  const prevStateRef = useRef({ activePage: 1, activePageItems: [], totalCount: 0 });
  const isFirstRender = useRef(true);

  const fetchPage = useCallback((rootUrl, pageNumber) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchUrl = `${rootUrl.toString()}?page=${pageNumber}`;

    fetch(fetchUrl, {
      signal: controller.signal,
      credentials: "include",
    })
        .then((response) => response.json())
        .then((data) => {
          if (!isMounted.current) return;

          setActivePageItems(data.results);
          setTotalCount(data.count);
          setActivePage(pageNumber);
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.log(e);
          }
        });
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchPage(props.url, 1);

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentState = { activePage, activePageItems, totalCount };

    if (
        updateCondition &&
        updateCondition(prevPropsRef.current, props, prevStateRef.current, currentState)
    ) {
      fetchPage(props.url, activePage);
    }

    prevPropsRef.current = props;
    prevStateRef.current = currentState;
  }, [props, activePage, activePageItems, totalCount, updateCondition, fetchPage]);

  const handlePageChange = (pageNumber) => {
    fetchPage(props.url, pageNumber);
  };

  return (
      <React.Fragment>
        <Pagination
            activePage={activePage}
            totalItemsCount={totalCount}
            pageRangeDisplayed={5}
            onChange={handlePageChange}
            itemClass="page-item"
            linkClass="page-link"
        />
        {children(activePageItems)}
      </React.Fragment>
  );
};

export default ApiResourcePaginator;
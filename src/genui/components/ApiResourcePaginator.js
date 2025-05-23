import React, { useState, useEffect, useRef, useCallback } from 'react';
import Pagination from 'react-js-pagination';

function ApiResourcePaginator(props) {
  const [activePage, setActivePage] = useState(1);
  const [activePageItems, setActivePageItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const abortControllerRef = useRef(new AbortController());
  const isMountedRef = useRef(true);

  const fetchPage = useCallback((rootUrl, pageNumber) => {
    const url = `${rootUrl.toString()}?page=${pageNumber}`;
    fetch(url, {signal: abortControllerRef.current.signal, credentials: "include"})
      .then(response => response.json())
      .then(data => {
        if (isMountedRef.current) {
          setActivePageItems(data.results);
          setTotalCount(data.count);
          setActivePage(pageNumber);
        }
      })
      .catch(e => console.log(e));
  }, []);

  const handlePageChange = (pageNumber) => {
    fetchPage(props.url, pageNumber);
  };

  // Equivalent to componentDidMount
  useEffect(() => {
    fetchPage(props.url, activePage);

    // Save a reference to the current abort controller
    const currentAbortController = abortControllerRef.current;

    // Equivalent to componentWillUnmount
    return () => {
      isMountedRef.current = false;
      currentAbortController.abort();
    };
  }, [fetchPage, props.url, activePage]);

  // Equivalent to componentDidUpdate for props changes
  const prevPropsRef = useRef(props);
  const prevStateRef = useRef({ activePage, activePageItems, totalCount });

  useEffect(() => {
    if (props.updateCondition) {
      const prevProps = prevPropsRef.current;
      const prevState = prevStateRef.current;

      if (props.updateCondition(prevProps, props, prevState, { activePage, activePageItems, totalCount })) {
        fetchPage(props.url, activePage);
      }

      // Update refs for next comparison
      prevPropsRef.current = props;
      prevStateRef.current = { activePage, activePageItems, totalCount };
    }
  }, [props, props.updateCondition, props.url, activePage, fetchPage, activePageItems, totalCount]);

  return (
    <React.Fragment>
      <Pagination
        activePage={activePage}
        // itemsCountPerPage={props.itemsPerPage ? props.itemsPerPage : 10}
        totalItemsCount={totalCount}
        pageRangeDisplayed={5}
        onChange={handlePageChange}
        itemClass="page-item"
        linkClass="page-link"
      />
      {props.children(activePageItems)}
    </React.Fragment>
  );
}

export default ApiResourcePaginator;

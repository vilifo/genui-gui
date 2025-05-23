import React, { useState, useEffect } from 'react';
import { smoothScrollToTop } from '../utils';
import Pagination from "react-js-pagination";

const SimplePaginator = (props) => {
  const [activePage, setActivePage] = useState(1);
  const [pageItems, setPageItems] = useState([]);

  // Equivalent to componentDidMount and componentDidUpdate
  useEffect(() => {
    setActivePage(1);
    setPageItems(props.items.slice(0, props.itemsPerPage));
  }, [props.items, props.forceUpdate, props.itemsPerPage]);

  const handlePageChange = (pageNumber) => {
    const end = pageNumber * props.itemsPerPage;
    const start = end - props.itemsPerPage;
    const newPageItems = props.items.slice(start, end <= props.items.length ? end : props.items.length);
    setPageItems(newPageItems);
    setActivePage(pageNumber);
    smoothScrollToTop();
  };

  return (
    <div>
      {props.children(pageItems)}
      <Pagination
        activePage={activePage}
        totalItemsCount={props.items.length}
        pageRangeDisplayed={5}
        onChange={handlePageChange}
        itemClass="page-item"
        linkClass="page-link"
      />
    </div>
  );
};

export default SimplePaginator;

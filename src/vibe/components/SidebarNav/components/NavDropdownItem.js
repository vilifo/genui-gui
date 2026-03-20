import React, { useState } from 'react';
import * as Feather from 'react-feather';
import NavBadge from './NavBadge';
import NavSingleItem from './NavSingleItem';

const NavDropdownItem = ({ item, isSidebarCollapsed }) => {
  const [open, setOpen] = useState(true);

  const toggle = (e) => {
    setOpen((prevOpen) => !prevOpen);
    e.preventDefault();
    e.stopPropagation();
  };

  const isExpanded = open ? 'open' : '';
  const Icon = item.icon ? Feather[item.icon] : null;
  const ExpandIcon = open ? Feather.ChevronDown : Feather.ChevronRight;

  return (
      <li className={`nav-item has-submenu ${isExpanded}`}>
        <a href="#!" role="button" onClick={toggle}>
          {item.icon && Icon && <Icon className="side-nav-icon" />}
          <span className="nav-item-label">{item.name}</span>{' '}
          {item.badge && (
              <NavBadge color={item.badge.variant} text={item.badge.text} />
          )}
          <ExpandIcon className="menu-expand-icon" />
        </a>
        {(open || isSidebarCollapsed) && (
            <ul className="nav-submenu">
              {/* Renamed the map parameter from 'item' to 'childItem' to avoid shadowing the prop */}
              {item.children.map((childItem, index) => (
                  <NavSingleItem item={childItem} key={index} />
              ))}
            </ul>
        )}
      </li>
  );
};

export default NavDropdownItem;
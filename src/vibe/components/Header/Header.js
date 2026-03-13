import React, {useState} from 'react';
import ToggleSidebarButton from './components/ToggleSidebarButton';
import PageLoader from '../PageLoader/PageLoader';

import {Navbar, NavbarToggler, Collapse, Nav} from 'reactstrap';

function Header(props) {
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    return (
        <header className="app-header">
            <SkipToContentLink focusId="primary-content"/>
            <div className="top-nav">
                <Navbar color="faded" light expand="md">
                    <ToggleSidebarButton
                        toggleSidebar={props.toggleSidebar}
                        isSidebarCollapsed={props.isSidebarCollapsed}
                    />
                    <div className="page-heading">{props.title}</div>
                    <NavbarToggler onClick={toggle}/>
                    <Collapse isOpen={isOpen} navbar>
                        <Nav className="ms-auto" navbar>
                            {props.children}
                        </Nav>
                    </Collapse>
                    <PageLoader/>
                </Navbar>
            </div>
        </header>
    );
}

export default Header;

const SkipToContentLink = ({focusId}) => {
    return (
        <a href={`#${focusId}`} tabIndex="1" className="skip-to-content">
            Skip to Content
        </a>
    );
};

import React from 'react';
import classnames from 'classnames';
import {TabContent, TabPane, Nav, NavItem, NavLink, Card,} from 'reactstrap';

const TabWidget = (props) => {
    const [activeTabState, setActiveTabState] = React.useState(props.activeTab);

    const toggle = (tab) => {
        if (activeTabState !== tab) {
            setActiveTabState(tab)
        }
    }

    React.useEffect(() => {
        if (props.activeTab && props.activeTab !== activeTabState) {
            setActiveTabState(props.activeTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.activeTab]);

    const tabs = props.tabs;
    let activeTab = tabs.find(tab => tab.title === activeTabState);
    if (!activeTab) {
        activeTab = tabs[0]
    }
    if (!activeTab) {
        throw new Error("No valid active tab found. Make sure to specify it in a prop or in the state.");
    }
    activeTab = activeTab.title;

    return (
        <Card body className="stretch-to-container unDraggable">
            <div className="full-bleed">
                <Nav tabs>
                    {
                        tabs.map(tab => (
                            <NavItem key={tab.title}>
                                <NavLink
                                    className={classnames({active: activeTab === tab.title})}
                                    onClick={() => {
                                        toggle(tab.title);
                                    }}
                                >
                                    {tab.title}
                                </NavLink>
                            </NavItem>
                        ))
                    }
                </Nav>
                <TabContent activeTab={activeTab}>
                    {
                        tabs.map(tab => {
                            const Component = tab.renderedComponent;
                            return (
                                <TabPane key={tab.title} tabId={tab.title}>
                                    <Component {...props}/>
                                </TabPane>
                            )
                        })
                    }
                </TabContent>
            </div>
        </Card>
    )
}

export default TabWidget;
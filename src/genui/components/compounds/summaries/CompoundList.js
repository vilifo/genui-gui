import React, { useMemo } from 'react';
import { Col, Row } from 'reactstrap';
import {
  ActivitiesByTypeFlatView,
  MoleculeActivityProvider,
  MoleculeMetadata,
  MoleculeImage,
  MoleculePropsProvider,
  TabWidget,
  PropertiesTable,
} from '../../..';
import SimplePaginator from '../../SimplePaginator';

const MoleculeData = (props) => {
  const {
    showInfo = true,
    showActivities = true,
    showProperties = true,
  } = props;

  let showData = showInfo;
  if (!showData && !showActivities) {
    showData = true;
  }

  const tabs = useMemo(() => {
    const newTabs = [];

    if (showData) {
      newTabs.push({
        title: "Info",
        renderedComponent: MoleculeMetadata,
      });
    }

    if (showActivities) {
      newTabs.push({
        title: "Activities",
        renderedComponent: (tabProps) => (
            <MoleculeActivityProvider
                {...tabProps}
                component={ActivitiesByTypeFlatView}
            />
        ),
      });
    }

    if (showProperties) {
      newTabs.push({
        title: "Properties",
        renderedComponent: (tabProps) => (
            <MoleculePropsProvider
                {...tabProps}
                propsList={[
                  "AMW",
                  "NUMHEAVYATOMS",
                  "NUMAROMATICRINGS",
                  "HBA",
                  "HBD",
                  "LOGP",
                  "TPSA",
                ]}
                component={PropertiesTable}
            />
        ),
      });
    }

    return newTabs;
  }, [showData, showActivities, showProperties]);

  const activeTab = showActivities ? "Activities" : "Info";

  return (
      <TabWidget {...props} tabs={tabs} activeTab={activeTab} />
  );
};

const MemoizedMoleculeData = React.memo(MoleculeData, (prevProps, nextProps) => {
  if (nextProps.updateCondition) {
    // Reconstruct the mock state object in case the parent's updateCondition expects it
    const getMockState = (p) => {
      let sData = p.showInfo !== undefined ? p.showInfo : true;
      const sActs = p.showActivities !== undefined ? p.showActivities : true;
      const sProps = p.showProperties !== undefined ? p.showProperties : true;
      if (!sData && !sActs) sData = true;
      return { showData: sData, showActivities: sActs, showProperties: sProps, tabs: [] };
    };

    const shouldUpdate = nextProps.updateCondition(
        prevProps,
        nextProps,
        getMockState(prevProps),
        getMockState(nextProps),
        {}
    );
    return !shouldUpdate;
  }
  return false;
});

export function CompoundListItem(props) {
  const { mol } = props;
  const sm_cols = [3, 9];
  const md_cols = [3, 9];

  return (
      <Row>
        <Col md={md_cols[0]} sm={sm_cols[0]}>
          <MoleculeImage mol={mol} />
        </Col>
        <Col md={md_cols[1]} sm={sm_cols[1]}>
          <MemoizedMoleculeData {...props} />
        </Col>
      </Row>
  );
}

export default function CompoundList(props) {
  const { mols, paginate } = props;

  if (paginate) {
    return (
        <SimplePaginator items={mols} itemsPerPage={10}>
          {(currentPageItems) =>
              currentPageItems.map((item) => (
                  <CompoundListItem {...props} key={item.id} mol={item} />
              ))
          }
        </SimplePaginator>
    );
  }

  return (
      <React.Fragment>
        {mols.map((mol) => (
            <CompoundListItem {...props} key={mol.id} mol={mol} />
        ))}
      </React.Fragment>
  );
}
import React, {useMemo} from 'react';
import {Col, Progress, Row} from 'reactstrap';
import {ActivitiesAggregator, groupBy, TabWidget} from '../../../../genui';
import ActivitySummary from './ActivitySummary';

const SelectedActivitiesPage = (props) => {
    const moleculeSelection = props.moleculeSelection;
    const selectedMolsInMap = props.selectedMolsInMap;
    const selectedMolsInMapLoaded = props.selectedMolsInMapLoaded;

    const hasSelection = moleculeSelection.molsCount > 0;

    const AggregatorContent = useMemo(() => {
        if (!hasSelection) return null;

        return (aggregatorProps) => {
            if (!selectedMolsInMapLoaded) {
                const progressValue = (selectedMolsInMap.length / moleculeSelection.molsCount) * 100;
                return (
                    <React.Fragment>
                        <div>Fetching selected compounds: {selectedMolsInMap.length}/{moleculeSelection.molsCount}</div>
                        <Progress color="info" value={progressValue}/>
                    </React.Fragment>
                );
            }
            return <ActivitiesAggregator {...aggregatorProps} />;
        };
    }, [hasSelection, selectedMolsInMapLoaded, selectedMolsInMap.length, moleculeSelection.molsCount]);

    if (!hasSelection) {
        return <p>No compounds selected in the map.</p>;
    }

    return (
        <Row>
            <Col sm={12}>
                <AggregatorContent {...props} mols={selectedMolsInMap}>
                    {(activities, finished, progress) => {
                        if (finished) {
                            const groupedActivities = groupBy(activities, 'type.id');

                            const tabs = groupedActivities.map((group) => ({
                                title: group[0].type.value,
                                renderedComponent: (tabProps) => (
                                    <ActivitySummary
                                        {...tabProps}
                                        mols={tabProps.selectedMolsInMap}
                                        type={group[0].type}
                                        activities={group}
                                    />
                                ),
                            }));
                            return <TabWidget {...props} tabs={tabs}/>;
                        }

                        const progressKeys = Object.keys(progress);
                        if (progressKeys.length === 0) {
                            return <div><p>No data to show.</p></div>;
                        }

                        const progressValues = progressKeys.map((key) => progress[key]);
                        const avgProgress = progressValues.reduce((a, b) => a + b, 0) / progressValues.length;

                        return (
                            <React.Fragment>
                                <div><p>Loading activity data...</p></div>
                                <Progress color="info" value={avgProgress}/>
                            </React.Fragment>
                        );
                    }}
                </AggregatorContent>
            </Col>
        </Row>
    );
};

export default SelectedActivitiesPage;
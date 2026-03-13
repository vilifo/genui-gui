import React, { useState, useEffect } from 'react';
import { PLOTLY_COLORS } from "../../../../genui";
import { Progress } from "reactstrap";

const ChemSpacePlot = (props) => {
    const [data, setData] = useState({
        points: {},
        compounds: {},
        feature_names: [],
        categories: [],
    });
    const [revision, setRevision] = useState(0);
    const [lastIndex, setLastIndex] = useState({});
    // const [pointsLoaded, setPointsLoaded] = useState(false);
    const [mapDrawn, setMapDrawn] = useState(false);
    const [parsingMols, setParsingMols] = useState(false);
    const [parsedMols, setParsedMols] = useState(0);
    const [molsParsed, setMolsParsed] = useState(false);

    useEffect(() => {
        setData(prevData => ({
            ...prevData,
            categories: props.molsets.map((molset, idx) => ({
                points: [],
                label: molset.name,
                id: molset.id
            }))
        }));
    }, [props.molsets]);

    useEffect(() => {
        if (countPropsPoints(props.points) > Object.keys(data.points).length) {
            updatePoints();
        }
        if (!molsParsed && !parsingMols && props.pointsFinishedLoading && props.moleculesFinishedLoading) {
            parseMoleculeData();
        }
        if (!mapDrawn && parsingMols && (parsedMols === Object.keys(data.points).length)) {
            setMolsParsed(true);
            setParsingMols(false);
            drawMap();
        }
    }, [props.points, data.points, molsParsed, parsingMols, props.pointsFinishedLoading, props.moleculesFinishedLoading, mapDrawn, parsedMols, data, props.molsets, props.map, props.molsetsToColor, props.pointsToMolecules]);

    const countPropsPoints = (points) => {
        let count = 0;
        Object.keys(points).forEach(key => count += points[key].length);
        return count;
    };

    const updatePoints = () => {
        const points = props.points;
        const molsets = props.molsets;

        setData(prevData => {
            const newData = { ...prevData };
            const newLastIndex = { ...lastIndex };
            molsets.forEach(molset => {
                const lastIdx = newLastIndex[molset.id];
                if (points.hasOwnProperty(molset.id)) {
                    const convertedPoints = convertPoints(points[molset.id], lastIdx);
                    const compounds = {};
                    Object.keys(convertedPoints).forEach(key => compounds[key] = {
                        smiles: convertedPoints[key].smiles,
                    });
                    const category = newData.categories.find(category => category.id === molset.id);
                    category.points = category.points.concat(Object.keys(convertedPoints));
                    category.color = props.molsetsToColor[molset.id];
                    newData.compounds = { ...newData.compounds, ...compounds };
                    newData.points = { ...newData.points, ...convertedPoints };
                    newLastIndex[molset.id] = points[molset.id].length - 1;
                }
            });
            newData.feature_names = [
                `${props.map.trainingStrategy.algorithm.name}-x`,
                `${props.map.trainingStrategy.algorithm.name}-y`,
            ];
            setLastIndex(newLastIndex);
            setRevision(prev => prev + 1);
            return newData;
        });
    };

    const convertPoints = (points, lastIndex) => {
        const ret = {};
        if (lastIndex !== undefined) {
            points.slice(lastIndex + 1).forEach(point => ret[point.id] = convertPoint(point));
        } else {
            points.forEach(point => ret[point.id] = convertPoint(point));
        }
        return ret;
    };

    const convertPoint = (point) => {
        const label = `MOLECULE_${point.molecule}`;
        return {
            object_ids: [label],
            features: [point.x, point.y],
            label: label,
            smiles: point.smiles,
            molID: point.molecule,
            categories: point.compoundSets
        };
    };

    const parseMoleculeData = () => {
        setParsingMols(true);

        const activity_types = [];
        setData(prevData => {
            const newData = { ...prevData };
            newData.feature_names = newData.feature_names.concat(
                Object.keys(props.pointsToMolecules[Object.keys(props.pointsToMolecules)[0]].properties).map(propName => propName)
            );

            Object.keys(props.pointsToMolecules).forEach((point_id) => {
                const molecule = props.pointsToMolecules[point_id];
                Object.keys(molecule.activities).forEach(actset_id => {
                    const activities = molecule.activities[actset_id];
                    activities.forEach(activity => {
                        if (!activity_types.includes(activity.type.id)) {
                            activity_types.push(activity.type.id);
                            newData.feature_names.push(activity.type.value);
                        }
                    });
                });
            });
            return newData;
        });

        Object.keys(props.pointsToMolecules).forEach((point_id, idx) => {
            const molecule = props.pointsToMolecules[point_id];

            setData(prevData => {
                const newData = { ...prevData };
                const point = { ...newData.points[point_id] };
                Object.keys(molecule.properties).forEach(propName => point.features.push(molecule.properties[propName]));
                newData.points[point_id] = point;

                const activities_map = {};
                Object.keys(molecule.activities).forEach(actset_id => {
                    const activities = molecule.activities[actset_id];
                    activities.forEach(activity => {
                        if (!activities_map[activity.type.id]) {
                            activities_map[activity.type.id] = [];
                        }
                        activities_map[activity.type.id].push(activity.value);
                    });
                });
                activity_types.forEach(type_id => {
                    if (activities_map[type_id]) {
                        const average = activities_map[type_id].reduce((a, b) => a + b) / activities_map[type_id].length;
                        point.features.push(average);
                    } else {
                        point.features.push(null);
                    }
                });
                return newData;
            });
            setParsedMols(idx + 1);
        });
    };

    const drawMap = () => {
        window.chemspace = new window.ChemSpace({
            target: "chemspace",
            colors: PLOTLY_COLORS,
            compounds: {
                draw: true,
                size: 1,
                tooltip_compound_size: 400,
            },
            color: {
                index: "category"
            },
        });

        window.chemspace.read_data(data);
        window.chemspace.draw();
        setMapDrawn(true);

        window.chemspace.events.point_tooltip = (point_ids, color, evt) => {
            props.onMolHover(props.pointsToMolecules[point_ids[0]]);
            return window.chemspace._get_point_tooltip(evt);
        };
        window.chemspace.events.points_selection = (point_ids) => {
            props.onMolsSelect(point_ids.map(point_id => props.pointsToMolecules[point_id]));
        };
    };

    if (!molsParsed) {
        return (
            <React.Fragment>
                {
                    !props.pointsFinishedLoading ? (
                        <React.Fragment>
                            <div><p>Loading map data...</p></div>
                            <Progress color="info" value={100 * countPropsPoints(props.points) / props.pointsTotal} />
                        </React.Fragment>
                    ) : null
                }
                <div><p>Fetching molecules... ({Object.keys(props.pointsToMolecules).length}/{props.pointsTotal})</p></div>
                <Progress color="info" value={100 * Object.keys(props.pointsToMolecules).length / props.pointsTotal} />
            </React.Fragment>
        );
    }

    return (
        <div id="chemspace" ref="chemspace">
            <div>Attaching molecule data: {Object.keys(props.pointsToMolecules).length}/{props.pointsTotal}</div>
        </div>
    );
};

export default ChemSpacePlot;
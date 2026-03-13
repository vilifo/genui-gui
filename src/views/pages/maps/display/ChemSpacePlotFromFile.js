import React, {useState, useEffect, useRef} from "react";
import {PLOTLY_COLORS} from "../../../../genui";

const ChemSpacePlotFromFile = ({selectedMap, onMolHover, onMolsSelect}) => {
    const [mapDrawn, setMapDrawn] = useState(false);
    const [error, setError] = useState(null);
    const selectedMapIdRef = useRef(null);

    const drawMap = () => {
        window.chemspace = new window.ChemSpace({
            target: "chemspace",
            colors: PLOTLY_COLORS,
            compounds: {
                draw: true,
                size: 1,
                tooltip_compound_size: 250,
            },
            color: {
                index: "category"
            },
            // point_size: {
            //     scale: {min: 4, middle: 8, "max": 12}
            // }
        });

        if (!selectedMap.chemspaceJSON) {
            setError(
                `Fatal error while rendering the map. No ChemSpace.js 
                JSON file found for "${selectedMap.name}". This
                map is probably not completed, yet. Check the creator 
                progress or come back later and refresh the page.`
            );
            return;
        }
        console.log(selectedMap.chemspaceJSON.file);
        window.chemspace.read_data_from_file(selectedMap.chemspaceJSON.file);

        if (!window.chemspace.data) {
            setError(
                `Could not load any structures from the supplied ChemSpace.js 
                JSON file for "${selectedMap.name}". This
                map is probably not completed, yet. Check the creator 
                progress or come back later and refresh the page.`
            );
            return;
        }

        const disabled_feature = "--- Disabled ---";
        window.chemspace.add_feature({name: disabled_feature, point2value: {}});
        window.chemspace.update_settings({
            point_size: {
                index: window.chemspace.data.feature_names.indexOf("--- Disabled ---")
            }
        });
        window.chemspace.draw();
        setMapDrawn(true);

        // register events
        window.chemspace.events.point_tooltip = (point_ids, color, evt) => {
            onMolHover(window.chemspace.data.compounds[point_ids[0]].id);
            return window.chemspace._get_point_tooltip(evt);
        };
        window.chemspace.events.points_selection = (point_ids) => {
            onMolsSelect(point_ids.map(point_id => window.chemspace.data.compounds[point_id].id));
        };
    };

    useEffect(() => {
        drawMap();
        selectedMapIdRef.current = selectedMap.id;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedMapIdRef.current !== selectedMap.id) {
            setMapDrawn(false);
            setError(null);
            drawMap();
            selectedMapIdRef.current = selectedMap.id;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMap.id]);

    return (
        <React.Fragment>
            {!mapDrawn ? <div>Fetching map data...</div> : null}
            <div id="chemspace"/>
            {error ? <div>{error}</div> : null}
            <div>
                <p className="text-muted">
                    Powered By <a target='_blank' rel="noopener noreferrer"
                                  href='https://openscreen.cz/software/chemspace/home/'>ChemSpace.js</a>
                </p>
            </div>
        </React.Fragment>
    );
};

export default ChemSpacePlotFromFile;
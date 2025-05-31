import React from "react";
import {PLOTLY_COLORS} from "../../../../genui";


const ChemSpacePlotFromFile = (props) => {
    const [mapDrawn, setMapDrawn] = React.useState(false);
    const [error, setError] = React.useState(null);
    const chemspaceRef = React.useRef(null);

    React.useEffect(() => {
        drawMap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedMap.id]);

    const drawMap = () => {
        window.chemspace = new window.ChemSpace({ //instantiate ChemSpace
            target: "chemspace", // the ID of target HTML element
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

        if (!props.selectedMap.chemspaceJSON) {
            setError(`Fatal error while rendering the map. No ChemSpace.js 
                JSON file found for "${props.selectedMap.name}". This
                map is probably not completed, yet. Check the creator 
                progress or come back later and refresh the page.`);
            return;
        }
        window.chemspace.read_data_from_file(props.selectedMap.chemspaceJSON.file); // read data
        if (!window.chemspace.data) {
            setError(`Could not load any structures from the supplied ChemSpace.js 
                JSON file for "${props.selectedMap.name}". This
                map is probably not completed, yet. Check the creator 
                progress or come back later and refresh the page.`);
            return;
        }
        const disabled_feature = "--- Disabled ---";
        window.chemspace.add_feature({name : disabled_feature, point2value : {}});
        window.chemspace.update_settings({point_size: {index: window.chemspace.data.feature_names.indexOf("--- Disabled ---")}})
        window.chemspace.draw(); //draw chemical space
        setMapDrawn(true);

        // register events
        window.chemspace.events.point_tooltip = (point_ids, color, evt) => {
            props.onMolHover(window.chemspace.data.compounds[point_ids[0]].id);
            return window.chemspace._get_point_tooltip(evt);
        };
        window.chemspace.events.points_selection = (point_ids) => {
            props.onMolsSelect(point_ids.map(point_id => window.chemspace.data.compounds[point_id].id));
        }
    };

    return (
        <>
            {
                !mapDrawn ? <div>Fetching map data...</div> : null
            }
            <div id="chemspace" ref={chemspaceRef} />
            {
                error ? <div>{error}</div> : null
            }
            <div>
                <p className="text-muted">Powered By <a target='_blank' rel="noopener noreferrer" href='https://openscreen.cz/software/chemspace/home/'>ChemSpace.js</a></p>
            </div>
        </>
    );
};

export default ChemSpacePlotFromFile;
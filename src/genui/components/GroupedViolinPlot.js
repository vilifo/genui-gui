import React, { useRef, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

const GroupedViolinPlot = ({
                               tracesRev,
                               traces,
                               title,
                               onHover,
                               onSelect,
                               onDeselect,
                           }) => {
    const plotlyRef = useRef(null);

    // 1. Handle the manual resize trigger (Side Effect)
    // Replaces the side-effect portion of shouldComponentUpdate
    useEffect(() => {
        if (plotlyRef.current && plotlyRef.current.resizeHandler) {
            plotlyRef.current.resizeHandler();
        }
    }, [tracesRev]);

    // 2. Memoize the data transformation so it only recalculates when 'traces' change
    const data = useMemo(() => {
        const traceDefaults = {
            type: 'violin',
            points: 'all',
            box: {
                visible: true,
            },
            meanline: {
                visible: true,
            },
        };

        return Object.keys(traces).map((key) => {
            const traceData = traces[key];
            return {
                ...traceDefaults,
                x: traceData.x,
                y: traceData.y,
                customdata: traceData.customdata,
                legendgroup: traceData.name,
                scalegroup: traceData.name,
                name: traceData.name,
                marker: traceData.marker,
            };
        });
    }, [traces]);

    // 3. Memoize layout and config so their object references remain stable
    const layout = useMemo(
        () => ({
            title: title,
            violinmode: 'group',
            autosize: true,
            yaxis: {
                zeroline: false,
            },
            showlegend: true,
            dragmode: 'lasso',
        }),
        [title]
    );

    const config = useMemo(
        () => ({
            responsive: false,
            displaylogo: false,
            displayModeBar: true,
        }),
        []
    );

    return (
        <div className="genui-activity-summary-violin-plot" style={{ height: '100vh' }}>
            <Plot
                ref={plotlyRef}
                data={data}
                layout={layout}
                useResizeHandler={true}
                config={config}
                style={{ width: '100%', height: '100%' }}
                onHover={onHover}
                onSelected={onSelect}
                onDeselect={onDeselect}
            />
        </div>
    );
};

// 4. Handle the render blocking
// Replaces the boolean return of shouldComponentUpdate
export default React.memo(GroupedViolinPlot, (prevProps, nextProps) => {
    // Return true if you want the component to SKIP re-rendering
    return prevProps.tracesRev === nextProps.tracesRev;
});
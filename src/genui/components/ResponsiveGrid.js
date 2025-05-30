import React from "react";
import {Responsive, WidthProvider} from "react-grid-layout";

const ResponsiveGrid = React.forwardRef((props, ref) => {
    const getLayout = (items, cols, config) => {
        let row_id = 0;
        let col_id = 0;
        return items.map(item => {
            // console.log(item);
            const position = {
                i: item.id.toString()
                , x: col_id
                , y: row_id
                , w: item.w[config]
                , h: item.h[config]
                // , minW: 1
                // , maxW: 1
                , minH: item.minH[config]
            };
            if (col_id % cols) {
                row_id += 1;
                col_id = 0;
            } else {
                col_id += 1;
            }
            return position;
        });
    };

    const items = props.items;
    const mdCols = (props.mdCols === undefined) ? 2 : props.mdCols;
    const smCols = (props.smCols === undefined) ? 1 : props.smCols;
    const mdBreak = (props.mdBreak === undefined) ? 992 : props.mdBreak;
    const smBreak = (props.smBreak === undefined) ? 480 : props.smBreak;

    const layouts = {
        md: getLayout(items, mdCols, "md")
        , sm: getLayout(items, smCols, "sm")
    };
    const ResponsiveGridLayout = WidthProvider(Responsive);
    // console.log(layouts);

    return (
        <ResponsiveGridLayout
            className={props.gridID}
            id={props.gridID}
            layouts={layouts}
            breakpoints={{md: mdBreak, sm: smBreak}}
            cols={{md: mdCols, sm: smCols}}
            rowHeight={props.rowHeight}
            autoSize={true}
            verticalCompact={true}
            draggableCancel='.unDraggable'
        >
            {props.children}
        </ResponsiveGridLayout>
    );
});

export default ResponsiveGrid;

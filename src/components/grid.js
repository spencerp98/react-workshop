import React from "react";
import TileRow from "./tileRow";

class Grid extends React.Component {
    render() { 
        const rows = [0, 1, 2, 3, 4, 5];
        const rowItems = rows.map((row) =>
            <TileRow key={row} row={this.props.grid[row]}/>
        );
        return (
            <div className="Grid">
                {rowItems}
            </div>
        );
    }
}

export default Grid;

import Tile from "./tile";
import './tileRow.css';

function TileRow(props) {
    const columns = [0, 1, 2, 3, 4];
    const columnItems = columns.map((column) =>
        <Tile key={column} letter={props.row[column].letter} column={column} state={props.row[column].state} />
    );
    return (
      <div className="TileRow">
        {columnItems}
      </div>
    );
}

export default TileRow;
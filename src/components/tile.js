import './tile.css'
import React from 'react';

class Tile extends React.Component {
    render() {
        return (
            <div className={"Tile "+this.props.state}>{this.props.letter}</div>
        );
    }
}
  
export default Tile;

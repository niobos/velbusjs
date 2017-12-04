import React, { PureComponent } from 'react';
import './FloorMap.css';

class FloorMap extends PureComponent {
    activateChild(event, index, subindices=[]) {
        // TODO: dedup this with App.js
        const active_element = subindices.slice(0);
        active_element.unshift(index);
        return this.props.onActivate(event, active_element);
    }

    render() {
        const children = React.Children.map(this.props.children, (child, index) => {
            const extra_props = {
                activeElement: null,
                onActivate: (event, subindices=[]) => this.activateChild(event, index, subindices),
            };
            if( this.props.activeElement !== null && this.props.activeElement[0] === index ) {
                extra_props.activeElement = this.props.activeElement.slice(1);
            }
            return React.cloneElement(child, extra_props);
        });
        return (<div className="floormap">
            <img src={this.props.imgsrc} alt="map" />
            {children}
        </div>);
    }
}

export default FloorMap;

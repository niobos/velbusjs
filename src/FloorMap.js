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

        let picture;
        if(typeof this.props.imgsrc === "string") {
            picture = <picture>
                <img src={this.props.imgsrc} alt="map"/>
            </picture>;
        } else if (typeof this.props.imgsrc === "object") {
            let sources = [];
            for(let source of this.props.imgsrc.sources) {
                sources.push(<source srcset={source.srcset} media={source.media} />);
            }
            picture = <picture>
                {sources}
                <img src={this.props.imgsrc.imgsrc} alt="map" />
            </picture>;
        } else {
            throw Error("Unrecognized imgsrc type");
        }

        return (<div className="floormap">
            {picture}
            {children}
        </div>);
    }
}

export default FloorMap;

import React, { PureComponent } from 'react';
import './Unknown.css';


/**
 * Required props:
 *  - left, top: position to render at
 *  - onActivate : callback when clicked
 *  - activeElement : when `null`, the component is closed; when non-null, it
 *                    is displayed in full
 *
 */
class Unknown extends PureComponent {
    render() {
        const s = {
            left: this.props.left,
            top: this.props.top,
            backgroundImage: `url(images/unknown.png)`,
        };

        return (<div onClick={this.props.onActivate} className="icon" style={s}>
            {this.props.activeElement !== null
                ? <UnknownControl {...this.state} {...this.props}/>
                : null}
        </div>);
    }
}

class UnknownControl extends PureComponent {
    render() {
        return (<div className='popover'>
            <div className='triangle'/>
            <div className='bubble'>
                <div className='name'>{this.props.name}</div>
                <div className='technical'>
                    Unknown @ 0x{this.props.address[0].toString(16)} {this.props.address.slice(1)}
                </div>
            </div>
        </div>);
    }
}


export default Unknown;

import React, { PureComponent } from 'react';
import './Dimmer.css';
import {default_value} from "./utils";
import Range from "./Range";

/**
 * Required props:
 *  - left, top: position to render at
 *  - onActivate : callback when clicked
 *  - activeElement : when `null`, the component is closed; when non-null, it
 *                    is displayed in full
 *
 *  - address : array of 2 ints: module address, dimmer number (1 through 4, inclusive)
 *  - icon : icon set to use, consisting of 2 parts: a name, and optionally an extension
 *           the images used should be named 'images/<name>/<state>.<extension>
 *           state is: off, dimmed, on
 *           extension defaults to 'svg'
 */
class Dimmer extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            dimvalue: 0,
        };
        if( this.props.address.length !== 2 ||
            this.props.address[1] < 1 ||
            this.props.address[1] > 4
        ) {
            throw('Dimmer: expected address & dimmer number')
        }

        let icon = default_value(this.props.icon, 'light');
        icon = icon.rsplit('.', 1);
        if( icon.length === 1 ) icon.push('svg');
        this.iconset = icon[0];
        this.extension = icon[1];
    }

    web_socket_message(new_state) {
        // Update to this module received
        // Filter out state for this particular dimmer
        if( new_state === null ) {
            // TODO: Module not found
            return;
        }

        let my_state = new_state[this.props.address[1]];
        if(my_state === undefined) my_state = {};

        if( Object.keys(my_state).length === 0 ) {
            // No data, request update
            const address_hex = ("00"+this.props.address[0].toString(16)).slice(-2);
            const current_state = new XMLHttpRequest();
            current_state.addEventListener("load", function (event) {
                // Ignore response. We will also receive this over the websocket, and process it there
            });
            current_state.open("GET", `http://${this.props.apiHostPort}/module/${address_hex}/${this.props.address[1]}/dimvalue`);
            current_state.send();
        }

        this.setState(my_state);
    }

    componentDidMount() {
        this.props.addWebSocketListener(this.props.address[0], this.web_socket_message.bind(this));
    }

    componentWillUnmount() {
        this.props.removeWebSocketListener(this.props.address[0], this.web_socket_message.bind(this));
    }

    render() {
        let dimmer_state;
        if( this.state.dimvalue === 0 ) {
            dimmer_state = 'off';
        } else if( this.state.dimvalue === 100 ) {
            dimmer_state = 'on';
        } else {
            dimmer_state = 'dimmed';
        }

        const s = {
            left: this.props.left,
            top: this.props.top,
            backgroundImage: `url(images/${this.iconset}/${dimmer_state}.${this.extension})`,
        };

        return (<div onClick={this.props.onActivate} className="icon" style={s}>
            {this.props.activeElement !== null
                ? <DimmerControl {...this.state} {...this.props}/>
                : null}
        </div>);
    }
}

class DimmerControl extends PureComponent {
    constructor(props) {
        super(props);
        setTimeout(function(component, props) { return function(){
            component.componentWillReceiveProps(props);
        }}(this, props), 0);

        this.state = {dimvalue: props.dimvalue};
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    componentWillReceiveProps(nextProps) {
        this.setState({dimvalue: nextProps.dimvalue});
    }

    changeDimvalue(desired_state) {
        const put_state = new XMLHttpRequest();
        put_state.addEventListener("load", function (event) {
            if( this.status !== 200 ) {
                console.log("PUT call failed:");
                console.log(this);
                console.log(event);
            }
            // Ignore response. We will also receive this over the websocket, and process it there
        });
        const address_hex = ("00"+this.props.address[0].toString(16)).slice(-2);
        put_state.open("PUT", `http://${this.props.apiHostPort}/module/${address_hex}/${this.props.address[1]}/dimvalue`);
        put_state.send(desired_state);
    }

    render() {
        return (<div className='popover'>
            <div className='triangle'/>
            <div className='bubble'>
                <div className='name'>{this.props.name}</div>
                <div className='technical'>
                    Dimmer @ 0x{this.props.address[0].toString(16)}-{this.props.address[1]}
                </div>
                <div className='currentState'>
                    Current state: {this.props.dimvalue}%
                </div>
                <Range value={this.state.dimvalue}
                       suffix='%'
                       onChange={this.changeDimvalue.bind(this)}
                       />
            </div>
        </div>);
    }
}

export default Dimmer;

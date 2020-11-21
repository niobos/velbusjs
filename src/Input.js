import React, { PureComponent } from 'react';
import './Input.css';
import Timer from "./Timer";
import {address_to_hex, default_value} from "./utils";

/**
 * Required props:
 *  - left, top: position to render at
 *  - onActivate : callback when clicked
 *  - activeElement : when `null`, the component is closed; when non-null, it
 *                    is displayed in full
 *
 *  - address : array of 2 ints: module address, input number (1 through 6, inclusive)
 *  - icon : icon set to use, consisting of 2 parts: a name, and optionally an extension
 *           the images used should be named 'images/<name>/<state>.<extension>
 *           state is: on, off, timer
 *           extension defaults to 'svg'
 *
 * Optional:
 *  - invert : boolean : swap on/off. Default: false (do not invert)
 */
class Input extends PureComponent {
    static defaultProps = {
        invert: false,
    }

    constructor(props) {
        super(props);
        this.state = {
            input: false,
        };
        if( !('address' in this.props) ||
            !('length' in this.props.address) ||
            this.props.address.length !== 2 ||
            this.props.address[1] < 1 ||
            this.props.address[1] > 6
        ) {
            throw('Input: expected address & relay number')
        }

        let icon = default_value(this.props.icon, 'light');
        icon = icon.rsplit('.', 1);
        if( icon.length === 1 ) icon.push('svg');
        this.iconset = icon[0];
        this.extension = icon[1];
    }

    web_socket_message(new_state) {
        // Update to this module received
        // Filter out state for this particular input
        if( new_state === null ) {
            // TODO: Module not found
            return;
        }

        let my_state = new_state[this.props.address[1]];
        if(my_state === undefined) {
            my_state = {};
        }

        if( Object.keys(my_state).length === 0 ) {
            // No data, request update
            const current_state = new XMLHttpRequest();
            current_state.addEventListener("load", function (event) {
                // Ignore response. We will also receive this over the websocket, and process it there
            });
            const address_hex = address_to_hex(this.props.address[0]);
            current_state.open("GET", `http://${this.props.apiHostPort}/module/${address_hex}/${this.props.address[1]}/input`);
            current_state.send();
        }

        if( this.props.invert ) {
            if( 'input' in my_state ) {
                my_state['input'] = ! my_state['input'];
            }
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
        let input_state = (this.state.input ? 'on' : 'off');

        const s = {
            left: this.props.left,
            top: this.props.top,
            backgroundImage: `url(images/${this.iconset}/${input_state}.${this.extension})`,
        };

        return (<div onClick={this.props.onActivate} className="icon" style={s}>
            {this.props.activeElement !== null
                ? <InputControl {...this.state} {...this.props}/>
                : null}
        </div>);
    }
}

class InputControl extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            desired_timeout: null,
        };
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    render() {
        let current_state = this.props.input ? 'on' : 'off';

        let since;
        if( 'last_change' in this.props && this.props.last_change !== null ) {
            since = <Timer direction="up" timestamp={this.props.last_change + window.my_time_offset_ms/1000.}/>;
        } else {
            since = 'unknown';
        }

        return (<div className='popover'>
            <div className='triangle'/>
            <div className='bubble'>
                <div className='name'>{this.props.name}</div>
                <div className='technical'>
                    Input @ 0x{address_to_hex(this.props.address[0])}-{this.props.address[1]}
                </div>
                <div className='currentState'>
                    Current state: {current_state}
                </div>
                <div className='since'>
                    Since: {since}
                </div>
            </div>
        </div>);
    }
}

export default Input;

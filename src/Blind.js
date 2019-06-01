import React, { PureComponent } from 'react';
import './Blind.css';
import TimeoutInput from './TimeoutInput.js';
import {address_to_hex, default_value, seconds_to_dhms} from "./utils";
import Range from "./Range";

/**
 * Required props:
 *  - left, top: position to render at
 *  - onActivate : callback when clicked
 *  - activeElement : when `null`, the component is closed; when non-null, it
 *                    is displayed in full
 *
 *  - address : array of 2 ints: module address, blind number (1..2 or only 1, depending on the module)
 *
 *  Optional props:
 *  - icon : icon set to use, consisting of 2 parts: a name, and optionally an extension
 *           the images used should be named 'images/<name>/<state>.<extension>
 *           state is: up, partial, down, moving_up, moving_down
 *           name defaults to 'blind'
 *           extension defaults to 'svg'
 */
class Blind extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            status: null,
            position: null,
        };
        if( !('address' in this.props) ||
            !('length' in this.props.address) ||
            this.props.address.length !== 2 ||
            this.props.address[1] < 1 ||
            this.props.address[1] > 2
        ) {
            throw('Blind: expected address & blind number')
        }

        let icon = default_value(this.props.icon, 'blind');
        icon = icon.rsplit('.', 1);
        if( icon.length === 1 ) icon.push('svg');
        this.iconset = icon[0];
        this.extension = icon[1];

        const self = this;  // create closure
        this.props.registerAllBlinds(function(state) { self.changePosition(state); })
    }

    web_socket_message(new_state) {
        // Update to this module received
        // Filter out state for this particular blind
        if( new_state === null ) {
            // TODO: Module not found
            return;
        }

        let my_state = new_state[this.props.address[1]];
        if(my_state === undefined) my_state = {};

        if( Object.keys(my_state).length === 0 ) {
            // No data, request update
            const current_state = new XMLHttpRequest();
            current_state.addEventListener("load", function (event) {
                // Ignore response. We will also receive this over the websocket, and process it there
            });
            const address_hex = address_to_hex(this.props.address[0]);
            current_state.open("GET", `http://${this.props.apiHostPort}/module/${address_hex}/${this.props.address[1]}/position`);
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

    changePosition(desired_state) {
        const put_state = new XMLHttpRequest();
        put_state.addEventListener("load", function (event) {
            if( this.status !== 200 ) {
                console.log("PUT call failed:");
                console.log(this);
                console.log(event);
            }
            // Ignore response. We will also receive this over the websocket, and process it there
        });
        const address_hex = address_to_hex(this.props.address[0]);
        put_state.open("PUT", `http://${this.props.apiHostPort}/module/${address_hex}/${this.props.address[1]}/position`);
        put_state.send(desired_state);
    }

    render() {
        let blind_state;
        if( this.state.status === 'up' ) {
            blind_state = 'moving_up';
        } else if( this.state.status === 'down' ) {
            blind_state = 'moving_down';
        } else { // 'off'
            if( this.state.position === 0 ) {
                blind_state = 'up';
            } else if( this.state.position === 100 ) {
                blind_state = 'down';
            } else {
                blind_state = 'partial';
            }
        }

        const s = {
            left: this.props.left,
            top: this.props.top,
            backgroundImage: `url(images/${this.iconset}/${blind_state}.${this.extension})`,
        };

        return (<div onClick={this.props.onActivate} className="icon" style={s}>
            {this.props.activeElement !== null
                ? <BlindControl {...this.state} {...this.props} changePosition={this.changePosition.bind(this)}/>
                : null}
        </div>);
    }
}

class BlindControl extends PureComponent {
    constructor(props) {
        super(props);
        setTimeout(function(component, props) { return function(){
            component.componentWillReceiveProps(props);
        }}(this, props), 0);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    componentWillReceiveProps(nextProps) {
    }

    render() {
        let buttons;
        let current_state;

        if( this.props.status === 'off' ) {
            buttons = [
                <div className='button' onClick={this.props.changePosition.bind(this, 'up')}>↑</div>,
                <div className='button' onClick={this.props.changePosition.bind(this, 'down')}>↓</div>,
            ];
            current_state = Math.round(this.props.position) + '% down';
        } else {
            buttons = [
                <div className='button' onClick={this.props.changePosition.bind(this, 'stop')}>■</div>,
            ];
            current_state = 'moving ' + this.props.status;
        }

        return (<div className='popover'>
            <div className='triangle'/>
            <div className='bubble'>
                <div className='name'>{this.props.name}</div>
                <div className='technical'>
                    Blind @ 0x{address_to_hex(this.props.address[0])}-{this.props.address[1]}
                </div>
                <div className='currentState'>
                    Current state: {current_state}
                </div>
                <div style={{display: 'table'}}>
                    {buttons}
                    <Range value={this.props.position}
                           suffix='%'
                           onChange={this.props.changePosition.bind(this)}
                           />
                </div>
            </div>
        </div>);
    }
}

export default Blind;

import React, { PureComponent } from 'react';
import './Relay.css';
import TimeoutInput from './TimeoutInput.js';
import {address_to_hex, default_value, seconds_to_dhms} from "./utils";
import Control from "./Control";

/**
 * Required props:
 *  - left, top: position to render at
 *  - onActivate : callback when clicked
 *  - activeElement : when `null`, the component is closed; when non-null, it
 *                    is displayed in full
 *
 *  - address : array of 2 ints: module address, relay number (1 through 5, inclusive)
 *  - icon : icon set to use, consisting of 2 parts: a name, and optionally an extension
 *           the images used should be named 'images/<name>/<state>.<extension>
 *           state is: on, off, timer
 *           extension defaults to 'svg'
 */
class Relay extends Control {
    constructor(props) {
        super(props);
        this.state = {
            relay: false,
        };
        if( !('address' in this.props) ||
            !('length' in this.props.address) ||
            this.props.address.length !== 2 ||
            this.props.address[1] < 1 ||
            this.props.address[1] > 5
        ) {
            throw('Relay: expected address & relay number')
        }

        let icon = default_value(this.props.icon, 'light');
        icon = icon.rsplit('.', 1);
        if( icon.length === 1 ) icon.push('svg');
        this.iconset = icon[0];
        this.extension = icon[1];
    }

    web_socket_message(new_state) {
        // Update to this module received
        // Filter out state for this particular relay
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
            current_state.open("GET", `http://${this.props.apiHostPort}/module/${address_hex}/${this.props.address[1]}/relay`);
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

    setRelay(desired_state) {
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
        put_state.open("PUT", `http://${this.props.apiHostPort}/module/${address_hex}/${this.props.address[1]}/relay`);
        put_state.send(JSON.stringify(desired_state));
    }

    allLightsOff() {
        super.allLightsOff();
        if( this.iconset === "light" ) {
            this.setRelay(false);
        }
    }

    render() {
        let relay_state;
        if( typeof this.state.relay === 'boolean' ) {
            relay_state = (this.state.relay ? 'on' : 'off');
        } else if( typeof this.state.relay === 'number' ) {
            relay_state = 'timer';
        }

        const s = {
            left: this.props.left,
            top: this.props.top,
            backgroundImage: `url(images/${this.iconset}/${relay_state}.${this.extension})`,
        };

        return (<div onClick={this.props.onActivate} className="icon" style={s}>
            {this.props.activeElement !== null
                ? <RelayControl {...this.state} {...this.props} setRelay={this.setRelay.bind(this)}/>
                : null}
        </div>);
    }
}

class RelayControl extends PureComponent {
    constructor(props) {
        super(props);
        this.update_timer = null;
        this.state = {
            desired_timeout: null,
        };
        setTimeout(function(component, props) { return function(){
            component.componentWillReceiveProps(props);
        }}(this, props), 0);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
        if( this.update_timer ) {
            clearInterval(this.update_timer);
        }
    }

    updateTimer(timeout_at_secs) {
        const now_secs = (new Date() - window.my_time_offset_ms) / 1000.;
        const timeout_in_secs = timeout_at_secs - now_secs;
        this.setState({relay: 'on for ' + seconds_to_dhms(timeout_in_secs)});
    }

    componentWillReceiveProps(nextProps) {
        if( this.update_timer ) {
            clearInterval(this.update_timer);
            this.update_timer = null;
        }

        if( typeof nextProps.relay === 'boolean' ) {
            this.setState({relay: nextProps.relay ? 'on' : 'off'});
        } else if( typeof nextProps.relay === 'number' ) {
            this.update_timer = setInterval(function() {
                    this.updateTimer(this.props.relay);
                }.bind(this), 1000);
            this.updateTimer(nextProps.relay);
        }
    }

    changeTimeout(timeout) {
        this.setState({desired_timeout: timeout});
    }

    switchRelay(event) {
        if( this.state.desired_timeout !== null ) {
            this.props.setRelay(this.state.desired_timeout);
        } else {
            this.props.setRelay(!this.props.relay);
        }
    }

    render() {
        return (<div className='popover'>
            <div className='triangle'/>
            <div className='bubble'>
                <div className='name'>{this.props.name}</div>
                <div className='technical'>
                    Relay @ 0x{address_to_hex(this.props.address[0])}-{this.props.address[1]}
                </div>
                <div className='currentState'>
                    Current state: {this.state.relay}
                </div>
                <div style={{display: 'table'}}>
                    <div className='button' onClick={this.switchRelay.bind(this)}>
                        {this.props.relay ? 'OFF' : 'ON'}
                    </div>
                    <div style={{marginLeft: '0.5em', whiteSpace: 'nowrap'}}>
                        {this.props.relay ? 'in' : 'for'} <TimeoutInput size="23" onChange={this.changeTimeout.bind(this)}
                                          placeholder={this.props.relay ? 'now' : 'permanent'}
                        />
                    </div>
                </div>
            </div>
        </div>);
    }
}

export default Relay;

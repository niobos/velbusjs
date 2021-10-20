import {Relay, RelayControl} from "./Relay";
import Timer from "./Timer";
import {address_to_hex} from "./utils";
import TimeoutInput from "./TimeoutInput";
import Range from "./Range";
import React from "react";

/**
 * Required props:
 *  - left, top: position to render at
 *  - onActivate : callback when clicked
 *  - activeElement : when `null`, the component is closed; when non-null, it
 *                    is displayed in full
 *
 *  - address : array of 2 ints: module address, relay number (1 through 5, inclusive)
 *  - dali_address : array of 2 ints: dali module address, dali number
 *  - icon : icon set to use, consisting of 2 parts: a name, and optionally an extension
 *           the images used should be named 'images/<name>/<state>.<extension>
 *           state is: on, off, timer
 *           extension defaults to 'svg'
 */
class RelayDali extends Relay {
    constructor(props) {
        super(props);
        if( !('dali_address' in this.props) ||
            !('length' in this.props.dali_address) ||
            this.props.dali_address.length !== 2 ||
            this.props.dali_address[1] < 1 ||
            this.props.dali_address[1] > 96
        ) {
            throw('RelayDali: expected dali address & dali number')
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
                ? <RelayDaliControl {...this.state} {...this.props}/>
                : null}
        </div>);
    }
}

class RelayDaliControl extends RelayControl {
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
        const address_hex = address_to_hex(this.props.dali_address[0]);
        put_state.open("PUT", `http://${this.props.apiHostPort}/module/${address_hex}/${this.props.dali_address[1]}/dimvalue`);
        put_state.send(desired_state);
    }

    render() {
        let current_state;
        if( typeof this.props.relay === 'boolean' ) {
            current_state = this.props.relay ? 'on' : 'off';
        } else if( typeof this.props.relay === 'number' ) {
            current_state = <span>on for <Timer direction="down" timestamp={this.props.relay + window.my_time_offset_ms/1000.} /></span>;
        }

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
                    RelayDali @ 0x{address_to_hex(this.props.address[0])}-{this.props.address[1]},
                    0x{address_to_hex(this.props.dali_address[0])}-{this.props.dali_address[1]}
                </div>
                <div className='currentState'>
                    Current state: {current_state}
                </div>
                <div className='since'>
                    Since: {since}
                </div>
                <div style={{display: 'table'}}>
                    <div className='button' onClick={this.switch_relay.bind(this)}>
                        {this.props.relay ? 'OFF' : 'ON'}
                    </div>
                    <div style={{marginLeft: '0.5em', whiteSpace: 'nowrap'}}>
                        {this.props.relay ? 'in' : 'for'} <TimeoutInput size="23" onChange={this.changeTimeout.bind(this)}
                                                                        placeholder={this.props.relay ? 'now' : 'permanent'}
                    />
                    </div>
                </div>
                <Range value={this.state.dimvalue}
                       suffix='' min='0' max='254'
                       onChange={this.changeDimvalue.bind(this)}
                />
            </div>
        </div>);
    }
}

export default RelayDali;
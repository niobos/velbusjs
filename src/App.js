import React, { PureComponent } from 'react';
import './App.css';
import FloorMap from './FloorMap.js';
import {address_to_hex, shallow_copy} from "./utils";
import { applyOperation } from 'fast-json-patch'
import Unknown from './Unknown.js';
import Relay from './Relay.js';
import Dimmer from './Dimmer.js';
import Blind from './Blind.js';
import Input from './Input.js';
import RelayDali from './RelayDali.js';


const control_components = {
    'relay': Relay,
    'relaydali': RelayDali,
    'dimmer': Dimmer,
    'blind': Blind,
    'input': Input,
};

class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            activeElement: [],
            offline: true,
        };
        this.ws_listeners = {};
        this.ws_state = {};

        if(this.props.apiHostPort) {
            this.apiHostPort = this.props.apiHostPort;
        } else {
            this.apiHostPort = `${document.domain}:${window.location.port}`
        }

        this.controls = [];
        for(let mindex in window.config['maps']) {
            this.controls.push([]);
        }

        for(let cindex in window.config['controls']) {
            const control = window.config['controls'][cindex];
            for (let pindex in control['positions']) {
                const position = control['positions'][pindex];

                const props = shallow_copy(control);
                props['name'] = cindex;
                props['left'] = position['left'];
                props['top'] = position['top'];
                props['addWebSocketListener'] = this.addWebSocketListener.bind(this);
                props['removeWebSocketListener'] = this.removeWebSocketListener.bind(this);
                props['apiHostPort'] = this.apiHostPort;

                let component = control_components[control['type']];
                if (component === undefined) {
                    component = Unknown;
                }
                this.controls[position['map']].push(React.createElement(component, props, null));
            }
        }
    }

    activateChild(event, index, subindices=[]) {
        const active_element = subindices.slice(0);
        active_element.unshift(index);
        this.setState({activeElement: active_element});
        event.stopPropagation();
    }
    deactivateAllChildren() {
        this.setState({activeElement: null});
    }

    addWebSocketListener(address, cb) {
        /* Register a listener to receive state updates
         * `cb` is called with the new state, similar to setState()
         */
        const address_hex = address_to_hex(address);
        if(!(address_hex in this.ws_listeners)) {
            this.ws_listeners[address_hex] = new Set();

            if(this.web_socket && this.web_socket.readyState === WebSocket.OPEN) {
                this.web_socket.send(JSON.stringify([{
                    'op': 'add', 'path': `/${address_hex}`,
                    'value': true
                }]));
            }
            // else: will be added on connect
        }
        this.ws_listeners[address_hex].add(cb);

        if( this.ws_state[address_hex] !== undefined ) {
            // Send current state, if we have any
            cb(this.ws_state[address_hex]);
        }
    }
    removeWebSocketListener(address, cb) {
        const address_hex = address_to_hex(address);
        this.ws_listeners[address_hex].remove(cb);
        if(this.ws_listeners.length === 0) {
            delete this.ws_listeners[address_hex];

            if(this.web_socket && this.web_socket.readyState === WebSocket.OPEN) {
                this.web_socket.send(JSON.stringify([{
                    'op': 'remove', 'path': `/${address_hex}`,
                }]));
            }
            // else: nothing to delete anyway
        }
    }

    componentDidMount() {
        window.addEventListener('click', this.deactivateAllChildren.bind(this));

        this.connectWebsocket();
    }
    componentWillUnmount() {
        window.removeEventListener('click', this.deactivateAllChildren.bind(this));

        this.web_socket.close();
    }

    connectWebsocket() {
        this.calculateTimeOffset();

        this.ws_state = {};
        console.log("Trying to connect to WebSocket");
        this.web_socket = new WebSocket(`ws://${this.apiHostPort}/module_state`);

        window.app = this;  // Debug TODO remove

        this.web_socket.onopen = function (app) {
            return function (event) {
                app.setState({offline: false});
                app.ws_timeout = 500;
                let subscriptions = [];
                let register_ops = [];
                for (let address_hex in app.ws_listeners) {
                    subscriptions.push(address_hex);
                    register_ops.push({
                        'op': 'add', 'path': `/${address_hex}`,
                        'value': true
                    });
                }
                app.web_socket.send(JSON.stringify(register_ops));
                console.log("WS connected. Subscribed to: " + subscriptions.join(', '));
            }
        }(this);

        this.web_socket.onmessage = function (app) {
            return function (event) {
                const event_obj = JSON.parse(event.data);
                let changed_addresses_hex = new Set();
                for (let i in event_obj) {
                    const operation = event_obj[i];
                    // ^^^ (let operation of event_obj) fails on iOS7

                    const address_hex = operation.path.split('/')[1];
                    changed_addresses_hex.add(address_hex);

                    applyOperation(app.ws_state, operation);
                }
                for (let address_hex of changed_addresses_hex) {
                    for (let cb of app.ws_listeners[address_hex]) {
                        cb(app.ws_state[address_hex]);
                    }
                }
            }
        }(this);

        this.web_socket.onclose = function (app) {
            return function (event) {
                app.setState({offline: true});
                console.log("WS closed");

                // Reconnect with exponential backoff
                setTimeout(function() { app.connectWebsocket(); }, app.ws_timeout);
                app.ws_timeout = Math.min(app.ws_timeout * 2, 5000);
            }
        }(this);
    }

    calculateTimeOffset() {
        const start_timestamp = new Date();
        const server_timestamp_xhr = new XMLHttpRequest();
        server_timestamp_xhr.addEventListener("load", function (event) {
            const end_timestamp = new Date();
            const average_timestamp = start_timestamp / 2 + end_timestamp / 2;
            const server_timestamp = parseFloat(this.responseText);
            window.my_time_offset_ms = Math.round(average_timestamp - server_timestamp*1000);
            console.log(`Time calibration: my time: ${average_timestamp}, server time: ${server_timestamp}; my offset: ${window.my_time_offset_ms} ms ahead`);
        });
        server_timestamp_xhr.open("GET", `http://${this.apiHostPort}/timestamp`);
        server_timestamp_xhr.send();
    }

    render() {
        const children = [];
        for(let mindex in window.config['maps']) {
            const mindex_int = parseInt(mindex);  // object keys are strings
            const map = window.config['maps'][mindex];

            let active_subelement = null;
            if( this.state.activeElement !== null && this.state.activeElement[0] === mindex) {
                active_subelement = this.state.activeElement.slice(1);
            }

            const controls = this.controls[mindex_int];
            children.push(React.createElement(
                FloorMap,
                {
                    imgsrc: map,
                    activeElement: active_subelement,
                    onActivate: (event, subindices=[]) => this.activateChild(event, mindex, subindices),
                    apiHostPort: this.apiHostPort,
                },
                ...controls))
        }

        const appStyle = {};
        if( this.state.offline ) {
            appStyle.backgroundColor = '#ffd8d5';
        }

        return (<div style={appStyle}>{children}</div>);
    }
}

export default App;

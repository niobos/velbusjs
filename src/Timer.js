import { PureComponent } from 'react';
import './Timer.css';
import {seconds_to_dhms} from "./utils";

/**
 * Displays a timer that counts up from, or down to the given timestamp
 * Props:
 * - timestamp: <unix epoch in seconds> (default: now)
 * - direction: 'up' or 'down'
 */
class Timer extends PureComponent {
    constructor(props) {
        super(props);
        this.update_timer = null;
        this.state = {
            time: '',
        };
    }

    componentDidMount() {
        this.updateTimer();
        this.update_timer = setInterval(function() {
            this.updateTimer();
        }.bind(this), 1000);
    }

    componentWillUnmount() {
        if( this.update_timer ) {
            clearInterval(this.update_timer);
            this.update_timer = null;
        }
    }

    updateTimer() {
        const now_secs = Date.now() / 1000.;
        let secs;
        if(this.props.direction === 'down') {
            secs = this.props.timestamp - now_secs;
        } else {
            secs = now_secs - this.props.timestamp;
        }

        this.setState({time: seconds_to_dhms(secs)});
    }

    render() {
        return this.state.time;
    }
}

export default Timer;

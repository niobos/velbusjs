import React, { PureComponent } from 'react';
import './TimeoutInput.css';
import {parse_duration} from "./utils";

/**
 * Required props:
 * - onChange: callback(timeout_in_secs)
 */
class TimeoutInput extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            valid: null,
        };
    }

    onChange(event) {
        const new_value = event.target.value;
        this.setState({  // Update the <input> value
            value: new_value,
        });

        if( new_value === '' ) {
            this.setState({valid: null});
            this.props.onChange(null);
        } else {
            try {
                // TODO: convert new_value to seconds
                const new_value_secs = parse_duration(new_value);
                if (isNaN(new_value_secs)) throw "Not a number";

                this.setState({valid: true});
                this.props.onChange(new_value_secs);
            } catch(e) {
                this.setState({valid: false});
                this.props.onChange(null);
            }
        }
    }

    render() {
        let validity = '';
        if( this.state.valid === null ) {
            validity = 'empty';
        } else if( this.state.valid === true ) {
            validity = 'valid';
        } else if( this.state.valid === false ) {
            validity = 'invalid';
        }

        return (
            <input {...this.props}  // Put ...props first, so we can override
                   type="text"
                   value={this.state.value} onChange={this.onChange.bind(this)}
                   className={`timeoutinput ${validity}`}
            />
        )
    }
}

export default TimeoutInput;

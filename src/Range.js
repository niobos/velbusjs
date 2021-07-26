import React, {PureComponent} from 'react';
import './Range.css';

/**
 * Required props:
 * - onChange(new_value): callback with the new selected value
 *
 * Optional props:
 * - min: minimum value (default: 0)
 * - max: maximum value (default: 100)
 * - value: current value (default: 50)
 * - suffix: suffix to append after value (default: ''), e.g. '%'
 */
class Range extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            value: null,
        };

        setTimeout(function (component, props) {
            return function () {
                component.componentWillReceiveProps(props);
            }}(this, props), 0);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            value: nextProps.value,
        });
    }

    changingDimvalue(event) {
        this.setState({value: event.target.value});
    }

    changeDimvalue(event) {
        const desired_state = parseInt(event.target.value, 10);  // Why is value a string?
        this.props.onChange(desired_state);
    }

    render() {
        const r_min = 'min' in this.props ? this.props.min : 0
        const r_max = 'max' in this.props ? this.props.max : 100
        return (
            <div style={{display: 'table'}}>
                <div style={{display: 'table-cell'}}>
                    <input type="range" min={r_min} max={r_max} value={this.state.value}
                           onInput={this.changingDimvalue.bind(this)}
                           onMouseUp={this.changeDimvalue.bind(this)}
                           onTouchEnd={this.changeDimvalue.bind(this)}
                    />
                </div>
                <div style={{display: 'table-cell'}}>
                    {this.state.value}{this.props.suffix}
                </div>
            </div>);
    }
}

export default Range;

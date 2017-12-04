function default_value(value, default_value) {
    if (value !== undefined) {
        return value;
    } else {
        return default_value;
    }
}

function shallow_copy(oldObj) {
    var newObj = {};
    for(var i in oldObj) {
        if(oldObj.hasOwnProperty(i)) {
            newObj[i] = oldObj[i];
        }
    }
    return newObj;
}

String.prototype.rsplit = function(sep, maxsplit) {
    let split = this.split(sep);
    if( maxsplit >= split.length) return split;
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
};

function to_custom_bases(number, bases) {
    /**
     * Splits an number (int/float) in an arbitrary number of bases
     * Can be used to convert e.g. seconds to (minutes,seconds)
     * Output is: [sign, digits, ...]
     * e.g. to_custom_bases(-86462.3, [24, 60, 60]) => [-1, 1, 0, 1, 2.3]
     */
    const sign = number >= 0 ? 1 : -1;

    number = Math.abs(number);
    let digits = [];
    while(bases.length > 0) {
        const base = bases.pop();
        const digit = number % base;
        digits.unshift(digit);

        number -= digit;
        number /= base;
    }
    digits.unshift(number);
    return [sign, ...digits];
}

function seconds_to_dhms(seconds) {
    const digits = to_custom_bases(Math.round(seconds), [24, 60, 60]);
    const sign = (digits.shift() < 0 ? '-' : '');
    const units = ['d', 'h', 'm', 's'];
    while( digits[0] === 0 && digits.length > 1 ) {
        // Leave at least 1 digit that will always show
        digits.shift();
        units.shift();
    }
    let out = [];
    while(digits.length) {
        out.push(digits.shift() + units.shift())
    }
    return sign + out.join(' ');
}

function parse_duration(duration) {
    /**
     * Parse the string d into a duration in seconds
     * recognized tokens:
     *   " s sec[s] second[s]
     *   ' m mi min[s] minute[s]
     *   h hour[s]
     *   d day[s]
     *   w week[s]
     *   mo month[s]    (30 days)
     *   y year[s]      (365 days)
     */
    if( typeof duration !== 'string' ) return undefined;

    // Match digits followed by unit
    const matches = duration.match(/\d+ ?(?:"|seconds?|secs?|s|'|minutes?|mins?|mi|m|hours?|h|days?|d|weeks?|w|months?|mo|years?|y)(?!['"a-zA-Z])/g);
    if( matches === undefined ) return undefined;

    duration = 0;
    for( let time_element of matches ) {
        const time_element_parts = time_element.match(/(\d+) ?(.*)/);
        let multiply = 0;
        switch(time_element_parts[2] /* units */) {
            case '"': case 's':
            case 'seconds': case 'second':
            case 'secs': case 'sec':
            multiply = 1; break;

            case "'": case 'm': case 'mi':
            case 'mins': case 'min':
            case 'minutes': case 'minute':
            multiply = 60; break;

            case 'h': case 'hours': case 'hour':
            multiply = 60 * 60; break;
            case 'd': case 'days': case 'day':
            multiply = 60 * 60 * 24; break;
            case 'w': case 'weeks': case 'week':
            multiply = 60 * 60 * 24 * 7; break;
            case 'mo': case 'months': case 'month':
            multiply = 60 * 60 * 24 * 30; break;
            case 'y': case 'years': case 'year':
            multiply = 60 * 60 * 24 * 365; break;

            default:
                /* unreachable */
                return undefined;
        }
        duration += parseInt(time_element_parts[1] * multiply, 10);
    }

    return duration;
}


export {default_value, shallow_copy, to_custom_bases, seconds_to_dhms, parse_duration};

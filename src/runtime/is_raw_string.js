/**
 * @flow
 */

const RawString = require('./raw_string');

module.exports = function(maybeRawString: mixed) : boolean {
	return maybeRawString instanceof RawString;
};

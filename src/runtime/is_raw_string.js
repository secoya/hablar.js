const RawString = require('./raw_string');

module.exports = function(maybeRawString) {
	return maybeRawString instanceof RawString;
};

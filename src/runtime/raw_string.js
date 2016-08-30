/**
 * @flow
 */

function RawString(str: string) : RawString {
	this._contents = str;

	return this;
}

RawString.prototype.toString = function() : string {
	return this._contents;
};

RawString.prototype.valueOf = function() : string {
	return this._contents;
};

module.exports = RawString;

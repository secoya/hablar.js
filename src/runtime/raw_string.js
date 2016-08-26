function RawString(str) {
	this._contents = str;

	return this;
}

RawString.prototype.toString = function() {
	return this._contents;
};

RawString.prototype.valueOf = function() {
	return this._contents;
};

module.exports = RawString;

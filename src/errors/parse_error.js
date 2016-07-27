/**
 * @flow
 */

export default function ParseError(
	message: string,
	hash?: {
		text: string,
		token: string,
		line: number,
		loc: {
			first_line: number,
			last_line: number,
			last_column: number,
		},
		expected: string[],
	}
) : ParseError {
	// $FlowFixMe I cannot get ES6 subclasses to work.
	Error.call(this, message);
	Error.captureStackTrace(this, ParseError);
	this.message = message;
	if (hash != null) {
		this.text = hash.text;
		this.token = hash.token;
		this.line = hash.line;
		this.expected = hash.expected;
		this.firstLine = hash.loc.first_line;
		this.lastLine = hash.loc.last_line;
		this.lastColumn = hash.loc.last_column;
	} else {
		this.text = null;
		this.token = null;
		this.line = null;
		this.expected = null;
		this.firstLine = null;
		this.lastLine = null;
		this.lastColumn = null;
	}
	return this;
}

ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.name = 'ParseError'; // eslint-disable-line no-extend-native

import {
	showErrorLocation,
} from  './util';

export default class ParseError extends Error {
	public static getErrorMessage(hash: {
			text: string,
			token: string,
			line: number,
			loc: {
				first_line: number,
				first_column: number,
				last_line: number,
				last_column: number,
			},
			expected: string[],
		}): string {
		const expected = hash.expected.join(', ');
		const got = `'${hash.token}'`;

		return (
			`Parse error on line ${hash.loc.last_line}:\n` +
			showErrorLocation(hash.text, `Expecting: ${expected} got ${got}`, hash.line, hash.loc.last_column)
		);
	}

	public expected: string[] | null;
	public firstColumn: number | null;
	public firstLine: number | null;
	public lastColumn: number | null;
	public lastLine: number | null;
	public line: number | null;
	public text: string | null;
	public token: string | null;

	public constructor(
		message: string,
		hash?: {
			text: string,
			token: string,
			line: number,
			loc: {
				first_line: number,
				first_column: number,
				last_line: number,
				last_column: number,
			},
			expected: string[],
		}
	) {
		super(message);
		if (hash != null) {
			this.text = hash.text;
			this.token = hash.token;
			this.line = hash.line;
			this.expected = hash.expected;
			this.firstColumn = hash.loc.first_column;
			this.firstLine = hash.loc.first_line;
			this.lastLine = hash.loc.last_line;
			this.lastColumn = hash.loc.last_column;
		} else {
			this.text = null;
			this.token = null;
			this.line = null;
			this.expected = null;
			this.firstColumn = null;
			this.firstLine = null;
			this.lastLine = null;
			this.lastColumn = null;
		}
	}
}

ParseError.prototype.name = 'ParseError'; // eslint-disable-line no-extend-native

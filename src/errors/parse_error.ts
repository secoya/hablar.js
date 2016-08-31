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
		const lines = hash.text.split('\n');
		const maxLineNumLength = lines.length.toString().length;
		const linesWithLineNumber = lines.map((e, i) => {
			const lineNumber = (i + 1).toString();
			const pad = ' '.repeat(maxLineNumLength - lineNumber.length + 1);
			return lineNumber + ':' + pad + e;
		});
		const errPad = ' '.repeat(maxLineNumLength + 2);
		const expected = hash.expected.join(', ');
		const got = `'${hash.token}'`;

		const errColumn = Math.min(lines[hash.line - 1].length, hash.loc.last_column + 1);
		linesWithLineNumber.splice(
			hash.loc.last_line,
			0,
			`${errPad}${'-'.repeat(errColumn)}^`, `${errPad}Expecting: ${expected} got ${got}`
		);
		return (
			`Parse error on line ${hash.loc.last_line}:\n${linesWithLineNumber.join('\n')}`
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

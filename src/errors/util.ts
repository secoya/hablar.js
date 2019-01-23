export function showErrorLocation(input: string, errText: string, line: number, column: number): string {
	const lines = input.split('\n');
	const maxLineNumLength = lines.length.toString().length;
	const linesWithLineNumber = lines.map((e, i) => {
		const lineNumber = (i + 1).toString();
		const pad = ' '.repeat(maxLineNumLength - lineNumber.length + 1);
		return lineNumber + ':' + pad + e;
	});
	const errPad = ' '.repeat(maxLineNumLength + 2);

	const errColumn = Math.min(lines[line - 1].length, column + 1);
	linesWithLineNumber.splice(line, 0, `${errPad}${'-'.repeat(errColumn)}^`, `${errPad}${errText}`);
	return linesWithLineNumber.join('\n');
}

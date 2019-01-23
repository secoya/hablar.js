import ParseError from '../errors/parse_error';

function monkeyPatchParserWithProperParseError(parser: any): any {
	const parse = parser.parse;

	parser.parse = (input: string): any => {
		try {
			return parse.call(parser, input);
		} catch (e) {
			throw new ParseError(e.message, e.hash);
		}
	};

	return parser;
}

function getParser(
	name: 'expression' | 'text' | 'constraint',
): {
	parse(input: string): any;
} {
	const fs = require('fs');
	const path = require('path');
	const jison = require('jison');

	const grammar = fs.readFileSync(path.join(__dirname, 'grammars', name + '.jison'), 'utf-8');
	const parser = new jison.Parser(grammar);

	return monkeyPatchParserWithProperParseError(parser);
}

export default getParser;

import ParseError from '../errors/parse_error';

function monkeyPatchParserWithProperParseError(parser: any): any {
	const parse = parser.parse;

	parser.parse = (input: string): any => {
		try {
			return parse.call(parser, input);
		} catch (e: any) {
			throw new ParseError(e.message, e.hash);
		}
	};

	return parser;
}

const parsers = {
	constraint: require('./grammars/constraint.js'),
	expression: require('./grammars/expression.js'),
	text: require('./grammars/text.js'),
};

function getParser(
	name: 'expression' | 'text' | 'constraint',
): {
	parse(input: string): any;
} {
	const parser = parsers[name];
	return monkeyPatchParserWithProperParseError(parser);
}
export default getParser;

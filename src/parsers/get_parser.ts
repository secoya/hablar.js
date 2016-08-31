import ParseError from '../errors/parse_error';

function monkeyPatchParserWithProperParseError(parser: any): any {
	const parse = parser.parse;

	parser.parse = function(input: string): any {
		try {
			return parse.call(parser, input);
		} catch (e) {
			throw new ParseError(e.message, e.hash);
		}
	};

	return parser;
}

let getParser: (name: 'expression' | 'text' | 'constraint') => {
	parse(input: string): any,
};

if (process.env.WEBPACK) {
	const parsers: {[key: string]: {
		parse(input: string): any,
	}} = {
		constraint: require('./grammars/constraint.jison'),
		expression: require('./grammars/expression.jison'),
		text: require('./grammars/text.jison'),
	};

	getParser = function(name: 'expression' | 'text' | 'constraint'): {
		parse(input: string): any,
	} {
		if (name !== 'expression' && name !== 'text' && name !== 'constraint') {
			throw new Error('Unknown parser: ' + name);
		}
		const parser = parsers[name];
		return monkeyPatchParserWithProperParseError(parser);
	};
} else {
	getParser = function(name: 'expression' | 'text' | 'constraint'): {
		parse(input: string): any,
	} {
		const fs = require('fs');
		const path = require('path');
		const jison = require('jison');

		const grammar = fs.readFileSync(
			path.join(
				__dirname,
				'grammars',
				name + '.jison'
			),
			'utf-8'
		);
		const parser = new jison.Parser(grammar);

		return monkeyPatchParserWithProperParseError(parser);
	};
}

export default getParser;

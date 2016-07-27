/**
 * @flow
 */
import path from 'path';
import fs from 'fs';
import ParseError from '../errors/parse_error';

function monkeyPatchParserWithProperParseError(parser: any) : any {
	const parse = parser.parse;

	parser.parse = function(input: string) : any {
		try {
			return parse.call(parser, input);
		} catch (e) {
			throw new ParseError(e.message, e.hash);
		}
	};

	return parser;
}

export default function getParser(name: string) : {
	parse(input: string) : any,
} {
	try {
		// $FlowFixMe: This is a valid path, I know flow can't resolve it
		const parser = require('./grammars/' + name).parser;
		return monkeyPatchParserWithProperParseError(parser);
	} catch (e) {
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
	}
}

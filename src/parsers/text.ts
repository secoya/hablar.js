import ParseError from '../errors/parse_error';
import expressionParser, {walkNode} from './expression';
import getParser from './get_parser';

const textParser = getParser('text');

import {
	Node as NodeExpression,
} from '../trees/expression';
import {
	ExprNode,
	LiteralNode,
	Node,
	Pos,
	VariableNode,
} from '../trees/text';

export type InitialExprNode = {
	textNodeType: 'expr',
	value: string,
	pos: Pos,
	valuePos: Pos,
};

export type InitialNode = LiteralNode
	| VariableNode
	| InitialExprNode
;

export function parseOnlyTextExpression(input: string): InitialNode[] {
	return textParser.parse(input);
}

function repositionPosition(
	enclosingPosition: Pos,
	pos: Pos
): Pos {
	// We subtract one from line indices as they are one indexed.
	// If we're still on line one - we add the firstColumn to both first and last column
	return {
		firstColumn: pos.firstLine !== 1 ? pos.firstColumn : (enclosingPosition.firstColumn + pos.firstColumn),
		firstLine: enclosingPosition.firstLine + pos.firstLine - 1,
		lastColumn: pos.lastLine !== 1 ? pos.lastColumn : (enclosingPosition.firstColumn + pos.lastColumn),
		lastLine: enclosingPosition.firstLine + pos.lastLine - 1,
	};
}

function fixupPositionInformation(
	node: NodeExpression,
	exprNode: InitialExprNode
): NodeExpression {
	walkNode(node, (n) => {
		n.pos = repositionPosition(exprNode.valuePos, n.pos);
	});
	return node;
}

export default function parse(input: string): Node[] {
	let parsed: InitialNode[] = [];
	try {
		parsed = parseOnlyTextExpression(input);
	} catch (e) {
		if (!(e instanceof ParseError)) {
			throw e;
		}
		const parseE = e as ParseError;
		if (
			parseE.firstLine == null ||
			parseE.lastLine == null ||
			parseE.lastColumn == null ||
			parseE.firstColumn == null
		) {
			throw e;
		}
		const hash = {
			expected: parseE.expected || [`'NONE'`],
			line: parseE.lastLine,
			loc: {
				first_column: parseE.firstColumn,
				first_line: parseE.lastLine,
				last_column: parseE.lastColumn,
				last_line: parseE.lastLine,
			},
			text: input,
			token: parseE.token || 'NONE',
		};
		const message = ParseError.getErrorMessage(hash);

		throw new ParseError(message, hash);
	}

	let last: Node | null = null;
	const result: Node[] = [];

	for (const fragment of parsed) {
		if (fragment.textNodeType === 'literal' && last != null && last.textNodeType === 'literal') {
			last.value += fragment.value;
		} else if (fragment.textNodeType === 'expr') {
			try {
				const newNode: ExprNode = {
					pos: fragment.pos,
					textNodeType: 'expr',
					value: fixupPositionInformation(expressionParser(fragment.value), fragment),
				};
				result.push(newNode);
				last = newNode;
			} catch (e) {
				if (!(e instanceof ParseError)) {
					throw e;
				}

				const parseErr = e as ParseError;

				if (
					parseErr.firstLine == null ||
					parseErr.lastLine == null ||
					parseErr.lastColumn == null ||
					parseErr.firstColumn == null
				) {
					throw e;
				}

				const token = (parseErr.token) === `EOF` ? `CLOSE_EXPR` : (parseErr.token || `NONE`);

				const errPos = repositionPosition(fragment.valuePos, {
					firstColumn: parseErr.firstColumn,
					firstLine: parseErr.firstLine,
					lastColumn: parseErr.lastColumn,
					lastLine: parseErr.lastLine,
				});
				if (token === 'CLOSE_EXPR') {
					errPos.firstColumn = fragment.valuePos.lastColumn;
					errPos.firstLine = fragment.valuePos.lastLine;
					errPos.lastColumn = fragment.valuePos.lastColumn - 1; // This should be +2 but we add that in the end
					errPos.lastLine = fragment.valuePos.lastLine;
				}
				const expected = (parseErr.expected || ['NONE']).map((e) => {
					if (e === 'EOF') {
						return `'CLOSE_EXPR'`;
					}

					return e;
				});

				const hash = {
					expected: expected,
					line: errPos.lastLine,
					loc: {
						first_column: errPos.firstColumn,
						first_line: errPos.firstLine,
						last_column: errPos.lastColumn,
						last_line: errPos.lastLine,
					},
					text: input,
					token: token,
				};
				const message = ParseError.getErrorMessage(hash);
				if (token === 'CLOSE_EXPR') {
					hash.loc.last_column += 3;
				}

				throw new ParseError(message, hash);
			}
		} else if (fragment.textNodeType === 'variable') {
			result.push(fragment);
		} else if (fragment.textNodeType === 'literal') {
			result.push(fragment);
		}
	}

	return result;
}

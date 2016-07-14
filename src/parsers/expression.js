/**
 * @flow
 */

import type {Node} from '../trees/expression';

import getParser from './get_parser';
import ParseError from './parse_error';
const expressionParser = getParser('expression');

export function walkNode(node: Node, callback: (node: Node) => void) : void {
	callback(node);
	switch (node.type) {
		case 'function_invocation':
			for (const param of node.parameters) {
				walkNode(param, callback);
			}
			break;
		case 'unary_minus':
			walkNode(node.op, callback);
			break;
		case 'binary_op':
			walkNode(node.lhs, callback);
			walkNode(node.rhs, callback);
			break;
	}
}

function substituteStringLiterals(
	node: Node,
	originalText: string
) : Node {
	walkNode(node, (expr) : void => {
		if (expr.type === 'string_literal') {
			try {
				const v = JSON.parse(expr.value);
				expr.value = v;
			} catch (e) {
				throw new ParseError(
					`Error parsing '${originalText}'. Invalid string literal ${expr.value}`
				);
			}
		}
	});

	return node;
}

export default function parse(input: string) : Node {
	const parsed : Node = expressionParser.parse(input);
	return substituteStringLiterals(parsed, input);
}

/**
 * @flow
 */

import expressionParser, {walkNode} from './expression';
import getParser from './get_parser';

const textParser = getParser('text');

import type {
	LiteralNode,
	VariableNode,
	Node,
	Pos,
} from '../trees/text';

import type {
	Node as NodeExpression,
} from '../trees/expression';

type InitialExprNode = {
	textNodeType: 'expr',
	value: string,
	pos: Pos,
	valuePos: Pos,
};

export type InitialNode =
	| LiteralNode
	| VariableNode
	| InitialExprNode
;

export type TextParserResult = {
	exprs: Node[],
	variables: string[],
	functions: string[],
};

export function parseOnlyTextExpression(input: string) : InitialNode[] {
	return textParser.parse(input);
}

function fixupPositionInformation(
	node: NodeExpression,
	exprNode: InitialExprNode
) : NodeExpression {
	walkNode(node, (n) => {
		// Note: Lines are 1 indexed
		if (n.pos.firstLine === 1) {
			n.pos.firstColumn += exprNode.valuePos.firstColumn;
		} else {
			n.pos.firstLine += exprNode.valuePos.firstLine - 1;
		}
		if (n.pos.lastLine === 1) {
			n.pos.lastColumn += exprNode.valuePos.firstColumn;
		} else {
			n.pos.lastLine += exprNode.valuePos.firstLine - 1;
		}
	});
	return node;
}

export default function parse(input: string) : TextParserResult {
	const parsed = parseOnlyTextExpression(input);

	const variables : Map<string, boolean> = new Map();
	const functions : Map<string, boolean> = new Map();

	let last : ?Node = null;
	const result : Node[] = [];

	for (const fragment of parsed) {
		if (fragment.textNodeType === 'literal' && last != null && last.textNodeType === 'literal') {
			last.value += fragment.value;
		} else if (fragment.textNodeType === 'expr') {
			const newNode = {
				textNodeType: 'expr',
				value: fixupPositionInformation(expressionParser(fragment.value), fragment),
				pos: fragment.pos,
			};
			walkNode(newNode.value, (node) => {
				switch (node.exprNodeType) {
					case 'variable':
						variables.set(node.name, true);
						break;
					case 'function_invocation':
						functions.set(node.name, true);
						break;
				}
			});
			result.push(newNode);
			last = newNode;
		} else if (fragment.textNodeType === 'variable') {
			result.push(fragment);
			variables.set(fragment.value, true);
		} else if (fragment.textNodeType === 'literal') {
			result.push(fragment);
		}
	}

	return {
		exprs: result,
		variables: Array.from(variables.keys()),
		functions: Array.from(functions.keys()),
	};
}

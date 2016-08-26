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

function fixupPositionInformation(
	node: NodeExpression,
	exprNode: InitialExprNode
): NodeExpression {
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

export default function parse(input: string): Node[] {
	const parsed = parseOnlyTextExpression(input);

	let last: Node | null = null;
	const result: Node[] = [];

	for (const fragment of parsed) {
		if (fragment.textNodeType === 'literal' && last != null && last.textNodeType === 'literal') {
			last.value += fragment.value;
		} else if (fragment.textNodeType === 'expr') {
			const newNode: ExprNode = {
				pos: fragment.pos,
				textNodeType: 'expr',
				value: fixupPositionInformation(expressionParser(fragment.value), fragment),
			};
			result.push(newNode);
			last = newNode;
		} else if (fragment.textNodeType === 'variable') {
			result.push(fragment);
		} else if (fragment.textNodeType === 'literal') {
			result.push(fragment);
		}
	}

	return result;
}

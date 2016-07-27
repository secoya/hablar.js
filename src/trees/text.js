/**
 * @flow
 */

import type {
	Node as ExpressionNode,
} from './expression';

export type Pos = {
	firstLine: number,
	firstColumn: number,
	lastLine: number,
	lastColumn: number,
 };

export type LiteralNode = {
	textNodeType: 'literal',
	value: string,
	pos: Pos,
};

export type VariableNode = {
	textNodeType: 'variable',
	value: string,
	pos: Pos,
};

export type ExprNode = {
	textNodeType: 'expr',
	value: ExpressionNode,
	pos: Pos,
};

export type Node =
	| LiteralNode
	| VariableNode
	| ExprNode
;

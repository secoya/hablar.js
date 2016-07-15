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
	type: 'literal',
	value: string,
	pos: Pos,
};

export type VariableNode = {
	type: 'variable',
	value: string,
	pos: Pos,
};

export type ExprNode = {
	type: 'expr',
	value: ExpressionNode,
	pos: Pos,
};

export type Node =
	| LiteralNode
	| VariableNode
	| ExprNode
;

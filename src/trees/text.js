/**
 * @flow
 */

import type {
	Node as ExpressionNode,
	TypedNode as TypedExpressionNode,
} from './expression';

import type {
	InferredType,
} from '../type_map';

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

export type TypedLiteralNode = {
	textNodeType: 'literal',
	value: string,
	pos: Pos,
	textType: InferredType,
}

export type VariableNode = {
	textNodeType: 'variable',
	value: string,
	pos: Pos,
};

export type TypedVariableNode = {
	textNodeType: 'variable',
	value: string,
	pos: Pos,
	textType: InferredType,
};

export type ExprNode = {
	textNodeType: 'expr',
	value: ExpressionNode,
	pos: Pos,
};

export type TypedExprNode = {
	textNodeType: 'expr',
	value: TypedExpressionNode,
	pos: Pos,
	textType: InferredType,
};

export type Node =
	| LiteralNode
	| VariableNode
	| ExprNode
;

export type TypedNode =
	| TypedLiteralNode
	| TypedVariableNode
	| TypedExprNode
;

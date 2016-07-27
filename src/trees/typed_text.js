/**
 *
 */

import type {InferredType} from '../type_map';

import type {Node as TypedExpressionNode} from '../typed_expression';

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
	exprType: 'string',
}

export type VariableNode = {
	type: 'variable',
	value: string,
	pos: Pos,
	exprType: InferredType,
};

export type ExprNode = {
	type: 'expr',
	value: TypedExpressionNode,
	pos: Pos,
	exprType: InferredType,
};

export type Node =
	| LiteralNode
	| VariableNode
	| ExprNode
;

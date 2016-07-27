/**
 *
 */

import type {Pos} from './text';

import type {InferredType} from '../type_map';

export type LiteralNode = {
	type: 'literal',
	value: string,
	pos: Pos,
	expressionType: InferredType,
}

export type VariableNode = {
	type: 'variable',
	value: string,
	pos: Pos,
	expressionType: InferredType,
};

export type ExprNode = {
	type: 'expr',
	value: ExpressionNode,
	pos: Pos,
	expressionType: InferredType,
};

export type Node =
	| LiteralNode
	| VariableNode
	| ExprNode
;

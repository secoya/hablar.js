/**
 *
 */

import type {Pos} from './expression';

import type {InferredType} from '../type_map';

export type BinaryOpPlusNode = {
	type: 'binary_op',
	op: 'plus',
	lhs: Node,
	rhs: Node,
	pos: Pos,
	expressionType: InferredType,
}

export type BinaryOpMinusNode = {
	type: 'binary_op',
	op: 'minus',
	lhs: Node,
	rhs: Node,
	pos: Pos,
	expressionType: InferredType,
}
export type BinaryOpDivideNode = {
	type: 'binary_op',
	op: 'divide',
	lhs: Node,
	rhs: Node,
	pos: Pos,
	expressionType: InferredType,
}

export type BinaryOpMultiplyNode = {
	type: 'binary_op',
	op: 'multiply',
	lhs: Node,
	rhs: Node,
	pos: Pos,
	expressionType: InferredType,
}

export type BinaryOpNode =
	| BinaryOpPlusNode
	| BinaryOpMinusNode
	| BinaryOpDivideNode
	| BinaryOpMultiplyNode
;

export type UnaryMinusNode = {
	type: 'unary_minus',
	op: Node,
	pos: Pos,
	expressionType: InferredType,
}

export type NumberNode = {
	type: 'number',
	value: number,
	pos: Pos,
	expressionType: 'number',
}

export type StringLiteralNode = {
	type: 'string_literal',
	value: string,
	pos: Pos,
	expressionType: 'string',
}

export type VariableNode = {
	type: 'variable',
	name: string,
	pos: Pos,
	expressionType: InferredType,
};

export type FunctionInvocationNode = {
	type: 'function_invocation',
	name: string,
	parameters: Node[],
	pos: Pos,
	expressionType: 'error' | 'string',
}

export type Node =
	| BinaryOpNode
	| UnaryMinusNode
	| NumberNode
	| StringLiteralNode
	| VariableNode
	| FunctionInvocationNode
;

/**
 * @flow
 */

import type {InferredType} from '../type_map';

export type Pos = {
	firstLine: number,
	firstColumn: number,
	lastLine: number,
	lastColumn: number,
};

export type BinaryOpNode = {
	exprNodeType: 'binary_op',
	binaryOp: 'plus' | 'multiply' | 'divide' | 'minus',
	lhs: Node,
	rhs: Node,
	pos: Pos,
};

export type TypedBinaryOpNode = {
	exprNodeType: 'binary_op',
	binaryOp: 'plus' | 'multiply' | 'divide' | 'minus',
	lhs: TypedNode,
	rhs: TypedNode,
	pos: Pos,
	exprType: InferredType,
}

export type UnaryMinusNode = {
	exprNodeType: 'unary_minus',
	op: Node,
	pos: Pos,
};

export type TypedUnaryMinusNode = {
	exprNodeType: 'unary_minus',
	op: TypedNode,
	pos: Pos,
	exprType: InferredType,
}

export type NumberNode = {
	exprNodeType: 'number',
	value: number,
	pos: Pos,
};

export type TypedNumberNode = {
	exprNodeType: 'number',
	value: number,
	pos: Pos,
	exprType: 'number',
}

export type StringLiteralNode = {
	exprNodeType: 'string_literal',
	value: string,
	pos: Pos,
};

export type TypedStringLiteralNode = {
	exprNodeType: 'string_literal',
	value: string,
	pos: Pos,
	exprType: 'string',
}

export type VariableNode = {
	exprNodeType: 'variable',
	name: string,
	pos: Pos,
};

export type TypedVariableNode = {
	exprNodeType: 'variable',
	name: string,
	pos: Pos,
	exprType: InferredType,
};

export type FunctionInvocationNode = {
	exprNodeType: 'function_invocation',
	name: string,
	parameters: Node[],
	pos: Pos,
};

export type TypedFunctionInvocationNode = {
	exprNodeType: 'function_invocation',
	name: string,
	parameters: TypedNode[],
	pos: Pos,
	exprType: 'error' | 'string',
}

export type Node =
	| BinaryOpNode
	| UnaryMinusNode
	| NumberNode
	| StringLiteralNode
	| VariableNode
	| FunctionInvocationNode
;

export type TypedNode =
	| TypedBinaryOpNode
	| TypedUnaryMinusNode
	| TypedNumberNode
	| TypedStringLiteralNode
	| TypedVariableNode
	| TypedFunctionInvocationNode
;

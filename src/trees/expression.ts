import {InferredType} from '../type_map';

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
	typed?: false,
};

export type TypedBinaryOpNode = {
	exprNodeType: 'binary_op',
	binaryOp: 'plus' | 'multiply' | 'divide' | 'minus',
	lhs: TypedNode,
	rhs: TypedNode,
	pos: Pos,
	exprType: InferredType,
	typed: true,
	isConstant: boolean,
}

export type UnaryMinusNode = {
	exprNodeType: 'unary_minus',
	op: Node,
	pos: Pos,
	typed?: false,
};

export type TypedUnaryMinusNode = {
	exprNodeType: 'unary_minus',
	op: TypedNode,
	pos: Pos,
	exprType: InferredType,
	typed: true,
	isConstant: boolean,
}

export type NumberNode = {
	exprNodeType: 'number',
	value: number,
	pos: Pos,
	typed?: false,
};

export type TypedNumberNode = {
	exprNodeType: 'number',
	value: number,
	pos: Pos,
	exprType: 'number',
	typed: true,
	isConstant: true,
}

export type StringLiteralNode = {
	exprNodeType: 'string_literal',
	value: string,
	pos: Pos,
	typed?: false,
};

export type TypedStringLiteralNode = {
	exprNodeType: 'string_literal',
	value: string,
	pos: Pos,
	exprType: 'string',
	typed: true,
	isConstant: true,
}

export type VariableNode = {
	exprNodeType: 'variable',
	name: string,
	pos: Pos,
	typed?: false,
};

export type TypedVariableNode = {
	exprNodeType: 'variable',
	name: string,
	pos: Pos,
	exprType: InferredType,
	typed: true,
	isConstant: false,
};

export type FunctionInvocationNode = {
	exprNodeType: 'function_invocation',
	name: string,
	parameters: Node[],
	pos: Pos,
	typed?: false,
};

export type TypedFunctionInvocationNode = {
	exprNodeType: 'function_invocation',
	name: string,
	parameters: TypedNode[],
	pos: Pos,
	exprType: 'error' | 'string',
	typed: true,
	isConstant: false,
}

export type Node = BinaryOpNode
	| UnaryMinusNode
	| NumberNode
	| StringLiteralNode
	| VariableNode
	| FunctionInvocationNode
;

export type TypedNode = TypedBinaryOpNode
	| TypedUnaryMinusNode
	| TypedNumberNode
	| TypedStringLiteralNode
	| TypedVariableNode
	| TypedFunctionInvocationNode
;

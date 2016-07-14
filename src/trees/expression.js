/**
 *
 */

export type Pos = {
	firstLine: number;
	firstColumn: number;
	lastLine: number;
	lastColumn: number;
};

export type BinaryOpPlusNode = {
	type: 'binary_op';
	op: 'plus';
	lhs: Node;
	rhs: Node;
	pos: Pos;
};

export type BinaryOpMinusNode = {
	type: 'binary_op';
	op: 'minus';
	lhs: Node;
	rhs: Node;
	pos: Pos;
};

export type BinaryOpDivideNode = {
	type: 'binary_op';
	op: 'divide';
	lhs: Node;
	rhs: Node;
	pos: Pos;
};

export type BinaryOpMultiplyNode = {
	type: 'binary_op';
	op: 'multiply';
	lhs: Node;
	rhs: Node;
	pos: Pos;
};

export type BinaryOpNode =
	| BinaryOpPlusNode
	| BinaryOpMinusNode
	| BinaryOpDivideNode
	| BinaryOpMultiplyNode
;

export type UnaryMinusNode = {
	type: 'unary_minus';
	op: Node;
	pos: Pos;
};

export type NumberNode = {
	type: 'number';
	value: number;
	pos: Pos;
};

export type StringLiteralNode = {
	type: 'string_literal';
	value: string;
	pos: Pos;
};

export type VariableNode = {
	type: 'variable';
	name: string;
	pos: Pos;
};

export type FunctionInvocationNode = {
	type: 'function_invocation';
	name: string;
	parameters: Node[];
	pos: Pos;
};

export type Node =
	| BinaryOpNode
	| UnaryMinusNode
	| NumberNode
	| StringLiteralNode
	| VariableNode
	| FunctionInvocationNode
;

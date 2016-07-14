/**
 *
 */

import type * as Expr from './expression';

export type InferredType = 'unknown' | 'gender' | 'enum' | 'number-or-string' | 'number' | 'string' | 'error';

type TypeInfo = { type: InferredType};

export type BinaryOpPlusNode = Expr.BinaryOpPlusNode & TypeInfo;

export type BinaryOpMinusNode = Expr.BinaryOpMinusNode & TypeInfo;
export type BinaryOpDivideNode = Expr.BinaryOpDivideNode & TypeInfo;

export type BinaryOpMultiplyNode = Expr.BinaryOpMultiplyNode & TypeInfo;

export type BinaryOpNode =
	| BinaryOpPlusNode
	| BinaryOpMinusNode
	| BinaryOpDivideNode
	| BinaryOpMultiplyNode
;

export type UnaryMinusNode = Expr.UnaryMinusNode & TypeInfo;

export type NumberNode = Expr.NumberNode & {
	type: 'number';
};

export type StringLiteralNode = Expr.StringLiteralNode & {
	type: 'string';
};

export type VariableNode = Expr.VariableNode & TypeInfo;

export type FunctionInvocationNode = Expr.FunctionInvocationNode & TypeInfo;

export type Node =
	| BinaryOpNode
	| UnaryMinusNode
	| NumberNode
	| StringLiteralNode
	| VariableNode
	| FunctionInvocationNode
;

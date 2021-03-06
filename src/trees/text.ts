import { Node as ExpressionNode, TypedNode as TypedExpressionNode } from './expression';

import { InferredType } from '../type_map';

export type Pos = {
	firstLine: number;
	firstColumn: number;
	lastLine: number;
	lastColumn: number;
};

export type LiteralNode = {
	textNodeType: 'literal';
	value: string;
	pos: Pos;
	typed?: false;
};

export type TypedLiteralNode = {
	textNodeType: 'literal';
	value: string;
	pos: Pos;
	textType: InferredType;
	typed: true;
};

export type VariableNode = {
	textNodeType: 'variable';
	value: string;
	pos: Pos;
	typed?: false;
};

export type TypedVariableNode = {
	textNodeType: 'variable';
	value: string;
	pos: Pos;
	textType: InferredType;
	typed: true;
};

export type ExprNode = {
	textNodeType: 'expr';
	value: ExpressionNode;
	pos: Pos;
	typed?: false;
};

export type TypedExprNode = {
	textNodeType: 'expr';
	value: TypedExpressionNode;
	pos: Pos;
	textType: InferredType;
	typed: true;
};

export type Node = LiteralNode | VariableNode | ExprNode;

export type TypedNode = TypedLiteralNode | TypedVariableNode | TypedExprNode;

export type ASTRoot = {
	input: string;
	nodes: Node[];
};

export type TypedASTRoot = {
	input: string;
	nodes: TypedNode[];
};

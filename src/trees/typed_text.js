/**
 *
 */

import type * as Text from './text';

export type InferredType = 'unknown' | 'gender' | 'enum' | 'number-or-string' | 'number' | 'string' | 'error';

type TypeInfo = { type: InferredType};

export type LiteralNode = Text.LiteralNode & {
	type: 'text';
};

export type VariableNode = Text.VariableNode & TypeInfo;

export type ExprNode = Text.ExprNode & TypeInfo;

export type Node =
	| LiteralNode
	| VariableNode
	| ExprNode
;

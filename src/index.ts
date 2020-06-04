import { default as parseText, parseOnlyTextExpression } from './parsers/text';

import { default as parseExpression } from './parsers/expression';

import { default as parseConstraint } from './parsers/constraint';

import * as ExprTree from './trees/expression';

export const ExpressionTree = ExprTree;

export const parsers = {
	constraint: parseConstraint,
	expression: parseExpression,
	onlyText: parseOnlyTextExpression,
	text: parseText,
};

export { default as UnknownFunctionError } from './errors/unknown_function_error';
export { default as UnknownVariableError } from './errors/unknown_variable_error';
export { default as DeadCodeError } from './errors/dead_code_error';
export { default as ParseError } from './errors/parse_error';
export { default as TypeError } from './errors/type_error';
export { showErrorLocation } from './errors/util';

import { InferredType as InferType } from './type_map';
export { default as TypeMap } from './type_map';

export type InferredType = InferType;

import { emitConstrainedTranslation } from './emitting/constraint';
import Context from './emitting/context';
import { emitExpression } from './emitting/expression';
import { encodeIfStringFunction } from './emitting/helpers';

import { getTypeGuardStatement, getTypeGuardStatements } from './emitting/type_guards';

import { emitConstrainedTranslations, emitNodeListExpression, emitTranslation } from './emitting/translation';

export const emitting = {
	Context: Context,
	constrainedTranslation: emitConstrainedTranslations,
	encodeIfStringFunction: encodeIfStringFunction,
	helpers: {
		emitConstrainedTranslationStatement: emitConstrainedTranslation,
		emitExpression: emitExpression,
		emitNodeListExpression: emitNodeListExpression,
		emitTypeGuardStatement: getTypeGuardStatement,
		emitTypeGuardStatements: getTypeGuardStatements,
	},
	translation: emitTranslation,
};

import {
	analyzeOnlyConstraintTranslation,
	analyzeOnlySimpleTranslation,
	analyzeOnlyTranslation,
	analyzeTranslation,
	typeInferTranslation,
} from './analysis/combined';
import { constantFoldExpression, constantFoldExpressionList } from './analysis/constant_folding';
import { analyzeConstraints } from './analysis/constraints';
import {
	inferConstraintTypes,
	inferExpressionTypes,
	inferTextTypes,
	makeTypedExpressionTree,
} from './analysis/type_inference';

export const analysis = {
	analyzeConstraints: analyzeConstraints,
	analyzeOnlyConstraintTranslation,
	analyzeOnlySimpleTranslation,
	analyzeOnlyTranslation,
	analyzeTranslation,
	constantFoldExpression: constantFoldExpression,
	constantFoldTranslation: constantFoldExpressionList,
	inferConstraintTypes,
	inferExpressionTypes,
	inferTextTypes,
	makeTypedExpressionTree,
	typeInferTranslation,
};

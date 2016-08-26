import {
	default as parseText,
	parseOnlyTextExpression,
} from './parsers/text';

import {
	default as parseExpression,
} from './parsers/expression';

import {
	default as parseConstraint,
} from './parsers/constraint';

import * as ExprTree from './trees/expression';

export const ExpressionTree = ExprTree;

export const parsers = {
	constraint: parseConstraint,
	expression: parseExpression,
	onlyText: parseOnlyTextExpression,
	text: parseText,
};

import {default as DeadCodeErrorConstructor} from './errors/dead_code_error';
import {default as ParseErrorConstructor} from './errors/parse_error';
import {default as TypeErrorConstructor} from './errors/type_error';

export const ParseError = ParseErrorConstructor;
export const DeadError = DeadCodeErrorConstructor;
export const TypeError = TypeErrorConstructor;

import {default as TypeMapConstructor, InferredType as InferType} from './type_map';

export const TypeMap = TypeMapConstructor;
export type InferredType = InferType;

import {emitConstrainedTranslation} from './emitting/constraint';
import Context from './emitting/context';
import {emitExpression} from './emitting/expression';

import {
	getTypeGuardStatement,
	getTypeGuardStatements,
} from './emitting/type_guards';

import {
	emitConstrainedTranslations,
	emitNodeListExpression,
	emitTranslation,
} from './emitting/translation';

export const emitting = {
	Context: Context,
	constrainedTranslation: emitConstrainedTranslations,
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
} from './analysis/combined';
import {
	constantFoldExpression,
	constantFoldExpressionList,
} from './analysis/constant_folding';
import {
	analyzeConstraints,
} from './analysis/constraints';
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
};

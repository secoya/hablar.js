/**
 * @flow
 */

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


export const parsers = {
	text: parseText,
	onlyText: parseOnlyTextExpression,
	expression: parseExpression,
	constraint: parseConstraint,
};

export {default as ParseError} from './errors/parse_error';
export {default as DeadCodeError} from './errors/dead_code_error';
export {default as TypeError} from './errors/type_error';

export {default as TypeMap} from './type_map';

import Context from './emitting/context';
import {emitConstrainedTranslation} from './emitting/constraint';
import {emitExpression} from './emitting/expression';

import {
	getTypeGuardStatement,
	getTypeGuardStatements,
} from './emitting/type_guards';

import {
	emitNodeListExpression,
	emitConstrainedTranslations,
	emitTranslation,
} from './emitting/translation';

export const emitting = {
	Context: Context,
	constrainedTranslation: emitConstrainedTranslations,
	translation: emitTranslation,
	helpers: {
		emitExpression: emitExpression,
		emitTypeGuardStatement: getTypeGuardStatement,
		emitTypeGuardStatements: getTypeGuardStatements,
		emitConstrainedTranslationStatement: emitConstrainedTranslation,
		emitNodeListExpression: emitNodeListExpression,
	},
};

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
	constantFoldExpression: constantFoldExpression,
	constantFoldTranslation: constantFoldExpressionList,
	analyzeConstraints: analyzeConstraints,
	inferConstraintTypes,
	inferExpressionTypes,
	inferTextTypes,
	makeTypedExpressionTree,
};

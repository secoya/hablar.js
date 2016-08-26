/**
 * @flow
 */

import {types} from 'recast';
import type {Statement, Expression} from 'ast-types';
import type {default as TypeMap, InferredType} from '../type_map';

import type Context from './context';

const b = types.builders;

function getTypeTestStatement(
	ctx: Context,
	varName: string,
	type: InferredType
) : Statement {
	const test = getNegativeTypeTest(ctx, varName, type);

	// Perhaps improve error message in the future
	const error = b.newExpression(
		b.identifier('Error'),
		[
			b.literal('Variable ' + varName + ' must be of type ' + type),
		]
	);

	return b.ifStatement(
		test,
		b.blockStatement(
			[
				b.throwStatement(error),
			]
		)
	);
}

function getNegativeTypeTest(
	ctx: Context,
	varName: string,
	type: InferredType
) : Expression {
	switch (type) {
		case 'unknown': {
			const hasOwnProperty = b.callExpression(
				b.memberExpression(
					ctx.varsExpr,
					b.identifier('hasOwnProperty'),
					false
				),
				[b.literal(varName)]
			);
			return b.unaryExpression('!', hasOwnProperty, true);
		}
		case 'string': {
			const paramExpr = b.memberExpression(
				ctx.varsExpr,
				b.identifier(varName),
				false
			);

			const typeOf = b.callExpression(
				b.identifier('typeof'),
				[paramExpr]
			);

			const isString = b.binaryExpression(
				'!==',
				typeOf,
				b.literal('string')
			);

			const isSafeString = b.callExpression(
				b.memberExpression(
					ctx.ctxExpr,
					b.identifier('isSafeString'),
					false
				),
				[paramExpr]
			);

			const isNotSafeString = b.unaryExpression(
				'!',
				isSafeString,
				true
			);

			return b.logicalExpression(
				'&&',
				isString,
				isNotSafeString
			);
		}
		case 'enum': // FALLTHROUGH
		case 'number': {
			const paramExpr = b.memberExpression(
				ctx.varsExpr,
				b.identifier(varName),
				false
			);

			const testType = type === 'enum' ? 'string' : type;
			const typeOf = b.callExpression(
				b.identifier('typeof'),
				[paramExpr]
			);

			return b.binaryExpression(
				'!==',
				typeOf,
				b.literal(testType)
			);
		}
		case 'number-or-string': {
			// I am not sure if simple OR binary tests are better
			// than array + indexOf tests.


			// Either way, my instincts tells me that simpler is better.
			// So here goes the OR binary tests
			const paramExpr = b.memberExpression(
				ctx.varsExpr,
				b.identifier(varName),
				false
			);

			ctx.usesTypeGuardScratchVariable = true;
			const typeOf = b.assignmentExpression(
				'=',
				ctx.typeGuardScratchVarExpr,
				b.callExpression(
					b.identifier('typeof'),
					[paramExpr]
				)
			);

			const isString = b.binaryExpression(
				'===',
				typeOf,
				b.literal('string')
			);

			const isNumber = b.binaryExpression(
				'===',
				ctx.typeGuardScratchVarExpr,
				b.literal('number')
			);

			const numberOrString = b.logicalExpression(
				'||',
				isString,
				isNumber
			);

			const isSafeString = b.callExpression(
				b.memberExpression(
					ctx.ctxExpr,
					b.identifier('isSafeString'),
					false
				),
				[paramExpr]
			);

			const isGoodValue = b.logicalExpression(
				'||',
				numberOrString,
				isSafeString
			);

			return b.unaryExpression('!', isGoodValue, true);
		}
		case 'gender': {
			const paramExpr = b.memberExpression(
				ctx.varsExpr,
				b.identifier(varName),
				false
			);

			const isMaskulinum = b.binaryExpression(
				'===',
				paramExpr,
				b.literal('M')
			);

			const isFeminum = b.binaryExpression(
				'===',
				paramExpr,
				b.literal('F')
			);

			const isNeutrum = b.binaryExpression(
				'===',
				paramExpr,
				b.literal('N')
			);

			const isGender = b.logicalExpression(
				'||',
				b.logicalExpression(
					'||',
					isMaskulinum,
					isFeminum
				),
				isNeutrum
			);

			return b.unaryExpression(
				'!',
				isGender,
				true
			);
		}
		case 'error':
			throw new Error('Cannot generate type guards for an error type!');
		default:
			throw new Error('Unknown type: ' + type);
	}
}

export function getTypeGuardStatement(
	varName: string,
	type: InferredType,
	ctx: Context
) : Statement {
	return getTypeTestStatement(ctx, varName, type);
}

export function getTypeGuardStatements(
	typeMap: TypeMap,
	ctx: Context,
) : Statement[] {
	const result = [];

	for (const varName of typeMap.variables()) {
		const type = typeMap.getVariableType(varName);
		result.push(getTypeTestStatement(ctx, varName, type));
	}

	for (const functionName of typeMap.functionNames()) {
		const fn = b.memberExpression(
			ctx.functionsExpr,
			b.identifier(functionName),
			false
		);

		const test = b.binaryExpression(
			'!==',
			b.callExpression(
				b.identifier('typeof'),
				[fn]
			),
			b.literal('function')
		);

		const throwError = b.throwStatement(
			b.newExpression(
				b.identifier('Error'),
				[
					b.literal('Translation requires function ' + functionName + ' to exist'),
				]
			)
		);

		result.push(
			b.ifStatement(
				test,
				b.blockStatement([
					throwError,
				])
			)
		);
	}

	return result;
}

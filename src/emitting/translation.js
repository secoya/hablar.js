/**
 * @flow
 */

import type {TypedNode} from '../trees/text';
import type TypeMap from '../type_map';
import Context from './context';

import {
	getTypeGuardStatements,
} from './type_guards';

import {
	emitConstrainedTranslation,
} from './constraint';

import type {
	Node as ConstraintNode,
} from '../trees/constraint';

import {
	emitExpression,
} from './expression';

import type {
	Statement,
	Expression,
} from 'ast-types';
import {types} from 'recast';

const b = types.builders;

function encodeIfString(
	exp: Expression,
	ctx: Context
) : Expression {
	return b.callExpression(
		ctx.encodeIfStringExpr,
		[ctx.ctxExpr, exp]
	);
}

function encodeString(
	exp: Expression,
	ctx: Context
) : Expression {
	return b.callExpression(
		b.memberExpression(
			ctx.ctxExpr,
			b.identifier('encode'),
			false
		),
		[exp]
	);
}

export function emitNodeListExpression(
	nodes: TypedNode[],
	ctx: Context
) : Expression {
	const exprs : Array<{
		type: 'string' | 'number',
		exp: Expression
	}> = [];

	for (const node of nodes) {
		switch (node.textNodeType) {
			case 'literal':
				exprs.push({
					type: 'string',
					exp: encodeString(b.literal(node.value), ctx),
				});
				break;
			case 'variable': {
				let varExp = b.memberExpression(
					ctx.varsExpr,
					b.identifier(node.value),
					false
				);

				if (
					node.textType !== 'number'
				) {
					varExp = encodeIfString(varExp, ctx);
				}
				exprs.push({
					type: node.textType === 'number' ? 'number' : 'string',
					exp: varExp,
				});
				break;
			}
			case 'expr': {
				let varExp = emitExpression(node.value, ctx);

				if (node.value.exprType !== 'number') {
					varExp = encodeIfString(varExp, ctx);
				}
				exprs.push({
					type: node.value.exprType === 'number' ? 'number' : 'string',
					exp: varExp,
				});
				break;
			}
			default:
				throw new Error('Unknown node type: ' + node.textNodeType);
		}
	}

	const res = exprs.reduce((acc, info) => {
		if (acc === null) {
			return info;
		}

		const accExp = acc.type === 'number' && info.type === 'number' ?
			b.binaryExpression(
				'+',
				b.literal(''),
				acc.exp
			) :
			acc.exp;
		return {
			type: 'string',
			exp: b.binaryExpression(
				'+',
				accExp,
				info.exp
			),
		};
	}, null);

	if (res === null) {
		return b.literal('');
	}

	// This can only happen when only a single expression/varaible
	// was present, that is a number
	if (res.type === 'number') {
		res.exp = b.binaryExpression(
			'+',
			b.literal(''),
			res.exp
		);
	}

	return res.exp;
}

function getTypeGuards(
	ctx: Context,
	typeMap: TypeMap
) : Statement[] {
	const usesTypeGuardScratchVariable = ctx.usesTypeGuardScratchVariable;
	ctx.usesTypeGuardScratchVariable = false;
	const statements : Statement[] = getTypeGuardStatements(typeMap, ctx);

	if (ctx.usesTypeGuardScratchVariable) {
		statements.splice(
			0,
			0,
			b.variableDeclaration(
				'var',
				[
					b.variableDeclarator(ctx.typeGuardScratchVarExpr, null),
				]
			)
		);
	}
	ctx.usesTypeGuardScratchVariable = usesTypeGuardScratchVariable;

	return statements;
}

export function emitConstrainedTranslations(
	translations: Array<{
		constraints: ConstraintNode[],
		nodes: TypedNode[],
	}>,
	ctx: Context,
	typeMap: TypeMap
) : Expression {
	if (translations.length === 0) {
		throw new Error('No constraints found');
	}

	const statements : Statement[] = getTypeGuards(ctx, typeMap);

	let unconditionallyReturned = false;
	for (const translation of translations) {
		const expr = emitNodeListExpression(translation.nodes, ctx);

		const stmt = emitConstrainedTranslation(translation.constraints, expr, ctx);

		if (stmt.type === 'ReturnStatement') {
			unconditionallyReturned = true;
		}

		statements.push(stmt);
	}

	if (!unconditionallyReturned) {
		statements.push(
			b.throwStatement(
				b.newExpression(
					b.identifier('Error'),
					[
						b.literal('No translation matched the parameters'),
					]
				)
			)
		);
	}

	return b.functionExpression(
		null,
		[
			ctx.varsExpr,
			ctx.functionsExpr,
			ctx.ctxExpr,
		],
		b.blockStatement(statements)
	);
}

export function emitTranslation(
	nodes: TypedNode[],
	ctx: Context,
	typeMap: TypeMap
) : Expression {
	const first = nodes[0];
	// Constant translations are just emitted as their Constant
	// translation
	if (nodes.length === 1 && first.textNodeType === 'literal') {
		return b.literal(first.value);
	}

	const statements = getTypeGuards(ctx, typeMap);

	// Emit the body of the translation
	const expr = emitNodeListExpression(nodes, ctx);

	statements.push(b.returnStatement(expr));

	return b.functionExpression(
		null,
		[
			ctx.varsExpr,
			ctx.functionsExpr,
			ctx.ctxExpr,
		],
		b.blockStatement(statements)
	);
}

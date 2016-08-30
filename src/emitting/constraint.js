/**
 * @flow
 */

import Context from './context';
import {types} from 'recast';
import type {Statement, Expression} from 'ast-types';
import type {Node} from '../trees/constraint';

const b = types.builders;

export function emitConstrainedTranslation(
	constraints: Node[],
	expr: Expression,
	ctx: Context
) : Statement {

	const tests : Expression[] = [];

	for (const t of constraints) {
		switch (t.op) {
			case '!': // This test generates no code
				break;
			case '=':
			case '!=':
			case '<':
			case '<=':
			case '>':
			case '>=':
				const lhs = b.memberExpression(
					ctx.varsExpr,
					b.identifier(t.lhs.name),
					false
				);
				const rhs = b.literal(t.rhs.value);

				let op = t.op;

				if (op === '=') {
					op = '===';
				} else if (op === '!=') {
					op = '!==';
				}

				tests.push(b.binaryExpression(op, lhs, rhs));
				break;
			default:
				throw new Error('Unknown constraint op: ' + t.op);
		}
	}

	const test = tests.reduce((acc, exp) => {
		if (acc === null) {
			return exp;
		}

		return b.logicalExpression('&&', acc, exp);
	}, null);

	if (test === null) {
		return b.returnStatement(expr);
	}
	return b.ifStatement(test, b.blockStatement([b.returnStatement(expr)]));
}

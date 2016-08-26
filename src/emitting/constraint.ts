import {Node} from '../trees/constraint';
import Context from './context';
import {types} from 'recast';

const b = types.builders;

export function emitConstrainedTranslation(
	constraints: Node[],
	expr: ASTTypes.Expression,
	ctx: Context
): ASTTypes.Statement {

	const tests: ASTTypes.Expression[] = [];

	for (const t of constraints) {
		const tOp = t.op;
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

				let op: '===' | '!==' | '>' | '<' | '>=' | '<=';

				switch (t.op) {
					case '=':
						op = '===';
						break;
					case '!=':
						op = '!==';
						break;
					case '>':
						op = '>';
						break;
					case '<':
						op = '<';
						break;
					case '<=':
						op = '<=';
						break;
					case '>=':
						op = '>=';
						break;
					default:
						throw new Error('Unknown op type: ' + tOp);
				}

				tests.push(b.binaryExpression(op, lhs, rhs));
				break;
			default:
				throw new Error('Unknown constraint op: ' + tOp);
		}
	}

	const test = tests.reduce((acc: ASTTypes.Expression | null, exp: ASTTypes.Expression) => {
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

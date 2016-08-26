import {types} from 'recast';

const b = types.builders;

import {
	TypedNode,
} from '../trees/expression';
import Context from './context';

function getBinaryOp(op: 'plus' | 'minus' | 'divide' | 'multiply'): '+' | '-' | '*' | '/' {
	switch (op) {
		case 'plus':
			return '+';
		case 'minus':
			return '-';
		case 'divide':
			return '/';
		case 'multiply':
			return '*';
		default:
			throw new Error('Invalid binary operator: ' + op);
	}
}

export function emitExpression(
	node: TypedNode,
	ctx: Context
): ASTTypes.Expression {
	const exprNodeType = node.exprNodeType;
	switch (node.exprNodeType) {
		case 'string_literal': // FALLTHROUGH
		case 'number':
			return b.literal(node.value);
		case 'variable':
			return b.memberExpression(
				ctx.varsExpr,
				b.identifier(node.name),
				false
			);
		case 'binary_op': {
			const lhs = emitExpression(node.lhs, ctx);
			const rhs = emitExpression(node.rhs, ctx);

			const op = getBinaryOp(node.binaryOp);

			if (node.isConstant || node.exprType === 'number') {
				return b.binaryExpression(op, lhs, rhs);
			} else {
				ctx.usesPlusOp = true;
				return b.callExpression(
					ctx.plusOpExpr,
					[lhs, rhs]
				);
			}
		}
		case 'unary_minus': {
			const operand = emitExpression(node.op, ctx);
			return b.unaryExpression('-', operand, true);
		}
		case 'function_invocation': {
			const callee = b.memberExpression(
				ctx.functionsExpr,
				b.identifier(node.name),
				false
			);

			const args = node.parameters.map(
				(n) => emitExpression(n, ctx)
			);

			return b.callExpression(callee, [ctx.ctxExpr, ...args]);
		}
		default:
			throw new Error('Unknown node type: ' + exprNodeType);
	}
}

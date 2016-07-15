/**
 * @flow
 */

import type {Node} from '../trees/expression';
import type {Node as TextNode, Pos} from '../trees/text';

function isConstantExpression(expr: Node) {
	return expr.type === 'number' || expr.type === 'string_literal';
}

function getConstantValue(expr: Node) : string | number {
	if (expr.type === 'number') {
		return expr.value;
	} else if (expr.type === 'string_literal') {
		return expr.value;
	}

	throw new Error('Not a constant expression value. It was: ' + expr.type);
}

function combinePosInformation(firstExpr: Node, lastExpr: Node) : Pos {
	return {
		firstLine: firstExpr.firstLine,
		firstColumn: firstExpr.firstColumn,
		lastLine: lastExpr.lastLine,
		lastColumn: lastExpr.lastColumn,
	};
}

function constantMultiplyOp(
	originalText: string,
	lhs: string | number,
	rhs: string | number
) : number {
	if (
	typeof (lhs) === 'string' ||
	typeof (rhs) === 'string'
	) {
		const lhsType = typeof (lhs);
		const rhsType = typeof (rhs);
		throw new Error(
			`Could not constant fold expression: '${originalText}'. ` +
			`Multiply operation between ${lhsType} and ${rhsType}. ` +
			'Only allowed between 2 numbers.'
		);
	}
	return lhs * rhs;
}

function constantBinaryOp(
	originalText: string,
	op: 'plus' | 'minus' | 'divide' | 'multiply',
	lhs: string | number,
	rhs: string | number
) : string | number {
	switch (op) {
		case 'plus':
			return lhs + rhs;
		case 'minus': {
			if (
				typeof (lhs) === 'string' ||
				typeof (rhs) === 'string'
			) {
				const lhsType = typeof (lhs);
				const rhsType = typeof (rhs);
				throw new Error(
					`Could not constant fold expression: '${originalText}'. ` +
					`Minus operation between ${lhsType} and ${rhsType}. ` +
					'Only allowed between 2 numbers.'
				);
			}
			return lhs - rhs;
		}
		case 'divide': {
			if (
			typeof (lhs) === 'string' ||
			typeof (rhs) === 'string'
		) {
				const lhsType = typeof (lhs);
				const rhsType = typeof (rhs);
				throw new Error(
					`Could not constant fold expression: '${originalText}'. ` +
					`Divide operation between ${lhsType} and ${rhsType}. ` +
					'Only allowed between 2 numbers.'
				);
			}
			return lhs / rhs;
		}
		case 'multiply':
			return constantMultiplyOp(originalText, lhs, rhs);
		default:
			throw new Error('Invalid binary operation type: ' + op);
	}
}

function constantFoldExpression(expr: Node, originalText: string) : Node {
	switch (expr.type) {
		case 'function_invocation': {
			const parameters = [];
			for (const param of expr.parameters) {
				parameters.push(constantFoldExpression(param, originalText));
			}

			return {
				type: 'function_invocation',
				name: expr.name,
				parameters,
			};
		}
		case 'binary_op': {
			const lhs = constantFoldExpression(expr.lhs, originalText);
			const rhs = constantFoldExpression(expr.rhs, originalText);

			if (isConstantExpression(lhs) && isConstantExpression(rhs)) {
				const val = constantBinaryOp(originalText, expr.op, lhs.value, rhs.value);
				if (typeof (val) === 'string') {
					return {
						type: 'string_literal',
						value: val,
					};
				} else {
					return {
						type: 'number',
						value: val,
					};
				}
			}	else if (
				expr.op === 'multiply' &&
				isConstantExpression(rhs) &&
				lhs.type === 'binary_op' &&
				lhs.op === 'multiply' &&
				isConstantExpression(lhs.rhs)
			) {
				// This is to constant fold expressions such as nonConstant * constant * constant2
				const val = constantMultiplyOp(originalText, lhs.rhs.value, rhs.value);
				return {
					type: 'binary_op',
					op: 'multiply',
					lhs: lhs.lhs,
					rhs: {
						type: 'number',
						value: val,
					},
				};
			}

			return {
				type: 'binary_op',
				op: expr.op,
				lhs,
				rhs,
			};
		}
		case 'unary_minus': {
			const val = constantFoldExpression(expr.op, originalText);
			if (isConstantExpression(val)) {
				if (typeof (val) !== 'number') {
					throw new Error(
						`Could not constant fold expression: '${originalText}'. ` +
						'Unary minus with a string. It is only allowed on numbers'
					);
				}
				return {
					type: 'number',
					value: -val,
				};
			}

			return {
				type: 'unary_minus',
				op: val,
			};
		}
		default:
			return expr;
	}
}

export default function constantFoldExpressionList(nodes: TextNode[], originalText: string) : TextNode[] {
	const result = [];
	let lastConstantExpr = null;
	for (const expr of nodes) {
		switch (expr.type) {
			case 'expr': {
				expr.value = constantFoldExpression(expr.value, originalText);
				if (isConstantExpression(expr.value)) {
					const val = '' + getConstantValue(expr.value);
					if (lastConstantExpr != null) {
						lastConstantExpr.value += val;
						lastConstantExpr.pos = combinePosInformation(lastConstantExpr, expr);
					} else {
						const newExpr = {
							type: 'literal',
							value: val,
							pos: combinePosInformation(lastConstantExpr, expr),
						};
						result.push(newExpr);
						lastConstantExpr = newExpr;
					}
				} else {
					result.push(expr);
				}
				break;
			}
			case 'literal':
				if (lastConstantExpr != null) {
					lastConstantExpr.value += expr.value;
					lastConstantExpr.pos = combinePosInformation(lastConstantExpr, expr);
				} else {
					result.push(expr);
					lastConstantExpr = expr;
				}
				break;
			default:
				result.push(expr);
				lastConstantExpr = null;
		}
	}

	return result;
}

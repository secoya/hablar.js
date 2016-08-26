/**
 * @flow
 */
import type {TypedNode as Node} from '../trees/expression';
import type {TypedNode as TextNode, Pos} from '../trees/text';

function isConstantExpression(expr: Node) {
	return expr.exprNodeType === 'number' || expr.exprNodeType === 'string_literal';
}

function getConstantValue(expr: Node) : string | number {
	if (expr.exprNodeType === 'number') {
		return expr.value;
	} else if (expr.exprNodeType === 'string_literal') {
		return expr.value;
	}

	throw new Error('Not a constant expression value. It was: ' + expr.exprNodeType);
}

function combinePosInformation(firstPos: Pos, lastPos: Pos) : Pos {
	return {
		firstLine: firstPos.firstLine,
		firstColumn: firstPos.firstColumn,
		lastLine: lastPos.lastLine,
		lastColumn: lastPos.lastColumn,
	};
}

function constantMultiplyOp(
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
			'Could not constant fold expression. ' +
			`Multiply operation between ${lhsType} and ${rhsType}. ` +
			'Only allowed between 2 numbers.'
		);
	}
	return lhs * rhs;
}

function constantBinaryOp(
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
					'Could not constant fold expression. ' +
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
					'Could not constant fold expression. ' +
					`Divide operation between ${lhsType} and ${rhsType}. ` +
					'Only allowed between 2 numbers.'
				);
			}
			return lhs / rhs;
		}
		case 'multiply':
			return constantMultiplyOp(lhs, rhs);
		default:
			throw new Error('Invalid binary operation type: ' + op);
	}
}

/**
 * Constant folds the given expression.
 * The result of this should at the very least be that
 * every node that has isConstant = true is turned into
 * either a string_literal node or a number node.
 *
 * This process may throw several errors, all of these
 * should have been reported during the type inference
 * as type errors in the code.
 */
export function constantFoldExpression(expr: Node) : Node {
	switch (expr.exprNodeType) {
		case 'string_literal': // FALLTHROUGH
		case 'number': // FALLTHROUGH
		case 'variable':
			return expr;
		case 'function_invocation': {
			const parameters = [];
			for (const param of expr.parameters) {
				parameters.push(constantFoldExpression(param));
			}

			return {
				exprNodeType: 'function_invocation',
				name: expr.name,
				parameters,
				exprType: expr.exprType,
				pos: expr.pos,
				typed: true,
				isConstant: false,
			};
		}
		case 'binary_op': {
			const lhs = constantFoldExpression(expr.lhs);
			const rhs = constantFoldExpression(expr.rhs);

			if (isConstantExpression(lhs) && isConstantExpression(rhs)) {
				const val = constantBinaryOp(expr.binaryOp, getConstantValue(lhs), getConstantValue(rhs));
				if (typeof (val) === 'string') {
					return {
						exprNodeType: 'string_literal',
						value: val,
						pos: expr.pos,
						exprType: 'string',
						typed: true,
						isConstant: true,
					};
				} else {
					return {
						exprNodeType: 'number',
						pos: expr.pos,
						value: val,
						exprType: 'number',
						typed: true,
						isConstant: true,
					};
				}
			}	else if (
				expr.binaryOp === 'multiply' &&
				isConstantExpression(rhs) &&
				lhs.exprNodeType === 'binary_op' &&
				lhs.binaryOp === 'multiply' &&
				isConstantExpression(lhs.rhs)
			) {
				// This is to constant fold expressions such as nonConstant * constant * constant2
				const val = constantMultiplyOp(getConstantValue(lhs.rhs), getConstantValue(rhs));
				return {
					exprNodeType: 'binary_op',
					binaryOp: 'multiply',
					lhs: lhs.lhs,
					rhs: {
						exprNodeType: 'number',
						value: val,
						pos: combinePosInformation(lhs.rhs.pos, rhs.pos),
						isConstant: true,
						typed: true,
						exprType: 'number',
					},
					isConstant: false,
					pos: expr.pos,
					typed: true,
					exprType: expr.exprType,
				};
			}

			return {
				exprNodeType: 'binary_op',
				exprType: expr.exprType,
				isConstant: false,
				typed: true,
				binaryOp: expr.binaryOp,
				lhs: lhs,
				rhs: rhs,
				pos: expr.pos,
			};
		}
		case 'unary_minus': {
			const val = constantFoldExpression(expr.op);
			if (isConstantExpression(val)) {
				if (val.exprType !== 'number') {
					throw new Error(
						'ould not constant fold expression. ' +
						'Unary minus with a string. It is only allowed on numbers.'
					);
				}

				const constantValue = getConstantValue(val);

				if (typeof (constantValue) === 'string') {
					throw new Error('Expected constant value to be a number, it was a string');
				}
				return {
					exprNodeType: 'number',
					value: -constantValue,
					pos: expr.pos,
					isConstant: true,
					typed: true,
					exprType: 'number',
				};
			}

			return {
				exprNodeType: 'unary_minus',
				op: val,
				typed: true,
				pos: expr.pos,
				exprType: expr.exprType,
				isConstant: false,
			};
		}
		default:
			throw new Error(`Unknown node type: ${expr.exprNodeType}`);
	}
}

export function constantFoldExpressionList(nodes: TextNode[]) : TextNode[] {
	const result = [];
	let lastConstantExpr = null;
	for (const expr of nodes) {
		switch (expr.textNodeType) {
			case 'expr': {
				expr.value = constantFoldExpression(expr.value);
				if (isConstantExpression(expr.value)) {
					const val = '' + getConstantValue(expr.value);
					if (lastConstantExpr != null) {
						lastConstantExpr.value += val;
						lastConstantExpr.pos = combinePosInformation(lastConstantExpr.pos, expr.pos);
					} else {
						const newExpr = {
							textNodeType: 'literal',
							value: val,
							typed: true,
							textType: 'string',
							pos: expr.pos,
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
					lastConstantExpr.pos = combinePosInformation(lastConstantExpr.pos, expr.pos);
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

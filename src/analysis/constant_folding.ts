import {
	TypedFunctionInvocationNode,
	TypedNode as Node,
	TypedNumberNode,
	TypedStringLiteralNode,
} from '../trees/expression';
import {
	Pos,
	TypedASTRoot,
	TypedLiteralNode,
	TypedNode as TextNode,
} from '../trees/text';

function isConstantExpression(expr: Node) {
	return expr.exprNodeType === 'number' || expr.exprNodeType === 'string_literal';
}

function getConstantValue(expr: Node): string | number {
	if (expr.exprNodeType === 'number') {
		return expr.value;
	} else if (expr.exprNodeType === 'string_literal') {
		return expr.value;
	}

	throw new Error('Not a constant expression value. It was: ' + expr.exprNodeType);
}

function combinePosInformation(firstPos: Pos, lastPos: Pos): Pos {
	return {
		firstColumn: firstPos.firstColumn,
		firstLine: firstPos.firstLine,
		lastColumn: lastPos.lastColumn,
		lastLine: lastPos.lastLine,
	};
}

function constantMultiplyOp(
	lhs: string | number,
	rhs: string | number
): number {
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
): string | number {
	switch (op) {
		case 'plus':
			// Type cast here to allow the addition.
			// It is intended to be allowed to mix and match number/string here.
			return (lhs as string) + (rhs as string);
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
export function constantFoldExpression(expr: Node): Node {
	const exprNodeType = expr.exprNodeType;
	switch (expr.exprNodeType) {
		case 'string_literal': // FALLTHROUGH
		case 'number': // FALLTHROUGH
		case 'variable':
			return expr;
		case 'function_invocation': {
			const parameters: Node[] = [];
			for (const param of expr.parameters) {
				parameters.push(constantFoldExpression(param));
			}

			return {
				exprNodeType: 'function_invocation',
				exprType: expr.exprType,
				isConstant: false,
				name: expr.name,
				parameters,
				pos: expr.pos,
				typed: true,
			} as TypedFunctionInvocationNode;
		}
		case 'binary_op': {
			const lhs = constantFoldExpression(expr.lhs);
			const rhs = constantFoldExpression(expr.rhs);

			if (isConstantExpression(lhs) && isConstantExpression(rhs)) {
				const val = constantBinaryOp(expr.binaryOp, getConstantValue(lhs), getConstantValue(rhs));
				if (typeof (val) === 'string') {
					return {
						exprNodeType: 'string_literal',
						exprType: 'string',
						isConstant: true,
						pos: expr.pos,
						typed: true,
						value: val,
					} as TypedStringLiteralNode;
				} else {
					return {
						exprNodeType: 'number',
						exprType: 'number',
						isConstant: true,
						pos: expr.pos,
						typed: true,
						value: val,
					} as TypedNumberNode;
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
					binaryOp: 'multiply',
					exprNodeType: 'binary_op',
					exprType: expr.exprType,
					isConstant: false,
					lhs: lhs.lhs,
					pos: expr.pos,
					rhs: {
						exprNodeType: 'number',
						exprType: 'number',
						isConstant: true,
						pos: combinePosInformation(lhs.rhs.pos, rhs.pos),
						typed: true,
						value: val,
					} as TypedNumberNode,
					typed: true,
				};
			}

			return {
				binaryOp: expr.binaryOp,
				exprNodeType: 'binary_op',
				exprType: expr.exprType,
				isConstant: false,
				lhs: lhs,
				pos: expr.pos,
				rhs: rhs,
				typed: true,
			};
		}
		case 'unary_minus': {
			const val = constantFoldExpression(expr.op);
			if (isConstantExpression(val)) {
				if (val.exprType !== 'number') {
					throw new Error(
						'Could not constant fold expression. ' +
						'Unary minus with a string. It is only allowed on numbers.'
					);
				}

				const constantValue = getConstantValue(val);

				if (typeof (constantValue) === 'string') {
					throw new Error('Expected constant value to be a number, it was a string');
				}
				return {
					exprNodeType: 'number',
					exprType: 'number',
					isConstant: true,
					pos: expr.pos,
					typed: true,
					value: -constantValue,
				} as TypedNumberNode;
			}

			return {
				exprNodeType: 'unary_minus',
				exprType: expr.exprType,
				isConstant: false,
				op: val,
				pos: expr.pos,
				typed: true,
			};
		}
		default:
			throw new Error(`Unknown node type: ${exprNodeType}`);
	}
}

export function constantFoldExpressionList(ast: TypedASTRoot): TypedASTRoot {
	const result: TextNode[] = [];
	let lastConstantExpr: TypedLiteralNode | null = null;
	for (const expr of ast.nodes) {
		switch (expr.textNodeType) {
			case 'expr': {
				expr.value = constantFoldExpression(expr.value);
				if (isConstantExpression(expr.value)) {
					const val = '' + getConstantValue(expr.value);
					if (lastConstantExpr != null) {
						lastConstantExpr.value += val;
						lastConstantExpr.pos = combinePosInformation(lastConstantExpr.pos, expr.pos);
					} else {
						const newExpr: TextNode = {
							pos: expr.pos,
							textNodeType: 'literal',
							textType: 'string',
							typed: true,
							value: val,
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

	return {
		input: ast.input,
		nodes: result,
	};
}

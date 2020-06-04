import { ASTRoot as ConstraintAST, Node as ConstraintNode } from '../trees/constraint';
import {
	Node as ExprNode,
	TypedBinaryOpNode,
	TypedFunctionInvocationNode,
	TypedNode as TypedExprNode,
	TypedNumberNode,
	TypedStringLiteralNode,
	TypedVariableNode,
	VariableNode as ExprVariableNode,
} from '../trees/expression';
import { ASTRoot, TypedASTRoot, TypedNode as TypedTextNode, VariableNode as TextVariableNode } from '../trees/text';

import { default as TypeMap, InferredType, UsageLocation } from '../type_map';

function addConstraintTypeUsageForNode(
	typeMap: TypeMap,
	node: ConstraintNode,
	ast: ConstraintAST,
	text: ASTRoot,
): void {
	const location = {
		constraints: ast,
		text: text,
	};

	const addTypeInfo = (variable: string, type: 'unknown' | 'gender' | 'enum' | 'number') => {
		typeMap.addTypeUsage(variable, type, {
			location,
			node,
			nodeType: 'constraint',
			type,
		});
	};

	if (node.op === '!') {
		const variable = node.operand.name;
		// We get no type information from this kind of thing. Just log the
		// unknown type.
		const type: 'unknown' = 'unknown';

		addTypeInfo(variable, type);
	} else {
		const variable = node.lhs.name;
		const type = node.rhs.type;
		addTypeInfo(variable, type);
	}
}

export function inferConstraintTypes(typeMap: TypeMap, ast: ConstraintAST, textAST: ASTRoot) {
	for (const constraint of ast.nodes) {
		addConstraintTypeUsageForNode(typeMap, constraint, ast, textAST);
	}
}

function addExprTypeInfo(
	typeMap: TypeMap,
	variable: ExprVariableNode,
	type: InferredType,
	location: UsageLocation,
): InferredType {
	if (type === 'error' || type === 'gender' || type === 'enum') {
		throw new Error('Invalid expression type usage type: ' + type);
	}
	return typeMap.addTypeUsage(variable.name, type, {
		location,
		node: variable,
		nodeType: 'expression',
		// We have excluded the other values from type in the guard above. I think this is a typescript bug
		type: type as 'unknown' | 'number-or-string' | 'number' | 'string',
	});
}

function inferExprType(
	typeMap: TypeMap,
	node: ExprNode,
	location: UsageLocation,
	resultType?: InferredType,
): InferredType {
	const exprType = node.exprNodeType;
	switch (node.exprNodeType) {
		case 'unary_minus':
			inferExprType(typeMap, node.op, location, 'number');
			return 'number';
		case 'variable': {
			if (resultType != null) {
				const resultExprType = addExprTypeInfo(typeMap, node, resultType, location);
				if (resultExprType === 'gender' || resultExprType === 'enum') {
					return 'string';
				}
				return resultExprType;
			}
			const nodeExprType = addExprTypeInfo(typeMap, node, 'unknown', location);
			if (nodeExprType === 'gender' || nodeExprType === 'enum') {
				return 'string';
			}

			return nodeExprType;
		}
		case 'number':
			return 'number';
		case 'string_literal':
			return 'string';
		case 'function_invocation':
			const parameterTypes = typeMap.functionParameterTypes(node.name);
			const types = parameterTypes.kind === 'known' ? parameterTypes.types : [];
			let idx = 0;
			for (const param of node.parameters) {
				const typeToInfer = idx < types.length ? types[idx] : undefined;
				inferExprType(typeMap, param, location, typeToInfer);
				idx++;
			}
			typeMap.addFunction(node.name);
			return 'unknown';
		case 'binary_op': {
			const binopType = node.binaryOp;
			switch (node.binaryOp) {
				case 'plus': {
					if (resultType !== 'number' || resultType == null) {
						resultType = 'number-or-string';
					}
					const lhs = inferExprType(typeMap, node.lhs, location, resultType);
					const rhs = inferExprType(typeMap, node.rhs, location, resultType);

					if (lhs !== rhs) {
						return 'number-or-string';
					}

					if (lhs === 'number') {
						return 'number';
					} else if (lhs === 'string') {
						return 'string';
					}

					return lhs;
				}
				case 'minus':
				case 'divide':
				case 'multiply':
					inferExprType(typeMap, node.lhs, location, 'number');
					inferExprType(typeMap, node.rhs, location, 'number');
					return 'number';
				default:
					throw new Error('Unknown binary operator: ' + binopType);
			}
		}
		default:
			throw new Error('Unknown expression type: ' + exprType);
	}
}

export function inferExpressionTypes(typeMap: TypeMap, node: ExprNode, location: UsageLocation) {
	inferExprType(typeMap, node, location);
}

export function inferTextTypes(typeMap: TypeMap, textAST: ASTRoot, constraintAST?: ConstraintAST) {
	const location = {
		constraints: constraintAST,
		text: textAST,
	};

	const addVariableTypeInfo = (node: TextVariableNode) => {
		typeMap.addTypeUsage(node.value, 'number-or-string', {
			location,
			node,
			nodeType: 'text',
			type: 'number-or-string',
		});
	};

	for (const node of textAST.nodes) {
		switch (node.textNodeType) {
			case 'variable':
				addVariableTypeInfo(node);
				break;
			case 'expr':
				inferExpressionTypes(typeMap, node.value, location);
				break;
			default: // Not needed - nothing to infer in literal types
		}
	}
}

function makeTypedExpressionNode(node: ExprNode, typeMap: TypeMap): TypedExprNode {
	const exprNodeType = node.exprNodeType;
	if (node.exprNodeType === 'string_literal') {
		return {
			exprNodeType: 'string_literal',
			exprType: 'string',
			isConstant: true,
			pos: node.pos,
			typed: true,
			value: node.value,
		} as TypedStringLiteralNode;
	} else if (node.exprNodeType === 'number') {
		return {
			exprNodeType: 'number',
			exprType: 'number',
			isConstant: true,
			pos: node.pos,
			typed: true,
			value: node.value,
		} as TypedNumberNode;
	} else if (node.exprNodeType === 'variable') {
		if (!typeMap.hasInfoForType(node.name)) {
			throw new Error(
				`Type for variable ${node.name} not found in type map.` +
					'Are you sure you ran the type inference phase first?',
			);
		}

		let type = typeMap.getVariableType(node.name);

		if (type === 'gender' || type === 'enum') {
			// Expressions don't deal with these type of variables.
			// This might need changing if the functions
			// get support for declaring types as well.
			type = 'string';
		}

		return {
			exprNodeType: 'variable',
			exprType: type,
			isConstant: false,
			name: node.name,
			pos: node.pos,
			typed: true,
		} as TypedVariableNode;
	} else if (node.exprNodeType === 'unary_minus') {
		const typedOp = makeTypedExpressionNode(node.op, typeMap);

		const exprType = typedOp.exprType;

		return {
			exprNodeType: 'unary_minus',
			exprType: exprType,
			isConstant: typedOp.isConstant,
			op: typedOp,
			pos: node.pos,
			typed: true,
		};
	} else if (node.exprNodeType === 'binary_op') {
		const typedLhs = makeTypedExpressionNode(node.lhs, typeMap);
		const lhsType = typedLhs.exprType;
		const typedRhs = makeTypedExpressionNode(node.rhs, typeMap);
		const rhsType = typedRhs.exprType;

		const makeBinaryResult = (
			op: 'plus' | 'minus' | 'divide' | 'multiply',
			type: InferredType,
		): TypedBinaryOpNode => {
			return {
				binaryOp: op,
				exprNodeType: 'binary_op',
				exprType: type,
				isConstant: typedLhs.isConstant && typedRhs.isConstant,
				lhs: typedLhs,
				pos: node.pos,
				rhs: typedRhs,
				typed: true,
			};
		};

		const binopType = node.binaryOp;
		switch (node.binaryOp) {
			case 'plus': {
				const bothNumbers = lhsType === 'number' && rhsType === 'number';
				let type: InferredType = 'number-or-string';
				if (bothNumbers) {
					type = 'number';
				} else if (lhsType === 'string' && rhsType === 'string') {
					type = 'string';
				}
				// Attempt to find the most specific type of both sides
				// Basicly if either side is a string, the result
				// is also a string. Otherwise it is number-or-string
				return makeBinaryResult('plus', type);
			}
			case 'minus':
			case 'divide':
			case 'multiply': {
				return makeBinaryResult(node.binaryOp, 'number');
			}
			default:
				throw new Error('Unknown binary operator: ' + binopType);
		}
	} else if (node.exprNodeType === 'function_invocation') {
		// For simplicity's sake. We state that functions
		// may only return strings. This should be *ok* as
		// any potential calculations can be done inside the function.
		// And in any case in general they should be used
		// to return some kind of escaped markup.
		const parameters: TypedExprNode[] = node.parameters.map((n) => makeTypedExpressionNode(n, typeMap));

		return {
			exprNodeType: 'function_invocation',
			exprType: 'string',
			isConstant: false,
			name: node.name,
			parameters: parameters,
			pos: node.pos,
			typed: true,
		} as TypedFunctionInvocationNode;
	} else {
		throw new Error('Unknown expression type: ' + exprNodeType);
	}
}

export function makeTypedExpressionTree(typeMap: TypeMap, node: ExprNode): TypedExprNode {
	if (!typeMap.isFrozen()) {
		throw new Error('Type map passed must be frozen. Use TypeMap.freeze()');
	}

	if (typeMap.hasTypeErrors()) {
		typeMap.throwTypeErrors();
	}

	return makeTypedExpressionNode(node, typeMap);
}

export function makeTypedExpressionList(typeMap: TypeMap, ast: ASTRoot): TypedASTRoot {
	if (!typeMap.isFrozen()) {
		throw new Error('Type map passed must be frozen. Use TypeMap.freeze()');
	}

	if (typeMap.hasTypeErrors()) {
		typeMap.throwTypeErrors();
	}

	const result: TypedTextNode[] = [];

	for (const node of ast.nodes) {
		const textType = node.textNodeType;
		if (node.textNodeType === 'literal') {
			result.push({
				pos: node.pos,
				textNodeType: 'literal',
				textType: 'string',
				typed: true,
				value: node.value,
			});
		} else if (node.textNodeType === 'variable') {
			const type = typeMap.getVariableType(node.value);

			result.push({
				pos: node.pos,
				textNodeType: 'variable',
				textType: type,
				typed: true,
				value: node.value,
			});
		} else if (node.textNodeType === 'expr') {
			// I don't know why typescript doesn't get that this is an expression.
			// but this workaround does the trick.
			const val = (node.value as any) as ExprNode;
			const exprRes = makeTypedExpressionTree(typeMap, val);

			result.push({
				pos: node.pos,
				textNodeType: 'expr',
				textType: exprRes.exprType,
				typed: true,
				value: exprRes,
			});
		} else {
			throw new Error('Unknown text node type: ' + textType);
		}
	}

	return {
		input: ast.input,
		nodes: result,
	};
}

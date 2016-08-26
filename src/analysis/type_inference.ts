import {
	Node as ConstraintNode,
} from '../trees/constraint';
import {
	Node as ExprNode,
	TypedBinaryOpNode,
	TypedNode as TypedExprNode,
	VariableNode as ExprVariableNode,
} from '../trees/expression';
import {
	Node as TextNode,
	TypedNode as TypedTextNode,
	VariableNode as TextVariableNode,
} from '../trees/text';

import {default as TypeError, ExprNodeInfo, TextNodeInfo} from '../errors/type_error';

import {
	default as TypeMap,
	ExprLocation,
	InferredType,
	TextLocation,
} from '../type_map';

function addConstraintTypeUsageForNode(
	typeMap: TypeMap,
	node: ConstraintNode,
	constraintNodes: ConstraintNode[]
): void {
	const location = {
		constraintNodes,
	};

	const addTypeInfo = (variable: string, type: 'unknown' | 'gender' | 'enum' | 'number') => {
		typeMap.addTypeUsage(variable, type, {
			nodeType: 'constraint',
			node,
			location,
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

export function inferConstraintTypes(typeMap: TypeMap, constraints: ConstraintNode[]) {
	for (const constraint of constraints) {
		addConstraintTypeUsageForNode(typeMap, constraint, constraints);
	}
}

function addExprTypeInfo(
	typeMap: TypeMap,
	variable: ExprVariableNode,
	type: InferredType,
	location: ExprLocation
): InferredType {
	if (
		type === 'error' ||
		type === 'gender' ||
		type === 'enum'
	) {
		throw new Error('Invalid expression type usage type: ' + type);
	}
	return typeMap.addTypeUsage(
		variable.name,
		type,
		{
			location,
			node: variable,
			nodeType: 'expression',
			// We have excluded the other values from type in the guard above. I think this is a typescript bug
			type: (type as 'unknown' | 'number-or-string' | 'number' | 'string'),
		}
	);
}

function inferExprType(
	typeMap: TypeMap,
	node: ExprNode,
	location: ExprLocation,
	resultType?: InferredType
): InferredType {
	const exprType = node.exprNodeType;
	switch (node.exprNodeType) {
		case 'unary_minus':
			inferExprType(typeMap, node.op, location, 'number');
			return 'number';
		case 'variable': {
			if (resultType != null) {
				const type = addExprTypeInfo(typeMap, node, resultType, location);
				if (type === 'gender' || type === 'enum') {
					return 'string';
				}
				return type;
			}
			const type = addExprTypeInfo(typeMap, node, 'unknown', location);
			if (type === 'gender' || type === 'enum') {
				return 'string';
			}

			return type;
		}
		case 'number':
			return 'number';
		case 'string_literal':
			return 'string';
		case 'function_invocation':
			// In the future we might want a register of functions
			// noting their type information. For now we can't say much about them.

			// We will however continue our inference phase and pass it down to
			// the arguments.

			for (const param of node.parameters) {
				inferExprType(typeMap, param, location);
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

export function inferExpressionTypes(
	typeMap: TypeMap,
	node: ExprNode,
	location: ExprLocation
) {
	inferExprType(typeMap, node, location);
}

export function inferTextTypes(
	typeMap: TypeMap,
	textNodes: TextNode[],
	constraintNodes?: ConstraintNode[]
) {
	const location: TextLocation = {
		constraintNodes: constraintNodes || null,
		textNodes,
	};

	const addVariableTypeInfo = (node: TextVariableNode) => {
		typeMap.addTypeUsage(
			node.value,
			'number-or-string',
			{
				nodeType: 'text',
				node,
				location,
				type: 'number-or-string',
			}
		);
	};

	for (const node of textNodes) {
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

function makeTypedExpressionNode(
	node: ExprNode,
	typeMap: TypeMap,
	addError: (
		expectedType: InferredType | InferredType[],
		foundType: InferredType,
		node: ExprNode
	) => void,
): TypedExprNode {
	if (node.exprNodeType === 'string_literal') {
		return {
			exprNodeType: 'string_literal',
			exprType: 'string',
			isConstant: true,
			pos: node.pos,
			typed: true,
			value: node.value,
		};
	} else if (node.exprNodeType === 'number') {
		return {
			exprNodeType: 'number',
			exprType: 'number',
			isConstant: true,
			pos: node.pos,
			typed: true,
			value: node.value,
		};
	} else if (node.exprNodeType === 'variable') {
		if (!typeMap.hasInfoForType(node.name)) {
			throw new Error(
					`Type for variable ${node.name} not found in type map.` +
					'Are you sure you ran the type inference phase first?'
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
		};
	} else if (node.exprNodeType === 'unary_minus') {
		const typedOp = makeTypedExpressionNode(node.op, typeMap, addError);

		let exprType = typedOp.exprType;
		if (
			typedOp.exprType !== 'number'
		)	{
			addError('number', typedOp.exprType, node.op);
			exprType = 'error';
		}

		return {
			exprNodeType: 'unary_minus',
			exprType: exprType,
			isConstant: typedOp.isConstant,
			op: typedOp,
			pos: node.pos,
			typed: true,
		};
	} else if (node.exprNodeType === 'binary_op') {
		const typedLhs = makeTypedExpressionNode(node.lhs, typeMap, addError);
		const lhsType = typedLhs.exprType;
		const typedRhs = makeTypedExpressionNode(node.rhs, typeMap, addError);
		const rhsType = typedRhs.exprType;

		const makeBinaryResult = (op: 'plus' | 'minus' | 'divide' | 'multiply', type: InferredType) : TypedBinaryOpNode => {
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
				if (
					lhsType === 'string' ||
					lhsType === 'number-or-string'
				) {
					if (
					rhsType === 'number' ||
					rhsType === 'number-or-string' ||
					rhsType === 'string'
				) {
						// Attempt to find the most specific type of both sides
						// Basicly if either side is a string, the result
						// is also a string. Otherwise it is number-or-string
						return makeBinaryResult(
							'plus',
							lhsType === 'number-or-string' ||
							rhsType === 'number-or-string' ?
								'number-or-string' :
								'string'
							);
					}
					addError(['number', 'string'], rhsType, node.rhs);
					return makeBinaryResult(node.binaryOp, 'error');
				} else if (lhsType === 'number') {
					if (
						rhsType === 'number' ||
						rhsType === 'number-or-string' ||
						rhsType === 'string'
					) {
						return makeBinaryResult(node.binaryOp, rhsType);
					}
					addError(['number', 'string'], rhsType, node.rhs);
					return makeBinaryResult(node.binaryOp, 'error');
				}

				addError(['number', 'string'], lhsType, node.lhs);
				return makeBinaryResult(node.binaryOp, 'error');
			}
			case 'minus':
			case 'divide':
			case 'multiply': {
				if (lhsType !== 'number') {
					addError('number', lhsType, node.lhs);
					return makeBinaryResult(node.binaryOp, 'error');
				}
				if (rhsType !== 'number') {
					addError('number', rhsType, node.rhs);
					return makeBinaryResult(node.binaryOp, 'error');
				}

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

		let hasError = false;

		const parameters: TypedExprNode[] = node.parameters.map(
			(n) => {
				const typedNode = makeTypedExpressionNode(n, typeMap, addError);

				if (typedNode.exprType === 'error') {
					hasError = true;
				}
				return typedNode;
			});

		const type: 'error' | 'string' = hasError ? 'error' : 'string';

		return {
			exprNodeType: 'function_invocation',
			exprType: type,
			isConstant: false,
			name: node.name,
			parameters: parameters,
			pos: node.pos,
			typed: true,
		};
	} else {
		throw new Error('Unknown expression type: ' + node.exprNodeType);
	}
}

export function makeTypedExpressionTree(
	typeMap: TypeMap,
	node: ExprNode,
	location: ExprLocation
): {
	errors: TypeError[],
	node: TypedExprNode,
} {
	if (!typeMap.isFrozen()) {
		throw new Error('Type map passed must be frozen. Use TypeMap.freeze()');
	}
	const errors: TypeError[] = [];

	const addError = (
		expectedTypes: InferredType | InferredType[],
		foundType: InferredType,
		n: ExprNode
	) => {
		if (foundType === 'error') {
			// We only log the error at the leaf of the expression
			// tree. So avoid reporting it all the way up the tree.
			return;
		}
		const nodeInfo: ExprNodeInfo = {
			location,
			node: n,
			type: 'expression',
		};
		errors.push(new TypeError(expectedTypes, foundType, typeMap, nodeInfo));
	};

	const typedNode = makeTypedExpressionNode(node, typeMap, addError);

	return {
		errors: errors,
		node: typedNode,
	};
}

export function makeTypedExpressionList(typeMap: TypeMap, nodes: TextNode[], constraintNodes?: ConstraintNode[]): {
	errors: TypeError[],
	translation: TypedTextNode[],
} {
	const location: ExprLocation = {
		constraintNodes: constraintNodes || null,
		textNodes: nodes,
	};

	if (!typeMap.isFrozen()) {
		throw new Error('Type map passed must be frozen. Use TypeMap.freeze()');
	}

	let errors: TypeError[] = [];
	const result: TypedTextNode[] = [];

	const addError = (
		expectedTypes: InferredType | InferredType[],
		foundType: InferredType,
		node: TextNode
	) => {
		if (foundType === 'error') {
			// We only log the error at the leaf of the expression
			// tree. So avoid reporting it all the way up the tree.
			return;
		}
		const nodeInfo: TextNodeInfo = {
			type: 'text',
			location,
			node,
		};
		errors.push(new TypeError(expectedTypes, foundType, typeMap, nodeInfo));
	};

	for (const node of nodes) {
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

			if (type !== 'number' && type !== 'number-or-string' && type !== 'string') {
				addError(['string', 'number', 'number-or-string'], type, node);
			}

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
			const exprRes = makeTypedExpressionTree(typeMap, val, location);

			if (exprRes.errors.length > 0) {
				errors = errors.concat(exprRes.errors);
			}

			result.push({
				pos: node.pos,
				textNodeType: 'expr',
				textType: exprRes.node.exprType,
				typed: true,
				value: exprRes.node,
			});
		} else {
			throw new Error('Unknown text node type: ' + textType);
		}
	}

	return {
		errors: errors,
		translation: result,
	};
}

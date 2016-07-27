/**
 * @flow
 */

import type {
	Node as TextNode,
	VariableNode as TextVariableNode,
} from '../trees/text';

import type {
	Node as ConstraintNode,
} from '../trees/constraint';

import type {
	Node as ExprNode,
	VariableNode as ExprVariableNode,
} from '../trees/expression';

import type {
	TypedExpressionNode,
} from '../trees/typed_expression';

import TypeError from '../errors/type_error';

import type {
	default as TypeMap,
	InferredType,
	ExprLocation,
} from '../type_map';

function addConstraintTypeUsageForNode(
	typeMap: TypeMap,
	node: ConstraintNode,
	constraintNodes: ConstraintNode[]
) : void {
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
		const type = 'unknown';

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
) : InferredType {
	return typeMap.addTypeUsage(
		variable.name,
		type,
		{
			nodeType: 'expression',
			variable,
			location,
			type,
		}
	);
}

function inferExprType(
	typeMap: TypeMap,
	node: ExprNode,
	location: ExprLocation,
	resultType?: InferredType
) : InferredType {
	switch (node.type) {
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
			return 'unknown';
		case 'binary_op': {
			switch (node.op) {
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
					throw new Error('Unknown binary operator: ' + node.op);
			}
		}
		default:
			throw new Error('Unknown expression type: ' + node.type);
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
	const location = {
		constraintNodes,
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
		switch (node.type) {
			case 'variable':
				addVariableTypeInfo(node);
				break;
			case 'expr':
				inferExpressionTypes(typeMap, node.value, location);
				break;
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
) : TypedExpressionNode {
	switch (node.type) {
		case 'string_literal':
			return {
				...node,
				expressionType: 'string',
			};
		case 'number':
			return {
				...node,
				expressionType: 'number',
			};
		case 'variable': {
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
				...node,
				expressionType: type,
			};
		}
		case 'unary_minus': {
			const typedOp = makeTypedExpressionNode(node.op, typeMap, addError);

			let exprType = typedOp.expressionType;
			if (
				typedOp.expressionType !== 'number'
			)	{
				addError('number', typedOp.expressionType, node.op);
				exprType = 'error';
			}

			return {
				...node,
				op: typedOp,
				expressionType: exprType,
			};
		}
		case 'binary_op': {
			const typedLhs = makeTypedExpressionNode(node.lhs, typeMap, addError);
			const lhsType = typedLhs.expressionType;
			const typedRhs = makeTypedExpressionNode(node.rhs, typeMap, addError);
			const rhsType = typedRhs.expressionType;

			switch (node.op) {
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
							return {
								...node,
								lhs: typedLhs,
								rhs: typedRhs,
								expressionType:
								// Attempt to find the most specific type of both sides
								// Basicly if either side is a string, the result
								// is also a string. Otherwise it is number-or-string
								lhsType === 'number-or-string' ||
								rhsType === 'number-or-string' ? 'number-or-string' : 'string',
							};
						}
						addError(['number', 'string'], rhsType, node.rhs);
						return {
							...node,
							lhs: typedLhs,
							rhs: typedRhs,
							expressionType: 'error',
						};
					} else if (lhsType === 'number') {
						if (
						rhsType === 'number' ||
						rhsType === 'number-or-string' ||
						rhsType === 'string'
					) {
							return {
								...node,
								lhs: typedLhs,
								rhs: typedRhs,
								expressionType: rhsType,
							};
						}
						addError(['number', 'string'], rhsType, node.rhs);
						return {
							...node,
							lhs: typedLhs,
							rhs: typedRhs,
							expressionType: 'error',
						};
					}

					addError(['number', 'string'], lhsType, node.lhs);
					return {
						...node,
						lhs: typedLhs,
						rhs: typedRhs,
						expressionType: 'error',
					};
				}
				case 'minus':
				case 'divide':
				case 'multiply': {
					if (lhsType !== 'number') {
						addError('number', lhsType, node.lhs);
						return {
							...node,
							lhs: typedLhs,
							rhs: typedRhs,
							expressionType: 'error',
						};
					}
					if (rhsType !== 'number') {
						addError('number', rhsType, node.rhs);
						return {
							...node,
							lhs: typedLhs,
							rhs: typedRhs,
							expressionType: 'error',
						};
					}

					return {
						...node,
						lhs: typedLhs,
						rhs: typedRhs,
						expressionType: 'number',
					};
				}
				default:
					throw new Error('Unknown binary operator: ' + node.op);
			}
		}
		case 'function_invocation': {
			// For simplicity's sake. We state that functions
			// may only return strings. This should be *ok* as
			// any potential calculations can be done inside the function.
			// And in any case in general they should be used
			// to return some kind of escaped markup.

			let hasError = false;

			const parameters = node.parameters.map(
				(node) => {
					const n = makeTypedExpressionNode(node, typeMap, addError);

					if (n.expressionType === 'error') {
						hasError = true;
					}
					return n;
				});

			return {
				...node,
				parameters,
				expressionType: hasError ? 'error' : 'string',
			};
		}
		default:
			throw new Error('Unknown expression type: ' + node.type);
	}
}

export function makeTypedExpressionTree(
	typeMap: TypeMap,
	node: ExprNode,
	location: ExprLocation
) : {
	node: TypedExpressionNode,
	errors: TypeError[],
} {
	const errors = [];
	const typedNode = makeTypedExpressionNode(node, typeMap, (
		expectedTypes: InferredType | InferredType[],
		foundType: InferredType,
		node: ExprNode
	) => {
		if (foundType === 'error') {
			// We only log the error at the leaf of the expression
			// tree. So avoid reporting it all the way up the tree.
			return;
		}
		const nodeInfo = {
			type: 'expression',
			location,
			node,
		};
		errors.push(new TypeError(expectedTypes, foundType, typeMap, nodeInfo));
	});

	return {
		node: typedNode,
		errors: errors,
	};
}

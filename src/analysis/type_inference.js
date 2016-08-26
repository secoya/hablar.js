/**
 * @flow
 */

import type {
	Node as TextNode,
	TypedNode as TypedTextNode,
	VariableNode as TextVariableNode,
} from '../trees/text';

import type {
	Node as ConstraintNode,
} from '../trees/constraint';

import type {
	Node as ExprNode,
	VariableNode as ExprVariableNode,
	TypedNode as TypedExprNode,
	TypedBinaryOpNode,
} from '../trees/expression';

import TypeError from '../errors/type_error';

import type {
	default as TypeMap,
	InferredType,
	ExprLocation,
	TextLocation,
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
			nodeType: 'expression',
			node: variable,
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
					throw new Error('Unknown binary operator: ' + node.binaryOp);
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
		switch (node.textNodeType) {
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
) : TypedExprNode {
	if (node.exprNodeType === 'string_literal') {
		return {
			exprNodeType: 'string_literal',
			value: node.value,
			pos: node.pos,
			exprType: 'string',
			typed: true,
			isConstant: true,
		};
	} else if (node.exprNodeType === 'number') {
		return {
			exprNodeType: 'number',
			value: node.value,
			pos: node.pos,
			exprType: 'number',
			typed: true,
			isConstant: true,
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
			name: node.name,
			pos: node.pos,
			exprType: type,
			typed: true,
			isConstant: false,
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
			op: typedOp,
			pos: node.pos,
			exprType: exprType,
			typed: true,
			isConstant: typedOp.isConstant,
		};
	} else if (node.exprNodeType === 'binary_op') {
		const typedLhs = makeTypedExpressionNode(node.lhs, typeMap, addError);
		const lhsType = typedLhs.exprType;
		const typedRhs = makeTypedExpressionNode(node.rhs, typeMap, addError);
		const rhsType = typedRhs.exprType;

		const makeBinaryResult = (op: 'plus' | 'minus' | 'divide' | 'multiply', type: InferredType) : TypedBinaryOpNode => {
			return {
				exprNodeType: 'binary_op',
				binaryOp: op,
				lhs: typedLhs,
				rhs: typedRhs,
				pos: node.pos,
				exprType: type,
				typed: true,
				isConstant: typedLhs.isConstant && typedRhs.isConstant,
			};
		};

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
				throw new Error('Unknown binary operator: ' + node.binaryOp);
		}
	} else if (node.exprNodeType === 'function_invocation') {
		// For simplicity's sake. We state that functions
		// may only return strings. This should be *ok* as
		// any potential calculations can be done inside the function.
		// And in any case in general they should be used
		// to return some kind of escaped markup.

		let hasError = false;

		const parameters : TypedExprNode[] = node.parameters.map(
			(node) => {
				const n = makeTypedExpressionNode(node, typeMap, addError);

				if (n.exprType === 'error') {
					hasError = true;
				}
				return n;
			});

		const type : 'error' | 'string' = hasError ? 'error' : 'string';

		return {
			exprNodeType: 'function_invocation',
			parameters: parameters,
			pos: node.pos,
			name: node.name,
			exprType: type,
			typed: true,
			isConstant: false,
		};
	} else {
		throw new Error('Unknown expression type: ' + node.exprNodeType);
	}
}

export function makeTypedExpressionTree(
	typeMap: TypeMap,
	node: ExprNode,
	location: ExprLocation
) : {
	node: TypedExprNode,
	errors: TypeError[],
} {
	if (!typeMap.isFrozen()) {
		throw new Error('Type map passed must be frozen. Use TypeMap.freeze()');
	}
	const errors = [];

	const addError = (
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
	};

	const typedNode = makeTypedExpressionNode(node, typeMap, addError);

	return {
		node: typedNode,
		errors: errors,
	};
}

export function makeTypedExpressionList(typeMap: TypeMap, nodes: TextNode[], constraintNodes?: ConstraintNode[]) : {
	translation: TypedTextNode[],
	errors: TypeError[],
} {
	const location : TextLocation = {
		textNodes: nodes,
		constraintNodes: constraintNodes,
	};

	if (!typeMap.isFrozen()) {
		throw new Error('Type map passed must be frozen. Use TypeMap.freeze()');
	}

	let errors = [];
	const result = [];

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
		const nodeInfo = {
			type: 'text',
			location,
			node,
		};
		errors.push(new TypeError(expectedTypes, foundType, typeMap, nodeInfo));
	};

	for (const node of nodes) {
		if (node.textNodeType === 'literal') {
			result.push({
				textNodeType: 'literal',
				pos: node.pos,
				typed: true,
				textType: 'string',
				value: node.value,
			});
		} else if (node.textNodeType === 'variable') {
			const type = typeMap.getVariableType(node.value);

			if (type !== 'number' && type !== 'number-or-string' && type !== 'string') {
				addError(['string', 'number', 'number-or-string'], type, node);
			}

			result.push({
				textNodeType: 'variable',
				pos: node.pos,
				typed: true,
				textType: type,
				value: node.value,
			});
		} else if (node.textNodeType === 'expr') {
			const exprRes = makeTypedExpressionTree(typeMap, node.value, location);

			if (exprRes.errors.length > 0) {
				errors = errors.concat(exprRes.errors);
			}

			result.push({
				textNodeType: 'expr',
				pos: node.pos,
				typed: true,
				textType: exprRes.node.exprType,
				value: exprRes.node,
			});
		} else {
			throw new Error('Unknown text node type: ' + node.textType);
		}
	}

	return {
		translation: result,
		errors: errors,
	};
}

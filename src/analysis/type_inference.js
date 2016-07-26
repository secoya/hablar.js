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

export type ConstraintTypeUsage = {
	nodeType: 'constraint',
	node: ConstraintNode,
	location: {
		constraintNodes: ConstraintNode[],
	},
	type: 'gender' | 'enum' | 'number',
};

export type ExprLocation = {
	textNodes: TextNode[],
	constraintNodes: ?ConstraintNode[],
};

export type ExpressionTypeUsage = {
	nodeType: 'expression',
	node: ExprNode,
	location: ExprLocation,
	type: 'unknown' | 'number-or-string' | 'number' | 'string',
}

export type TextTypeUsage = {
	nodeType: 'text',
	node: TextNode,
	location: {
		textNodes: TextNode[],
		constraintNodes: ?ConstraintNode[],
	},
	type: 'unknown',
}

export type TypeUsage =
	| ConstraintTypeUsage
	| ExpressionTypeUsage
	| TextTypeUsage

type InferredType = 'unknown' | 'gender' | 'enum' | 'number-or-string' | 'number' | 'string' | 'error';

export type TypeInfo = {
	usages: TypeUsage[],
	type: InferredType,
};

export type TypeMap = Map<string, TypeInfo>;

function addConstraintTypeUsageForNode(
	typeMap: TypeMap,
	node: ConstraintNode,
	constraintNodes: ConstraintNode[]
) : void {
	const location = {
		constraintNodes,
	};

	const addTypeInfo = (variable: string, type: InferredType) => {
		const usage = getTypeInfoForVariable(typeMap, variable);
		usage.type = mergeTypeInfo(usage.type, type);
		usage.usages.push({
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

function mergeTypeInfo(existingType: InferredType, newType: InferredType) : InferredType {
	if (newType === 'unknown') {
		return existingType;
	}
	switch (existingType) {
		case 'unknown':
			return newType;
		case 'error':
			return 'error';
		case 'number-or-string':
			switch (newType) {
				case 'number-or-string': // FALLTHROUGH
				case 'number': // FALLTHROUGH
				case 'string': // FALLTHROUGH
				case 'enum': // / FALLTHROUGH
				case 'gender':
					return newType;
				default:
					return 'error';
			}
		case 'string':
			switch (newType) {
				case 'number-or-string': // FALLTHROUGH
				case 'string':
					return 'string';
				case 'enum':
					return 'enum';
				case 'gender':
					return 'gender';
				default:
					return 'error';
			}
		case 'enum':
			switch (newType) {
				case 'number-or-string': // FALLTHROUGH
				case 'string': // FALLTHROUGH
				case 'enum':
					return 'enum';
				default:
					return 'error';
			}
		case 'gender':
			switch (newType) {
				case 'number-or-string': // FALLTHROUGH
				case 'string': // FALLTHROUGH
				case 'gender':
					return 'gender';
				default:
					return 'error';
			}
		case 'number':
			switch (newType) {
				case 'number': // FALLTHROUGH
				case 'number-or-string': // FALLTHROUGH
					return 'number';
				default:
					return 'error';
			}
		default:
			throw new Error('Unknown existing type: ' + existingType);
	}
}

function getTypeInfoForVariable(typeMap: TypeMap, variable: string) : TypeInfo {
	let result = typeMap.get(variable);
	if (result != null) {
		return result;
	}

	result = {
		usages: [],
		type: 'unknown',
	};
	typeMap.set(variable, result);

	return result;
}

export function makeTypeMap() : TypeMap {
	return new Map();
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
	const usage = getTypeInfoForVariable(typeMap, variable.name);
	usage.type = mergeTypeInfo(usage.type, type);
	usage.usages.push({
		nodeType: 'expression',
		variable,
		location,
		type,
	});
	return usage.type;
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

	const addVariableTypeInfo = (node: TextVariableNode, type: InferredType) => {
		const usage = getTypeInfoForVariable(typeMap, node.value);
		usage.type = mergeTypeInfo(usage.type, type);
		usage.usages.push({
			nodeType: 'text',
			node,
			location,
			type,
		});
	};

	for (const node of textNodes) {
		switch (node.type) {
			case 'variable':
				addVariableTypeInfo(node, 'number-or-string');
				break;
			case 'expr':
				inferExpressionTypes(typeMap, node.value, location);
				break;
		}
	}
}

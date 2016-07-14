/**
 * @flow
 */

import type {
	Node as TypedTextNode,
} from '../trees/typed_text';

import type {
	Node as TextNode,
} from '../trees/text';

import type {
	Node as TypedExpressionNode,
} from '../trees/typed_expression';

import type {
	Node as ConstraintNode,
} from '../trees/constraint';

export type ConstraintTypeUsage = {
	nodeType: 'constraint';
	node: ConstraintNode;
	location: {
		constraintNodes: ConstraintNode[];
	};
	type: 'gender' | 'enum' | 'number';
};

export type ExpressionTypeUsage = {
	nodeType: 'expression';
	node: TypedExpressionNode;
	location: {
		constraintNodes: ?ConstraintNode[];
	};
	type: 'unknown' | 'number-or-string' | 'number' | 'string';
}

export type TextTypeUsage = {
	nodeType: 'text';
	node: TypedTextNode;
	location: {
		textNodes: TypedTextNode[];
		constraintNodes: ?ConstraintNode[];
	};
	type: 'unknown';
}

export type TypeUsage =
	| ConstraintTypeUsage
	| ExpressionTypeUsage
	| TextTypeUsage

type InferredType = 'unknown' | 'gender' | 'enum' | 'number-or-string' | 'number' | 'string' | 'error';

export type TypeInfo = {
	usages: TypeUsage[];
	type: InferredType;
};

export type TypeMap = Map<string, TypeInfo>;

function addConstraintTypeUsageForNode(typeMap: TypeMap, node: ConstraintNode, constraintNodes: ConstraintNode[]) : void {
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

export function inferConstraintTypes(typeMap: TypeMap, constraints: ConstraintNode[]) {
	for (const constraint of constraints) {
		addConstraintTypeUsageForNode(typeMap, constraint, constraints);
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

export function inferTextTypes(typeMap: TypeMap, nodes: TextNode[], constraints?: ConstraintNode[]): TypedTextNode[] {
	return [];
}

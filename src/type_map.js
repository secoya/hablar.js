/**
 * @flow
 */

import type {
	Node as TextNode,
} from './trees/text';

import type {
	Node as ConstraintNode,
} from './trees/constraint';

import type {
	Node as ExprNode,
} from './trees/expression';

export type InferredType =
	| 'unknown'
	| 'gender'
	| 'enum'
	| 'number-or-string'
	| 'number'
	| 'string'
	| 'error'
;

export type ConstraintTypeUsage = {
	nodeType: 'constraint',
	node: ConstraintNode,
	location: {
		constraintNodes: ConstraintNode[],
	},
	type: 'unknown' | 'gender' | 'enum' | 'number',
};

export type ExprLocation = {
	textNodes: TextNode[],
	constraintNodes: ?ConstraintNode[],
};

export type TextLocation = {
	textNodes: TextNode[],
	constraintNodes: ?ConstraintNode[],
};

export type ExpressionTypeUsage = {
	nodeType: 'expression',
	node: ExprNode,
	location: ExprLocation,
	type:  'unknown' | 'number-or-string' | 'number' | 'string',
}

export type TextTypeUsage = {
	nodeType: 'text',
	node: TextNode,
	location: TextLocation,
	type: 'number-or-string',
}

// Used for third party integration. It could be that the person
// integrating with this has some sort of metadata
// on the actual translation - that specifies the types
// of all variables.
export type CustomTypeUsage = {
	nodeType: 'custom',
}

export type TypeUsage =
	| ConstraintTypeUsage
	| ExpressionTypeUsage
	| TextTypeUsage
	| CustomTypeUsage

export type TypeInfo = {
	usages: TypeUsage[],
	type: InferredType,
};

export default class TypeMap {
	_map: Map<string, TypeInfo>;
	_functions: Set<string>;
	_frozen: boolean;
	size: number;

	constructor() {
		Object.defineProperty(
			this,
			'_map',
			{
				configurable: false,
				enumerable: false,
				value: new Map(),
				writable: false,
			}
		);

		// Flow thinks this is invalid as value undefined
		// is not a number. However the getter will always
		// return a correct value.
		// $FlowFixMe
		Object.defineProperty(
			this,
			'size',
			{
				configurable: false,
				enumerable: true,
				get: () => {
					return this._map.size;
				},
			}
		);

		Object.defineProperty(
			this,
			'_functions',
			{
				configurable: false,
				enumerable: false,
				writable: false,
				value: new Set(),
			}
		);

		this._frozen = false;
	}

	static mergeTypeInfo(existingType: InferredType, newType: InferredType) : InferredType {
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

	_throwIfFrozen(errMsg: string) : void {
		if (this._frozen) {
			throw new Error(errMsg);
		}
	}

	getVariableTypeInfo(variable: string) : TypeInfo {
		let usage = this._map.get(variable);

		if (usage != null) {
			return usage;
		}

		this._throwIfFrozen('Trying to get type info for unknown type: ' + variable);

		usage = {
			usages: [],
			type: 'unknown',
		};

		this._map.set(variable, usage);
		return usage;
	}

	getVariableType(variable: string) : InferredType {
		return this.getVariableTypeInfo(variable).type;
	}

	hasInfoForType(variable: string) : bool {
		return this._map.has(variable);
	}

	variables() : Array<string> {
		return Array.from(this._map.keys());
	}

	freeze() : void {
		this._frozen = true;
	}

	isFrozen() : boolean {
		return this._frozen;
	}

	addTypeUsage(
		variable: string,
		type: InferredType,
		usage: TypeUsage
	) : InferredType {
		this._throwIfFrozen(
			`Cannot add type usage for ${variable} when type map is frozen`
		);
		const info = this.getVariableTypeInfo(variable);
		info.type = TypeMap.mergeTypeInfo(info.type, type);
		info.usages.push(usage);

		return info.type;
	}

	addFunction(functionName: string) : void {
		this._throwIfFrozen(
			`Cannot add function ${functionName} after map is frozen`
		);
		this._functions.add(functionName);
	}

	functionNames() : Iterator<string> {
		return this._functions.values();
	}
}

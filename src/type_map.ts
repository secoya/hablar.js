import {
	Node as TextNode,
} from './trees/text';

import {
	Node as ConstraintNode,
} from './trees/constraint';

import {
	Node as ExprNode,
} from './trees/expression';

export type InferredType = 'enum'
	| 'error'
	| 'gender'
	| 'number-or-string'
	| 'number'
	| 'string'
	| 'unknown'
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
	constraintNodes: ConstraintNode[] | null,
};

export type TextLocation = {
	textNodes: TextNode[],
	constraintNodes: ConstraintNode[] | null,
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

export type TypeUsage = ConstraintTypeUsage
	| ExpressionTypeUsage
	| TextTypeUsage
	| CustomTypeUsage

export type TypeInfo = {
	usages: TypeUsage[],
	type: InferredType,
};

export default class TypeMap {
	private static mergeTypeInfo(existingType: InferredType, newType: InferredType): InferredType {
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

	private map: Map<string, TypeInfo>;
	private functions: Set<string>;
	private frozen: boolean;

	public constructor() {
		this.map = new Map<string, TypeInfo>();
		this.functions = new Set<string>();
		this.frozen = false;
	}

	public get size(): number {
		return this.map.size;
	}

	public getVariableTypeInfo(variable: string): TypeInfo {
		let usage = this.map.get(variable);

		if (usage != null) {
			return usage;
		}

		this._throwIfFrozen('Trying to get type info for unknown type: ' + variable);

		usage = {
			type: 'unknown',
			usages: [],
		};

		this.map.set(variable, usage);
		return usage;
	}
	public getVariableType(variable: string): InferredType {
		return this.getVariableTypeInfo(variable).type;
	}

	public hasInfoForType(variable: string): boolean {
		return this.map.has(variable);
	}

	public variables(): Array<string> {
		return Array.from(this.map.keys());
	}

	public freeze(): void {
		this.frozen = true;
	}

	public isFrozen(): boolean {
		return this.frozen;
	}

	public addTypeUsage(
		variable: string,
		type: InferredType,
		usage: TypeUsage
	): InferredType {
		this._throwIfFrozen(
			`Cannot add type usage for ${variable} when type map is frozen`
		);
		const info = this.getVariableTypeInfo(variable);
		info.type = TypeMap.mergeTypeInfo(info.type, type);
		info.usages.push(usage);

		return info.type;
	}

	public addFunction(functionName: string): void {
		this._throwIfFrozen(
			`Cannot add function ${functionName} after map is frozen`
		);
		this.functions.add(functionName);
	}

	public functionNames(): IterableIterator<string> {
		return this.functions.values();
	}

	private _throwIfFrozen(errMsg: string): void {
		if (this.frozen) {
			throw new Error(errMsg);
		}
	}
}

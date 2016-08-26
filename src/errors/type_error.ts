import {
	Node as ConstraintNode,
} from '../trees/constraint';
import {
	Node as ExprNode,
} from '../trees/expression';
import {
	Node as TextNode,
} from '../trees/text';

export type ExprNodeInfo = {
	type: 'expression',
	node: ExprNode,
	location: {
		textNodes: TextNode[],
		constraintNodes: ConstraintNode[] | null,
	}
};

export type TextNodeInfo = {
	type: 'text',
	node: TextNode,
	location: {
		textNodes: TextNode[],
		constraintNodes: ConstraintNode[] | null,
	}
};

export type ConstraintNodeInfo = {
	type: 'constraint',
	node: ConstraintNode,
	location: {
		constraintNodes: ConstraintNode[] | null,
	}
};

export type NodeInfo = ExprNodeInfo
	| TextNodeInfo
	| ConstraintNodeInfo;

import {default as TypeMap, InferredType} from '../type_map';

function printTypes(t: InferredType | InferredType[]): string {
	if (Array.isArray(t)) {
		return t.map(printType).join(', ');
	}

	return printType(t);
}

function printType(t: InferredType): string {
	return t;
}

export default class TypeError extends Error {
	public expectedTypes: InferredType | InferredType[];
	public foundType: InferredType;
	public nodeInfo: NodeInfo;
	public typeMap: TypeMap;

	public constructor(
		expectedTypes: InferredType | InferredType[],
		foundType: InferredType,
		typeMap: TypeMap,
		nodeInfo: NodeInfo
	) {
		super('' +
			`Caught type error. Expected one of types: ${printTypes(expectedTypes)}. ` +
			`Found type ${printType(foundType)}. At node: ${JSON.stringify(nodeInfo.node)}`);
		this.foundType = foundType;
		this.typeMap = typeMap;
		this.nodeInfo = nodeInfo;
		this.expectedTypes = expectedTypes;
	}
}

TypeError.prototype.name = 'TypeError';

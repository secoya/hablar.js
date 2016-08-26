/**
 * @flow
 */
type InferredType =
	| 'unknown'
	|	'gender'
	| 'enum'
	| 'number-or-string'
	| 'number'
	| 'string'
	| 'error';

import type {
	Node as ExprNode,
} from '../trees/expression';

import type {
	Node as TextNode,
} from '../trees/text';

import type {
	Node as ConstraintNode,
} from '../trees/constraint';

type ExprNodeInfo = {
	type: 'expression',
	node: ExprNode,
	location: {
		textNodes: TextNode[],
		constraintNodes: ?ConstraintNode[]
	}
};

type TextNodeInfo = {
	type: 'text',
	node: TextNode,
	location: {
		textNodes: TextNode[],
		constraintNodes: ?ConstraintNode[]
	}
};

type ConstraintNodeInfo = {
	type: 'constraint',
	node: ConstraintNode,
	location: {
		constraintNodes: ?ConstraintNode[]
	}
};

type NodeInfo =
	| ExprNodeInfo
	| TextNodeInfo
	| ConstraintNodeInfo;

import type TypeMap from '../type_map';

function printTypes(t: InferredType | InferredType[]) : string {
	if (Array.isArray(t)) {
		return t.map(printType).join(', ');
	}

	return printType(t);
}

function printType(t: InferredType) : string {
	return t;
}

export default function TypeError(
	expectedTypes: InferredType | InferredType[],
	foundType: InferredType,
	typeMap: TypeMap,
	nodeInfo: NodeInfo
) : TypeError {
	// $FlowFixMe I cannot get ES6 subclasses to work.
	Error.call(this);
	Error.captureStackTrace(this, TypeError);
	this.message = '' +
		`Caught type error. Expected one of types: ${printTypes(expectedTypes)}. ` +
		`Found type ${printType(foundType)}. At node: ${JSON.stringify(nodeInfo.node)}`;
	return this;
}

TypeError.prototype = Object.create(Error.prototype);
TypeError.prototype.name = 'TypeError'; // eslint-disable-line no-extend-native

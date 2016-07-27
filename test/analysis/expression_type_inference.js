/**
 * @flow
 * eslint-env mocha,node
 */

import {assert} from 'chai';

import * as infer from '../../src/analysis/type_inference';

import TypeMap from '../../src/type_map';

import type {
	TypeInfo,
	InferredType,
} from '../../src/type_map';

import type {
	Node,
	NumberNode,
	StringLiteralNode,
	VariableNode,
	UnaryMinusNode,
	BinaryOpNode,
	FunctionInvocationNode,

	TypedNode,
	TypedNumberNode,
	TypedStringLiteralNode,
	TypedVariableNode,
	TypedUnaryMinusNode,
	TypedBinaryOpNode,
	TypedFunctionInvocationNode,
} from '../../src/trees/expression';

const makeEmptyPos = () => ({
	firstLine: 1,
	firstColumn: 0,
	lastLine: 1,
	lastColumn: 0,
});

const location = {
	textNodes: [],
	constraintNodes: [],
};

function getTypeInfo(typeMap: TypeMap, variable: string) : TypeInfo {
	assert.isTrue(
		typeMap.hasInfoForType(variable),
		'Expected type map to have info for ' + variable
	);

	return typeMap.getVariableTypeInfo(variable);
}

function makeVariableNode(name: string) : VariableNode {
	return {
		exprNodeType: 'variable',
		pos: makeEmptyPos(),
		name: name,
	};
}

function makeTypedVariableNode(name: string, type: InferredType) : TypedVariableNode {
	return {
		exprNodeType: 'variable',
		pos: makeEmptyPos(),
		name: name,
		exprType: type,
	};
}

function makeNumberNode(val: number) : NumberNode {
	return {
		exprNodeType: 'number',
		pos: makeEmptyPos(),
		value: val,
	};
}

function makeTypedNumberNode(
	val: number
) : TypedNumberNode {
	return {
		exprNodeType: 'number',
		pos: makeEmptyPos(),
		value: val,
		exprType: 'number',
	};
}

function makeUnaryMinusNode(
	op: Node
) : UnaryMinusNode {
	return {
		exprNodeType: 'unary_minus',
		pos: makeEmptyPos(),
		op: op,
	};
}

function makeTypedUnaryMinusNode(
	op: TypedNode,
	type: InferredType
) : TypedUnaryMinusNode {
	return {
		exprNodeType: 'unary_minus',
		pos: makeEmptyPos(),
		op: op,
		exprType: type,
	};
}

function makeStringLiteralNode(val: string) : StringLiteralNode {
	return {
		exprNodeType: 'string_literal',
		pos: makeEmptyPos(),
		value: val,
	};
}

function makeTypedStringLiteralNode(
	val: string
) : TypedStringLiteralNode {
	return {
		exprNodeType: 'string_literal',
		pos: makeEmptyPos(),
		value: val,
		exprType: 'string',
	};
}

function makeBinaryPlusNode(
	lhs: Node,
	rhs: Node
) : BinaryOpNode {
	return {
		exprNodeType: 'binary_op',
		binaryOp: 'plus',
		pos: makeEmptyPos(),
		lhs: lhs,
		rhs: rhs,
	};
}

function makeTypedBinaryPlusNode(
	lhs: TypedNode,
	rhs: TypedNode,
	type: InferredType
) : TypedBinaryOpNode {
	return {
		exprNodeType: 'binary_op',
		binaryOp: 'plus',
		pos: makeEmptyPos(),
		lhs: lhs,
		rhs: rhs,
		exprType: type,
	};
}


function makeBinaryNumberNode(lhs: Node, rhs: Node) : BinaryOpNode {
	return {
		exprNodeType: 'binary_op',
		binaryOp: 'minus',
		pos: makeEmptyPos(),
		lhs: lhs,
		rhs: rhs,
	};
}

function makeTypedBinaryNumberNode(
	lhs: TypedNode,
	rhs: TypedNode,
	type: InferredType
) : TypedBinaryOpNode {
	return {
		exprNodeType: 'binary_op',
		binaryOp: 'minus',
		pos: makeEmptyPos(),
		lhs: lhs,
		rhs: rhs,
		exprType: type,
	};
}

function makeFunctionInvocationNode(
	name : string,
	parameters: Node[],
) : FunctionInvocationNode {
	return {
		exprNodeType: 'function_invocation',
		name: name,
		pos: makeEmptyPos(),
		parameters,
	};
}

function makeTypedFunctionInvocationNode(
	name: string,
	parameters: TypedNode[],
	type: 'error' | 'string'
) : TypedFunctionInvocationNode {
	return {
		exprNodeType: 'function_invocation',
		name: name,
		pos: makeEmptyPos(),
		parameters,
		exprType: type,
	};
}

describe('Type inference', function() {
	describe('Binary operators', function() {
		describe('Plus', function() {
			it('Should infer var+10 as number-or-string', function() {
				const varName = 'var';
				const node = makeBinaryPlusNode(
					makeVariableNode(varName),
					makeNumberNode(10)
				);

				const typeMap = new TypeMap();
				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number-or-string', info.type);

				const typedNode = makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number-or-string'),
					makeTypedNumberNode(10),
					'number-or-string'
				);
				const typeInfo = infer.makeTypedExpressionTree(
					typeMap,
					node,
					location
				);

				assert.deepEqual(typedNode, typeInfo.node);
				assert.equal(0, typeInfo.errors.length);
			});

			it('Should infer var+"hello" as number-or-string', function() {
				const varName = 'var';
				const node = makeBinaryPlusNode(
					makeVariableNode(varName),
					makeStringLiteralNode('hello')
				);

				const typeMap = new TypeMap();
				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number-or-string', info.type);

				const typedNode = makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number-or-string'),
					makeTypedStringLiteralNode('hello'),
					'number-or-string'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);

				assert.deepEqual(typedNode, typeInfo.node);
				assert.equal(0, typeInfo.errors.length);
			});

			it('Should infer both vars in var+var2 as number-or-string', function() {
				const varName = 'var';
				const secondVarName = 'var2';
				const node = makeBinaryPlusNode(
					makeVariableNode(varName),
					makeVariableNode(secondVarName)
				);

				const typeMap = new TypeMap();
				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number-or-string', info.type);

				const secondInfo = getTypeInfo(typeMap, secondVarName);
				assert.equal('number-or-string', secondInfo.type);

				const typedNode = makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number-or-string'),
					makeTypedVariableNode(secondVarName, 'number-or-string'),
					'number-or-string'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
				assert.deepEqual(typedNode, typeInfo.node);
				assert.equal(0, typeInfo.errors.length);
			});

			it('Should infer var+5 where var is number as number', function() {
				const varName = 'var';
				const node = makeBinaryPlusNode(
					makeVariableNode(varName),
					makeNumberNode(5)
				);

				const typeMap = new TypeMap();
				typeMap.addTypeUsage(varName, 'number', {
					nodeType: 'custom',
				});

				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number', info.type);

				const typedNode = makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number'),
					makeTypedNumberNode(5),
					'number'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
				assert.deepEqual(typedNode, typeInfo.node);
				assert.equal(0, typeInfo.errors.length);
			});
		});

		describe('Number operators', function() {
			it('Should infer var-5 as number', function() {
				const varName = 'var';
				const node = makeBinaryNumberNode(
					makeVariableNode(varName),
					makeNumberNode(5)
				);

				const typeMap = new TypeMap();
				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number', info.type);

				const typedNode = makeTypedBinaryNumberNode(
					makeTypedVariableNode(varName, 'number'),
					makeTypedNumberNode(5),
					'number'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
				assert.deepEqual(typedNode, typeInfo.node);
				assert.equal(0, typeInfo.errors.length);
			});

			it('Should infers both vars in var-var2 as number', function() {
				const varName = 'var';
				const secondVarName = 'var2';
				const node = makeBinaryNumberNode(
					makeVariableNode(varName),
					makeVariableNode(secondVarName)
				);

				const typeMap = new TypeMap();
				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number', info.type);

				const secondInfo = getTypeInfo(typeMap, secondVarName);
				assert.equal('number', secondInfo.type);

				const typedNode = makeTypedBinaryNumberNode(
					makeTypedVariableNode(varName, 'number'),
					makeTypedVariableNode(secondVarName, 'number'),
					'number'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
				assert.deepEqual(typedNode, typeInfo.node);
				assert.equal(0, typeInfo.errors.length);
			});
		});
	});

	describe('Unary minus', function() {
		it('Should infer -var as number', function() {
			const varName = 'var';
			const node  = makeUnaryMinusNode(makeVariableNode(varName));

			const typeMap = new TypeMap();

			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);

			assert.equal('number', info.type);

			const typedNode = makeTypedUnaryMinusNode(
				makeTypedVariableNode(varName, 'number'),
				'number'
			);

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
			assert.deepEqual(typedNode, typeInfo.node);
			assert.equal(0, typeInfo.errors.length);
		});

		it('Should infer -(var+5) as number', function() {
			const varName = 'var';
			const node = makeUnaryMinusNode(
				makeBinaryPlusNode(
					makeVariableNode(varName),
					makeNumberNode(5)
				)
			);

			const typeMap = new TypeMap();

			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);
			assert.equal('number', info.type);

			const typedNode = makeTypedUnaryMinusNode(
				makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number'),
					makeTypedNumberNode(5),
					'number'
				),
				'number'
			);

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
			assert.deepEqual(typedNode, typeInfo.node);
			assert.equal(0, typeInfo.errors.length);
		});

		it('Should infer both vars in -(var+var2) as number', function() {
			const varName = 'var';
			const secondVarName = 'var2';
			const node = makeUnaryMinusNode(
				makeBinaryPlusNode(
					makeVariableNode(varName),
					makeVariableNode(secondVarName)
				)
			);

			const typeMap = new TypeMap();
			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);
			assert.equal('number', info.type);

			const secondInfo = getTypeInfo(typeMap, secondVarName);
			assert.equal('number', secondInfo.type);

			const typedNode = makeTypedUnaryMinusNode(
				makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number'),
					makeTypedVariableNode(secondVarName, 'number'),
					'number'
				),
				'number'
			);

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
			assert.deepEqual(typedNode, typeInfo.node);
			assert.equal(0, typeInfo.errors.length);
		});

		describe('Fail cases', function() {
			it('Should fail to unify number with string', function() {
				const varName = 'var';
				const node = makeUnaryMinusNode(
					makeVariableNode(varName)
				);

				const typeMap = new TypeMap();
				typeMap.addTypeUsage(varName, 'string', {
					nodeType: 'custom',
				});

				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('error', info.type);

				const typedNode = makeTypedUnaryMinusNode(
					makeTypedVariableNode(varName, 'error'),
					'error'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
				assert.deepEqual(typedNode, typeInfo.node);
				// We need some kind of phase that looks through all
				// variables and sees if their type is error.
				// And logs that as an error, but for now this is not implemented.
				assert.equal(0, typeInfo.errors.length);
			});

			it('Should fail to unify number with enum', function() {
				const varName = 'var';
				const node = makeUnaryMinusNode(
					makeVariableNode(varName),
				);

				const typeMap = new TypeMap();
				typeMap.addTypeUsage(varName, 'enum', {
					nodeType: 'custom',
				});

				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('error', info.type);

				const typedNode = makeTypedUnaryMinusNode(
					makeTypedVariableNode(varName, 'error'),
					'error'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
				assert.deepEqual(typedNode, typeInfo.node);
				// We need some kind of phase that looks through all
				// variables and sees if their type is error.
				// And logs that as an error, but for now this is not implemented.
				assert.equal(0, typeInfo.errors.length);
			});

			it('Should fail to unify number with gender', function() {
				const varName = 'var';
				const node = makeUnaryMinusNode(
					makeVariableNode(varName)
				);

				const typeMap = new TypeMap();

				typeMap.addTypeUsage(varName, 'gender', {
					nodeType: 'custom',
				});

				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('error', info.type);

				const typedNode = makeTypedUnaryMinusNode(
					makeTypedVariableNode(varName, 'error'),
					'error'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
				assert.deepEqual(typedNode, typeInfo.node);
				// We need some kind of phase that looks through all
				// variables and sees if their type is error.
				// And logs that as an error, but for now this is not implemented.
				assert.equal(0, typeInfo.errors.length);
			});
		});
	});

	describe('Functions', function() {
		it('Will infer unknown for variable used as a parameter', function() {
			const varName = 'var';

			const node = makeFunctionInvocationNode('fn', [makeVariableNode(varName)]);

			const typeMap = new TypeMap();

			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);
			assert.equal('unknown', info.type);

			const typedNode = makeTypedFunctionInvocationNode(
				'fn',
				[makeTypedVariableNode(varName, 'unknown')],
				'string'
			);

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
			assert.deepEqual(typedNode, typeInfo.node);
			assert.equal(0, typeInfo.errors.length);
		});

		it('Will infer unknown for multiple variables used as parameters', function() {
			const varName = 'var';
			const secondVarName = 'var2';

			const node = makeFunctionInvocationNode(
				'fn',
				[
					makeVariableNode(varName),
					makeVariableNode(secondVarName),
				]
			);

			const typeMap = new TypeMap();
			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);
			assert.equal('unknown', info.type);

			const secondInfo = getTypeInfo(typeMap, secondVarName);
			assert.equal('unknown', secondInfo.type);

			const typedNode = makeTypedFunctionInvocationNode(
				'fn',
				[
					makeTypedVariableNode(varName, 'unknown'),
					makeTypedVariableNode(secondVarName, 'unknown'),
				],
				'string'
			);

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node, location);
			assert.deepEqual(typedNode, typeInfo.node);
			assert.equal(0, typeInfo.errors.length);
		});
	});
});

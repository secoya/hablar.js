import {assert} from 'chai';
import 'mocha';

import * as infer from '../../src/analysis/type_inference';

import {
	Node as ConstraintNode,
} from '../../src/trees/constraint';
import {
	BinaryOpNode,
	FunctionInvocationNode,
	Node,
	NumberNode,
	StringLiteralNode,
	TypedBinaryOpNode,
	TypedFunctionInvocationNode,
	TypedNode,
	TypedNumberNode,
	TypedStringLiteralNode,
	TypedUnaryMinusNode,
	TypedVariableNode,
	UnaryMinusNode,
	VariableNode,
} from '../../src/trees/expression';
import {
	Node as TextNode,
} from '../../src/trees/text';
import TypeMap from '../../src/type_map';
import {
	InferredType,
	TypeInfo,
} from '../../src/type_map';

const makeEmptyPos = () => ({
	firstColumn: 0,
	firstLine: 1,
	lastColumn: 0,
	lastLine: 1,
});

const location = {
	constraints: {
		input: '',
		nodes: ([] as ConstraintNode[]),
	},
	text: {
		input: '',
		nodes: ([] as TextNode[]),
	},
};

function getTypeInfo(typeMap: TypeMap, variable: string): TypeInfo {
	assert.isTrue(
		typeMap.hasInfoForType(variable),
		'Expected type map to have info for ' + variable
	);

	return typeMap.getVariableTypeInfo(variable);
}

function makeVariableNode(name: string): VariableNode {
	return {
		exprNodeType: 'variable',
		name: name,
		pos: makeEmptyPos(),
	};
}

function makeTypedVariableNode(name: string, type: InferredType): TypedVariableNode {
	return {
		exprNodeType: 'variable',
		exprType: type,
		isConstant: false,
		name: name,
		pos: makeEmptyPos(),
		typed: true,
	};
}

function makeNumberNode(val: number): NumberNode {
	return {
		exprNodeType: 'number',
		pos: makeEmptyPos(),
		value: val,
	};
}

function makeTypedNumberNode(
	val: number
): TypedNumberNode {
	return {
		exprNodeType: 'number',
		exprType: 'number',
		isConstant: true,
		pos: makeEmptyPos(),
		typed: true,
		value: val,
	};
}

function makeUnaryMinusNode(
	op: Node
): UnaryMinusNode {
	return {
		exprNodeType: 'unary_minus',
		op: op,
		pos: makeEmptyPos(),
	};
}

function makeTypedUnaryMinusNode(
	op: TypedNode,
	type: InferredType
): TypedUnaryMinusNode {
	return {
		exprNodeType: 'unary_minus',
		exprType: type,
		isConstant: op.isConstant,
		op: op,
		pos: makeEmptyPos(),
		typed: true,
	};
}

function makeStringLiteralNode(val: string): StringLiteralNode {
	return {
		exprNodeType: 'string_literal',
		pos: makeEmptyPos(),
		value: val,
	};
}

function makeTypedStringLiteralNode(
	val: string
): TypedStringLiteralNode {
	return {
		exprNodeType: 'string_literal',
		exprType: 'string',
		isConstant: true,
		pos: makeEmptyPos(),
		typed: true,
		value: val,
	};
}

function makeBinaryPlusNode(
	lhs: Node,
	rhs: Node
): BinaryOpNode {
	return {
		binaryOp: 'plus',
		exprNodeType: 'binary_op',
		lhs: lhs,
		pos: makeEmptyPos(),
		rhs: rhs,
	};
}

function makeTypedBinaryPlusNode(
	lhs: TypedNode,
	rhs: TypedNode,
	type: InferredType
): TypedBinaryOpNode {
	return {
		binaryOp: 'plus',
		exprNodeType: 'binary_op',
		exprType: type,
		isConstant: lhs.isConstant && rhs.isConstant,
		lhs: lhs,
		pos: makeEmptyPos(),
		rhs: rhs,
		typed: true,
	};
}

function makeBinaryNumberNode(lhs: Node, rhs: Node): BinaryOpNode {
	return {
		binaryOp: 'minus',
		exprNodeType: 'binary_op',
		lhs: lhs,
		pos: makeEmptyPos(),
		rhs: rhs,
	};
}

function makeTypedBinaryNumberNode(
	lhs: TypedNode,
	rhs: TypedNode,
	type: InferredType
): TypedBinaryOpNode {
	return {
		binaryOp: 'minus',
		exprNodeType: 'binary_op',
		exprType: type,
		isConstant: lhs.isConstant && rhs.isConstant,
		lhs: lhs,
		pos: makeEmptyPos(),
		rhs: rhs,
		typed: true,
	};
}

function makeFunctionInvocationNode(
	name: string,
	parameters: Node[],
): FunctionInvocationNode {
	return {
		exprNodeType: 'function_invocation',
		name: name,
		parameters,
		pos: makeEmptyPos(),
	};
}

function makeTypedFunctionInvocationNode(
	name: string,
	parameters: TypedNode[],
	type: 'error' | 'string',
): TypedFunctionInvocationNode {
	return {
		exprNodeType: 'function_invocation',
		exprType: type,
		isConstant: false,
		name: name,
		parameters,
		pos: makeEmptyPos(),
		typed: true,
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
				typeMap.freeze();

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
				);

				assert.deepEqual(typedNode, typeInfo);
				assert.equal(0, Array.from(typeMap.functionNames()).length);
			});

			it('Should infer var+"hello" as number-or-string', function() {
				const varName = 'var';
				const node = makeBinaryPlusNode(
					makeVariableNode(varName),
					makeStringLiteralNode('hello')
				);

				const typeMap = new TypeMap();
				infer.inferExpressionTypes(typeMap, node, location);
				typeMap.freeze();

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number-or-string', info.type);

				const typedNode = makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number-or-string'),
					makeTypedStringLiteralNode('hello'),
					'number-or-string'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node);

				assert.deepEqual(typedNode, typeInfo);

				assert.equal(0, Array.from(typeMap.functionNames()).length);
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
				typeMap.freeze();

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number-or-string', info.type);

				const secondInfo = getTypeInfo(typeMap, secondVarName);
				assert.equal('number-or-string', secondInfo.type);

				const typedNode = makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number-or-string'),
					makeTypedVariableNode(secondVarName, 'number-or-string'),
					'number-or-string'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
				assert.deepEqual(typedNode, typeInfo);
				assert.equal(0, Array.from(typeMap.functionNames()).length);
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
				typeMap.freeze();

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number', info.type);

				const typedNode = makeTypedBinaryPlusNode(
					makeTypedVariableNode(varName, 'number'),
					makeTypedNumberNode(5),
					'number'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
				assert.deepEqual(typedNode, typeInfo);

				assert.equal(0, Array.from(typeMap.functionNames()).length);
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
				typeMap.freeze();

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number', info.type);

				const typedNode = makeTypedBinaryNumberNode(
					makeTypedVariableNode(varName, 'number'),
					makeTypedNumberNode(5),
					'number'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
				assert.deepEqual(typedNode, typeInfo);

				assert.equal(0, Array.from(typeMap.functionNames()).length);
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
				typeMap.freeze();

				const info = getTypeInfo(typeMap, varName);
				assert.equal('number', info.type);

				const secondInfo = getTypeInfo(typeMap, secondVarName);
				assert.equal('number', secondInfo.type);

				const typedNode = makeTypedBinaryNumberNode(
					makeTypedVariableNode(varName, 'number'),
					makeTypedVariableNode(secondVarName, 'number'),
					'number'
				);

				const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
				assert.deepEqual(typedNode, typeInfo);

				assert.equal(0, Array.from(typeMap.functionNames()).length);
			});
		});
	});

	describe('Unary minus', function() {
		it('Should infer -var as number', function() {
			const varName = 'var';
			const node  = makeUnaryMinusNode(makeVariableNode(varName));

			const typeMap = new TypeMap();

			infer.inferExpressionTypes(typeMap, node, location);
			typeMap.freeze();

			const info = getTypeInfo(typeMap, varName);

			assert.equal('number', info.type);

			const typedNode = makeTypedUnaryMinusNode(
				makeTypedVariableNode(varName, 'number'),
				'number'
			);

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
			assert.deepEqual(typedNode, typeInfo);

			assert.equal(0, Array.from(typeMap.functionNames()).length);
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
			typeMap.freeze();

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

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
			assert.deepEqual(typedNode, typeInfo);
			assert.equal(0, Array.from(typeMap.functionNames()).length);
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
			typeMap.freeze();

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

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
			assert.deepEqual(typedNode, typeInfo);

			assert.equal(0, Array.from(typeMap.functionNames()).length);
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
				typeMap.freeze();

				const info = getTypeInfo(typeMap, varName);
				assert.isTrue(typeMap.hasTypeErrors(), 'Should have type errors');
				assert.equal('error', info.type);

				assert.equal(0, Array.from(typeMap.functionNames()).length);
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
				typeMap.freeze();

				const info = getTypeInfo(typeMap, varName);
				assert.isTrue(typeMap.hasTypeErrors(), 'Should have type errors');
				assert.equal('error', info.type);

				assert.equal(0, Array.from(typeMap.functionNames()).length);
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
				typeMap.freeze();

				const info = getTypeInfo(typeMap, varName);
				assert.isTrue(typeMap.hasTypeErrors(), 'Should have type errors');
				assert.equal('error', info.type);
				assert.equal(0, Array.from(typeMap.functionNames()).length);
			});
		});
	});

	describe('Functions', function() {
		it('Will infer unknown for variable used as a parameter', function() {
			const varName = 'var';

			const node = makeFunctionInvocationNode('fn', [makeVariableNode(varName)]);

			const typeMap = new TypeMap();

			infer.inferExpressionTypes(typeMap, node, location);
			typeMap.freeze();

			const info = getTypeInfo(typeMap, varName);
			assert.equal('unknown', info.type);

			const typedNode = makeTypedFunctionInvocationNode(
				'fn',
				[makeTypedVariableNode(varName, 'unknown')],
				'string'
			);

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
			assert.deepEqual(typedNode, typeInfo);

			assert.sameMembers(['fn'], Array.from(typeMap.functionNames()));
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
			typeMap.freeze();

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

			const typeInfo = infer.makeTypedExpressionTree(typeMap, node);
			assert.deepEqual(typedNode, typeInfo);

			assert.sameMembers(['fn'], Array.from(typeMap.functionNames()));
		});
	});
});

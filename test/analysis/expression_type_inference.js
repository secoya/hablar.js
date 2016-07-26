/**
 * @flow
 * eslint-env mocha,node
 */

import {assert} from 'chai';

import * as infer from '../../src/analysis/type_inference';

import type {
	Node,
	NumberNode,
	VariableNode,
	FunctionInvocationNode,
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

function getTypeInfo(typeMap: infer.TypeMap, variable: string) : infer.TypeInfo {
	const typeInfo = typeMap.get(variable);

	assert.isNotNull(typeInfo);

	if (typeInfo == null) {
		throw new Error('Make flow type checker happy, this will never get called');
	}

	return typeInfo;
}

function makeVariableNode(name: string) : VariableNode {
	return {
		type: 'variable',
		pos: makeEmptyPos(),
		name: name,
	};
}

function makeNumberNode(val: number) : NumberNode {
	return {
		type: 'number',
		pos: makeEmptyPos(),
		value: val,
	};
}

function makeFunctionInvocationNode(
	parameters: Node[],
	name : string = 'fn'
) : FunctionInvocationNode {
	return {
		type: 'function_invocation',
		name: name,
		pos: makeEmptyPos(),
		parameters,
	};
}

describe('Type inference', function() {
	describe('Unary minus', function() {
		it('Should infer -var as number', function() {
			const varName = 'var';
			const node : Node = {
				type: 'unary_minus',
				pos: makeEmptyPos(),
				op: makeVariableNode(varName),
			};

			const typeMap = infer.makeTypeMap();

			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);

			assert.equal('number', info.type);
		});
		it('Should infer -(var+5) as number', function() {
			const varName = 'var';
			const node : Node = {
				type: 'unary_minus',
				pos: makeEmptyPos(),
				op: {
					type: 'binary_op',
					op: 'plus',
					lhs: makeVariableNode(varName),
					rhs: makeNumberNode(5),
				},
			};

			const typeMap = infer.makeTypeMap();

			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);
			assert.equal('number', info.type);
		});

		describe('Fail cases', function() {
			it('Should fail to unify number with string', function() {
				const varName = 'var';
				const node : Node = {
					type: 'unary_minus',
					pos: makeEmptyPos(),
					op: makeVariableNode(varName),
				};

				const typeMap = infer.makeTypeMap();

				typeMap.set(varName, {
					type: 'string',
					usages: [],
				});

				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('error', info.type);
			});

			it('Should fail to unify number with enum', function() {
				const varName = 'var';
				const node : Node = {
					type: 'unary_minus',
					pos: makeEmptyPos(),
					op: makeVariableNode(varName),
				};

				const typeMap = infer.makeTypeMap();

				typeMap.set(varName, {
					type: 'enum',
					usages: [],
				});

				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('error', info.type);
			});

			it('Should fail to unify number with gender', function() {
				const varName = 'var';
				const node : Node = {
					type: 'unary_minus',
					pos: makeEmptyPos(),
					op: makeVariableNode(varName),
				};

				const typeMap = infer.makeTypeMap();

				typeMap.set(varName, {
					type: 'gender',
					usages: [],
				});

				infer.inferExpressionTypes(typeMap, node, location);

				const info = getTypeInfo(typeMap, varName);
				assert.equal('error', info.type);
			});
		});
	});

	describe('Functions', function() {
		it('Will infer unknown for variable used as a parameter', function() {
			const varName = 'var';

			const node = makeFunctionInvocationNode([makeVariableNode(varName)]);

			const typeMap = infer.makeTypeMap();

			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);
			assert.equal('unknown', info.type);
		});

		it('Will infer unknown for multiple variables used as parameters', function() {
			const varName = 'var';
			const secondVarName = 'var2';

			const node = makeFunctionInvocationNode([
				makeVariableNode(varName),
				makeVariableNode(secondVarName),
			]);

			const typeMap = infer.makeTypeMap();
			infer.inferExpressionTypes(typeMap, node, location);

			const info = getTypeInfo(typeMap, varName);
			assert.equal('unknown', info.type);

			const secondInfo = getTypeInfo(typeMap, secondVarName);
			assert.equal('unknown', secondInfo.type);
		});
	});
});

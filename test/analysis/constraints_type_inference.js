/**
 * @flow
 * eslint-env mocha,node
 */

import {assert} from 'chai';

import * as infer from '../../src/analysis/type_inference';

import type {
	Node,
	IdentifierNode,
	NumberNode,
	EnumNode,
	EqualityNode,
	IneqNode,
	GenderNode,
} from '../../src/trees/constraint';

const makeEmptyPos = () => ({
	firstLine: 1,
	firstColumn: 0,
	lastLine: 1,
	lastColumn: 0,
});

function getTypeInfo(typeMap: infer.TypeMap, variable: string) : infer.TypeInfo {
	const typeInfo = typeMap.get(variable);

	assert.isNotNull(typeInfo);

	if (typeInfo == null) {
		throw new Error('Make flow type checker happy, this will never get called');
	}

	return typeInfo;
}

function makeNumberNode(variable: string, op: '=' | '!=' | '>' | '<' | '<=' | '>=' = '=') : Node {
	const numberNode : NumberNode = {
		type: 'number',
		value: 5,
		pos: makeEmptyPos(),
	};

	const varNode : IdentifierNode = {
		type: 'identifier',
		name: variable,
		pos: makeEmptyPos(),
	};

	if (op === '=' || op === '!=') {
		const res : EqualityNode = {
			op,
			pos: makeEmptyPos(),
			lhs: varNode,
			rhs: numberNode,
		};

		return res;
	} else {
		const res : IneqNode = {
			op,
			pos: makeEmptyPos(),
			lhs: varNode,
			rhs: numberNode,
		};

		return res;
	}
}

function makeEnumNode(variable: string, op: '=' | '!=' = '=') : Node {
	const enumNode : EnumNode = {
		type: 'enum',
		value: 'some-enum',
		pos: makeEmptyPos(),
	};

	const varNode : IdentifierNode = {
		type: 'identifier',
		name: variable,
		pos: makeEmptyPos(),
	};

	const res : EqualityNode = {
		op,
		pos: makeEmptyPos(),
		lhs: varNode,
		rhs: enumNode,
	};

	return res;
}

function makeGenderNode(variable: string, op: '=' | '!=' = '=') : Node {
	const genderNode : GenderNode = {
		type: 'gender',
		gender: 'F',
		pos: makeEmptyPos(),
	};

	const varNode : IdentifierNode = {
		type: 'identifier',
		name: variable,
		pos: makeEmptyPos(),
	};

	const res : EqualityNode = {
		op,
		pos: makeEmptyPos(),
		lhs: varNode,
		rhs: genderNode,
	};

	return res;
}

function makeIgnoreNode(variable: string) : Node {
	const varNode : IdentifierNode = {
		type: 'identifier',
		name: variable,
		pos: makeEmptyPos(),
	};

	return {
		op: '!',
		pos: makeEmptyPos(),
		operand: varNode,
	};
}

describe('Type inference', function() {
	describe('Constraints', function() {
		describe('Ignore', function() {
			it('Should infer ignore constraints as unknown', function() {
				const constraints = [makeIgnoreNode('i')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'i');
				assert.deepEqual(
					{
						type: 'unknown',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'unknown',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});
		});

		describe('Numbers', function() {
			it('Should infer number equals as number', function() {
				const constraints = [makeNumberNode('n', '=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});

			it('Should infer number not-equals as number', function() {
				const constraints = [makeNumberNode('n', '!=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});

			it('Should infer number less-than as number', function() {
				const constraints = [makeNumberNode('n', '<')];

				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});

			it('Should infer number less-than-equals as number', function() {
				const constraints = [makeNumberNode('n', '<=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});

			it('Should infer number greater-than as number', function() {
				const constraints = [makeNumberNode('n', '>')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});

			it('Should infer number greater-than-equals as number', function() {
				const constraints = [makeNumberNode('n', '>=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});
		});

		describe('Genders', function() {
			it('Should infer gender equals as gender type', function() {
				const constraints = [makeGenderNode('g', '=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'g');
				assert.deepEqual(
					{
						type: 'gender',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'gender',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});

			it('Should infer gender not-equals as gender type', function() {
				const constraints = [makeGenderNode('g', '!=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'g');
				assert.deepEqual(
					{
						type: 'gender',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'gender',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});
		});

		describe('Enums', function() {
			it('Should infer enum equals as enum type', function() {
				const constraints = [makeEnumNode('e', '=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'e');
				assert.deepEqual(
					{
						type: 'enum',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'enum',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});

			it('Should infer enum not-equals as enum type', function() {
				const constraints = [makeEnumNode('e', '!=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'e');
				assert.deepEqual(
					{
						type: 'enum',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'enum',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
			});
		});

		describe('Multiple distinct variable', function() {
			it('Should infer types for both variables', function() {
				const constraints = [
					makeEnumNode('e'),
					makeNumberNode('i'),
				];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

				assert.equal(2, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'e');
				assert.deepEqual(
					{
						type: 'enum',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[0],
								location: {
									constraintNodes: constraints,
								},
								type: 'enum',
							},
						],
					},
					typeInfo
				);
				assert.equal(constraints[0], typeInfo.usages[0].node);
				assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
				const numberTypeInfo = getTypeInfo(typeMap, 'i');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								nodeType: 'constraint',
								node: constraints[1],
								location: {
									constraintNodes: constraints,
								},
								type: 'number',
							},
						],
					},
					numberTypeInfo,
				);
				assert.equal(constraints[1], numberTypeInfo.usages[0].node);
				assert.equal(constraints, numberTypeInfo.usages[0].location.constraintNodes);
			});
		});

		describe('Same variable multiple constraints', function() {
			describe('Initial number', function() {
				it('Is number when used as number two times', function() {
					const constraints = [makeNumberNode('n'), makeNumberNode('n', '>')];
					const typeMap = infer.makeTypeMap();

					infer.inferConstraintTypes(typeMap, constraints);

					assert.equal(1, typeMap.size);

					const typeInfo = getTypeInfo(typeMap, 'n');
					assert.deepEqual(
						{
							type: 'number',
							usages: [
								{
									nodeType: 'constraint',
									node: constraints[0],
									location: {
										constraintNodes: constraints,
									},
									type: 'number',
								},
								{
									nodeType: 'constraint',
									node: constraints[1],
									location: {
										constraintNodes: constraints,
									},
									type: 'number',
								},
							],
						},
						typeInfo
					);
					assert.equal(constraints[0], typeInfo.usages[0].node);
					assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
					assert.equal(constraints[1], typeInfo.usages[1].node);
					assert.equal(constraints, typeInfo.usages[1].location.constraintNodes);
				});

				it('Is number when used as ignore', function() {
					const constraints = [makeNumberNode('n'), makeIgnoreNode('n')];
					const typeMap = infer.makeTypeMap();

					infer.inferConstraintTypes(typeMap, constraints);

					assert.equal(1, typeMap.size);

					const typeInfo = getTypeInfo(typeMap, 'n');
					assert.deepEqual(
						{
							type: 'number',
							usages: [
								{
									nodeType: 'constraint',
									node: constraints[0],
									location: {
										constraintNodes: constraints,
									},
									type: 'number',
								},
								{
									nodeType: 'constraint',
									node: constraints[1],
									location: {
										constraintNodes: constraints,
									},
									type: 'unknown',
								},
							],
						},
						typeInfo
					);
					assert.equal(constraints[0], typeInfo.usages[0].node);
					assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
					assert.equal(constraints[1], typeInfo.usages[1].node);
					assert.equal(constraints, typeInfo.usages[1].location.constraintNodes);
				});
			});

			describe('Fail cases', function() {
				it('Cannot reconcile with enum', function() {
					const constraints = [makeNumberNode('n'), makeEnumNode('n')];
					const typeMap = infer.makeTypeMap();

					infer.inferConstraintTypes(typeMap, constraints);

					assert.equal(1, typeMap.size);

					const typeInfo = getTypeInfo(typeMap, 'n');
					assert.deepEqual(
						{
							type: 'error',
							usages: [
								{
									nodeType: 'constraint',
									node: constraints[0],
									location: {
										constraintNodes: constraints,
									},
									type: 'number',
								},
								{
									nodeType: 'constraint',
									node: constraints[1],
									location: {
										constraintNodes: constraints,
									},
									type: 'enum',
								},
							],
						},
						typeInfo
					);
					assert.equal(constraints[0], typeInfo.usages[0].node);
					assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
					assert.equal(constraints[1], typeInfo.usages[1].node);
					assert.equal(constraints, typeInfo.usages[1].location.constraintNodes);
				});

				it('Cannot reconcile with gender', function() {
					const constraints = [makeNumberNode('n'), makeGenderNode('n')];
					const typeMap = infer.makeTypeMap();

					infer.inferConstraintTypes(typeMap, constraints);

					assert.equal(1, typeMap.size);

					const typeInfo = getTypeInfo(typeMap, 'n');
					assert.deepEqual(
						{
							type: 'error',
							usages: [
								{
									nodeType: 'constraint',
									node: constraints[0],
									location: {
										constraintNodes: constraints,
									},
									type: 'number',
								},
								{
									nodeType: 'constraint',
									node: constraints[1],
									location: {
										constraintNodes: constraints,
									},
									type: 'gender',
								},
							],
						},
						typeInfo
					);
					assert.equal(constraints[0], typeInfo.usages[0].node);
					assert.equal(constraints, typeInfo.usages[0].location.constraintNodes);
					assert.equal(constraints[1], typeInfo.usages[1].node);
					assert.equal(constraints, typeInfo.usages[1].location.constraintNodes);
				});
			});
		});
	});
});

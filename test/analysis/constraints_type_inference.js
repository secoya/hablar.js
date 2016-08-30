/**
 * @flow
 * eslint-env mocha,node
 */

import {assert} from 'chai';

import * as infer from '../../src/analysis/type_inference';

import TypeMap from '../../src/type_map';

import type {
	TypeInfo,
	TypeUsage,
	ConstraintTypeUsage,
} from '../../src/type_map';

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

function getTypeInfo(typeMap: TypeMap, variable: string) : TypeInfo {
	assert.isTrue(
		typeMap.hasInfoForType(variable),
		'Expected type map to have info for ' + variable
	);
	return typeMap.getVariableTypeInfo(variable);
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
		value: 'F',
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

function assertConstraintUsage(usage: TypeUsage) : ConstraintTypeUsage {
	assert.equal('constraint', usage.nodeType);

	if (usage.nodeType !== 'constraint') {
		throw new Error('Make flow happy');
	}

	return usage;
}

describe('Type inference', function() {
	describe('Constraints', function() {
		describe('Ignore', function() {
			it('Should infer ignore constraints as unknown', function() {
				const constraints = [makeIgnoreNode('i')];
				const typeMap = new TypeMap();

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

				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});
		});

		describe('Numbers', function() {
			it('Should infer number equals as number', function() {
				const constraints = [makeNumberNode('n', '=')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});

			it('Should infer number not-equals as number', function() {
				const constraints = [makeNumberNode('n', '!=')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});

			it('Should infer number less-than as number', function() {
				const constraints = [makeNumberNode('n', '<')];

				const typeMap = new TypeMap();

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

				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});

			it('Should infer number less-than-equals as number', function() {
				const constraints = [makeNumberNode('n', '<=')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});

			it('Should infer number greater-than as number', function() {
				const constraints = [makeNumberNode('n', '>')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});

			it('Should infer number greater-than-equals as number', function() {
				const constraints = [makeNumberNode('n', '>=')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});
		});

		describe('Genders', function() {
			it('Should infer gender equals as gender type', function() {
				const constraints = [makeGenderNode('g', '=')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});

			it('Should infer gender not-equals as gender type', function() {
				const constraints = [makeGenderNode('g', '!=')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});
		});

		describe('Enums', function() {
			it('Should infer enum equals as enum type', function() {
				const constraints = [makeEnumNode('e', '=')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});

			it('Should infer enum not-equals as enum type', function() {
				const constraints = [makeEnumNode('e', '!=')];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
			});
		});

		describe('Multiple distinct variable', function() {
			it('Should infer types for both variables', function() {
				const constraints = [
					makeEnumNode('e'),
					makeNumberNode('i'),
				];
				const typeMap = new TypeMap();

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
				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraints, usage.location.constraintNodes);
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
				const numberUsage = assertConstraintUsage(numberTypeInfo.usages[0]);
				assert.equal(constraints[1], numberUsage.node);
				assert.equal(constraints, numberUsage.location.constraintNodes);
			});
		});

		describe('Same variable multiple constraints', function() {
			describe('Initial number', function() {
				it('Is number when used as number two times', function() {
					const constraints = [makeNumberNode('n'), makeNumberNode('n', '>')];
					const typeMap = new TypeMap();

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
					const usage = assertConstraintUsage(typeInfo.usages[0]);
					assert.equal(constraints[0], usage.node);
					assert.equal(constraints, usage.location.constraintNodes);

					const secondUsage = assertConstraintUsage(typeInfo.usages[1]);
					assert.equal(constraints[1], secondUsage.node);
					assert.equal(constraints, secondUsage.location.constraintNodes);
				});

				it('Is number when used as ignore', function() {
					const constraints = [makeNumberNode('n'), makeIgnoreNode('n')];
					const typeMap = new TypeMap();

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
					const usage = assertConstraintUsage(typeInfo.usages[0]);
					assert.equal(constraints[0], usage.node);
					assert.equal(constraints, usage.location.constraintNodes);

					const secondUsage = assertConstraintUsage(typeInfo.usages[1]);
					assert.equal(constraints[1], secondUsage.node);
					assert.equal(constraints, secondUsage.location.constraintNodes);
				});
			});

			describe('Fail cases', function() {
				it('Cannot reconcile with enum', function() {
					const constraints = [makeNumberNode('n'), makeEnumNode('n')];
					const typeMap = new TypeMap();

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

					const usage = assertConstraintUsage(typeInfo.usages[0]);
					assert.equal(constraints[0], usage.node);
					assert.equal(constraints, usage.location.constraintNodes);

					const secondUsage = assertConstraintUsage(typeInfo.usages[1]);
					assert.equal(constraints[1], secondUsage.node);
					assert.equal(constraints, secondUsage.location.constraintNodes);
				});

				it('Cannot reconcile with gender', function() {
					const constraints = [makeNumberNode('n'), makeGenderNode('n')];
					const typeMap = new TypeMap();

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

					const usage = assertConstraintUsage(typeInfo.usages[0]);
					assert.equal(constraints[0], usage.node);
					assert.equal(constraints, usage.location.constraintNodes);

					const secondUsage = assertConstraintUsage(typeInfo.usages[1]);
					assert.equal(constraints[1], secondUsage.node);
					assert.equal(constraints, secondUsage.location.constraintNodes);
				});
			});
		});
	});
});

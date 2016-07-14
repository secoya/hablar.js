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
			});

			it('Should infer number not-equals as number', function() {
				const constraints = [makeNumberNode('n', '!=')];
				const typeMap = infer.makeTypeMap();

				infer.inferConstraintTypes(typeMap, constraints);

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
	});
});

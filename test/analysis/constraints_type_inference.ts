import {assert} from 'chai';
import 'mocha';

import * as infer from '../../src/analysis/type_inference';

import TypeMap from '../../src/type_map';

import {
	ConstraintTypeUsage,
	TypeInfo,
	TypeUsage,
} from '../../src/type_map';

import {
	EnumNode,
	EqualityNode,
	GenderNode,
	IdentifierNode,
	IneqNode,
	Node,
	NumberNode,
} from '../../src/trees/constraint';

const makeEmptyPos = () => ({
	firstColumn: 0,
	firstLine: 1,
	lastColumn: 0,
	lastLine: 1,
});

function getTypeInfo(typeMap: TypeMap, variable: string): TypeInfo {
	assert.isTrue(
		typeMap.hasInfoForType(variable),
		'Expected type map to have info for ' + variable
	);
	return typeMap.getVariableTypeInfo(variable);
}

function makeNumberNode(variable: string, op: '=' | '!=' | '>' | '<' | '<=' | '>=' = '='): Node {
	const numberNode: NumberNode = {
		pos: makeEmptyPos(),
		type: 'number',
		value: 5,
	};

	const varNode: IdentifierNode = {
		name: variable,
		pos: makeEmptyPos(),
		type: 'identifier',
	};

	if (op === '=' || op === '!=') {
		const res: EqualityNode = {
			lhs: varNode,
			op: op as '=' | '!=',
			pos: makeEmptyPos(),
			rhs: numberNode,
		};

		return res;
	} else {
		const res: IneqNode = {
			lhs: varNode,
			op: op as '>' | '<' | '<=' | '>=',
			pos: makeEmptyPos(),
			rhs: numberNode,
		};

		return res;
	}
}

function makeEnumNode(variable: string, op: '=' | '!=' = '='): Node {
	const enumNode: EnumNode = {
		pos: makeEmptyPos(),
		type: 'enum',
		value: 'some-enum',
	};

	const varNode: IdentifierNode = {
		name: variable,
		pos: makeEmptyPos(),
		type: 'identifier',
	};

	const res: EqualityNode = {
		lhs: varNode,
		op: op,
		pos: makeEmptyPos(),
		rhs: enumNode,
	};

	return res;
}

function makeGenderNode(variable: string, op: '=' | '!=' = '='): Node {
	const genderNode: GenderNode = {
		pos: makeEmptyPos(),
		type: 'gender',
		value: 'F',
	};

	const varNode: IdentifierNode = {
		name: variable,
		pos: makeEmptyPos(),
		type: 'identifier',
	};

	const res: EqualityNode = {
		lhs: varNode,
		op: op,
		pos: makeEmptyPos(),
		rhs: genderNode,
	};

	return res;
}

function makeIgnoreNode(variable: string): Node {
	const varNode: IdentifierNode = {
		name: variable,
		pos: makeEmptyPos(),
		type: 'identifier',
	};

	return {
		op: '!',
		operand: varNode,
		pos: makeEmptyPos(),
	};
}

function assertConstraintUsage(usage: TypeUsage): ConstraintTypeUsage {
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

				const textAST = {
					input: 'test',
					nodes: [],
				};

				const constraintAST = {
					input: '!i',
					nodes: constraints,
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'i');
				assert.deepEqual(
					{
						type: 'unknown',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'unknown',
							},
						],
					},
					typeInfo
				);

				const usage = assertConstraintUsage(typeInfo.usages[0]);
				assert.equal(constraints[0], usage.node);
				assert.equal(constraintAST, usage.location.constraints);
				assert.equal(textAST, usage.location.text);
			});
		});

		describe('Numbers', function() {
			it('Should infer number equals as number', function() {
				const constraints = [makeNumberNode('n', '=')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'n=5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});

			it('Should infer number not-equals as number', function() {
				const constraints = [makeNumberNode('n', '!=')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'n!=5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});

			it('Should infer number less-than as number', function() {
				const constraints = [makeNumberNode('n', '<')];

				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'n<5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'number',
							},
						],
					},
					typeInfo
				);

				assertConstraintUsage(typeInfo.usages[0]);
			});

			it('Should infer number less-than-equals as number', function() {
				const constraints = [makeNumberNode('n', '<=')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'n<=5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});

			it('Should infer number greater-than as number', function() {
				const constraints = [makeNumberNode('n', '>')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'n>5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});

			it('Should infer number greater-than-equals as number', function() {
				const constraints = [makeNumberNode('n', '>=')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'n>=5',
					nodes: constraints,
				};

				const textAST = {
					input: 'test',
					nodes: [],
				};
				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'n');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'number',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});
		});

		describe('Genders', function() {
			it('Should infer gender equals as gender type', function() {
				const constraints = [makeGenderNode('g', '=')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'g=5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'g');
				assert.deepEqual(
					{
						type: 'gender',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'gender',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});

			it('Should infer gender not-equals as gender type', function() {
				const constraints = [makeGenderNode('g', '!=')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'g!=5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'g');
				assert.deepEqual(
					{
						type: 'gender',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'gender',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});
		});

		describe('Enums', function() {
			it('Should infer enum equals as enum type', function() {
				const constraints = [makeEnumNode('e', '=')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'e=5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'e');
				assert.deepEqual(
					{
						type: 'enum',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'enum',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});

			it('Should infer enum not-equals as enum type', function() {
				const constraints = [makeEnumNode('e', '!=')];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'e!=5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(1, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'e');
				assert.deepEqual(
					{
						type: 'enum',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'enum',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
			});
		});

		describe('Multiple distinct variable', function() {
			it('Should infer types for both variables', function() {
				const constraints = [
					makeEnumNode('e'),
					makeNumberNode('i'),
				];
				const typeMap = new TypeMap();

				const constraintAST = {
					input: 'e="enum", i=5',
					nodes: constraints,
				};
				const textAST = {
					input: 'test',
					nodes: [],
				};

				infer.inferConstraintTypes(
					typeMap,
					constraintAST,
					textAST,
				);

				assert.equal(2, typeMap.size);

				const typeInfo = getTypeInfo(typeMap, 'e');
				assert.deepEqual(
					{
						type: 'enum',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[0],
								nodeType: 'constraint',
								type: 'enum',
							},
						],
					},
					typeInfo
				);
				assertConstraintUsage(typeInfo.usages[0]);
				const numberTypeInfo = getTypeInfo(typeMap, 'i');
				assert.deepEqual(
					{
						type: 'number',
						usages: [
							{
								location: {
									constraints: constraintAST,
									text: textAST,
								},
								node: constraints[1],
								nodeType: 'constraint',
								type: 'number',
							},
						],
					},
					numberTypeInfo,
				);
				assertConstraintUsage(numberTypeInfo.usages[0]);
			});
		});

		describe('Same variable multiple constraints', function() {
			describe('Initial number', function() {
				it('Is number when used as number two times', function() {
					const constraints = [makeNumberNode('n'), makeNumberNode('n', '>')];
					const typeMap = new TypeMap();

					const constraintAST = {
						input: 'n=5, n>5',
						nodes: constraints,
					};
					const textAST = {
						input: 'test',
						nodes: [],
					};
					infer.inferConstraintTypes(
						typeMap,
						constraintAST,
						textAST,
					);

					assert.equal(1, typeMap.size);

					const typeInfo = getTypeInfo(typeMap, 'n');
					assert.deepEqual(
						{
							type: 'number',
							usages: [
								{
									location: {
										constraints: constraintAST,
										text: textAST,
									},
									node: constraints[0],
									nodeType: 'constraint',
									type: 'number',
								},
								{
									location: {
										constraints: constraintAST,
										text: textAST,
									},
									node: constraints[1],
									nodeType: 'constraint',
									type: 'number',
								},
							],
						},
						typeInfo
					);
					assertConstraintUsage(typeInfo.usages[0]);
					assertConstraintUsage(typeInfo.usages[1]);
				});

				it('Is number when used as ignore', function() {
					const constraints = [makeNumberNode('n'), makeIgnoreNode('n')];
					const typeMap = new TypeMap();

					const constraintAST = {
						input: 'n=5,!n',
						nodes: constraints,
					};
					const textAST = {
						input: 'test',
						nodes: [],
					};

					infer.inferConstraintTypes(
						typeMap,
						constraintAST,
						textAST,
					);

					assert.equal(1, typeMap.size);

					const typeInfo = getTypeInfo(typeMap, 'n');
					assert.deepEqual(
						{
							type: 'number',
							usages: [
								{
									location: {
										constraints: constraintAST,
										text: textAST,
									},
									node: constraints[0],
									nodeType: 'constraint',
									type: 'number',
								},
								{
									location: {
										constraints: constraintAST,
										text: textAST,
									},
									node: constraints[1],
									nodeType: 'constraint',
									type: 'unknown',
								},
							],
						},
						typeInfo
					);
					assertConstraintUsage(typeInfo.usages[0]);
					assertConstraintUsage(typeInfo.usages[1]);
				});
			});

			describe('Fail cases', function() {
				it('Cannot reconcile with enum', function() {
					const constraints = [makeNumberNode('n'), makeEnumNode('n')];
					const typeMap = new TypeMap();

					const constraintAST = {
						input: 'n=5,n="enum"',
						nodes: constraints,
					};
					const textAST = {
						input: 'test',
						nodes: [],
					};
					infer.inferConstraintTypes(
						typeMap,
						constraintAST,
						textAST,
					);

					assert.equal(1, typeMap.size);

					const typeInfo = getTypeInfo(typeMap, 'n');
					assert.deepEqual(
						{
							type: 'error',
							usages: [
								{
									location: {
										constraints: constraintAST,
										text: textAST,
									},
									node: constraints[0],
									nodeType: 'constraint',
									type: 'number',
								},
								{
									location: {
										constraints: constraintAST,
										text: textAST,
									},
									node: constraints[1],
									nodeType: 'constraint',
									type: 'enum',
								},
							],
						},
						typeInfo
					);

					assertConstraintUsage(typeInfo.usages[0]);
					assertConstraintUsage(typeInfo.usages[1]);
				});

				it('Cannot reconcile with gender', function() {
					const constraints = [makeNumberNode('n'), makeGenderNode('n')];
					const typeMap = new TypeMap();

					const constraintAST = {
						input: 'n=5,n=\'F\'',
						nodes: constraints,
					};
					const textAST = {
						input: 'test',
						nodes: [],
					};

					infer.inferConstraintTypes(
						typeMap,
						constraintAST,
						textAST,
					);

					assert.equal(1, typeMap.size);

					const typeInfo = getTypeInfo(typeMap, 'n');
					assert.deepEqual(
						{
							type: 'error',
							usages: [
								{
									location: {
										constraints: constraintAST,
										text: textAST,
									},
									node: constraints[0],
									nodeType: 'constraint',
									type: 'number',
								},
								{
									location: {
										constraints: constraintAST,
										text: textAST,
									},
									node: constraints[1],
									nodeType: 'constraint',
									type: 'gender',
								},
							],
						},
						typeInfo
					);

					assertConstraintUsage(typeInfo.usages[0]);
					assertConstraintUsage(typeInfo.usages[1]);
				});
			});
		});
	});
});

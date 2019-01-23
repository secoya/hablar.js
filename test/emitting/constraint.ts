import { prettyPrint, types } from 'recast';

import { emitConstrainedTranslation } from '../../src/emitting/constraint';
import Context from '../../src/emitting/context';
import { EqualityNode, IgnoreNode, IneqNode, ValueNode } from '../../src/trees/constraint';

const b = types.builders;

const nullExpr = b.identifier('null');

const five = b.literal(5);

function makeEmptyPos() {
	return {
		firstColumn: 0,
		firstLine: 0,
		lastColumn: 0,
		lastLine: 0,
	};
}

function makeIgnoreConstraint(varName: string): IgnoreNode {
	return {
		op: '!',
		operand: {
			name: varName,
			pos: makeEmptyPos(),
			type: 'identifier',
		},
		pos: makeEmptyPos(),
	};
}

function makeEqualityConstraint(varName: string, value: string | number): EqualityNode {
	let rhs: ValueNode;
	if (typeof value === 'string') {
		rhs = {
			pos: makeEmptyPos(),
			type: 'enum',
			value: value,
		};
	} else {
		rhs = {
			pos: makeEmptyPos(),
			type: 'number',
			value: value,
		};
	}
	return {
		lhs: {
			name: varName,
			pos: makeEmptyPos(),
			type: 'identifier',
		},
		op: '=',
		pos: makeEmptyPos(),
		rhs: rhs,
	};
}

function makeInequalityConstraint(varName: string, value: number, op: '>' | '<' | '>=' | '<=' = '>'): IneqNode {
	return {
		lhs: {
			name: varName,
			pos: makeEmptyPos(),
			type: 'identifier',
		},
		op: op,
		pos: makeEmptyPos(),
		rhs: {
			pos: makeEmptyPos(),
			type: 'number',
			value: value,
		},
	};
}

describe('Emitting - Constraints', () => {
	it('Emits simple return statement with no constraints', () => {
		const ctx = new Context();

		const res = prettyPrint(
			emitConstrainedTranslation(
				{
					input: '',
					nodes: [],
				},
				nullExpr,
				ctx,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`"return null;"`);
	});

	it('Emits simple return statement with just ignore constraints', () => {
		const ctx = new Context();

		const res = prettyPrint(
			emitConstrainedTranslation(
				{
					input: '!someVar',
					nodes: [makeIgnoreConstraint('someVar')],
				},
				nullExpr,
				ctx,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`"return null;"`);
	});

	it('Emits simple if statement on single constraint', () => {
		const ctx = new Context();

		const res = prettyPrint(
			emitConstrainedTranslation(
				{
					input: 'someVar=5',
					nodes: [makeEqualityConstraint('someVar', 5)],
				},
				nullExpr,
				ctx,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"if (vars.someVar === 5) {
    return null;
}"
`);
	});

	it('Emits simple if statement on multiple constraints with one ignore constraint', () => {
		const ctx = new Context();

		const res = prettyPrint(
			emitConstrainedTranslation(
				{
					input: 'someVar=5,!someOtherVar',
					nodes: [makeEqualityConstraint('someVar', 5), makeIgnoreConstraint('someOtherVar')],
				},
				nullExpr,
				ctx,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"if (vars.someVar === 5) {
    return null;
}"
`);
	});
	it('Emits simple if statement on constraint with multiple tests', () => {
		const ctx = new Context();

		const res = prettyPrint(
			emitConstrainedTranslation(
				{
					input: 'someVar=5,someOtherVar<10',
					nodes: [makeEqualityConstraint('someVar', 5), makeInequalityConstraint('someOtherVar', 10)],
				},
				five,
				ctx,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"if (vars.someVar === 5 && vars.someOtherVar > 10) {
    return 5;
}"
`);
	});
});

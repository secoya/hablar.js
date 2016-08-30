/**
 * @flow
 * eslint-env mocha,node
 */
import {assert} from 'chai';

import Context from '../../src/emitting/context';
import type {
	IgnoreNode,
	EqualityNode,
	IneqNode,
} from '../../src/trees/constraint';

import {types} from 'recast';
import {prettyPrint} from 'recast';

import {
	emitConstrainedTranslation,
} from '../../src/emitting/constraint';

const b = types.builders;

const nullExpr = b.identifier('null');

const five = b.literal(5);

function makeEmptyPos() {
	return {
		firstLine: 0,
		firstColumn: 0,
		lastLine: 0,
		lastColumn: 0,
	};
}

function makeIgnoreConstraint(varName: string) : IgnoreNode {
	return {
		pos: makeEmptyPos(),
		op: '!',
		operand: {
			type: 'identifier',
			pos: makeEmptyPos(),
			name: varName,
		},
	};
}

function makeEqualityConstraint(
	varName: string,
	value: string | number
) : EqualityNode {
	let rhs = null;
	if (typeof (value) === 'string') {
		rhs = {
			type: 'enum',
			value: value,
			pos: makeEmptyPos(),
		};
	} else {
		rhs = {
			type: 'number',
			value: value,
			pos: makeEmptyPos(),
		};
	}
	return {
		pos: makeEmptyPos(),
		op: '=',
		lhs: {
			type: 'identifier',
			pos: makeEmptyPos(),
			name: varName,
		},
		rhs: rhs,
	};
}

function makeInequalityConstraint(
	varName: string,
	value: number,
	op: '>' | '<' | '>=' | '<=' = '>'
) : IneqNode {
	return {
		pos: makeEmptyPos(),
		op: op,
		lhs: {
			type: 'identifier',
			pos: makeEmptyPos(),
			name: varName,
		},
		rhs: {
			type: 'number',
			value: value,
			pos: makeEmptyPos(),
		},
	};
}

describe('Emitting - Constraints', function() {
	it('Emits simple return statement with no constraints', function() {
		const ctx = new Context();

		const res = prettyPrint(emitConstrainedTranslation([], nullExpr, ctx));

		assert.equal('return null;', res.code);
	});

	it('Emits simple return statement with just ignore constraints', function() {
		const ctx = new Context();

		const res = prettyPrint(emitConstrainedTranslation(
			[
				makeIgnoreConstraint('someVar'),
			],
			nullExpr,
			ctx
		));

		assert.equal('return null;', res.code);
	});

	it('Emits simple if statement on single constraint', function() {
		const ctx = new Context();

		const res = prettyPrint(emitConstrainedTranslation(
			[
				makeEqualityConstraint('someVar', 5),
			],
			nullExpr,
			ctx
		));

		assert.equal(
			`if (vars.someVar === 5) {
    return null;
}`,
			res.code
		);
	});

	it('Emits simple if statement on multiple constraints with one ignore constraint', function() {
		const ctx = new Context();

		const res = prettyPrint(emitConstrainedTranslation(
			[
				makeEqualityConstraint('someVar', 5),
				makeIgnoreConstraint('someOtherVar'),
			],
			nullExpr,
			ctx
		));

		assert.equal(
			`if (vars.someVar === 5) {
    return null;
}`,
			res.code
		);
	});

	it('Emits simple if statement on constraint with multiple tests', function() {
		const ctx = new Context();

		const res = prettyPrint(emitConstrainedTranslation(
			[
				makeEqualityConstraint('someVar', 5),
				makeInequalityConstraint('someOtherVar', 10),
			],
			five,
			ctx
		));

		assert.equal(
			`if (vars.someVar === 5 && vars.someOtherVar > 10) {
    return 5;
}`,
			res.code
		);
	});
});

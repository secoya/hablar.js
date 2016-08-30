/**
 * @flow
 * eslint-env mocha,node
 */

import {assert} from 'chai';

import {
	emitTranslation,
	emitConstrainedTranslations,
} from '../../src/emitting/translation';
import type {
	TypedNode,
	TypedVariableNode,
} from '../../src/trees/expression';

import type {
	Node as ConstraintNode,
} from '../../src/trees/constraint';

import type {
	TypedLiteralNode as TypedTextLiteralNode,
	TypedVariableNode as TypedTextVariableNode,
	TypedExprNode as TypedTextExprNode,
} from '../../src/trees/text';
import type {
	InferredType,
} from '../../src/type_map';
import TypeMap from '../../src/type_map';
import Context from '../../src/emitting/context';
import {prettyPrint} from 'recast';

const makeEmptyPos = () => ({
	firstLine: 1,
	firstColumn: 0,
	lastLine: 1,
	lastColumn: 0,
});

function tn(str: string) : TypedTextLiteralNode {
	return {
		textNodeType: 'literal',
		textType: 'string',
		pos: makeEmptyPos(),
		typed: true,
		value: str,
	};
}

function vn(name: string, type: InferredType) : TypedTextVariableNode {
	return {
		textNodeType: 'variable',
		textType: type,
		pos: makeEmptyPos(),
		typed: true,
		value: name,
	};
}

function en(exp: TypedNode) : TypedTextExprNode {
	return {
		textNodeType: 'expr',
		textType: exp.exprType,
		pos: makeEmptyPos(),
		typed: true,
		value: exp,
	};
}

function v(
	type: InferredType,
	name: string
) : TypedVariableNode {
	return {
		exprNodeType: 'variable',
		name: name,
		pos: makeEmptyPos(),
		exprType: type,
		typed: true,
		isConstant: false,
	};
}

function cignore(
	varName: string
) : ConstraintNode {
	return {
		op: '!',
		operand: {
			type: 'identifier',
			name: varName,
			pos: makeEmptyPos(),
		},
		pos: makeEmptyPos(),
	};
}

function ceq(
	op: '=' | '!=',
	varName: string,
	value: string | number
) : ConstraintNode {
	let rhs = null;
	if (typeof (value) === 'number') {
		rhs = {
			type: 'number',
			pos: makeEmptyPos(),
			value: value,
		};
	} else {
		rhs = {
			type: 'enum',
			pos: makeEmptyPos(),
			value: value,
		};
	}
	return {
		op: op,
		lhs: {
			type: 'identifier',
			name: varName,
			pos: makeEmptyPos(),
		},
		rhs: rhs,
		pos: makeEmptyPos(),
	};
}

describe('Emitting - translation', function() {
	it('Should emit simple string on basic translation', function() {
		const nodes = [
			tn('Some text'),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitTranslation(nodes, ctx, map));

		assert.equal('"Some text"', res.code);
	});

	it('Should emit function with guard on variable node - excluding scratch variable', function() {
		const nodes = [
			vn('myVar', 'string'),
		];
		const map = new TypeMap();
		map.addTypeUsage('myVar', 'string', {
			nodeType: 'custom',
		});

		const ctx = new Context();

		const res = prettyPrint(emitTranslation(nodes, ctx, map));

		const expected = `function(vars, fns, ctx) {
    if (typeof(vars.myVar) !== "string") {
        throw new Error("Variable myVar must be of type string");
    }

    return encodeIfString(ctx, vars.myVar);
}`;
		assert.equal(expected, res.code);
	});

	it('Should emit function with guard on variable node - including scratch variable', function() {
		const nodes = [
			vn('myVar', 'number-or-string'),
		];
		const map = new TypeMap();
		map.addTypeUsage('myVar', 'number-or-string', {
			nodeType: 'custom',
		});

		const ctx = new Context();

		const res = prettyPrint(emitTranslation(nodes, ctx, map));

		const expected = `function(vars, fns, ctx) {
    var _;

    if (!((_ = typeof(vars.myVar)) === "string" || _ === "number")) {
        throw new Error("Variable myVar must be of type number-or-string");
    }

    return encodeIfString(ctx, vars.myVar);
}`;
		assert.equal(expected, res.code);
	});

	it('Should ensure result is a string', function() {
		const nodes = [
			vn('myVar', 'number'),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitTranslation(nodes, ctx, map));

		const expected = `function(vars, fns, ctx) {
    return "" + vars.myVar;
}`;
		assert.equal(expected, res.code);
	});

	it('Should remove unneeded empty string literal with leading text', function() {
		const nodes = [
			tn('Some number: '),
			vn('myVar', 'number'),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitTranslation(nodes, ctx, map));

		const expected = `function(vars, fns, ctx) {
    return ctx.encode("Some number: ") + vars.myVar;
}`;
		assert.equal(expected, res.code);
	});

	it('Should remove unneeded empty string literal with leading text - when using expression', function() {
		const nodes = [
			tn('Some number: '),
			en(v('number', 'myVar')),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitTranslation(nodes, ctx, map));

		const expected = `function(vars, fns, ctx) {
    return ctx.encode("Some number: ") + vars.myVar;
}`;
		assert.equal(expected, res.code);
	});

	it('Should add empty string literal to force string concat on two numbers', function() {
		const nodes = [
			en(v('number', 'myOtherVar')),
			en(v('number', 'myVar')),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitTranslation(nodes, ctx, map));

		const expected = `function(vars, fns, ctx) {
    return "" + vars.myOtherVar + vars.myVar;
}`;
		assert.equal(expected, res.code);
	});

	describe('Constrained translations', function() {
		it('Should emit simple return on ignore constraint', function() {
			const translations = [
				{
					constraints: [
						cignore('someVar'),
					],
					nodes: [
						tn('Some translation'),
					],
				},
			];
			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

			const expected = `function(vars, fns, ctx) {
    return ctx.encode("Some translation");
}`;
			assert.equal(expected, res.code);
		});

		it('Should emit if statement with throw statement when not guarenteed to return', function() {
			const translations = [
				{
					constraints: [
						ceq('=', 'someVar', 5),
					],
					nodes: [
						tn('Some translation'),
					],
				},
			];
			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

			const expected = `function(vars, fns, ctx) {
    if (vars.someVar === 5) {
        return ctx.encode("Some translation");
    }

    throw new Error("No translation matched the parameters");
}`;
			assert.equal(expected, res.code);
		});

		it(
			'Should emit constrained translations in order - ' +
			'and not emit throw statement if unconstrained translation exists', function() {
			const translations = [
				{
					constraints: [
						ceq('=', 'someVar', 5),
					],
					nodes: [
						tn('Some translation'),
					],
				},
				{
					constraints: [
						ceq('=', 'someVar', 10),
					],
					nodes: [
						tn('Some other translation'),
					],
				},
				{
					constraints: [
						cignore('someVar'),
					],
					nodes: [
						tn('Some default translation'),
					],
				},
			];
			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

			const expected = `function(vars, fns, ctx) {
    if (vars.someVar === 5) {
        return ctx.encode("Some translation");
    }

    if (vars.someVar === 10) {
        return ctx.encode("Some other translation");
    }

    return ctx.encode("Some default translation");
}`;
			assert.equal(expected, res.code);
		});
	});
});

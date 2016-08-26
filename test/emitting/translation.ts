/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../types/recast.d.ts" />
import {assert} from 'chai';

import Context from '../../src/emitting/context';
import {
	emitConstrainedTranslations,
	emitSimpleTranslation,
} from '../../src/emitting/translation';
import {
	Node as ConstraintNode,
	ValueNode,
} from '../../src/trees/constraint';
import {
	TypedNode,
	TypedVariableNode,
} from '../../src/trees/expression';
import {
	TypedExprNode as TypedTextExprNode,
	TypedLiteralNode as TypedTextLiteralNode,
	TypedVariableNode as TypedTextVariableNode,
} from '../../src/trees/text';
import {
	InferredType,
} from '../../src/type_map';
import TypeMap from '../../src/type_map';
import {prettyPrint} from 'recast';

const makeEmptyPos = () => ({
	firstColumn: 0,
	firstLine: 1,
	lastColumn: 0,
	lastLine: 1,
});

function tn(str: string): TypedTextLiteralNode {
	return {
		pos: makeEmptyPos(),
		textNodeType: 'literal',
		textType: 'string',
		typed: true,
		value: str,
	};
}

function vn(name: string, type: InferredType): TypedTextVariableNode {
	return {
		pos: makeEmptyPos(),
		textNodeType: 'variable',
		textType: type,
		typed: true,
		value: name,
	};
}

function en(exp: TypedNode): TypedTextExprNode {
	return {
		pos: makeEmptyPos(),
		textNodeType: 'expr',
		textType: exp.exprType,
		typed: true,
		value: exp,
	};
}

function v(
	type: InferredType,
	name: string
): TypedVariableNode {
	return {
		exprNodeType: 'variable',
		exprType: type,
		isConstant: false,
		name: name,
		pos: makeEmptyPos(),
		typed: true,
	};
}

function cignore(
	varName: string
): ConstraintNode {
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

function ceq(
	op: '=' | '!=',
	varName: string,
	value: string | number
): ConstraintNode {
	let rhs: ValueNode;
	if (typeof (value) === 'number') {
		rhs = {
			pos: makeEmptyPos(),
			type: 'number',
			value: value,
		};
	} else {
		rhs = {
			pos: makeEmptyPos(),
			type: 'enum',
			value: value,
		};
	}
	return {
		lhs: {
			name: varName,
			pos: makeEmptyPos(),
			type: 'identifier',
		},
		op: op,
		pos: makeEmptyPos(),
		rhs: rhs,
	};
}

describe('Emitting - translation', function() {
	it('Should emit simple string on basic translation', function() {
		const nodes = [
			tn('Some text'),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitSimpleTranslation(nodes, ctx, map));

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

		const res = prettyPrint(emitSimpleTranslation(nodes, ctx, map));

		// tslint:disable:indent
		const expected = `function(vars, fns, ctx) {
    if (typeof(vars.myVar) !== "string" && !ctx.isSafeString(vars.myVar)) {
        throw new Error("Variable myVar must be of type string");
    }

    return encodeIfString(ctx, vars.myVar);
}`;
		// tslint:enable:indent
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

		const res = prettyPrint(emitSimpleTranslation(nodes, ctx, map));

		// tslint:disable:indent
		const expected = `function(vars, fns, ctx) {
    var _;

    if (!((_ = typeof(vars.myVar)) === "string" || _ === "number" || ctx.isSafeString(vars.myVar))) {
        throw new Error("Variable myVar must be of type number-or-string");
    }

    return encodeIfString(ctx, vars.myVar);
}`;
		// tslint:enable:indent
		assert.equal(expected, res.code);
	});

	it('Should ensure result is a string', function() {
		const nodes = [
			vn('myVar', 'number'),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitSimpleTranslation(nodes, ctx, map));

		// tslint:disable:indent
		const expected = `function(vars, fns, ctx) {
    return ctx.encode("" + vars.myVar);
}`;
		// tslint:enable:indent
		assert.equal(expected, res.code);
	});

	it('Should remove unneeded empty string literal with leading text', function() {
		const nodes = [
			tn('Some number: '),
			vn('myVar', 'number'),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitSimpleTranslation(nodes, ctx, map));

		// tslint:disable:indent
		const expected = `function(vars, fns, ctx) {
    return ctx.encode("Some number: " + vars.myVar);
}`;
		// tslint:enable:indent
		assert.equal(expected, res.code);
	});

	it('Should remove unneeded empty string literal with leading text - when using expression', function() {
		const nodes = [
			tn('Some number: '),
			en(v('number', 'myVar')),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitSimpleTranslation(nodes, ctx, map));

		// tslint:disable:indent
		const expected = `function(vars, fns, ctx) {
    return ctx.encode("Some number: " + vars.myVar);
}`;
		// tslint:enable:indent
		assert.equal(expected, res.code);
	});

	it('Should add empty string literal to force string concat on two numbers', function() {
		const nodes = [
			en(v('number', 'myOtherVar')),
			en(v('number', 'myVar')),
		];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(emitSimpleTranslation(nodes, ctx, map));

		// tslint:disable:indent
		const expected = `function(vars, fns, ctx) {
    return ctx.encode("" + vars.myOtherVar + vars.myVar);
}`;
		// tslint:enable:indent
		assert.equal(expected, res.code);
	});

	describe('Constrained translations', function() {
		it('Should emit simple return on ignore constraint', function() {
			const translations = [
				{
					constraints: [
						cignore('someVar'),
					],
					translation: [
						tn('Some translation'),
					],
				},
			];
			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

			// tslint:disable:indent
			const expected = `function(vars, fns, ctx) {
    return ctx.encode("Some translation");
}`;
			// tslint:enable:indent
			assert.equal(expected, res.code);
		});

		it('Should emit if statement with throw statement when not guarenteed to return', function() {
			const translations = [
				{
					constraints: [
						ceq('=', 'someVar', 5),
					],
					translation: [
						tn('Some translation'),
					],
				},
			];
			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

			// tslint:disable:indent
			const expected = `function(vars, fns, ctx) {
    if (vars.someVar === 5) {
        return ctx.encode("Some translation");
    }

    throw new Error("No translation matched the parameters");
}`;
			// tslint:enable:indent
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
					translation: [
						tn('Some translation'),
					],
				},
				{
					constraints: [
						ceq('=', 'someVar', 10),
					],
					translation: [
						tn('Some other translation'),
					],
				},
				{
					constraints: [
						cignore('someVar'),
					],
					translation: [
						tn('Some default translation'),
					],
				},
			];
			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

			// tslint:disable:indent
			const expected = `function(vars, fns, ctx) {
    if (vars.someVar === 5) {
        return ctx.encode("Some translation");
    }

    if (vars.someVar === 10) {
        return ctx.encode("Some other translation");
    }

    return ctx.encode("Some default translation");
}`;
			// tslint:enable:indent
			assert.equal(expected, res.code);
		});
	});
});

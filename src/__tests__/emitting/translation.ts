import { prettyPrint } from 'recast';
import Context from '../../emitting/context';
import { emitConstrainedTranslations, emitSimpleTranslation } from '../../emitting/translation';
import { Node as ConstraintNode, ValueNode } from '../../trees/constraint';
import { TypedNode, TypedVariableNode } from '../../trees/expression';
import {
	TypedExprNode as TypedTextExprNode,
	TypedLiteralNode as TypedTextLiteralNode,
	TypedVariableNode as TypedTextVariableNode,
} from '../../trees/text';
import { InferredType } from '../../type_map';
import TypeMap from '../../type_map';

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

function v(type: InferredType, name: string): TypedVariableNode {
	return {
		exprNodeType: 'variable',
		exprType: type,
		isConstant: false,
		name: name,
		pos: makeEmptyPos(),
		typed: true,
	};
}

function cignore(varName: string): ConstraintNode {
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

function ceq(op: '=' | '!=', varName: string, value: string | number): ConstraintNode {
	let rhs: ValueNode;
	if (typeof value === 'number') {
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

describe('Emitting - translation', () => {
	it('Should emit simple string on basic translation', () => {
		const nodes = [tn('Some text')];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(
			emitSimpleTranslation(
				{
					input: 'Some text',
					nodes: nodes,
				},
				ctx,
				map,
			),
		);

		expect('"Some text"').toEqual(res.code);
	});

	it('Should emit function with guard on variable node - excluding scratch variable', () => {
		const nodes = [vn('myVar', 'string')];
		const map = new TypeMap();
		map.addTypeUsage('myVar', 'string', {
			nodeType: 'custom',
		});

		const ctx = new Context();

		const res = prettyPrint(
			emitSimpleTranslation(
				{
					input: '$myVar',
					nodes: nodes,
				},
				ctx,
				map,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    if (typeof(vars.myVar) !== \\"string\\" && !ctx.isSafeString(vars.myVar)) {
        throw new Error(\\"Variable myVar must be of type string\\");
    }

    return encodeIfString(ctx, vars.myVar);
}"
`);
	});

	it('Should emit function with guard on variable node - including scratch variable', () => {
		const nodes = [vn('myVar', 'number-or-string')];
		const map = new TypeMap();
		map.addTypeUsage('myVar', 'number-or-string', {
			nodeType: 'custom',
		});

		const ctx = new Context();

		const res = prettyPrint(
			emitSimpleTranslation(
				{
					input: '$myVar',
					nodes: nodes,
				},
				ctx,
				map,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    var _;

    if (!((_ = typeof(vars.myVar)) === \\"string\\" || _ === \\"number\\" || ctx.isSafeString(vars.myVar))) {
        throw new Error(\\"Variable myVar must be of type number-or-string\\");
    }

    return encodeIfString(ctx, vars.myVar);
}"
`);
	});

	it('Should ensure result is a string', () => {
		const nodes = [vn('myVar', 'number')];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(
			emitSimpleTranslation(
				{
					input: '$myVar',
					nodes: nodes,
				},
				ctx,
				map,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    return ctx.encode(\\"\\" + vars.myVar);
}"
`);
	});

	it('Should remove unneeded empty string literal with leading text', () => {
		const nodes = [tn('Some number: '), vn('myVar', 'number')];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(
			emitSimpleTranslation(
				{
					input: 'Some number: $myVar',
					nodes: nodes,
				},
				ctx,
				map,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    return ctx.encode(\\"Some number: \\" + vars.myVar);
}"
`);
	});

	it('Should remove unneeded empty string literal with leading text - when using expression', () => {
		const nodes = [tn('Some number: '), en(v('number', 'myVar'))];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(
			emitSimpleTranslation(
				{
					input: 'Some number: $number',
					nodes: nodes,
				},
				ctx,
				map,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    return ctx.encode(\\"Some number: \\" + vars.myVar);
}"
`);
	});

	it('Should add empty string literal to force string concat on two numbers', () => {
		const nodes = [en(v('number', 'myOtherVar')), en(v('number', 'myVar'))];
		const map = new TypeMap();
		const ctx = new Context();

		const res = prettyPrint(
			emitSimpleTranslation(
				{
					input: '{{$myOtherVar}}{{$myVar}}',
					nodes: nodes,
				},
				ctx,
				map,
			),
		);

		expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    return ctx.encode(\\"\\" + vars.myOtherVar + vars.myVar);
}"
`);
	});

	describe('Constrained translations', () => {
		it('Should emit simple return on ignore constraint', () => {
			const translations = [
				{
					constraints: {
						input: '!someVar',
						nodes: [cignore('someVar')],
					},
					translation: {
						input: 'Some translation',
						nodes: [tn('Some translation')],
					},
				},
			];
			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

			expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    return ctx.encode(\\"Some translation\\");
}"
`);
		});

		it('Should emit if statement with throw statement when not guarenteed to return', () => {
			const translations = [
				{
					constraints: {
						input: 'someVar=5',
						nodes: [ceq('=', 'someVar', 5)],
					},
					translation: {
						input: 'Some translation',
						nodes: [tn('Some translation')],
					},
				},
			];
			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

			expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    if (vars.someVar === 5) {
        return ctx.encode(\\"Some translation\\");
    }

    throw new Error(\\"No translation matched the parameters\\");
}"
`);
		});

		it(
			'Should emit constrained translations in order - ' +
				'and not emit throw statement if unconstrained translation exists',
			() => {
				const translations = [
					{
						constraints: {
							input: 'someVar=5',
							nodes: [ceq('=', 'someVar', 5)],
						},
						translation: {
							input: 'Some translation',
							nodes: [tn('Some translation')],
						},
					},
					{
						constraints: {
							input: 'someVar=10',
							nodes: [ceq('=', 'someVar', 10)],
						},
						translation: {
							input: 'Some other translation',
							nodes: [tn('Some other translation')],
						},
					},
					{
						constraints: {
							input: '!someVar',
							nodes: [cignore('someVar')],
						},
						translation: {
							input: 'Some default translation',
							nodes: [tn('Some default translation')],
						},
					},
				];
				const map = new TypeMap();
				const ctx = new Context();

				const res = prettyPrint(emitConstrainedTranslations(translations, ctx, map));

				expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    if (vars.someVar === 5) {
        return ctx.encode(\\"Some translation\\");
    }

    if (vars.someVar === 10) {
        return ctx.encode(\\"Some other translation\\");
    }

    return ctx.encode(\\"Some default translation\\");
}"
`);
			},
		);

		it('Should not double escape variable in expression', () => {
			const tr = {
				input: 'Some translation {{$myVar}}',
				nodes: [tn('Some translation '), en(v('string', 'myVar'))],
			};

			const map = new TypeMap();
			const ctx = new Context();

			const res = prettyPrint(emitSimpleTranslation(tr, ctx, map));

			expect(res.code).toMatchInlineSnapshot(`
"function(vars, fns, ctx) {
    return ctx.encode(\\"Some translation \\") + encodeIfString(ctx, vars.myVar);
}"
`);
		});
	});
});

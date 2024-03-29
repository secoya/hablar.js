import { prettyPrint } from 'recast';

import { analyzeTranslation, analyzeTranslations, ConstraintTranslation } from '../analysis/combined';
import Context from '../emitting/context';
import { emitTranslation } from '../emitting/translation';
import constraintParser from '../parsers/constraint';
import fullTextParser from '../parsers/text';
import TypeMap from '../type_map';

describe('Full tests', () => {
	it('Should work with simple text translations', () => {
		const text = 'Some translation';

		const ast = fullTextParser(text);

		const typeMap = new TypeMap();
		const ctx = new Context();
		const analyzed = analyzeTranslation(ast, typeMap);

		const jsAst = emitTranslation(analyzed, ctx, typeMap);
		expect('"Some translation"').toEqual(prettyPrint(jsAst).code);
	});

	it('Should work with multiple simple text translations', () => {
		const text1 = 'Some translation';
		const ast1 = fullTextParser(text1);

		const text2 = 'Some other translation';
		const ast2 = fullTextParser(text2);

		const typeMap = new TypeMap();
		const ctx = new Context();
		const analyzed = analyzeTranslations([ast1, ast2], typeMap);

		const jsAst1 = emitTranslation(analyzed[0], ctx, typeMap);
		const jsAst2 = emitTranslation(analyzed[1], ctx, typeMap);
		expect('"Some translation"').toEqual(prettyPrint(jsAst1).code);
		expect('"Some other translation"').toEqual(prettyPrint(jsAst2).code);
	});

	it('Should work with complex translations', () => {
		const translation: ConstraintTranslation = [
			{
				constraints: constraintParser('n = 0'),
				translation: fullTextParser('You have nothing in your basket'),
			},
			{
				constraints: constraintParser('n = 1'),
				translation: fullTextParser('You have one item in your basket'),
			},
			{
				constraints: constraintParser('n > 1'),
				translation: fullTextParser('You have $n items in your basket'),
			},
		];
		const typeMap = new TypeMap();
		const ctx = new Context();
		const analyzed = analyzeTranslation(translation, typeMap);

		const jsAst = emitTranslation(analyzed, ctx, typeMap);

		expect(prettyPrint(jsAst).code).toMatchInlineSnapshot(`
		"function(vars, fns, ctx) {
		    if (typeof(vars.n) !== \"number\") {
		        throw new Error(\"Variable n must be of type number\");
		    }

		    if (vars.n === 0) {
		        return ctx.encode(\"You have nothing in your basket\");
		    }

		    if (vars.n === 1) {
		        return ctx.encode(\"You have one item in your basket\");
		    }

		    if (vars.n > 1) {
		        return ctx.encode(\"You have \" + vars.n + \" items in your basket\");
		    }

		    throw new Error(\"No translation matched the parameters\");
		}"
	`);
	});

	it('Should constant fold simple translation', () => {
		const translation = fullTextParser("Here's one million: {{1*1000*1000}}");
		const typeMap = new TypeMap();
		const ctx = new Context();
		const analyzed = analyzeTranslation(translation, typeMap);

		const jsAst = emitTranslation(analyzed, ctx, typeMap);
		expect(prettyPrint(jsAst).code).toMatchInlineSnapshot(`"\"Here's one million: 1000000\""`);
	});

	it('Should constant fold complex translations', () => {
		const translation: ConstraintTranslation = [
			{
				constraints: constraintParser('n = 0'),
				translation: fullTextParser('You have nothing in your basket. One million: {{1*1000*1000}}'),
			},
			{
				constraints: constraintParser('n = 1'),
				translation: fullTextParser('You have one item in your basket. One million: {{1*1000*1000}}'),
			},
			{
				constraints: constraintParser('n > 1'),
				translation: fullTextParser('You have $n items in your basket. One million: {{1*1000*1000}}'),
			},
		];
		const typeMap = new TypeMap();
		const ctx = new Context();
		const analyzed = analyzeTranslation(translation, typeMap);

		const jsAst = emitTranslation(analyzed, ctx, typeMap);

		expect(prettyPrint(jsAst).code).toMatchInlineSnapshot(`
		"function(vars, fns, ctx) {
		    if (typeof(vars.n) !== \"number\") {
		        throw new Error(\"Variable n must be of type number\");
		    }

		    if (vars.n === 0) {
		        return ctx.encode(\"You have nothing in your basket. One million: 1000000\");
		    }

		    if (vars.n === 1) {
		        return ctx.encode(\"You have one item in your basket. One million: 1000000\");
		    }

		    if (vars.n > 1) {
		        return ctx.encode(\"You have \" + vars.n + \" items in your basket. One million: 1000000\");
		    }

		    throw new Error(\"No translation matched the parameters\");
		}"
	`);
	});

	it('Should generate pretty type errors', () => {
		const text = 'Calculation: {{$myVar*5}}.';

		const ast = fullTextParser(text);

		const typeMap = new TypeMap();
		typeMap.addTypeUsage('myVar', 'string', { nodeType: 'custom' });
		expect(() => analyzeTranslation(ast, typeMap)).toThrowErrorMatchingInlineSnapshot(`
"Type error at line 1:
1: Calculation: {{$myVar*5}}.
   ----------------^
   Variable $myVar was expected to have type: string, found: number."
`);
	});

	it('Should generate pretty unknown variable error - in expression', () => {
		const text = 'Calculation: {{$myVar}}.';

		const ast = fullTextParser(text);

		const typeMap = new TypeMap();
		expect(() => analyzeTranslation(ast, typeMap, ['someOtherVar'])).toThrowErrorMatchingInlineSnapshot(`
"Unknown variable $myVar used on line 1:
1: Calculation: {{$myVar}}.
   ----------------^
   Variable $myVar is not known to this translation. Known variables are: $someOtherVar"
`);
	});

	it('Should generate pretty unknown variable error - outside of expression', () => {
		const text = 'Calculation: $myVar.';

		const ast = fullTextParser(text);

		const typeMap = new TypeMap();
		expect(() => analyzeTranslation(ast, typeMap, ['someOtherVar'])).toThrowErrorMatchingInlineSnapshot(`
"Unknown variable $myVar used on line 1:
1: Calculation: $myVar.
   --------------^
   Variable $myVar is not known to this translation. Known variables are: $someOtherVar"
`);
	});

	it('Should allow known variable to be used', () => {
		const text = 'Calculation: $myVar';

		const ast = fullTextParser(text);

		const typeMap = new TypeMap();
		expect(() => analyzeTranslation(ast, typeMap, ['myVar'], ['someFunction'])).not.toThrow();
	});

	it('Should generate pretty unknown function error', () => {
		const text = 'Calculation: {{fn()}}';

		const ast = fullTextParser(text);

		const typeMap = new TypeMap();
		expect(() => analyzeTranslation(ast, typeMap, null, ['otherFn'])).toThrowErrorMatchingInlineSnapshot(`
"Unknown function fn used on line 1:
1: Calculation: {{fn()}}
   ---------------^
   Function fn is not known to this translation. Known functions are: otherFn"
`);
	});

	it('Should be able to type infer function arguments', () => {
		const text = 'Bold text: {{bold($myVar)}}';

		const ast = fullTextParser(text);

		const typeMap = new TypeMap();
		analyzeTranslation(ast, typeMap, null, ['bold']);
		expect(typeMap.getVariableType('myVar')).toMatchInlineSnapshot(`"unknown"`);
		const newTypeMap = new TypeMap();
		newTypeMap.addTypedFunction('bold', ['string']);
		analyzeTranslation(ast, newTypeMap, null, ['bold']);
		expect(newTypeMap.getVariableType('myVar')).toMatchInlineSnapshot(`"string"`);
	});
});

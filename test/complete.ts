import {assert} from 'chai';
import 'mocha';

import {prettyPrint} from 'recast';

import {
	analyzeTranslation,
	ConstraintTranslation,
	SimpleTranslation,
} from '../src/analysis/combined';
import Context from '../src/emitting/context';
import {
	emitTranslation,
} from '../src/emitting/translation';
import constraintParser from '../src/parsers/constraint';
import fullTextParser from '../src/parsers/text';
import TypeMap from '../src/type_map';

describe('Full tests', function() {
	it('Should work with simple text translations', function() {
		const text = 'Some translation';

		const ast: SimpleTranslation = fullTextParser(text);

		const typeMap = new TypeMap();
		const ctx = new Context();
		const analyzed = analyzeTranslation(ast, typeMap);

		const jsAst = emitTranslation(analyzed, ctx, typeMap);
		assert.equal('"Some translation"', prettyPrint(jsAst).code);
	});

	it('Should work with complex translations', function() {
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
		// tslint:disable:indent
		const expected =
			`function(vars, fns, ctx) {
    if (typeof(vars.n) !== "number") {
        throw new Error("Variable n must be of type number");
    }

    if (vars.n === 0) {
        return ctx.encode("You have nothing in your basket");
    }

    if (vars.n === 1) {
        return ctx.encode("You have one item in your basket");
    }

    if (vars.n > 1) {
        return ctx.encode("You have " + vars.n + " items in your basket");
    }

    throw new Error("No translation matched the parameters");
}`;
		// tslint:enable:indent
		assert.equal(expected, prettyPrint(jsAst).code);
	});

	it('Should constant fold simple translation', function() {
		const translation: SimpleTranslation = fullTextParser('Here\'s one million: {{1*1000*1000}}');
		const typeMap = new TypeMap();
		const ctx = new Context();
		const analyzed = analyzeTranslation(translation, typeMap);

		const jsAst = emitTranslation(analyzed, ctx, typeMap);
		const expected = '"Here\'s one million: 1000000"';
		assert.equal(expected, prettyPrint(jsAst).code);
	});

	it('Should constant fold complex translations', function() {
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
		// tslint:disable:indent
		const expected =
			`function(vars, fns, ctx) {
    if (typeof(vars.n) !== "number") {
        throw new Error("Variable n must be of type number");
    }

    if (vars.n === 0) {
        return ctx.encode("You have nothing in your basket. One million: 1000000");
    }

    if (vars.n === 1) {
        return ctx.encode("You have one item in your basket. One million: 1000000");
    }

    if (vars.n > 1) {
        return ctx.encode("You have " + vars.n + " items in your basket. One million: 1000000");
    }

    throw new Error("No translation matched the parameters");
}`;
		// tslint:enable:indent
		assert.equal(expected, prettyPrint(jsAst).code);
	});
});

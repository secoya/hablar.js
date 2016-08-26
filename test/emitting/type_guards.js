/**
 * @flow
 * eslint-env mocha,node
 */

import {
	getTypeGuardStatements,
	getTypeGuardStatement,
} from '../../src/emitting/type_guards';
import TypeMap from '../../src/type_map';
import Context from '../../src/emitting/context';
import {prettyPrint, types} from 'recast';
import {assert} from 'chai';

const b = types.builders;

describe('Emitting - Type guards', function() {
	describe('Parameters', function() {
		it('Should emit nothing with empty type map', function() {
			const map = new TypeMap();
			map.freeze();
			const ctx = new Context();

			const stmts = getTypeGuardStatements(map, ctx);

			assert.isFalse(ctx.usesTypeGuardScratchVariable);
			assert.equal(0, stmts.length);
		});

		it('Should emit simple existence test for unknown type', function() {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'unknown', ctx);

			const expected =
				`if (!vars.hasOwnProperty("myVar")) {
    throw new Error("Variable myVar must be of type unknown");
}`
			;

			assert.isFalse(ctx.usesTypeGuardScratchVariable);
			assert.equal(expected, prettyPrint(stmt).code);
		});

		it('Should emit simple typeof test for string', function() {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'string', ctx);

			const expected =
				`if (typeof(vars.myVar) !== "string" && !ctx.isSafeString(vars.myVar)) {
    throw new Error("Variable myVar must be of type string");
}`
			;
			assert.isFalse(ctx.usesTypeGuardScratchVariable);
			assert.equal(expected, prettyPrint(stmt).code);
		});

		it('Should emit simple typeof test for number', function() {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'number', ctx);

			const expected =
				`if (typeof(vars.myVar) !== "number") {
    throw new Error("Variable myVar must be of type number");
}`
			;
			assert.isFalse(ctx.usesTypeGuardScratchVariable);
			assert.equal(expected, prettyPrint(stmt).code);
		});

		it('Should emit combined typeof test for number-or-string', function() {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'number-or-string', ctx);

			const expected =
				`if (!((_ = typeof(vars.myVar)) === "string" || _ === "number" || ctx.isSafeString(vars.myVar))) {
    throw new Error("Variable myVar must be of type number-or-string");
}`
			;
			assert.isTrue(ctx.usesTypeGuardScratchVariable);
			assert.equal(expected, prettyPrint(stmt).code);
		});

		it('Should emit combined value equality tests for gender', function() {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'gender', ctx);

			const expected =
				`if (!(vars.myVar === "M" || vars.myVar === "F" || vars.myVar === "N")) {
    throw new Error("Variable myVar must be of type gender");
}`
			;
			assert.isFalse(ctx.usesTypeGuardScratchVariable);
			assert.equal(expected, prettyPrint(stmt).code);
		});
	});

	describe('Functions', function() {
		it('Should emit nothing on empty function array', function() {
			const ctx = new Context();
			const map = new TypeMap();
			map.freeze();
			const res = getTypeGuardStatements(map, ctx);

			assert.equal(0, res.length);
		});

		it('Should emit single if statement on single function', function() {
			const ctx = new Context();
			const map = new TypeMap();
			map.addFunction('myFn');
			map.freeze();
			const res = getTypeGuardStatements(map, ctx);

			const expected =
				`if (typeof(fns.myFn) !== "function") {
    throw new Error("Translation requires function myFn to exist");
}`;

			assert.equal(1, res.length);
			assert.equal(expected, prettyPrint(res[0]).code);
		});

		it('Should emit two if statements on two functions', function() {
			const ctx = new Context();
			const map = new TypeMap();
			map.addFunction('myFn');
			map.addFunction('myOtherFn');
			map.freeze();
			const res = getTypeGuardStatements(map, ctx);

			const expected =
				`{
    if (typeof(fns.myFn) !== "function") {
        throw new Error("Translation requires function myFn to exist");
    }

    if (typeof(fns.myOtherFn) !== "function") {
        throw new Error("Translation requires function myOtherFn to exist");
    }
}`;
			assert.equal(expected, prettyPrint(b.blockStatement(res)).code);
		});
	});
});

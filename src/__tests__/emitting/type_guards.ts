import { prettyPrint, types } from 'recast';
import Context from '../../emitting/context';
import { getTypeGuardStatement, getTypeGuardStatements } from '../../emitting/type_guards';
import TypeMap from '../../type_map';

const b = types.builders;

describe('Emitting - Type guards', () => {
	describe('Parameters', () => {
		it('Should emit nothing with empty type map', () => {
			const map = new TypeMap();
			map.freeze();
			const ctx = new Context();

			const stmts = getTypeGuardStatements(map, ctx);

			expect(ctx.usesTypeGuardScratchVariable).toBe(false);
			expect(0).toEqual(stmts.length);
		});

		it('Should emit simple existence test for unknown type', () => {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'unknown', ctx);

			expect(ctx.usesTypeGuardScratchVariable).toBe(false);
			expect(prettyPrint(stmt).code).toMatchInlineSnapshot(`
"if (!vars.hasOwnProperty(\"myVar\")) {
    throw new Error(\"Variable myVar must be of type unknown\");
}"
`);
		});

		it('Should emit simple typeof test for string', () => {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'string', ctx);

			expect(ctx.usesTypeGuardScratchVariable).toBe(false);
			expect(prettyPrint(stmt).code).toMatchInlineSnapshot(`
"if (typeof(vars.myVar) !== \"string\" && !ctx.isSafeString(vars.myVar)) {
    throw new Error(\"Variable myVar must be of type string\");
}"
`);
		});

		it('Should emit simple typeof test for number', () => {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'number', ctx);

			expect(ctx.usesTypeGuardScratchVariable).toBe(false);
			expect(prettyPrint(stmt).code).toMatchInlineSnapshot(`
"if (typeof(vars.myVar) !== \"number\") {
    throw new Error(\"Variable myVar must be of type number\");
}"
`);
		});

		it('Should emit combined typeof test for number-or-string', () => {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'number-or-string', ctx);

			expect(ctx.usesTypeGuardScratchVariable).toBe(true);
			expect(prettyPrint(stmt).code).toMatchInlineSnapshot(`
"if (!((_ = typeof(vars.myVar)) === \"string\" || _ === \"number\" || ctx.isSafeString(vars.myVar))) {
    throw new Error(\"Variable myVar must be of type number-or-string\");
}"
`);
		});

		it('Should emit combined value equality tests for gender', () => {
			const ctx = new Context();
			const stmt = getTypeGuardStatement('myVar', 'gender', ctx);

			expect(ctx.usesTypeGuardScratchVariable).toBe(false);
			expect(prettyPrint(stmt).code).toMatchInlineSnapshot(`
"if (!(vars.myVar === \"M\" || vars.myVar === \"F\" || vars.myVar === \"N\")) {
    throw new Error(\"Variable myVar must be of type gender\");
}"
`);
		});
	});

	describe('Functions', () => {
		it('Should emit nothing on empty function array', () => {
			const ctx = new Context();
			const map = new TypeMap();
			map.freeze();
			const res = getTypeGuardStatements(map, ctx);

			expect(0).toEqual(res.length);
		});

		it('Should emit single if statement on single function', () => {
			const ctx = new Context();
			const map = new TypeMap();
			map.addFunction('myFn');
			map.freeze();
			const res = getTypeGuardStatements(map, ctx);

			expect(1).toEqual(res.length);
			expect(prettyPrint(res[0]).code).toMatchInlineSnapshot(`
"if (typeof(fns.myFn) !== \"function\") {
    throw new Error(\"Translation requires function myFn to exist\");
}"
`);
		});

		it('Should emit two if statements on two functions', () => {
			const ctx = new Context();
			const map = new TypeMap();
			map.addFunction('myFn');
			map.addFunction('myOtherFn');
			map.freeze();
			const res = getTypeGuardStatements(map, ctx);

			expect(prettyPrint(b.blockStatement(res)).code).toMatchInlineSnapshot(`
"{
    if (typeof(fns.myFn) !== \"function\") {
        throw new Error(\"Translation requires function myFn to exist\");
    }

    if (typeof(fns.myOtherFn) !== \"function\") {
        throw new Error(\"Translation requires function myOtherFn to exist\");
    }
}"
`);
		});
	});
});

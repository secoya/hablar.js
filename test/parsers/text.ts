import ParseError from '../../src/errors/parse_error';
import fullTextParser, { parseOnlyTextExpression as textParser } from '../../src/parsers/text';

describe('Text parser', () => {
	describe('Simple text literals', () => {
		it('Should parse simple one word literal', () => {
			const exp = 'Hello';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: 'Hello',
				},
			]).toEqual(res);
		});

		it('Should parse simple two word literal', () => {
			const exp = 'Hello world';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 11,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: 'Hello world',
				},
			]).toEqual(res);
		});
	});

	describe('Variables', () => {
		it('Should parse simple variable', () => {
			const exp = '$hello';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 6,
						lastLine: 1,
					},
					textNodeType: 'variable',
					value: 'hello',
				},
			]).toEqual(res);
		});

		it('Should parse variable and text', () => {
			const exp = '$hello world';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 6,
						lastLine: 1,
					},
					textNodeType: 'variable',
					value: 'hello',
				},
				{
					pos: {
						firstColumn: 6,
						firstLine: 1,
						lastColumn: 12,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: ' world',
				},
			]).toEqual(res);
		});

		it('Should parse text and variable', () => {
			const exp = 'hello $world';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 6,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: 'hello ',
				},
				{
					pos: {
						firstColumn: 6,
						firstLine: 1,
						lastColumn: 12,
						lastLine: 1,
					},
					textNodeType: 'variable',
					value: 'world',
				},
			]).toEqual(res);
		});

		it('Should parse text, variable and text ', () => {
			const exp = 'hello $world!';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 6,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: 'hello ',
				},
				{
					pos: {
						firstColumn: 6,
						firstLine: 1,
						lastColumn: 12,
						lastLine: 1,
					},
					textNodeType: 'variable',
					value: 'world',
				},
				{
					pos: {
						firstColumn: 12,
						firstLine: 1,
						lastColumn: 13,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: '!',
				},
			]).toEqual(res);
		});
	});

	describe('Expressions', () => {
		it('Should parse simple expression', () => {
			const exp = '{{5}}';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					textNodeType: 'expr',
					value: '5',
					valuePos: {
						firstColumn: 2,
						firstLine: 1,
						lastColumn: 3,
						lastLine: 1,
					},
				},
			]).toEqual(res);
		});

		it('Should parse complicated expression', () => {
			const exp = '{{5*10+"hello"*myFunction($world, "lol", 50.4)}}';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 48,
						lastLine: 1,
					},
					textNodeType: 'expr',
					value: '5*10+"hello"*myFunction($world, "lol", 50.4)',
					valuePos: {
						firstColumn: 2,
						firstLine: 1,
						lastColumn: 46,
						lastLine: 1,
					},
				},
			]).toEqual(res);
		});

		it('Should allow mixing of text and expressions', () => {
			const exp = 'Hello {{"world"}}';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 6,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: 'Hello ',
				},
				{
					pos: {
						firstColumn: 6,
						firstLine: 1,
						lastColumn: 17,
						lastLine: 1,
					},
					textNodeType: 'expr',
					value: '"world"',
					valuePos: {
						firstColumn: 8,
						firstLine: 1,
						lastColumn: 15,
						lastLine: 1,
					},
				},
			]).toEqual(res);
		});

		it('Should extract relevant position information', () => {
			const exp = 'Hello {{ world($hans, ) }}';
			const res = textParser(exp);

			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 6,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: 'Hello ',
				},
				{
					pos: {
						firstColumn: 6,
						firstLine: 1,
						lastColumn: 26,
						lastLine: 1,
					},
					textNodeType: 'expr',
					value: ' world($hans, ) ',
					valuePos: {
						firstColumn: 8,
						firstLine: 1,
						lastColumn: 24,
						lastLine: 1,
					},
				},
			]).toEqual(res);
		});

		describe('Fail cases', () => {
			it('Should reject empty expression', () => {
				const exp = '{{}}';
				expect(() => textParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
{{}}
--^
Expecting 'CHAR', 'CHARS', 'STRING_LITERAL', 'VARIABLE', got 'CLOSE_EXPR'"
`);
			});

			it('Should reject unclosed braces', () => {
				const exp = '{{5';
				expect(() => textParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
{{5
---^
Expecting 'CHAR', 'CHARS', 'STRING_LITERAL', 'VARIABLE', 'CLOSE_EXPR', got 'EOF'"
`);
			});
		});
	});

	describe('Text and expression parser', () => {
		it('Should parse and extract relevant information', () => {
			// This also heavily tests the line and column information preservation
			// between the text and expression parsing.
			// tslint:disable:indent
			const exp = `Hello {{ "world"+
$test

}} {{
    func()
}}`;
			// tslint:enable:indent
			const res = fullTextParser(exp);
			expect(exp).toEqual(res.input);
			expect([
				{
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 6,
						lastLine: 1,
					},
					textNodeType: 'literal',
					value: 'Hello ',
				},
				{
					pos: {
						firstColumn: 6,
						firstLine: 1,
						lastColumn: 2,
						lastLine: 4,
					},
					textNodeType: 'expr',
					value: {
						binaryOp: 'plus',
						exprNodeType: 'binary_op',
						lhs: {
							exprNodeType: 'string_literal',
							pos: {
								firstColumn: 9,
								firstLine: 1,
								lastColumn: 16,
								lastLine: 1,
							},
							value: 'world',
						},
						pos: {
							firstColumn: 9,
							firstLine: 1,
							lastColumn: 5,
							lastLine: 2,
						},
						rhs: {
							exprNodeType: 'variable',
							name: 'test',
							pos: {
								firstColumn: 0,
								firstLine: 2,
								lastColumn: 5,
								lastLine: 2,
							},
						},
					},
				},
				{
					pos: {
						firstColumn: 2,
						firstLine: 4,
						lastColumn: 3,
						lastLine: 4,
					},
					textNodeType: 'literal',
					value: ' ',
				},
				{
					pos: {
						firstColumn: 3,
						firstLine: 4,
						lastColumn: 2,
						lastLine: 6,
					},
					textNodeType: 'expr',
					value: {
						exprNodeType: 'function_invocation',
						name: 'func',
						parameters: [],
						pos: {
							firstColumn: 4,
							firstLine: 5,
							lastColumn: 10,
							lastLine: 5,
						},
					},
				},
			]).toEqual(res.nodes);
		});

		it("Should give good error message on mismatched curly's", () => {
			expect(() => fullTextParser('Hello {{ world')).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
1: Hello {{ world
   --------------^
   Expecting: 'CHAR', 'CHARS', 'STRING_LITERAL', 'VARIABLE', 'CLOSE_EXPR' got 'EOF'"
`);
		});

		it('Should support long input and pad line numbers in error message accordingly', () => {
			expect(() =>
				fullTextParser(
					`Line 1
Line 2
Line 3
Line 4
Line 5
Line 6
Line 7
Line 8
Line 9
Line 10
{{`,
				),
			).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 11:
1:  Line 1
2:  Line 2
3:  Line 3
4:  Line 4
5:  Line 5
6:  Line 6
7:  Line 7
8:  Line 8
9:  Line 9
10: Line 10
11: {{
    --^
    Expecting: 'CHAR', 'CHARS', 'STRING_LITERAL', 'VARIABLE' got 'EOF'"
`);
		});

		it('Should give good error message with error inside expression parser at EOF', () => {
			expect(() => fullTextParser('Hello {{ world( }}')).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
1: Hello {{ world( }}
   ----------------^
   Expecting: 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'CLOSE_PAREN', 'VARIABLE', 'IDENTIFIER' got 'CLOSE_EXPR'"
`);
		});

		it('Should give good error message with error inside expression parser - in expr', () => {
			expect(() => fullTextParser('Hello {{ world($hans, ) }}')).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
1: Hello {{ world($hans, ) }}
   ----------------------^
   Expecting: 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER' got 'CLOSE_PAREN'"
`);
		});

		it('Should give good error message when input spans multiple lines with error inside expression parser', () => {
			expect(() =>
				fullTextParser(
					`Hello there
{{ world(

}}
Some other line`,
				),
			).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 4:
1: Hello there
2: {{ world(
3: 
4: }}
   ^
   Expecting: 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'CLOSE_PAREN', 'VARIABLE', 'IDENTIFIER' got 'CLOSE_EXPR'
5: Some other line"
`);
		});
	});
});

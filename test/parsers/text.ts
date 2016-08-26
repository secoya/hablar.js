/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
import {assert} from 'chai';

import ParseError from '../../src/errors/parse_error';
import fullTextParser, {parseOnlyTextExpression as textParser} from '../../src/parsers/text';

describe('Text parser', function() {
	describe('Simple text literals', function() {
		it('Should parse simple one word literal', function() {
			const exp = 'Hello';
			const res = textParser(exp);

			assert.deepEqual([{
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 5,
					lastLine: 1,
				},
				textNodeType: 'literal',
				value: 'Hello',
			}], res);
		});

		it('Should parse simple two word literal', function() {
			const exp = 'Hello world';
			const res = textParser(exp);

			assert.deepEqual([{
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 11,
					lastLine: 1,
				},
				textNodeType: 'literal',
				value: 'Hello world',
			}], res);
		});
	});

	describe('Variables', function() {
		it('Should parse simple variable', function() {
			const exp = '$hello';
			const res = textParser(exp);

			assert.deepEqual([{
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 6,
					lastLine: 1,
				},
				textNodeType: 'variable',
				value: 'hello',
			}], res);
		});

		it('Should parse variable and text', function() {
			const exp = '$hello world';
			const res = textParser(exp);

			assert.deepEqual(
				[
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
				], res);
		});

		it('Should parse text and variable', function() {
			const exp = 'hello $world';
			const res = textParser(exp);

			assert.deepEqual(
				[
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
				], res);
		});

		it('Should parse text, variable and text ', function() {
			const exp = 'hello $world!';
			const res = textParser(exp);

			assert.deepEqual(
				[
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
				], res);
		});
	});

	describe('Expressions', function() {
		it('Should parse simple expression', function() {
			const exp = '{{5}}';
			const res = textParser(exp);

			assert.deepEqual(
				[
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
				],
				res
			);
		});

		it('Should parse complicated expression', function() {
			const exp = '{{5*10+"hello"*myFunction($world, "lol", 50.4)}}';
			const res = textParser(exp);

			assert.deepEqual(
				[
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
				],
				res
			);
		});

		it('Should allow mixing of text and expressions', function() {
			const exp = 'Hello {{"world"}}';
			const res = textParser(exp);

			assert.deepEqual(
				[
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
				],
				res
			);
		});

		describe('Fail cases', function() {
			it('Should reject empty expression', function() {
				const exp = '{{}}';
				assert.throws(() => textParser(exp), ParseError);
			});

			it('Should reject unclosed braces', function() {
				const exp = '{{5';
				assert.throws(() => textParser(exp), ParseError);
			});
		});
	});

	describe('Text and expression parser', function() {
		it('Should parse and extract relevant information', function() {
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
			assert.deepEqual(
				[
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
				],
				res
			);
		});
	});
});

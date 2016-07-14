/**
 * @flow
 * eslint-env mocha,node
 */
import {assert} from 'chai';

import fullTextParser, {parseOnlyTextExpression as textParser} from '../../src/parsers/text';
import ParseError from '../../src/parsers/parse_error';

describe('Text parser', function() {
	describe('Simple text literals', function() {
		it('Should parse simple one word literal', function() {
			const exp = 'Hello';
			const res = textParser(exp);

			assert.deepEqual([{
				type: 'literal',
				value: 'Hello',
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 5,
				},
			}], res);
		});

		it('Should parse simple two word literal', function() {
			const exp = 'Hello world';
			const res = textParser(exp);

			assert.deepEqual([{
				type: 'literal',
				value: 'Hello world',
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 11,
				},
			}], res);
		});
	});

	describe('Variables', function() {
		it('Should parse simple variable', function() {
			const exp = '$hello';
			const res = textParser(exp);

			assert.deepEqual([{
				type: 'variable',
				value: 'hello',
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 6,
				},
			}], res);
		});

		it('Should parse variable and text', function() {
			const exp = '$hello world';
			const res = textParser(exp);

			assert.deepEqual(
				[
					{
						type: 'variable',
						value: 'hello',
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 6,
						},
					},
					{
						type: 'literal',
						value: ' world',
						pos: {
							firstLine: 1,
							firstColumn: 6,
							lastLine: 1,
							lastColumn: 12,
						},
					},
				], res);
		});

		it('Should parse text and variable', function() {
			const exp = 'hello $world';
			const res = textParser(exp);

			assert.deepEqual(
				[
					{
						type: 'literal',
						value: 'hello ',
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 6,
						},
					},
					{
						type: 'variable',
						value: 'world',
						pos: {
							firstLine: 1,
							firstColumn: 6,
							lastLine: 1,
							lastColumn: 12,
						},
					},
				], res);
		});

		it('Should parse text, variable and text ', function() {
			const exp = 'hello $world!';
			const res = textParser(exp);

			assert.deepEqual(
				[
					{
						type: 'literal',
						value: 'hello ',
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 6,
						},
					},
					{
						type: 'variable',
						value: 'world',
						pos: {
							firstLine: 1,
							firstColumn: 6,
							lastLine: 1,
							lastColumn: 12,
						},
					},
					{
						type: 'literal',
						value: '!',
						pos: {
							firstLine: 1,
							firstColumn: 12,
							lastLine: 1,
							lastColumn: 13,
						},
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
						type: 'expr',
						value: '5',
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 5,
						},
						valuePos: {
							firstLine: 1,
							firstColumn: 2,
							lastLine: 1,
							lastColumn: 3,
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
						type: 'expr',
						value: '5*10+"hello"*myFunction($world, "lol", 50.4)',
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 48,
						},
						valuePos: {
							firstLine: 1,
							firstColumn: 2,
							lastLine: 1,
							lastColumn: 46,
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
						type: 'literal',
						value: 'Hello ',
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 6,
						},
					},
					{
						type: 'expr',
						value: '"world"',
						pos: {
							firstLine: 1,
							firstColumn: 6,
							lastLine: 1,
							lastColumn: 17,
						},
						valuePos: {
							firstLine: 1,
							firstColumn: 8,
							lastLine: 1,
							lastColumn: 15,
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
			const exp = `Hello {{ "world"+
$test

}} {{
    func()
}}`;
			const res = fullTextParser(exp);

			assert.sameMembers(['test'], res.variables);
			assert.sameMembers(['func'], res.functions);
			assert.deepEqual(
				[
					{
						type: 'literal',
						value: 'Hello ',
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 6,
						},
					},
					{
						type: 'expr',
						pos: {
							firstLine: 1,
							firstColumn: 6,
							lastLine: 4,
							lastColumn: 2,
						},
						value: {
							type: 'binary_op',
							op: 'plus',
							lhs: {
								type: 'string_literal',
								value: 'world',
								pos: {
									firstLine: 1,
									firstColumn: 9,
									lastLine: 1,
									lastColumn: 16,
								},
							},
							rhs: {
								type: 'variable',
								name: 'test',
								pos: {
									firstLine: 2,
									firstColumn: 0,
									lastLine: 2,
									lastColumn: 5,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 9,
								lastLine: 2,
								lastColumn: 5,
							},
						},
					},
					{
						type: 'literal',
						value: ' ',
						pos: {
							firstLine: 4,
							firstColumn: 2,
							lastLine: 4,
							lastColumn: 3,
						},
					},
					{
						type: 'expr',
						value: {
							type: 'function_invocation',
							name: 'func',
							parameters: [],
							pos: {
								firstLine: 5,
								firstColumn: 4,
								lastLine: 5,
								lastColumn: 10,
							},
						},
						pos: {
							firstLine: 4,
							firstColumn: 3,
							lastLine: 6,
							lastColumn: 2,
						},
					},
				],
				res.exprs
			);
		});
	});
});

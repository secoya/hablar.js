/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
import {assert} from 'chai';

import ParseError from '../../src/errors/parse_error';
import expressionParser from '../../src/parsers/expression';

describe('Expression parser', function() {
	describe('Literals', function() {
		describe('Numbers', function() {
			it('Should parse integer number', function() {
				const exp = '5';
				const res = expressionParser(exp);

				assert.deepEqual({
					exprNodeType: 'number',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 1,
						lastLine: 1,
					},
					value: 5,
				}, res);
			});

			it('Should parse floating point number', function() {
				const exp = '5.24';
				const res = expressionParser(exp);

				assert.deepEqual({
					exprNodeType: 'number',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					value: 5.24,
				}, res);
			});

			describe('Fail cases', function() {
				it('Should reject floating point number in scientific notation', function() {
					const exp = '5.24e10';
					assert.throws(() => expressionParser(exp), ParseError);
				});
			});
		});

		describe('Strings', function() {
			it('Should parse simple string', function() {
				const exp = '"Some string"';
				const res = expressionParser(exp);

				assert.deepEqual({
					exprNodeType: 'string_literal',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 13,
						lastLine: 1,
					},
					value: 'Some string',
				}, res);
			});

			it('Should parse simple string with double-quote escape sequence', function() {
				const exp = '"Some \\"string\\""';
				const res = expressionParser(exp);

				assert.deepEqual({
					exprNodeType: 'string_literal',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 17,
						lastLine: 1,
					},
					value: 'Some "string"',
				}, res);
			});

			it('Should parse simple string with other special characters escape sequence', function() {
				const exp = '"Some \\n\\t\\f\\rstring"';
				const res = expressionParser(exp);

				assert.deepEqual({
					exprNodeType: 'string_literal',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 21,
						lastLine: 1,
					},
					value: 'Some \n\t\f\rstring',
				}, res);
			});

			describe('Fail cases', function() {
				it('Should reject simple string with invalid escape sequence', function() {
					const exp = '"Some \\."';
					assert.throws(() => expressionParser(exp), ParseError);
				});
			});
		});
	});

	describe('Variables', function() {
		it('Should parse a simple variable', function() {
			const exp = '$hello';
			const res = expressionParser(exp);

			assert.deepEqual({
				exprNodeType: 'variable',
				name: 'hello',
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 6,
					lastLine: 1,
				},
			}, res);
		});

		it('Should parse a simple variable with mixed casing', function() {
			const exp = '$helloWorld';
			const res = expressionParser(exp);

			assert.deepEqual({
				exprNodeType: 'variable',
				name: 'helloWorld',
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 11,
					lastLine: 1,
				},
			}, res);
		});

		it('Should parse a simple variable with underscores', function() {
			const exp = '$hello_world';
			const res = expressionParser(exp);

			assert.deepEqual({
				exprNodeType: 'variable',
				name: 'hello_world',
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 12,
					lastLine: 1,
				},
			}, res);
		});

		describe('Fail cases', function() {
			it('Should fail on invalid identifier', function() {
				const exp = '$hello-not-valid-variable-name';

				assert.throws(() => expressionParser(exp), ParseError);
			});
		});
	});

	describe('Unary minus', function() {
		it('Should parse negative integer number', function() {
			const exp = '-5';
			const res = expressionParser(exp);

			assert.deepEqual({
				exprNodeType: 'unary_minus',
				op: {
					exprNodeType: 'number',
					pos: {
						firstColumn: 1,
						firstLine: 1,
						lastColumn: 2,
						lastLine: 1,
					},
					value: 5,
				},
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 2,
					lastLine: 1,
				},
			}, res);
		});

		it('Should parse negative variable', function() {
			const exp = '-$n';
			const res = expressionParser(exp);

			assert.deepEqual({
				exprNodeType: 'unary_minus',
				op: {
					exprNodeType: 'variable',
					name: 'n',
					pos: {
						firstColumn: 1,
						firstLine: 1,
						lastColumn: 3,
						lastLine: 1,
					},
				},
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 3,
					lastLine: 1,
				},
			}, res);
		});

		it('Should parse negative paren expresison', function() {
			const exp = '-(5)';
			const res = expressionParser(exp);

			assert.deepEqual({
				exprNodeType: 'unary_minus',
				op: {
					exprNodeType: 'number',
					pos: {
						firstColumn: 2,
						firstLine: 1,
						lastColumn: 3,
						lastLine: 1,
					},
					value: 5,
				},
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 4,
					lastLine: 1,
				},
			}, res);
		});

		describe('Fail cases', function() {
			it('Should reject unary minus without operand', function() {
				const exp = '-';
				assert.throws(() => expressionParser(exp), ParseError);
			});
		});
	});

	describe('Functions', function() {
		it('Should parse a simple function invocation with no parameters', function() {
			const exp = 'hello()';
			const res = expressionParser(exp);

			assert.deepEqual({
				exprNodeType: 'function_invocation',
				name: 'hello',
				parameters: [],
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 7,
					lastLine: 1,
				},
			}, res);
		});

		it('Should parse a simple function invocation with a numeric parameter', function() {
			const exp = 'hello(10)';
			const res = expressionParser(exp);

			assert.deepEqual(
				{
					exprNodeType: 'function_invocation',
					name: 'hello',
					parameters: [
						{
							exprNodeType: 'number',
							pos: {
								firstColumn: 6,
								firstLine: 1,
								lastColumn: 8,
								lastLine: 1,
							},
							value: 10,
						},
					],
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 9,
						lastLine: 1,
					},
				},
				res
			);
		});

		it('Should parse a simple function invocation with multiple parameters', function() {
			const exp = 'hello(10, $world, "some string")';
			const res = expressionParser(exp);

			assert.deepEqual(
				{
					exprNodeType: 'function_invocation',
					name: 'hello',
					parameters: [
						{
							exprNodeType: 'number',
							pos: {
								firstColumn: 6,
								firstLine: 1,
								lastColumn: 8,
								lastLine: 1,
							},
							value: 10,
						},
						{
							exprNodeType: 'variable',
							name: 'world',
							pos: {
								firstColumn: 10,
								firstLine: 1,
								lastColumn: 16,
								lastLine: 1,
							},
						},
						{
							exprNodeType: 'string_literal',
							pos: {
								firstColumn: 18,
								firstLine: 1,
								lastColumn: 31,
								lastLine: 1,
							},
							value: 'some string',
						},
					],
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 32,
						lastLine: 1,
					},
				},
				res
			);
		});

		it('Should parse a simple function invocation with a paren parameter', function() {
			const exp = 'hello((10))';
			const res = expressionParser(exp);

			assert.deepEqual(
				{
					exprNodeType: 'function_invocation',
					name: 'hello',
					parameters: [
						{
							exprNodeType: 'number',
							pos: {
								firstColumn: 7,
								firstLine: 1,
								lastColumn: 9,
								lastLine: 1,
							},
							value: 10,
						},
					],
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 11,
						lastLine: 1,
					},
				},
				res
			);
		});

		describe('Fail cases', function() {
			it('Should reject invocations with trailing comma', function() {
				const exp = 'hello(10, 20,)';
				assert.throws(() => expressionParser(exp), ParseError);
			});

			it('Should reject invocations without comma separator between arguments', function() {
				const exp = 'hello(10 20)';
				assert.throws(() => expressionParser(exp), ParseError);
			});

			it('Should reject invocations without parens', function() {
				const exp = 'hello 10, 20';
				assert.throws(() => expressionParser(exp), ParseError);
			});

			it('Should reject invocations without closing paren', function() {
				const exp = 'hello(10, 20';
				assert.throws(() => expressionParser(exp), ParseError);
			});
		});
	});

	describe('Arithmetic', function() {
		it('Should parse simple numeric plus arithmetic', function() {
			const exp = '5+10';
			const res = expressionParser(exp);

			assert.deepEqual(
				{
					binaryOp: 'plus',
					exprNodeType: 'binary_op',
					lhs: {
						exprNodeType: 'number',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						value: 5,
					},
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					rhs: {
						exprNodeType: 'number',
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 4,
							lastLine: 1,
						},
						value: 10,
					},
				},
				res
			);
		});

		it('Should parse simple numeric minus arithmetic', function() {
			const exp = '5-10';
			const res = expressionParser(exp);

			assert.deepEqual(
				{
					binaryOp: 'minus',
					exprNodeType: 'binary_op',
					lhs: {
						exprNodeType: 'number',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						value: 5,
					},
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					rhs: {
						exprNodeType: 'number',
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 4,
							lastLine: 1,
						},
						value: 10,
					},
				},
				res
			);
		});

		it('Should parse simple numeric divide arithmetic', function() {
			const exp = '5/10';
			const res = expressionParser(exp);

			assert.deepEqual(
				{
					binaryOp: 'divide',
					exprNodeType: 'binary_op',
					lhs: {
						exprNodeType: 'number',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						value: 5,
					},
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					rhs: {
						exprNodeType: 'number',
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 4,
							lastLine: 1,
						},
						value: 10,
					},
				},
				res
			);
		});

		it('Should parse simple numeric multiply arithmetic', function() {
			const exp = '5*10';
			const res = expressionParser(exp);

			assert.deepEqual(
				{
					binaryOp: 'multiply',
					exprNodeType: 'binary_op',
					lhs: {
						exprNodeType: 'number',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						value: 5,
					},
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					rhs: {
						exprNodeType: 'number',
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 4,
							lastLine: 1,
						},
						value: 10,
					},
				},
				res
			);
		});

		describe('Operator precedence', function() {
			it('Pure multiply behaves as expected', function() {
				const exp = '5*10*20';
				const res = expressionParser(exp);

				assert.deepEqual(
					{
						binaryOp: 'multiply',
						exprNodeType: 'binary_op',
						lhs: {
							binaryOp: 'multiply',
							exprNodeType: 'binary_op',
							lhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 0,
									firstLine: 1,
									lastColumn: 1,
									lastLine: 1,
								},
								value: 5,
							},
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 4,
								lastLine: 1,
							},
							rhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 2,
									firstLine: 1,
									lastColumn: 4,
									lastLine: 1,
								},
								value: 10,
							},
						},
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 7,
							lastLine: 1,
						},
						rhs: {
							exprNodeType: 'number',
							pos: {
								firstColumn: 5,
								firstLine: 1,
								lastColumn: 7,
								lastLine: 1,
							},
							value: 20,
						},
					},
					res
				);
			});

			it('Pure divide behaves as expected', function() {
				const exp = '5/10/20';
				const res = expressionParser(exp);

				assert.deepEqual(
					{
						binaryOp: 'divide',
						exprNodeType: 'binary_op',
						lhs: {
							binaryOp: 'divide',
							exprNodeType: 'binary_op',
							lhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 0,
									firstLine: 1,
									lastColumn: 1,
									lastLine: 1,
								},
								value: 5,
							},
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 4,
								lastLine: 1,
							},
							rhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 2,
									firstLine: 1,
									lastColumn: 4,
									lastLine: 1,
								},
								value: 10,
							},
						},
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 7,
							lastLine: 1,
						},
						rhs: {
							exprNodeType: 'number',
							pos: {
								firstColumn: 5,
								firstLine: 1,
								lastColumn: 7,
								lastLine: 1,
							},
							value: 20,
						},
					},
					res
				);
			});

			it('Parens groups expressions', function() {
				const exp = '5*(10*20)';
				const res = expressionParser(exp);

				assert.deepEqual(
					{
						binaryOp: 'multiply',
						exprNodeType: 'binary_op',
						lhs: {
							exprNodeType: 'number',
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 1,
								lastLine: 1,
							},
							value: 5,
						},
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 8,
							lastLine: 1,
						},
						rhs: {
							binaryOp: 'multiply',
							exprNodeType: 'binary_op',
							lhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 3,
									firstLine: 1,
									lastColumn: 5,
									lastLine: 1,
								},
								value: 10,
							},
							pos: {
								firstColumn: 3,
								firstLine: 1,
								lastColumn: 8,
								lastLine: 1,
							},
							rhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 6,
									firstLine: 1,
									lastColumn: 8,
									lastLine: 1,
								},
								value: 20,
							},
						},
					},
					res
				);
			});

			it('Plus operator precedence mixed with multiply', function() {
				const exp = '5+10*20';
				const res = expressionParser(exp);

				assert.deepEqual(
					{
						binaryOp: 'plus',
						exprNodeType: 'binary_op',
						lhs: {
							exprNodeType: 'number',
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 1,
								lastLine: 1,
							},
							value: 5,
						},
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 7,
							lastLine: 1,
						},
						rhs: {
							binaryOp: 'multiply',
							exprNodeType: 'binary_op',
							lhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 2,
									firstLine: 1,
									lastColumn: 4,
									lastLine: 1,
								},
								value: 10,
							},
							pos: {
								firstColumn: 2,
								firstLine: 1,
								lastColumn: 7,
								lastLine: 1,
							},
							rhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 5,
									firstLine: 1,
									lastColumn: 7,
									lastLine: 1,
								},
								value: 20,
							},
						},
					},
					res
				);
			});

			it('Plus operator precedence mixed with divide', function() {
				const exp = '5+10/20';
				const res = expressionParser(exp);

				assert.deepEqual(
					{
						binaryOp: 'plus',
						exprNodeType: 'binary_op',
						lhs: {
							exprNodeType: 'number',
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 1,
								lastLine: 1,
							},
							value: 5,
						},
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 7,
							lastLine: 1,
						},
						rhs: {
							binaryOp: 'divide',
							exprNodeType: 'binary_op',
							lhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 2,
									firstLine: 1,
									lastColumn: 4,
									lastLine: 1,
								},
								value: 10,
							},
							pos: {
								firstColumn: 2,
								firstLine: 1,
								lastColumn: 7,
								lastLine: 1,
							},
							rhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 5,
									firstLine: 1,
									lastColumn: 7,
									lastLine: 1,
								},
								value: 20,
							},
						},
					},
					res
				);
			});

			it('Minus operator precedence mixed with multiply', function() {
				const exp = '5-10*20';
				const res = expressionParser(exp);

				assert.deepEqual(
					{
						binaryOp: 'minus',
						exprNodeType: 'binary_op',
						lhs: {
							exprNodeType: 'number',
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 1,
								lastLine: 1,
							},
							value: 5,
						},
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 7,
							lastLine: 1,
						},
						rhs: {
							binaryOp: 'multiply',
							exprNodeType: 'binary_op',
							lhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 2,
									firstLine: 1,
									lastColumn: 4,
									lastLine: 1,
								},
								value: 10,
							},
							pos: {
								firstColumn: 2,
								firstLine: 1,
								lastColumn: 7,
								lastLine: 1,
							},
							rhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 5,
									firstLine: 1,
									lastColumn: 7,
									lastLine: 1,
								},
								value: 20,
							},
						},
					},
					res
				);
			});

			it('Minus operator precedence mixed with divide', function() {
				const exp = '5-10/20';
				const res = expressionParser(exp);

				assert.deepEqual(
					{
						binaryOp: 'minus',
						exprNodeType: 'binary_op',
						lhs: {
							exprNodeType: 'number',
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 1,
								lastLine: 1,
							},
							value: 5,
						},
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 7,
							lastLine: 1,
						},
						rhs: {
							binaryOp: 'divide',
							exprNodeType: 'binary_op',
							lhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 2,
									firstLine: 1,
									lastColumn: 4,
									lastLine: 1,
								},
								value: 10,
							},
							pos: {
								firstColumn: 2,
								firstLine: 1,
								lastColumn: 7,
								lastLine: 1,
							},
							rhs: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 5,
									firstLine: 1,
									lastColumn: 7,
									lastLine: 1,
								},
								value: 20,
							},
						},
					},
					res
				);
			});

			it('Unary minus operator precedence', function() {
				const exp = '-5 * -(10 - -20)';
				const res = expressionParser(exp);

				assert.deepEqual(
					{
						binaryOp: 'multiply',
						exprNodeType: 'binary_op',
						lhs: {
							exprNodeType: 'unary_minus',
							op: {
								exprNodeType: 'number',
								pos: {
									firstColumn: 1,
									firstLine: 1,
									lastColumn: 2,
									lastLine: 1,
								},
								value: 5,
							},
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 2,
								lastLine: 1,
							},
						},
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 16,
							lastLine: 1,
						},
						rhs: {
							exprNodeType: 'unary_minus',
							op: {
								binaryOp: 'minus',
								exprNodeType: 'binary_op',
								lhs: {
									exprNodeType: 'number',
									pos: {
										firstColumn: 7,
										firstLine: 1,
										lastColumn: 9,
										lastLine: 1,
									},
									value: 10,
								},
								pos: {
									firstColumn: 7,
									firstLine: 1,
									lastColumn: 15,
									lastLine: 1,
								},
								rhs: {
									exprNodeType: 'unary_minus',
									op: {
										exprNodeType: 'number',
										pos: {
											firstColumn: 13,
											firstLine: 1,
											lastColumn: 15,
											lastLine: 1,
										},
										value: 20,
									},
									pos: {
										firstColumn: 12,
										firstLine: 1,
										lastColumn: 15,
										lastLine: 1,
									},
								},
							},
							pos: {
								firstColumn: 5,
								firstLine: 1,
								lastColumn: 16,
								lastLine: 1,
							},
						},
					},
					res
				);
			});

			describe('Fail cases', function() {
				it('Should reject unary plus', function() {
					const exp = '+10';
					assert.throws(() => expressionParser(exp), ParseError);
				});

				it('Should reject unmatched parens', function() {
					const exp = '(20+10';
					assert.throws(() => expressionParser(exp), ParseError);
				});

				it('Should reject trailing binary plus op without rhs operand', function() {
					const exp = '20+';
					assert.throws(() => expressionParser(exp), ParseError);
				});

				it('Should reject trailing binary minus op without rhs operand', function() {
					const exp = '20-';
					assert.throws(() => expressionParser(exp), ParseError);
				});

				it('Should reject trailing binary multiply op without rhs operand', function() {
					const exp = '20*';
					assert.throws(() => expressionParser(exp), ParseError);
				});

				it('Should reject trailing binary divide op without rhs operand', function() {
					const exp = '20/';
					assert.throws(() => expressionParser(exp), ParseError);
				});
			});
		});
	});
});

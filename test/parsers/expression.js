/**
 * @flow
 * eslint-env mocha,node
 */
import {assert} from 'chai';

import expressionParser from '../../src/parsers/expression';
import ParseError from '../../src/parsers/parse_error';

describe('Expression parser', function() {
	describe('Literals', function() {
		describe('Numbers', function() {
			it('Should parse integer number', function() {
				const exp = '5';
				const res = expressionParser(exp);

				assert.deepEqual({
					type: 'number',
					value: 5,
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 1,
					},
				}, res);
			});

			it('Should parse floating point number', function() {
				const exp = '5.24';
				const res = expressionParser(exp);

				assert.deepEqual({
					type: 'number',
					value: 5.24,
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 4,
					},
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
					type: 'string_literal',
					value: 'Some string',
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 13,
					},
				}, res);
			});

			it('Should parse simple string with double-quote escape sequence', function() {
				const exp = '"Some \\"string\\""';
				const res = expressionParser(exp);

				assert.deepEqual({
					type: 'string_literal',
					value: 'Some "string"',
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 17,
					},
				}, res);
			});

			it('Should parse simple string with other special characters escape sequence', function() {
				const exp = '"Some \\n\\t\\f\\rstring"';
				const res = expressionParser(exp);

				assert.deepEqual({
					type: 'string_literal',
					value: 'Some \n\t\f\rstring',
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 21,
					},
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
				type: 'variable',
				name: 'hello',
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 6,
				},
			}, res);
		});

		it('Should parse a simple variable with mixed casing', function() {
			const exp = '$helloWorld';
			const res = expressionParser(exp);

			assert.deepEqual({
				type: 'variable',
				name: 'helloWorld',
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 11,
				},
			}, res);
		});

		it('Should parse a simple variable with underscores', function() {
			const exp = '$hello_world';
			const res = expressionParser(exp);

			assert.deepEqual({
				type: 'variable',
				name: 'hello_world',
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 12,
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
				type: 'unary_minus',
				op: {
					type: 'number',
					value: 5,
					pos: {
						firstLine: 1,
						firstColumn: 1,
						lastLine: 1,
						lastColumn: 2,
					},
				},
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 2,
				},
			}, res);
		});

		it('Should parse negative variable', function() {
			const exp = '-$n';
			const res = expressionParser(exp);

			assert.deepEqual({
				type: 'unary_minus',
				op: {
					type: 'variable',
					name: 'n',
					pos: {
						firstLine: 1,
						firstColumn: 1,
						lastLine: 1,
						lastColumn: 3,
					},
				},
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 3,
				},
			}, res);
		});

		it('Should parse negative paren expresison', function() {
			const exp = '-(5)';
			const res = expressionParser(exp);

			assert.deepEqual({
				type: 'unary_minus',
				op: {
					type: 'number',
					value: 5,
					pos: {
						firstLine: 1,
						firstColumn: 2,
						lastLine: 1,
						lastColumn: 3,
					},
				},
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 4,
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
				type: 'function_invocation',
				name: 'hello',
				parameters: [],
				pos: {
					firstLine: 1,
					firstColumn: 0,
					lastLine: 1,
					lastColumn: 7,
				},
			}, res);
		});

		it('Should parse a simple function invocation with a numeric parameter', function() {
			const exp = 'hello(10)';
			const res = expressionParser(exp);

			assert.deepEqual(
				{
					type: 'function_invocation',
					name: 'hello',
					parameters: [
						{
							type: 'number',
							value: 10,
							pos: {
								firstLine: 1,
								firstColumn: 6,
								lastLine: 1,
								lastColumn: 8,
							},
						},
					],
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 9,
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
					type: 'function_invocation',
					name: 'hello',
					parameters: [
						{
							type: 'number',
							value: 10,
							pos: {
								firstLine: 1,
								firstColumn: 6,
								lastLine: 1,
								lastColumn: 8,
							},
						},
						{
							type: 'variable',
							name: 'world',
							pos: {
								firstLine: 1,
								firstColumn: 10,
								lastLine: 1,
								lastColumn: 16,
							},
						},
						{
							type: 'string_literal',
							value: 'some string',
							pos: {
								firstLine: 1,
								firstColumn: 18,
								lastLine: 1,
								lastColumn: 31,
							},
						},
					],
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 32,
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
					type: 'function_invocation',
					name: 'hello',
					parameters: [
						{
							type: 'number',
							value: 10,
							pos: {
								firstLine: 1,
								firstColumn: 7,
								lastLine: 1,
								lastColumn: 9,
							},
						},
					],
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 11,
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
					type: 'binary_op',
					op: 'plus',
					lhs: {
						type: 'number',
						value: 5,
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 1,
						},
					},
					rhs: {
						type: 'number',
						value: 10,
						pos: {
							firstLine: 1,
							firstColumn: 2,
							lastLine: 1,
							lastColumn: 4,
						},
					},
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 4,
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
					type: 'binary_op',
					op: 'minus',
					lhs: {
						type: 'number',
						value: 5,
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 1,
						},
					},
					rhs: {
						type: 'number',
						value: 10,
						pos: {
							firstLine: 1,
							firstColumn: 2,
							lastLine: 1,
							lastColumn: 4,
						},
					},
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 4,
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
					type: 'binary_op',
					op: 'divide',
					lhs: {
						type: 'number',
						value: 5,
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 1,
						},
					},
					rhs: {
						type: 'number',
						value: 10,
						pos: {
							firstLine: 1,
							firstColumn: 2,
							lastLine: 1,
							lastColumn: 4,
						},
					},
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 4,
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
					type: 'binary_op',
					op: 'multiply',
					lhs: {
						type: 'number',
						value: 5,
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 1,
						},
					},
					rhs: {
						type: 'number',
						value: 10,
						pos: {
							firstLine: 1,
							firstColumn: 2,
							lastLine: 1,
							lastColumn: 4,
						},
					},
					pos: {
						firstLine: 1,
						firstColumn: 0,
						lastLine: 1,
						lastColumn: 4,
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
						type: 'binary_op',
						op: 'multiply',
						lhs: {
							type: 'binary_op',
							op: 'multiply',
							lhs: {
								type: 'number',
								value: 5,
								pos: {
									firstLine: 1,
									firstColumn: 0,
									lastLine: 1,
									lastColumn: 1,
								},
							},
							rhs: {
								type: 'number',
								value: 10,
								pos: {
									firstLine: 1,
									firstColumn: 2,
									lastLine: 1,
									lastColumn: 4,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 4,
							},
						},
						rhs: {
							type: 'number',
							value: 20,
							pos: {
								firstLine: 1,
								firstColumn: 5,
								lastLine: 1,
								lastColumn: 7,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 7,
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
						type: 'binary_op',
						op: 'divide',
						lhs: {
							type: 'binary_op',
							op: 'divide',
							lhs: {
								type: 'number',
								value: 5,
								pos: {
									firstLine: 1,
									firstColumn: 0,
									lastLine: 1,
									lastColumn: 1,
								},
							},
							rhs: {
								type: 'number',
								value: 10,
								pos: {
									firstLine: 1,
									firstColumn: 2,
									lastLine: 1,
									lastColumn: 4,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 4,
							},
						},
						rhs: {
							type: 'number',
							value: 20,
							pos: {
								firstLine: 1,
								firstColumn: 5,
								lastLine: 1,
								lastColumn: 7,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 7,
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
						type: 'binary_op',
						op: 'multiply',
						lhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'binary_op',
							op: 'multiply',
							lhs: {
								type: 'number',
								value: 10,
								pos: {
									firstLine: 1,
									firstColumn: 3,
									lastLine: 1,
									lastColumn: 5,
								},
							},
							rhs: {
								type: 'number',
								value: 20,
								pos: {
									firstLine: 1,
									firstColumn: 6,
									lastLine: 1,
									lastColumn: 8,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 3,
								lastLine: 1,
								lastColumn: 8,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 8,
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
						type: 'binary_op',
						op: 'plus',
						lhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'binary_op',
							op: 'multiply',
							lhs: {
								type: 'number',
								value: 10,
								pos: {
									firstLine: 1,
									firstColumn: 2,
									lastLine: 1,
									lastColumn: 4,
								},
							},
							rhs: {
								type: 'number',
								value: 20,
								pos: {
									firstLine: 1,
									firstColumn: 5,
									lastLine: 1,
									lastColumn: 7,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 2,
								lastLine: 1,
								lastColumn: 7,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 7,
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
						type: 'binary_op',
						op: 'plus',
						lhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'binary_op',
							op: 'divide',
							lhs: {
								type: 'number',
								value: 10,
								pos: {
									firstLine: 1,
									firstColumn: 2,
									lastLine: 1,
									lastColumn: 4,
								},
							},
							rhs: {
								type: 'number',
								value: 20,
								pos: {
									firstLine: 1,
									firstColumn: 5,
									lastLine: 1,
									lastColumn: 7,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 2,
								lastLine: 1,
								lastColumn: 7,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 7,
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
						type: 'binary_op',
						op: 'minus',
						lhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'binary_op',
							op: 'multiply',
							lhs: {
								type: 'number',
								value: 10,
								pos: {
									firstLine: 1,
									firstColumn: 2,
									lastLine: 1,
									lastColumn: 4,
								},
							},
							rhs: {
								type: 'number',
								value: 20,
								pos: {
									firstLine: 1,
									firstColumn: 5,
									lastLine: 1,
									lastColumn: 7,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 2,
								lastLine: 1,
								lastColumn: 7,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 7,
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
						type: 'binary_op',
						op: 'minus',
						lhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'binary_op',
							op: 'divide',
							lhs: {
								type: 'number',
								value: 10,
								pos: {
									firstLine: 1,
									firstColumn: 2,
									lastLine: 1,
									lastColumn: 4,
								},
							},
							rhs: {
								type: 'number',
								value: 20,
								pos: {
									firstLine: 1,
									firstColumn: 5,
									lastLine: 1,
									lastColumn: 7,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 2,
								lastLine: 1,
								lastColumn: 7,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 7,
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
						type: 'binary_op',
						op: 'multiply',
						lhs: {
							type: 'unary_minus',
							op: {
								type: 'number',
								value: 5,
								pos: {
									firstLine: 1,
									firstColumn: 1,
									lastLine: 1,
									lastColumn: 2,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 2,
							},
						},
						rhs: {
							type: 'unary_minus',
							op: {
								type: 'binary_op',
								op: 'minus',
								lhs: {
									type: 'number',
									value: 10,
									pos: {
										firstLine: 1,
										firstColumn: 7,
										lastLine: 1,
										lastColumn: 9,
									},
								},
								rhs: {
									type: 'unary_minus',
									op: {
										type: 'number',
										value: 20,
										pos: {
											firstLine: 1,
											firstColumn: 13,
											lastLine: 1,
											lastColumn: 15,
										},
									},
									pos: {
										firstLine: 1,
										firstColumn: 12,
										lastLine: 1,
										lastColumn: 15,
									},
								},
								pos: {
									firstLine: 1,
									firstColumn: 7,
									lastLine: 1,
									lastColumn: 15,
								},
							},
							pos: {
								firstLine: 1,
								firstColumn: 5,
								lastLine: 1,
								lastColumn: 16,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 16,
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

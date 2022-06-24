import ParseError from '../../errors/parse_error';
import expressionParser from '../../parsers/expression';

describe('Expression parser', () => {
	describe('Literals', () => {
		describe('Numbers', () => {
			it('Should parse integer number', () => {
				const exp = '5';
				const res = expressionParser(exp);

				expect({
					exprNodeType: 'number',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 1,
						lastLine: 1,
					},
					value: 5,
				}).toEqual(res);
			});

			it('Should parse floating point number', () => {
				const exp = '5.24';
				const res = expressionParser(exp);

				expect({
					exprNodeType: 'number',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					value: 5.24,
				}).toEqual(res);
			});

			describe('Fail cases', () => {
				it('Should reject floating point number in scientific notation', () => {
					const exp = '5.24e10';
					expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
5.24e10
-^
Expecting 'EOF', 'PLUS', 'MINUS', 'DIVIDE', 'MULTIPLY', 'CLOSE_PAREN', 'COMMA', got 'INVALID'"
`);
				});
			});
		});

		describe('Strings', () => {
			it('Should parse simple string', () => {
				const exp = '"Some string"';
				const res = expressionParser(exp);

				expect({
					exprNodeType: 'string_literal',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 13,
						lastLine: 1,
					},
					value: 'Some string',
				}).toEqual(res);
			});

			it('Should parse simple string with double-quote escape sequence', () => {
				const exp = '"Some \\"string\\""';
				const res = expressionParser(exp);

				expect({
					exprNodeType: 'string_literal',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 17,
						lastLine: 1,
					},
					value: 'Some "string"',
				}).toEqual(res);
			});

			it('Should parse simple string with other special characters escape sequence', () => {
				const exp = '"Some \\n\\t\\f\\rstring"';
				const res = expressionParser(exp);

				expect({
					exprNodeType: 'string_literal',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 21,
						lastLine: 1,
					},
					value: 'Some \n\t\f\rstring',
				}).toEqual(res);
			});

			describe('Fail cases', () => {
				it('Should reject simple string with invalid escape sequence', () => {
					const exp = '"Some \\."';
					expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(
						`"Error parsing '\\"Some \\\\.\\"'. Invalid string literal \\"Some \\\\.\\""`,
					);
				});
			});
		});
	});

	describe('Variables', () => {
		it('Should parse a simple variable', () => {
			const exp = '$hello';
			const res = expressionParser(exp);

			expect({
				exprNodeType: 'variable',
				name: 'hello',
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 6,
					lastLine: 1,
				},
			}).toEqual(res);
		});

		it('Should parse a simple variable with mixed casing', () => {
			const exp = '$helloWorld';
			const res = expressionParser(exp);

			expect({
				exprNodeType: 'variable',
				name: 'helloWorld',
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 11,
					lastLine: 1,
				},
			}).toEqual(res);
		});

		it('Should parse a simple variable with underscores', () => {
			const exp = '$hello_world';
			const res = expressionParser(exp);

			expect({
				exprNodeType: 'variable',
				name: 'hello_world',
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 12,
					lastLine: 1,
				},
			}).toEqual(res);
		});

		describe('Fail cases', () => {
			it('Should fail on invalid identifier', () => {
				const exp = '$hello-not-valid-variable-name';

				expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
$hello-not-valid-variable-name
----------^
Expecting 'OPEN_PAREN', got 'MINUS'"
`);
			});
		});
	});

	describe('Unary minus', () => {
		it('Should parse negative integer number', () => {
			const exp = '-5';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		it('Should parse negative variable', () => {
			const exp = '-$n';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		it('Should parse negative paren expresison', () => {
			const exp = '-(5)';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		describe('Fail cases', () => {
			it('Should reject unary minus without operand', () => {
				const exp = '-';
				expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
-
-^
Expecting 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER', got 'EOF'"
`);
			});
		});
	});

	describe('Functions', () => {
		it('Should parse a simple function invocation with no parameters', () => {
			const exp = 'hello()';
			const res = expressionParser(exp);

			expect({
				exprNodeType: 'function_invocation',
				name: 'hello',
				parameters: [],
				pos: {
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 7,
					lastLine: 1,
				},
			}).toEqual(res);
		});

		it('Should parse a simple function invocation with a numeric parameter', () => {
			const exp = 'hello(10)';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		it('Should parse a simple function invocation with multiple parameters', () => {
			const exp = 'hello(10, $world, "some string")';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		it('Should parse a simple function invocation with a paren parameter', () => {
			const exp = 'hello((10))';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		describe('Fail cases', () => {
			it('Should reject invocations with trailing comma', () => {
				const exp = 'hello(10, 20,)';
				expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
hello(10, 20,)
-------------^
Expecting 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER', got 'CLOSE_PAREN'"
`);
			});

			it('Should reject invocations with trailing comma - with leading whitespace', () => {
				const exp = ' hello($hans, )';
				let thrown = false;
				try {
					expressionParser(exp);
				} catch (e) {
					expect(e).toBeInstanceOf(ParseError);
					const parseE = e as ParseError;
					const expectedMessage =
						// tslint:disable:indent
						`Parse error on line 1:
 hello($hans, )
--------------^
Expecting 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER', got 'CLOSE_PAREN'`;
					// tslint:enable:indent
					expect(expectedMessage).toEqual(e.message);
					expect(' hello($hans, '.length - 1).toEqual(parseE.lastColumn);
					thrown = true;
				}
				expect(thrown).toBe(true);
			});

			it('Should reject invocations without comma separator between arguments', () => {
				const exp = 'hello(10 20)';
				expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
hello(10 20)
---------^
Expecting 'EOF', 'PLUS', 'MINUS', 'DIVIDE', 'MULTIPLY', 'CLOSE_PAREN', 'COMMA', got 'NUMBER'"
`);
			});

			it('Should reject invocations without parens', () => {
				const exp = 'hello 10, 20';
				expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
hello 10, 20
------^
Expecting 'OPEN_PAREN', got 'NUMBER'"
`);
			});

			it('Should reject invocations without closing paren', () => {
				const exp = 'hello(10, 20';
				expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
hello(10, 20
------------^
Expecting 'PLUS', 'MINUS', 'DIVIDE', 'MULTIPLY', 'CLOSE_PAREN', 'COMMA', got 'EOF'"
`);
			});
		});
	});

	describe('Arithmetic', () => {
		it('Should parse simple numeric plus arithmetic', () => {
			const exp = '5+10';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		it('Should parse simple numeric minus arithmetic', () => {
			const exp = '5-10';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		it('Should parse simple numeric divide arithmetic', () => {
			const exp = '5/10';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		it('Should parse simple numeric multiply arithmetic', () => {
			const exp = '5*10';
			const res = expressionParser(exp);

			expect({
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
			}).toEqual(res);
		});

		describe('Operator precedence', () => {
			it('Pure multiply behaves as expected', () => {
				const exp = '5*10*20';
				const res = expressionParser(exp);

				expect({
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
				}).toEqual(res);
			});

			it('Pure divide behaves as expected', () => {
				const exp = '5/10/20';
				const res = expressionParser(exp);

				expect({
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
				}).toEqual(res);
			});

			it('Parens groups expressions', () => {
				const exp = '5*(10*20)';
				const res = expressionParser(exp);

				expect({
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
				}).toEqual(res);
			});

			it('Plus operator precedence mixed with multiply', () => {
				const exp = '5+10*20';
				const res = expressionParser(exp);

				expect({
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
				}).toEqual(res);
			});

			it('Plus operator precedence mixed with divide', () => {
				const exp = '5+10/20';
				const res = expressionParser(exp);

				expect({
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
				}).toEqual(res);
			});

			it('Minus operator precedence mixed with multiply', () => {
				const exp = '5-10*20';
				const res = expressionParser(exp);

				expect({
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
				}).toEqual(res);
			});

			it('Minus operator precedence mixed with divide', () => {
				const exp = '5-10/20';
				const res = expressionParser(exp);

				expect({
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
				}).toEqual(res);
			});

			it('Unary minus operator precedence', () => {
				const exp = '-5 * -(10 - -20)';
				const res = expressionParser(exp);

				expect({
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
				}).toEqual(res);
			});

			describe('Fail cases', () => {
				it('Should reject unary plus', () => {
					const exp = '+10';
					expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
+10
^
Expecting 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER', got 'PLUS'"
`);
				});

				it('Should reject unmatched parens', () => {
					const exp = '(20+10';
					expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
(20+10
------^
Expecting 'PLUS', 'MINUS', 'DIVIDE', 'MULTIPLY', 'CLOSE_PAREN', got 'EOF'"
`);
				});

				it('Should reject trailing binary plus op without rhs operand', () => {
					const exp = '20+';
					expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
20+
---^
Expecting 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER', got 'EOF'"
`);
				});

				it('Should reject trailing binary minus op without rhs operand', () => {
					const exp = '20-';
					expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
20-
---^
Expecting 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER', got 'EOF'"
`);
				});

				it('Should reject trailing binary multiply op without rhs operand', () => {
					const exp = '20*';
					expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
20*
---^
Expecting 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER', got 'EOF'"
`);
				});

				it('Should reject trailing binary divide op without rhs operand', () => {
					const exp = '20/';
					expect(() => expressionParser(exp)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
20/
---^
Expecting 'MINUS', 'NUMBER', 'STRING_LITERAL', 'OPEN_PAREN', 'VARIABLE', 'IDENTIFIER', got 'EOF'"
`);
				});
			});
		});
	});
});

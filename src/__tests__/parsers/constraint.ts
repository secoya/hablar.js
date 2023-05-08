import constraintParser from '../../parsers/constraint';

describe('Constraint parser', () => {
	describe('Numeric constraints', () => {
		it('Should parse simple numeric greater than constraint', () => {
			const constraint = 'n>5';
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '>',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 3,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 3,
							lastLine: 1,
						},
						type: 'number',
						value: 5,
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple numeric greater than or equals constraint', () => {
			const constraint = 'n>=5';
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '>=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 3,
							firstLine: 1,
							lastColumn: 4,
							lastLine: 1,
						},
						type: 'number',
						value: 5,
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple numeric less than constraint', () => {
			const constraint = 'n<10';
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '<',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 4,
							lastLine: 1,
						},
						type: 'number',
						value: 10,
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple numeric less than or equals constraint', () => {
			const constraint = 'n<=10';
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '<=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 3,
							firstLine: 1,
							lastColumn: 5,
							lastLine: 1,
						},
						type: 'number',
						value: 10,
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple numeric equals constraint', () => {
			const constraint = 'n=10';
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 4,
							lastLine: 1,
						},
						type: 'number',
						value: 10,
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple numeric not-equals constraint', () => {
			const constraint = 'n!=10';
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '!=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 3,
							firstLine: 1,
							lastColumn: 5,
							lastLine: 1,
						},
						type: 'number',
						value: 10,
					},
				},
			]).toEqual(parsed.nodes);
		});

		describe('Floats', () => {
			it('Should parse floating point number', () => {
				const constraint = 'n=10.24';
				const parsed = constraintParser(constraint);

				expect(constraint).toEqual(parsed.input);
				expect([
					{
						lhs: {
							name: 'n',
							pos: {
								firstColumn: 0,
								firstLine: 1,
								lastColumn: 1,
								lastLine: 1,
							},
							type: 'identifier',
						},
						op: '=',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 7,
							lastLine: 1,
						},
						rhs: {
							pos: {
								firstColumn: 2,
								firstLine: 1,
								lastColumn: 7,
								lastLine: 1,
							},
							type: 'number',
							value: 10.24,
						},
					},
				]).toEqual(parsed.nodes);
			});
			describe('Fail cases', () => {
				it('Should reject floating point number in scientific notation', () => {
					const constraint = 'n=10.24e10';
					expect(() => constraintParser(constraint)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
n=10.24e10
----^
Expecting 'EOF', 'COMMA', got 'INVALID'"
`);
				});
			});
		});

		describe('Fail cases', () => {
			it('Should reject numbers with space separators', () => {
				const constraint = 'n=10 000';
				expect(() => constraintParser(constraint)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
n=10 000
-----^
Expecting 'EOF', 'COMMA', got 'NUMBER'"
`);
			});
			it('Should reject numbers with space comma separators', () => {
				const constraint = 'n=10,000';
				expect(() => constraintParser(constraint)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
n=10,000
-----^
Expecting 'IDENTIFIER', 'IGNORE', got 'NUMBER'"
`);
			});
		});
	});

	describe('Gender values', () => {
		it('Should parse simple gender femina equals constraint', () => {
			const constraint = "n='F'";
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 5,
							lastLine: 1,
						},
						type: 'gender',
						value: 'F',
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple gender maskulin equals constraint', () => {
			const constraint = "n='M'";
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 5,
							lastLine: 1,
						},
						type: 'gender',
						value: 'M',
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple gender neutral equals constraint', () => {
			const constraint = "n='N'";
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 2,
							firstLine: 1,
							lastColumn: 5,
							lastLine: 1,
						},
						type: 'gender',
						value: 'N',
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple gender not-equals constraint', () => {
			const constraint = "n != 'M'";

			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '!=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 8,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 5,
							firstLine: 1,
							lastColumn: 8,
							lastLine: 1,
						},
						type: 'gender',
						value: 'M',
					},
				},
			]).toEqual(parsed.nodes);
		});

		describe('Fail cases', () => {
			it('Should should reject non gender constraint', () => {
				const constraint = "n='K'";
				expect(() => constraintParser(constraint)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
n='K'
--^
Expecting 'GENDER_FEMINUM', 'GENDER_MASKULINUM', 'GENDER_NEUTRUM', 'ENUM_STRING', 'NUMBER', got 'INVALID'"
`);
			});

			it('Should throw parse error when comparing inequalities to gender strings', () => {
				expect(() => constraintParser("n > 'F'")).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
n > 'F'
----^
Expecting 'NUMBER', got 'GENDER_FEMINUM'"
`);
			});
		});
	});

	describe('String enums', () => {
		it('Should parse simple string-enum equals constraint', () => {
			const constraint = 'n = "some-string"';

			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 17,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 4,
							firstLine: 1,
							lastColumn: 17,
							lastLine: 1,
						},
						type: 'enum',
						value: 'some-string',
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse simple string-enum not-equals constraint', () => {
			const constraint = 'n != "some-string"';

			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '!=',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 18,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 5,
							firstLine: 1,
							lastColumn: 18,
							lastLine: 1,
						},
						type: 'enum',
						value: 'some-string',
					},
				},
			]).toEqual(parsed.nodes);
		});

		describe('Fail cases', () => {
			it('Should reject invalid string-enum', () => {
				const constraint = 'n != "some string"';
				expect(() => constraintParser(constraint)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
n != \"some string\"
-----^
Expecting 'GENDER_FEMINUM', 'GENDER_MASKULINUM', 'GENDER_NEUTRUM', 'ENUM_STRING', 'NUMBER', got 'INVALID'"
`);
			});

			it('Should throw parse error when comparing inequalities to strings', () => {
				expect(() => constraintParser('n > "Mystring"')).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
n > \"Mystring\"
----^
Expecting 'NUMBER', got 'ENUM_STRING'"
`);
			});
		});
	});

	describe('Space sensitivity', () => {
		it('Should parse simple constraint ignoring whitespace', () => {
			const constraint = `n
			>
			5`;
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '>',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 4,
						lastLine: 3,
					},
					rhs: {
						pos: {
							firstColumn: 3,
							firstLine: 3,
							lastColumn: 4,
							lastLine: 3,
						},
						type: 'number',
						value: 5,
					},
				},
			]).toEqual(parsed.nodes);
		});
	});

	describe('Multiple constraints', () => {
		it('Should parse multiple constraints', () => {
			const constraint = 'n > 5, n < 2';
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '>',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 4,
							firstLine: 1,
							lastColumn: 5,
							lastLine: 1,
						},
						type: 'number',
						value: 5,
					},
				},
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 7,
							firstLine: 1,
							lastColumn: 8,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '<',
					pos: {
						firstColumn: 7,
						firstLine: 1,
						lastColumn: 12,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 11,
							firstLine: 1,
							lastColumn: 12,
							lastLine: 1,
						},
						type: 'number',
						value: 2,
					},
				},
			]).toEqual(parsed.nodes);
		});

		it('Should parse multiple constraints with multiple variables', () => {
			const constraint = 'n > 5, i < 2';
			const parsed = constraintParser(constraint);

			expect(constraint).toEqual(parsed.input);
			expect([
				{
					lhs: {
						name: 'n',
						pos: {
							firstColumn: 0,
							firstLine: 1,
							lastColumn: 1,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '>',
					pos: {
						firstColumn: 0,
						firstLine: 1,
						lastColumn: 5,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 4,
							firstLine: 1,
							lastColumn: 5,
							lastLine: 1,
						},
						type: 'number',
						value: 5,
					},
				},
				{
					lhs: {
						name: 'i',
						pos: {
							firstColumn: 7,
							firstLine: 1,
							lastColumn: 8,
							lastLine: 1,
						},
						type: 'identifier',
					},
					op: '<',
					pos: {
						firstColumn: 7,
						firstLine: 1,
						lastColumn: 12,
						lastLine: 1,
					},
					rhs: {
						pos: {
							firstColumn: 11,
							firstLine: 1,
							lastColumn: 12,
							lastLine: 1,
						},
						type: 'number',
						value: 2,
					},
				},
			]).toEqual(parsed.nodes);
		});

		describe('Fail cases', () => {
			it('Should reject dangling comma in constraints list', () => {
				const constraint = 'n > 5, i < 2,';

				expect(() => constraintParser(constraint)).toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
n > 5, i < 2,
-------------^
Expecting 'IDENTIFIER', 'IGNORE', got 'EOF'"
`);
			});
		});
	});
});

import {assert} from 'chai';
import 'mocha';

import ParseError from '../../src/errors/parse_error';
import constraintParser from '../../src/parsers/constraint';

describe('Constraint parser', function() {
	describe('Numeric constraints', function() {
		it('Should parse simple numeric greater than constraint', function() {
			const constraint = 'n>5';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple numeric greater than or equals constraint', function() {
			const constraint = 'n>=5';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple numeric less than constraint', function() {
			const constraint = 'n<10';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple numeric less than or equals constraint', function() {
			const constraint = 'n<=10';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple numeric equals constraint', function() {
			const constraint = 'n=10';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple numeric not-equals constraint', function() {
			const constraint = 'n!=10';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		describe('Floats', function() {
			it('Should parse floating point number', function() {
				const constraint = 'n=10.24';
				const parsed = constraintParser(constraint);

				assert.equal(constraint, parsed.input);
				assert.deepEqual(
					[
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
					],
					parsed.nodes,
				);
			});
			describe('Fail cases', function() {
				it('Should reject floating point number in scientific notation', function() {
					const constraint = 'n=10.24e10';
					assert.throws(() => constraintParser(constraint), ParseError);
				});
			});
		});

		describe('Fail cases', function() {
			it('Should reject numbers with space separators', function() {
				const constraint = 'n=10 000';
				assert.throws(() => constraintParser(constraint), ParseError);
			});
			it('Should reject numbers with space comma separators', function() {
				const constraint = 'n=10,000';
				assert.throws(() => constraintParser(constraint), ParseError);
			});
		});
	});

	describe('Gender values', function() {
		it('Should parse simple gender femina equals constraint', function() {
			const constraint = 'n=\'F\'';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple gender maskulin equals constraint', function() {
			const constraint = 'n=\'M\'';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple gender neutral equals constraint', function() {
			const constraint = 'n=\'N\'';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple gender not-equals constraint', function() {
			const constraint = 'n != \'M\'';

			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		describe('Fail cases', function() {
			it('Should should reject non gender constraint', function() {
				const constraint = 'n=\'K\'';
				assert.throws(() => constraintParser(constraint), ParseError);
			});

			it('Should throw parse error when comparing inequalities to gender strings', function() {
				assert.throws(() => constraintParser('n > \'F\''), ParseError);
			});
		});
	});

	describe('String enums', function() {
		it('Should parse simple string-enum equals constraint', function() {
			const constraint = 'n = "some-string"';

			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse simple string-enum not-equals constraint', function() {
			const constraint = 'n != "some-string"';

			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		describe('Fail cases', function() {
			it('Should reject invalid string-enum', function() {
				const constraint = 'n != "some string"';
				assert.throws(() => constraintParser(constraint), ParseError);
			});

			it('Should throw parse error when comparing inequalities to strings', function() {
				assert.throws(() => constraintParser('n > "Mystring"'), ParseError);
			});
		});
	});

	describe('Space sensitivity', function() {
		it('Should parse simple constraint ignoring whitespace', function() {
			const constraint = `n
			>
			5`;
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});
	});

	describe('Multiple constraints', function() {
		it('Should parse multiple constraints', function() {
			const constraint = 'n > 5, n < 2';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		it('Should parse multiple constraints with multiple variables', function() {
			const constraint = 'n > 5, i < 2';
			const parsed = constraintParser(constraint);

			assert.equal(constraint, parsed.input);
			assert.deepEqual(
				[
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
				],
				parsed.nodes,
			);
		});

		describe('Fail cases', function() {
			it('Should reject dangling comma in constraints list', function() {
				const constraint = 'n > 5, i < 2,';

				assert.throws(() => constraintParser(constraint), ParseError);
			});
		});
	});
});

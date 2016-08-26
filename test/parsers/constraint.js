/**
 * @flow
 * eslint-env mocha,node
 */
import {assert} from 'chai';

import constraintParser from '../../src/parsers/constraint';
import ParseError from '../../src/errors/parse_error';

describe('Constraint parser', function() {
	describe('Numeric constraints', function() {
		it('Should parse simple numeric greater than constraint', function() {
			const constraint = 'n>5';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '>',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
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
							lastColumn: 3,
						},
					},
				],
				parsed
			);
		});

		it('Should parse simple numeric greater than or equals constraint', function() {
			const constraint = 'n>=5';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '>=',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 1,
								firstColumn: 3,
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
				],
				parsed
			);
		});

		it('Should parse simple numeric less than constraint', function() {
			const constraint = 'n<10';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '<',
						lhs: {
							type: 'identifier',
							name: 'n',
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
				],
				parsed
			);
		});

		it('Should parse simple numeric less than or equals constraint', function() {
			const constraint = 'n<=10';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '<=',
						lhs: {
							type: 'identifier',
							name: 'n',
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
								firstColumn: 3,
								lastLine: 1,
								lastColumn: 5,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 5,
						},
					},
				],
				parsed
			);
		});

		it('Should parse simple numeric equals constraint', function() {
			const constraint = 'n=10';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '=',
						lhs: {
							type: 'identifier',
							name: 'n',
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
				],
				parsed
			);
		});

		it('Should parse simple numeric not-equals constraint', function() {
			const constraint = 'n!=10';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '!=',
						lhs: {
							type: 'identifier',
							name: 'n',
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
								firstColumn: 3,
								lastLine: 1,
								lastColumn: 5,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 5,
						},
					},
				],
				parsed
			);
		});

		describe('Floats', function() {
			it('Should parse floating point number', function() {
				const constraint = 'n=10.24';
				const parsed = constraintParser(constraint);

				assert.deepEqual(
					[
						{
							op: '=',
							lhs: {
								type: 'identifier',
								name: 'n',
								pos: {
									firstLine: 1,
									firstColumn: 0,
									lastLine: 1,
									lastColumn: 1,
								},
							},
							rhs: {
								type: 'number',
								value: 10.24,
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
					],
					parsed
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

			assert.deepEqual(
				[
					{
						op: '=',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'gender',
							value: 'F',
							pos: {
								firstLine: 1,
								firstColumn: 2,
								lastLine: 1,
								lastColumn: 5,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 5,
						},
					},
				],
				parsed
			);
		});

		it('Should parse simple gender maskulin equals constraint', function() {
			const constraint = 'n=\'M\'';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '=',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'gender',
							value: 'M',
							pos: {
								firstLine: 1,
								firstColumn: 2,
								lastLine: 1,
								lastColumn: 5,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 5,
						},
					},
				],
				parsed
			);
		});

		it('Should parse simple gender neutral equals constraint', function() {
			const constraint = 'n=\'N\'';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '=',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'gender',
							value: 'N',
							pos: {
								firstLine: 1,
								firstColumn: 2,
								lastLine: 1,
								lastColumn: 5,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 5,
						},
					},
				],
				parsed
			);
		});

		it('Should parse simple gender not-equals constraint', function() {
			const constraint = 'n != \'M\'';

			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '!=',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'gender',
							value: 'M',
							pos: {
								firstLine: 1,
								firstColumn: 5,
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
				],
				parsed
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

			assert.deepEqual(
				[
					{
						op: '=',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'enum',
							value: 'some-string',
							pos: {
								firstLine: 1,
								firstColumn: 4,
								lastLine: 1,
								lastColumn: 17,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 17,
						},
					},
				],
				parsed
			);
		});

		it('Should parse simple string-enum not-equals constraint', function() {
			const constraint = 'n != "some-string"';

			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '!=',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'enum',
							value: 'some-string',
							pos: {
								firstLine: 1,
								firstColumn: 5,
								lastLine: 1,
								lastColumn: 18,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 18,
						},
					},
				],
				parsed
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

			assert.deepEqual(
				[
					{
						op: '>',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 3,
								firstColumn: 3,
								lastLine: 3,
								lastColumn: 4,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 3,
							lastColumn: 4,
						},
					},
				],
				parsed
			);
		});
	});

	describe('Multiple constraints', function() {
		it('Should parse multiple constraints', function() {
			const constraint = 'n > 5, n < 2';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '>',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 1,
								firstColumn: 4,
								lastLine: 1,
								lastColumn: 5,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 5,
						},
					},
					{
						op: '<',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 7,
								lastLine: 1,
								lastColumn: 8,
							},
						},
						rhs: {
							type: 'number',
							value: 2,
							pos: {
								firstLine: 1,
								firstColumn: 11,
								lastLine: 1,
								lastColumn: 12,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 7,
							lastLine: 1,
							lastColumn: 12,
						},
					},
				],
				parsed
			);
		});

		it('Should parse multiple constraints with multiple variables', function() {
			const constraint = 'n > 5, i < 2';
			const parsed = constraintParser(constraint);

			assert.deepEqual(
				[
					{
						op: '>',
						lhs: {
							type: 'identifier',
							name: 'n',
							pos: {
								firstLine: 1,
								firstColumn: 0,
								lastLine: 1,
								lastColumn: 1,
							},
						},
						rhs: {
							type: 'number',
							value: 5,
							pos: {
								firstLine: 1,
								firstColumn: 4,
								lastLine: 1,
								lastColumn: 5,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 0,
							lastLine: 1,
							lastColumn: 5,
						},
					},
					{
						op: '<',
						lhs: {
							type: 'identifier',
							name: 'i',
							pos: {
								firstLine: 1,
								firstColumn: 7,
								lastLine: 1,
								lastColumn: 8,
							},
						},
						rhs: {
							type: 'number',
							value: 2,
							pos: {
								firstLine: 1,
								firstColumn: 11,
								lastLine: 1,
								lastColumn: 12,
							},
						},
						pos: {
							firstLine: 1,
							firstColumn: 7,
							lastLine: 1,
							lastColumn: 12,
						},
					},
				],
				parsed
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

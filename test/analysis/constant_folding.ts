import {assert} from 'chai';
import 'mocha';

import {
	constantFoldExpression,
	constantFoldExpressionList,
} from '../../src/analysis/constant_folding';

import {
	Pos,
	TypedBinaryOpNode,
	TypedFunctionInvocationNode,
	TypedNode,
	TypedNumberNode,
	TypedStringLiteralNode,
	TypedUnaryMinusNode,
	TypedVariableNode,
} from '../../src/trees/expression';
import {
	TypedExprNode as TypedTextExprNode,
	TypedLiteralNode as TypedTextLiteralNode,
	TypedVariableNode as TypedTextVariableNode,
} from '../../src/trees/text';

import {
	InferredType,
} from '../../src/type_map';

const makeEmptyPos = () => ({
	firstColumn: 0,
	firstLine: 1,
	lastColumn: 0,
	lastLine: 1,
});

function s(str: string, pos?: Pos): TypedStringLiteralNode {
	return {
		exprNodeType: 'string_literal',
		exprType: 'string',
		isConstant: true,
		pos: pos == null ? makeEmptyPos() : pos,
		typed: true,
		value: str,
	};
}

function n(num: number, pos?: Pos): TypedNumberNode {
	return {
		exprNodeType: 'number',
		exprType: 'number',
		isConstant: true,
		pos: pos == null ? makeEmptyPos() : pos,
		typed: true,
		value: num,
	};
}

function um(node: TypedNode, exprType: 'number' | 'string' = 'number', pos?: Pos): TypedUnaryMinusNode {
	return {
		exprNodeType: 'unary_minus',
		exprType: exprType,
		isConstant: node.isConstant,
		op: node,
		pos: pos == null ? makeEmptyPos() : pos,
		typed: true,
	};
}

function b(
	type: InferredType,
	op: 'plus' | 'minus' | 'multiply' | 'divide',
	lhs: TypedNode,
	rhs: TypedNode,
	pos?: Pos
): TypedBinaryOpNode {
	return {
		binaryOp: op,
		exprNodeType: 'binary_op',
		exprType: type,
		isConstant: lhs.isConstant && rhs.isConstant,
		lhs: lhs,
		pos: pos == null ? makeEmptyPos() : pos,
		rhs: rhs,
		typed: true,
	};
}

function v(
	type: InferredType,
	name: string,
	pos?: Pos
): TypedVariableNode {
	return {
		exprNodeType: 'variable',
		exprType: type,
		isConstant: false,
		name: name,
		pos: pos == null ? makeEmptyPos() : pos,
		typed: true,
	};
}

function f(
	name: string,
	args: TypedNode[],
	pos?: Pos
): TypedFunctionInvocationNode {
	return {
		exprNodeType: 'function_invocation',
		exprType: 'string',
		isConstant: false,
		name: name,
		parameters: args,
		pos: pos == null ? makeEmptyPos() : pos,
		typed: true,
	};
}

function tn(str: string): TypedTextLiteralNode {
	return {
		pos: makeEmptyPos(),
		textNodeType: 'literal',
		textType: 'string',
		typed: true,
		value: str,
	};
}

function vn(name: string, type: InferredType): TypedTextVariableNode {
	return {
		pos: makeEmptyPos(),
		textNodeType: 'variable',
		textType: type,
		typed: true,
		value: name,
	};
}

function en(exp: TypedNode): TypedTextExprNode {
	return {
		pos: makeEmptyPos(),
		textNodeType: 'expr',
		textType: exp.exprType,
		typed: true,
		value: exp,
	};
}

describe('Constant folding', function() {
	describe('Number', function() {
		it('Constant folds 10 to itself', function() {
			const numberNode = n(10);

			const folded = constantFoldExpression(numberNode);
			assert.equal(numberNode, folded);
		});

		it('Constant folds -5 to itself', function() {
			const numberNode = n(-5);

			const folded = constantFoldExpression(numberNode);
			assert.equal(numberNode, folded);
		});
	});

	describe('Number', function() {
		it('Constant empty string to itself', function() {
			const stringNode = s('');

			const folded = constantFoldExpression(stringNode);
			assert.equal(stringNode, folded);
		});

		it('Constant folds "hello" to itself', function() {
			const stringNode = s('hello');

			const folded = constantFoldExpression(stringNode);
			assert.equal(stringNode, folded);
		});
	});

	describe('Unary Minus', function() {
		it('Can constant fold a simple unary minus number node', function() {
			const numberNode = n(10);

			const unaryMinusNode = um(numberNode);

			const folded = constantFoldExpression(unaryMinusNode);

			assert.deepEqual(n(-10), folded);
			assert.equal(unaryMinusNode.pos, folded.pos);
		});

		it('Can constant fold a simple unary minus number node with negative starting number', function() {
			const numberNode = n(-100);

			const unaryMinusNode = um(numberNode);

			const folded = constantFoldExpression(unaryMinusNode);

			assert.deepEqual(n(100), folded);
			assert.equal(unaryMinusNode.pos, folded.pos);
		});

		it('Errors on unary minus with a string', function() {
			const stringNode = s('hello');

			const unaryMinusNode = um(stringNode);

			assert.throws(() => constantFoldExpression(unaryMinusNode));
		});

		it('Does not constant fold -var', function() {
			const varNode = v('number', 'var');

			const unaryMinus = um(varNode);

			const folded = constantFoldExpression(unaryMinus);

			assert.deepEqual(unaryMinus, folded);
			assert.equal(unaryMinus.pos, folded.pos);
		});
	});

	describe('Binary op - plus', function() {
		it('Can concat two strings', function() {
			const lhs = s('Hello ');
			const rhs = s('world');

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			assert.deepEqual(s('Hello world'), folded);
			assert.equal(concatNode.pos, folded.pos);
		});

		it('Accepts string and variable', function() {
			const lhs = s('Hello ');
			const rhs = v('string', 'world');

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			assert.deepEqual(concatNode, folded);
			assert.equal(concatNode.pos, folded.pos);
		});

		it('Accepts variable and variable', function() {
			const lhs = v('string', 'hello');
			const rhs = v('string', 'world');

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			assert.deepEqual(concatNode, folded);
			assert.equal(concatNode.pos, folded.pos);
		});

		it('Can concat string and number', function() {
			const lhs = s('5');
			const rhs = n(10);

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			assert.deepEqual(s('510'), folded);
			assert.equal(concatNode.pos, folded.pos);
		});

		it('Can concat number and string', function() {
			const lhs = n(10);
			const rhs = s(' hello');

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			assert.deepEqual(s('10 hello'), folded);
			assert.equal(concatNode.pos, folded.pos);
		});

		it('Can add two numbers', function() {
			const lhs = n(10);
			const rhs = n(5);

			const additionNode = b('number', 'plus', lhs, rhs);

			const folded = constantFoldExpression(additionNode);

			assert.deepEqual(n(15), folded);
			assert.equal(additionNode.pos, folded.pos);
		});
	});

	describe('Binary op minus', function() {
		it('Cannot minus two strings', function() {
			const lhs = s('Hello ');
			const rhs = s('world');

			const minusNode = b('string', 'minus', lhs, rhs);

			assert.throws(() => constantFoldExpression(minusNode));
		});

		it('Cannot minus string and number', function() {
			const lhs = s('5');
			const rhs = n(10);

			const minusNode = b('string', 'minus', lhs, rhs);

			assert.throws(() => constantFoldExpression(minusNode));
		});

		it('Cannot minus number and string', function() {
			const lhs = n(10);
			const rhs = s(' hello');

			const minusNode = b('string', 'minus', lhs, rhs);

			assert.throws(() => constantFoldExpression(minusNode));
		});

		it('Can minus two numbers', function() {
			const lhs = n(10);
			const rhs = n(5);

			const minusNode = b('number', 'minus', lhs, rhs);

			const folded = constantFoldExpression(minusNode);

			assert.deepEqual(n(5), folded);
			assert.equal(minusNode.pos, folded.pos);
		});

		it('Accepts number and varaible', function() {
			const lhs = n(10);
			const rhs = v('number', 'var');

			const minusNode = b('number', 'minus', lhs, rhs);

			const folded = constantFoldExpression(minusNode);

			assert.deepEqual(minusNode, folded);
			assert.equal(minusNode.pos, folded.pos);
		});

		it('Accepts variable and varaible', function() {
			const lhs = v('number', 'var1');
			const rhs = v('number', 'var2');

			const minusNode = b('number', 'minus', lhs, rhs);

			const folded = constantFoldExpression(minusNode);

			assert.deepEqual(minusNode, folded);
			assert.equal(minusNode.pos, folded.pos);
		});
	});

	describe('Binary op multiply', function() {
		it('Cannot multiply two strings', function() {
			const lhs = s('Hello ');
			const rhs = s('world');

			const multiplyNode = b('string', 'multiply', lhs, rhs);

			assert.throws(() => constantFoldExpression(multiplyNode));
		});

		it('Cannot multiply string and number', function() {
			const lhs = s('5');
			const rhs = n(10);

			const multiplyNode = b('string', 'multiply', lhs, rhs);

			assert.throws(() => constantFoldExpression(multiplyNode));
		});

		it('Cannot multiply number and string', function() {
			const lhs = n(10);
			const rhs = s(' hello');

			const multiplyNode = b('string', 'multiply', lhs, rhs);

			assert.throws(() => constantFoldExpression(multiplyNode));
		});

		it('Can multiply two numbers', function() {
			const lhs = n(10);
			const rhs = n(5);

			const multiplyNode = b('number', 'multiply', lhs, rhs);

			const folded = constantFoldExpression(multiplyNode);

			assert.deepEqual(n(50), folded);
			assert.equal(multiplyNode.pos, folded.pos);
		});

		it('Folds var*number*number', function() {
			const varNode = v('number', 'var', {
				firstColumn: 0,
				firstLine: 1,
				lastColumn: 3,
				lastLine: 1,
			});
			const numberNode = n(5, {
				firstColumn: 5,
				firstLine: 1,
				lastColumn: 6,
				lastLine: 1,
			});
			const number2 = n(10, {
				firstColumn: 7,
				firstLine: 1,
				lastColumn: 9,
				lastLine: 1,
			});

			const lhs = b('number', 'multiply', varNode, numberNode, {
				firstColumn: 0,
				firstLine: 1,
				lastColumn: 6,
				lastLine: 1,
			});
			const node = b('number', 'multiply', lhs, number2, {
				firstColumn: 0,
				firstLine: 1,
				lastColumn: 9,
				lastLine: 1,
			});

			const folded = constantFoldExpression(node);
			const expected = b('number', 'multiply', varNode, n(50, {
				firstColumn: 5,
				firstLine: 1,
				lastColumn: 9,
				lastLine: 1,
			}), {
				firstColumn: 0,
				firstLine: 1,
				lastColumn: 9,
				lastLine: 1,
			});

			assert.deepEqual(expected, folded);
		});
	});

	describe('Binary op divide', function() {
		it('Cannot divide two strings', function() {
			const lhs = s('Hello ');
			const rhs = s('world');

			const divideNode = b('string', 'divide', lhs, rhs);

			assert.throws(() => constantFoldExpression(divideNode));
		});

		it('Cannot divide string and number', function() {
			const lhs = s('5');
			const rhs = n(10);

			const divideNode = b('string', 'divide', lhs, rhs);

			assert.throws(() => constantFoldExpression(divideNode));
		});

		it('Cannot divide number and string', function() {
			const lhs = n(10);
			const rhs = s(' hello');

			const divideNode = b('string', 'divide', lhs, rhs);

			assert.throws(() => constantFoldExpression(divideNode));
		});

		it('Can divide two numbers', function() {
			const lhs = n(10);
			const rhs = n(5);

			const divideNode = b('number', 'divide', lhs, rhs);

			const folded = constantFoldExpression(divideNode);

			assert.deepEqual(n(2), folded);
			assert.equal(divideNode.pos, folded.pos);
		});
	});

	describe('Functions', function() {
		it('Does not constant fold a function call', function() {
			const functionNode = f('someFunction', []);

			const folded = constantFoldExpression(functionNode);

			assert.deepEqual(functionNode, folded);
			assert.equal(functionNode.pos, folded.pos);
		});

		it('Does fold arguments', function() {
			const functionNode = f('someFunction', [um(n(10))]);

			const folded = constantFoldExpression(functionNode);

			const expectedFolded = f('someFunction', [n(-10)]);
			assert.deepEqual(expectedFolded, folded);
			assert.equal(functionNode.pos, folded.pos);
		});
	});

	describe('Full text constant folding', function() {
		it('Can constant fold some stuff', function() {
			const text = tn('Some text: ');
			const varNode = vn('var', 'string');
			const expNode = en(b(
				'string',
				'plus',
				s('Hello '),
				s('world')
			));
			const text2 = tn('!');

			const folded = constantFoldExpressionList([text, varNode, expNode, text2]);

			assert.deepEqual([
				tn('Some text: '),
				vn('var', 'string'),
				tn('Hello world!'),
			], folded);
		});

		it('Can constant fold a complete constant expression', function() {
			const text = tn('Some text: ');
			const expNode = en(b(
				'string',
				'plus',
				s('Hello '),
				s('world')
			));
			const text2 = tn('!');

			const folded = constantFoldExpressionList([text, expNode, text2]);

			assert.deepEqual([
				tn('Some text: Hello world!'),
			], folded);
		});
	});
});

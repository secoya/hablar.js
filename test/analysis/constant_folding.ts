import { constantFoldExpression, constantFoldExpressionList } from '../../src/analysis/constant_folding';

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

import { InferredType } from '../../src/type_map';

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
	pos?: Pos,
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

function v(type: InferredType, name: string, pos?: Pos): TypedVariableNode {
	return {
		exprNodeType: 'variable',
		exprType: type,
		isConstant: false,
		name: name,
		pos: pos == null ? makeEmptyPos() : pos,
		typed: true,
	};
}

function f(name: string, args: TypedNode[], pos?: Pos): TypedFunctionInvocationNode {
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

describe('Constant folding', () => {
	describe('Number', () => {
		it('Constant folds 10 to itself', () => {
			const numberNode = n(10);

			const folded = constantFoldExpression(numberNode);
			expect(numberNode).toEqual(folded);
		});

		it('Constant folds -5 to itself', () => {
			const numberNode = n(-5);

			const folded = constantFoldExpression(numberNode);
			expect(numberNode).toEqual(folded);
		});
	});

	describe('Number', () => {
		it('Constant empty string to itself', () => {
			const stringNode = s('');

			const folded = constantFoldExpression(stringNode);
			expect(stringNode).toEqual(folded);
		});

		it('Constant folds "hello" to itself', () => {
			const stringNode = s('hello');

			const folded = constantFoldExpression(stringNode);
			expect(stringNode).toEqual(folded);
		});
	});

	describe('Unary Minus', () => {
		it('Can constant fold a simple unary minus number node', () => {
			const numberNode = n(10);

			const unaryMinusNode = um(numberNode);

			const folded = constantFoldExpression(unaryMinusNode);

			expect(n(-10)).toEqual(folded);
			expect(unaryMinusNode.pos).toEqual(folded.pos);
		});

		it('Can constant fold a simple unary minus number node with negative starting number', () => {
			const numberNode = n(-100);

			const unaryMinusNode = um(numberNode);

			const folded = constantFoldExpression(unaryMinusNode);

			expect(n(100)).toEqual(folded);
			expect(unaryMinusNode.pos).toEqual(folded.pos);
		});

		it('Errors on unary minus with a string', () => {
			const stringNode = s('hello');

			const unaryMinusNode = um(stringNode);

			expect(() => constantFoldExpression(unaryMinusNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Unary minus with a string. It is only allowed on numbers."`,
			);
		});

		it('Does not constant fold -var', () => {
			const varNode = v('number', 'var');

			const unaryMinus = um(varNode);

			const folded = constantFoldExpression(unaryMinus);

			expect(unaryMinus).toEqual(folded);
			expect(unaryMinus.pos).toEqual(folded.pos);
		});
	});

	describe('Binary op - plus', () => {
		it('Can concat two strings', () => {
			const lhs = s('Hello ');
			const rhs = s('world');

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			expect(s('Hello world')).toEqual(folded);
			expect(concatNode.pos).toEqual(folded.pos);
		});

		it('Accepts string and variable', () => {
			const lhs = s('Hello ');
			const rhs = v('string', 'world');

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			expect(concatNode).toEqual(folded);
			expect(concatNode.pos).toEqual(folded.pos);
		});

		it('Accepts variable and variable', () => {
			const lhs = v('string', 'hello');
			const rhs = v('string', 'world');

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			expect(concatNode).toEqual(folded);
			expect(concatNode.pos).toEqual(folded.pos);
		});

		it('Can concat string and number', () => {
			const lhs = s('5');
			const rhs = n(10);

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			expect(s('510')).toEqual(folded);
			expect(concatNode.pos).toEqual(folded.pos);
		});

		it('Can concat number and string', () => {
			const lhs = n(10);
			const rhs = s(' hello');

			const concatNode = b('string', 'plus', lhs, rhs);

			const folded = constantFoldExpression(concatNode);

			expect(s('10 hello')).toEqual(folded);
			expect(concatNode.pos).toEqual(folded.pos);
		});

		it('Can add two numbers', () => {
			const lhs = n(10);
			const rhs = n(5);

			const additionNode = b('number', 'plus', lhs, rhs);

			const folded = constantFoldExpression(additionNode);

			expect(n(15)).toEqual(folded);
			expect(additionNode.pos).toEqual(folded.pos);
		});
	});

	describe('Binary op minus', () => {
		it('Cannot minus two strings', () => {
			const lhs = s('Hello ');
			const rhs = s('world');

			const minusNode = b('string', 'minus', lhs, rhs);

			expect(() => constantFoldExpression(minusNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Minus operation between string and string. Only allowed between 2 numbers."`,
			);
		});

		it('Cannot minus string and number', () => {
			const lhs = s('5');
			const rhs = n(10);

			const minusNode = b('string', 'minus', lhs, rhs);

			expect(() => constantFoldExpression(minusNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Minus operation between string and number. Only allowed between 2 numbers."`,
			);
		});

		it('Cannot minus number and string', () => {
			const lhs = n(10);
			const rhs = s(' hello');

			const minusNode = b('string', 'minus', lhs, rhs);

			expect(() => constantFoldExpression(minusNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Minus operation between number and string. Only allowed between 2 numbers."`,
			);
		});

		it('Can minus two numbers', () => {
			const lhs = n(10);
			const rhs = n(5);

			const minusNode = b('number', 'minus', lhs, rhs);

			const folded = constantFoldExpression(minusNode);

			expect(n(5)).toEqual(folded);
			expect(minusNode.pos).toEqual(folded.pos);
		});

		it('Accepts number and varaible', () => {
			const lhs = n(10);
			const rhs = v('number', 'var');

			const minusNode = b('number', 'minus', lhs, rhs);

			const folded = constantFoldExpression(minusNode);

			expect(minusNode).toEqual(folded);
			expect(minusNode.pos).toEqual(folded.pos);
		});

		it('Accepts variable and varaible', () => {
			const lhs = v('number', 'var1');
			const rhs = v('number', 'var2');

			const minusNode = b('number', 'minus', lhs, rhs);

			const folded = constantFoldExpression(minusNode);

			expect(minusNode).toEqual(folded);
			expect(minusNode.pos).toEqual(folded.pos);
		});
	});

	describe('Binary op multiply', () => {
		it('Cannot multiply two strings', () => {
			const lhs = s('Hello ');
			const rhs = s('world');

			const multiplyNode = b('string', 'multiply', lhs, rhs);

			expect(() => constantFoldExpression(multiplyNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Multiply operation between string and string. Only allowed between 2 numbers."`,
			);
		});

		it('Cannot multiply string and number', () => {
			const lhs = s('5');
			const rhs = n(10);

			const multiplyNode = b('string', 'multiply', lhs, rhs);

			expect(() => constantFoldExpression(multiplyNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Multiply operation between string and number. Only allowed between 2 numbers."`,
			);
		});

		it('Cannot multiply number and string', () => {
			const lhs = n(10);
			const rhs = s(' hello');

			const multiplyNode = b('string', 'multiply', lhs, rhs);

			expect(() => constantFoldExpression(multiplyNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Multiply operation between number and string. Only allowed between 2 numbers."`,
			);
		});

		it('Can multiply two numbers', () => {
			const lhs = n(10);
			const rhs = n(5);

			const multiplyNode = b('number', 'multiply', lhs, rhs);

			const folded = constantFoldExpression(multiplyNode);

			expect(n(50)).toEqual(folded);
			expect(multiplyNode.pos).toEqual(folded.pos);
		});

		it('Folds var*number*number', () => {
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
			const expected = b(
				'number',
				'multiply',
				varNode,
				n(50, {
					firstColumn: 5,
					firstLine: 1,
					lastColumn: 9,
					lastLine: 1,
				}),
				{
					firstColumn: 0,
					firstLine: 1,
					lastColumn: 9,
					lastLine: 1,
				},
			);

			expect(folded).toEqual(expected);
		});
	});

	describe('Binary op divide', () => {
		it('Cannot divide two strings', () => {
			const lhs = s('Hello ');
			const rhs = s('world');

			const divideNode = b('string', 'divide', lhs, rhs);

			expect(() => constantFoldExpression(divideNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Divide operation between string and string. Only allowed between 2 numbers."`,
			);
		});

		it('Cannot divide string and number', () => {
			const lhs = s('5');
			const rhs = n(10);

			const divideNode = b('string', 'divide', lhs, rhs);

			expect(() => constantFoldExpression(divideNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Divide operation between string and number. Only allowed between 2 numbers."`,
			);
		});

		it('Cannot divide number and string', () => {
			const lhs = n(10);
			const rhs = s(' hello');

			const divideNode = b('string', 'divide', lhs, rhs);

			expect(() => constantFoldExpression(divideNode)).toThrowErrorMatchingInlineSnapshot(
				`"Could not constant fold expression. Divide operation between number and string. Only allowed between 2 numbers."`,
			);
		});

		it('Can divide two numbers', () => {
			const lhs = n(10);
			const rhs = n(5);

			const divideNode = b('number', 'divide', lhs, rhs);

			const folded = constantFoldExpression(divideNode);

			expect(n(2)).toEqual(folded);
			expect(divideNode.pos).toEqual(folded.pos);
		});
	});

	describe('Functions', () => {
		it('Does not constant fold a function call', () => {
			const functionNode = f('someFunction', []);

			const folded = constantFoldExpression(functionNode);

			expect(functionNode).toEqual(folded);
			expect(functionNode.pos).toEqual(folded.pos);
		});

		it('Does fold arguments', () => {
			const functionNode = f('someFunction', [um(n(10))]);

			const folded = constantFoldExpression(functionNode);

			const expectedFolded = f('someFunction', [n(-10)]);
			expect(expectedFolded).toEqual(folded);
			expect(functionNode.pos).toEqual(folded.pos);
		});
	});

	describe('Full text constant folding', () => {
		it('Can constant fold some stuff', () => {
			const text = tn('Some text: ');
			const varNode = vn('var', 'string');
			const expNode = en(b('string', 'plus', s('Hello '), s('world')));
			const text2 = tn('!');

			const folded = constantFoldExpressionList({
				input: 'Some text: $var{{"Hello"+"world"}}!',
				nodes: [text, varNode, expNode, text2],
			});

			expect('Some text: $var{{"Hello"+"world"}}!').toEqual(folded.input);
			expect([tn('Some text: '), vn('var', 'string'), tn('Hello world!')]).toEqual(folded.nodes);
		});

		it('Can constant fold a complete constant expression', () => {
			const text = tn('Some text: ');
			const expNode = en(b('string', 'plus', s('Hello '), s('world')));
			const text2 = tn('!');

			const folded = constantFoldExpressionList({
				input: 'Some text: {{"Hello "+"world"}}!',
				nodes: [text, expNode, text2],
			});

			expect([tn('Some text: Hello world!')]).toEqual(folded.nodes);
		});

		// Regression: https://github.com/secoya/hablar.js/issues/1
		it('Can constant fold simple text + interpolation', () => {
			const nodes = [tn('Svar til '), en(v('string', 'name')), tn("'s pulse")];
			const nodesClone = JSON.parse(JSON.stringify(nodes));

			const folded = constantFoldExpressionList({
				input: "Svar til {{$name}}'s pulse",
				nodes: nodesClone,
			});

			expect(folded.nodes).toEqual(nodes);
		});
	});
});

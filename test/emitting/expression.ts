import {assert} from 'chai';
import 'mocha';

import {prettyPrint} from 'recast';

import Context from '../../src/emitting/context';
import {emitExpression} from '../../src/emitting/expression';
import {
	TypedBinaryOpNode,
	TypedFunctionInvocationNode,
	TypedNode,
	TypedNumberNode,
	TypedStringLiteralNode,
	TypedVariableNode,
} from '../../src/trees/expression';
import {
	InferredType,
} from '../../src/type_map';

const makeEmptyPos = () => ({
	firstColumn: 0,
	firstLine: 1,
	lastColumn: 0,
	lastLine: 1,
});

function s(str: string): TypedStringLiteralNode {
	return {
		exprNodeType: 'string_literal',
		exprType: 'string',
		isConstant: true,
		pos: makeEmptyPos(),
		typed: true,
		value: str,
	};
}

function n(num: number): TypedNumberNode {
	return {
		exprNodeType: 'number',
		exprType: 'number',
		isConstant: true,
		pos: makeEmptyPos(),
		typed: true,
		value: num,
	};
}

function b(
	type: InferredType,
	op: 'plus' | 'minus' | 'multiply' | 'divide',
	lhs: TypedNode,
	rhs: TypedNode
): TypedBinaryOpNode {
	return {
		binaryOp: op,
		exprNodeType: 'binary_op',
		exprType: type,
		isConstant: lhs.isConstant && rhs.isConstant,
		lhs: lhs,
		pos: makeEmptyPos(),
		rhs: rhs,
		typed: true,
	};
}

function v(
	type: InferredType,
	name: string
): TypedVariableNode {
	return {
		exprNodeType: 'variable',
		exprType: type,
		isConstant: false,
		name: name,
		pos: makeEmptyPos(),
		typed: true,
	};
}

function f(
	name: string,
	args: TypedNode[]
): TypedFunctionInvocationNode {
	return {
		exprNodeType: 'function_invocation',
		exprType: 'string',
		isConstant: false,
		name: name,
		parameters: args,
		pos: makeEmptyPos(),
		typed: true,
	};
}

describe('Emitting - Expressions', function() {
	it('Should emit simple string literal', function() {
		const n = s('string');
		const ctx = new Context();

		const res = prettyPrint(emitExpression(n, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('"string"', res.code);
	});

	it('Should emit simple number literal', function() {
		const node = n(10);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('10', res.code);
	});

	it('Should emit simple binary op', function() {
		const node = b('number', 'plus', n(5), n(10));
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('5 + 10', res.code);
	});

	it('Should group nested binary ops properly', function() {
		const node = b(
			'number',
			'plus',
			n(5),
			b(
				'number',
				'multiply',
				n(10),
				n(5)
			)
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('5 + 10 * 5', res.code);
	});

	it('Should group nested binary ops properly - and add needed parens', function() {
		const node = b(
			'number',
			'multiply',
			n(5),
			b(
				'number',
				'plus',
				n(10),
				n(5)
			)
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('5 * (10 + 5)', res.code);
	});

	it('Should emit simple variable expression correct', function() {
		const node = v(
			'string',
			'myVarName'
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('vars.myVarName', res.code);
	});

	// Note: This test verifies that no weird thing is attempted
	// to resolve invalid JS identifiers. We disallow them in the grammar
	// so it should be *ok*
	it('Should emit simple variable expressions with weird names as incorrect javascript', function() {
		const node = v(
			'string',
			'myVar-Name'
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('vars.myVar-Name', res.code);
	});

	it('Should emit helper function call on binary plus when variable string involved', function() {
		const node = b(
			'number-or-string',
			'plus',
			n(5),
			v('number-or-string', 'myVar')
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isTrue(ctx.usesPlusOp);
		assert.equal('plusOp(5, vars.myVar)', res.code);
	});

	it('Should not emit helper function call on plus when expr type is number', function() {
		const node = b(
			'number',
			'plus',
			n(5),
			v('number', 'myVar')
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('5 + vars.myVar', res.code);
	});

	it('Should emit method call on function call', function() {
		const node = f(
			'myFn',
			[]
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('fns.myFn(ctx)', res.code);
	});

	it('Should emit method call on function call - single parameter', function() {
		const node = f(
			'myFn',
			[n(10)]
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('fns.myFn(ctx, 10)', res.code);
	});

	it('Should emit method call on function call - two parameters', function() {
		const node = f(
			'myFn',
			[n(10), s('stuff')]
		);
		const ctx = new Context();

		const res = prettyPrint(emitExpression(node, ctx));

		assert.isFalse(ctx.usesPlusOp);
		assert.equal('fns.myFn(ctx, 10, "stuff")', res.code);
	});
});

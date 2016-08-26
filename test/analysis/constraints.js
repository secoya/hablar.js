/**
 * @flow
 */

import {assert} from 'chai';

import {
	analyzeConstraints,
} from '../../src/analysis/constraints';

import DeadCodeError from '../../src/errors/dead_code_error';

import type {
	Node as ConstraintNode,
} from '../../src/trees/constraint';

import type {
	TypedNode as TypedTextNode,
} from '../../src/trees/text';

const makeEmptyPos = () => ({
	firstLine: 1,
	firstColumn: 0,
	lastLine: 1,
	lastColumn: 0,
});

function returnNode(v?: string = 'var') : ConstraintNode {
	return {
		op: '!',
		operand: {
			type: 'identifier',
			pos: makeEmptyPos(),
			name: v,
		},
		pos: makeEmptyPos(),
	};
}

function tn(str: string) : TypedTextNode {
	return {
		textNodeType: 'literal',
		textType: 'string',
		pos: makeEmptyPos(),
		typed: true,
		value: str,
	};
}

function noReturnNode(v?: string = 'var') : ConstraintNode {
	return {
		op: '=',
		lhs: {
			type: 'identifier',
			pos: makeEmptyPos(),
			name: v,
		},
		rhs: {
			type: 'number',
			value: 5,
			pos: makeEmptyPos(),
		},
		pos: makeEmptyPos(),
	};
}

function makeTranslation(constraints: ConstraintNode[] | ConstraintNode, text: string) : {
	constraints: ConstraintNode[],
	translation: TypedTextNode[],
} {
	return {
		constraints: Array.isArray(constraints) ? constraints : [constraints],
		translation: [tn(text)],
	};
}

// We many more tests here. But this is simple stuff to verify
// that it works.
describe('Constraints analyzer', function() {
	describe('Dead code', function() {
		it('It detects a simple dead code', function() {
			const ret = makeTranslation(returnNode(), 'Return node');
			const noRet = makeTranslation(noReturnNode(), 'No return node');

			assert.throws(() => analyzeConstraints([ret, noRet]), DeadCodeError);
		});

		it('It does not detects a simple non dead code', function() {
			const ret = makeTranslation(returnNode(), 'Return node');
			const noRet = makeTranslation(noReturnNode(), 'No return node');

			assert.doesNotThrow(() => analyzeConstraints([noRet, ret]), DeadCodeError);
		});
	});
});

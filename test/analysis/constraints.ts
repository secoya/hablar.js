import {assert} from 'chai';
import 'mocha';

import {
	analyzeConstraints,
} from '../../src/analysis/constraints';

import DeadCodeError from '../../src/errors/dead_code_error';

import {
	ASTRoot as ConstraintAST,
	Node as ConstraintNode,
} from '../../src/trees/constraint';

import {
	TypedASTRoot as TypedTextASTRoot,
	TypedNode as TypedTextNode,
} from '../../src/trees/text';

const makeEmptyPos = () => ({
	firstColumn: 0,
	firstLine: 1,
	lastColumn: 0,
	lastLine: 1,
});

function returnNode(v: string = 'var'): ConstraintNode {
	return {
		op: '!',
		operand: {
			name: v,
			pos: makeEmptyPos(),
			type: 'identifier',
		},
		pos: makeEmptyPos(),
	};
}

function tn(str: string): TypedTextNode {
	return {
		pos: makeEmptyPos(),
		textNodeType: 'literal',
		textType: 'string',
		typed: true,
		value: str,
	};
}

function noReturnNode(v: string = 'var'): ConstraintNode {
	return {
		lhs: {
			name: v,
			pos: makeEmptyPos(),
			type: 'identifier',
		},
		op: '=',
		pos: makeEmptyPos(),
		rhs: {
			pos: makeEmptyPos(),
			type: 'number',
			value: 5,
		},
	};
}

function makeTranslation(constraints: ConstraintNode[] | ConstraintNode, text: string): {
	constraints: ConstraintAST,
	translation: TypedTextASTRoot,
} {
	return {
		constraints: {
			input: '',
			nodes: Array.isArray(constraints) ? constraints : [constraints],
		},
		translation: {
			input: text,
			nodes: [tn(text)],
		},
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

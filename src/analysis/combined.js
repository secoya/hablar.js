/**
 * @flow
 */

import type {
	Node,
	TypedNode,
} from '../trees/text';

import type {
	Node as ConstraintNode,
} from '../trees/constraint';

import TypeMap from '../type_map';

import {
	inferTextTypes,
	inferConstraintTypes,
	makeTypedExpressionList,
} from './type_inference';

import {
	constantFoldExpressionList,
} from './constant_folding';

export type SimpleTranslation = Node[];
// $FlowFixMe: Flow is not happy that we use unions between two types that have no relations
export type ConstraintTranslation = {
	constraints: ConstraintNode[],
	translation: Node[],
}[];

export type SimpleTypedTranslation = TypedNode[];
export type TypedConstraintTranslation = Array<{
	constraints: ConstraintNode[],
	translation: TypedNode[]
}>;

export type Translation = SimpleTranslation | ConstraintTranslation;

export type TypedTranslation = SimpleTypedTranslation | TypedConstraintTranslation;

function workWithTranslation<TSimple, TConstraint>(
	translation: Translation,
	callbackSimple: (translation: SimpleTranslation) => TSimple,
	callbackConstraint: (translation: ConstraintTranslation) => TConstraint
) : TSimple | TConstraint {
	if (translation.length === 0) {
		return callbackSimple([]);
	}
	if (translation[0].textNodeType !== undefined) {
		const nodes : SimpleTranslation = translation;
		return callbackSimple(nodes);
	} else {
		const constraintTranslation : ConstraintTranslation = translation;
		return callbackConstraint(constraintTranslation);
	}
}

export function typeInferTranslation(
	translation: Translation,
	map: TypeMap
) : void {
	workWithTranslation(
		translation,
		(tr) => inferTextTypes(map, tr),
		(translation) => {
			for (const tr of translation) {
				inferConstraintTypes(map, tr.constraints);
				inferTextTypes(map, tr.translation, tr.constraints);
			}
		}
	);
}

export function analyzeOnlyTranslation(
	translation: Translation,
	map: TypeMap
) : TypedTranslation {
	return workWithTranslation(
		translation,
		(tr) : SimpleTypedTranslation => analyzeOnlySimpleTranslation(tr, map),
		(tr) => analyzeOnlyConstraintTranslation(tr, map)
	);
}

export function analyzeTranslation(
	translation: Translation,
	map: TypeMap
) : TypedTranslation {
	typeInferTranslation(translation, map);
	map.freeze();

	return analyzeOnlyTranslation(translation, map);
}

export function analyzeOnlySimpleTranslation(
	translation: SimpleTranslation,
	map: TypeMap
) : SimpleTypedTranslation {
	const res = makeTypedExpressionList(map, translation);

	if (res.errors.length > 0) {
		throw new Error('Some type error');
	}

	return constantFoldExpressionList(res.translation);
}

export function analyzeOnlyConstraintTranslation(
	translations: ConstraintTranslation,
	map: TypeMap
) : TypedConstraintTranslation {
	const res = [];
	let errors = [];

	for (const translation of translations) {
		const typed = makeTypedExpressionList(map, translation.translation);

		if (typed.errors.length > 0) {
			errors = errors.concat(typed.errors);
		}

		res.push({
			constraints: translation.constraints,
			translation: typed.translation,
		});
	}

	if (errors.length > 0) {
		if (errors.length === 1) {
			throw errors[0];
		}
		throw new Error(JSON.stringify(errors));
	}

	for (const tr of res) {
		tr.translation = constantFoldExpressionList(tr.translation);
	}

	return res;
}

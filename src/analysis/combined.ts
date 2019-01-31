import { ASTRoot as ConstraintAST } from '../trees/constraint';
import { ASTRoot, TypedASTRoot } from '../trees/text';
import TypeMap from '../type_map';
import { ensureAllVariablesAndFunctionsAreAllowed } from './allowed_symbols';
import { constantFoldExpressionList } from './constant_folding';
import { inferConstraintTypes, inferTextTypes, makeTypedExpressionList } from './type_inference';

export type SimpleTranslation = ASTRoot;
// $FlowFixMe: Flow is not happy that we use unions between two types that have no relations
export type ConstraintTranslation = {
	constraints: ConstraintAST;
	translation: ASTRoot;
}[];

export type SimpleTypedTranslation = TypedASTRoot;
export type TypedConstraintTranslation = Array<{
	constraints: ConstraintAST;
	translation: TypedASTRoot;
}>;

export type Translation = SimpleTranslation | ConstraintTranslation;

export type TypedTranslation = SimpleTypedTranslation | TypedConstraintTranslation;

function workWithTranslation<TSimple, TConstraint>(
	translation: Translation,
	callbackSimple: (translation: SimpleTranslation) => TSimple,
	callbackConstraint: (translation: ConstraintTranslation) => TConstraint,
): TSimple | TConstraint {
	const simple = translation as SimpleTranslation;
	const constraint = translation as ConstraintTranslation;
	if (!Array.isArray(constraint)) {
		return callbackSimple(simple);
	} else {
		return callbackConstraint(constraint);
	}
}

export function typeInferTranslation(translation: Translation, map: TypeMap): void {
	workWithTranslation(
		translation,
		tr => inferTextTypes(map, tr),
		tr => {
			for (const trans of tr) {
				inferConstraintTypes(map, trans.constraints, trans.translation);
				inferTextTypes(map, trans.translation, trans.constraints);
			}
		},
	);
}

export function analyzeOnlyTranslation(
	translation: Translation,
	map: TypeMap,
	allowedVariables: string[] | null = null,
	allowedFunctions: string[] | null = null,
): TypedTranslation {
	return workWithTranslation(
		translation,
		(tr): SimpleTypedTranslation => analyzeOnlySimpleTranslation(tr, map, allowedVariables, allowedFunctions),
		tr => analyzeOnlyConstraintTranslation(tr, map, allowedVariables, allowedFunctions),
	);
}

export function analyzeTranslation(
	translation: Translation,
	map: TypeMap,
	allowedVariables: string[] | null = null,
	allowedFunctions: string[] | null = null,
): TypedTranslation {
	typeInferTranslation(translation, map);
	map.freeze();

	return analyzeOnlyTranslation(translation, map, allowedVariables, allowedFunctions);
}

export function analyzeTranslations(
	translations: Translation[],
	map: TypeMap,
	allowedVariables: string[] | null = null,
	allowedFunctions: string[] | null = null,
): TypedTranslation[] {
	for (const translation of translations) {
		typeInferTranslation(translation, map);
	}
	map.freeze();

	return translations.map(translation =>
		analyzeOnlyTranslation(translation, map, allowedVariables, allowedFunctions),
	);
}

export function analyzeOnlySimpleTranslation(
	translation: SimpleTranslation,
	map: TypeMap,
	allowedVariables: string[] | null = null,
	allowedFunctions: string[] | null = null,
): SimpleTypedTranslation {
	const res = makeTypedExpressionList(map, translation);

	if (allowedVariables != null || allowedFunctions != null) {
		ensureAllVariablesAndFunctionsAreAllowed(res, null, allowedVariables, allowedFunctions);
	}

	return constantFoldExpressionList(res);
}

export function analyzeOnlyConstraintTranslation(
	translations: ConstraintTranslation,
	map: TypeMap,
	allowedVariables: string[] | null = null,
	allowedFunctions: string[] | null = null,
): TypedConstraintTranslation {
	const res: TypedConstraintTranslation = [];

	for (const translation of translations) {
		const typed = makeTypedExpressionList(map, translation.translation);

		if (allowedVariables != null || allowedFunctions != null) {
			ensureAllVariablesAndFunctionsAreAllowed(
				typed,
				translation.constraints,
				allowedVariables,
				allowedFunctions,
			);
		}

		res.push({
			constraints: translation.constraints,
			translation: typed,
		});
	}

	for (const tr of res) {
		tr.translation = constantFoldExpressionList(tr.translation);
	}

	return res;
}

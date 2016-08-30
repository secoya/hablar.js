/**
 * @flow
 */

import type {Expression, Identifier} from 'ast-types';
import {types} from 'recast';

const b = types.builders;

export default class Context {
	usesPlusOp: bool = false;
	usesTypeGuardScratchVariable: bool = false;
	typeGuardScratchVarExpr: Identifier = b.identifier('_');
	functionsExpr: Identifier = b.identifier('fns');
	varsExpr: Identifier = b.identifier('vars');
	plusOpExpr: Expression = b.identifier('plusOp');
	ctxExpr: Identifier = b.identifier('ctx');
	encodeIfStringExpr: Expression = b.identifier('encodeIfString');
}

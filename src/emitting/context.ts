import T from 'ast-types';
import * as ASTTypes from 'ast-types/gen/kinds';

const b = T.builders;

export default class Context {
	public ctxExpr: ASTTypes.IdentifierKind = b.identifier('ctx');
	public encodeIfStringExpr: ASTTypes.IdentifierKind = b.identifier('encodeIfString');
	public functionsExpr: ASTTypes.IdentifierKind = b.identifier('fns');
	public plusOpExpr: ASTTypes.IdentifierKind = b.identifier('plusOp');
	public typeGuardScratchVarExpr: ASTTypes.IdentifierKind = b.identifier('_');
	public usesTypeGuardScratchVariable: boolean = false;
	public varsExpr: ASTTypes.IdentifierKind = b.identifier('vars');
}

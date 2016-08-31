import {builders as b} from 'ast-types';

export default class Context {
	public ctxExpr: ASTTypes.Identifier = b.identifier('ctx');
	public encodeIfStringExpr: ASTTypes.Expression = b.identifier('encodeIfString');
	public functionsExpr: ASTTypes.Identifier = b.identifier('fns');
	public plusOpExpr: ASTTypes.Expression = b.identifier('plusOp');
	public typeGuardScratchVarExpr: ASTTypes.Identifier = b.identifier('_');
	public usesPlusOp: boolean = false;
	public usesTypeGuardScratchVariable: boolean = false;
	public varsExpr: ASTTypes.Identifier = b.identifier('vars');
}

import { builders as b } from 'ast-types';
import * as ASTTypes from 'ast-types/gen/kinds';
import { ASTRoot as ConstraintAST } from '../trees/constraint';
import { TypedNode as ExprNode } from '../trees/expression';
import { TypedASTRoot } from '../trees/text';
import TypeMap from '../type_map';
import { emitConstrainedTranslation } from './constraint';
import Context from './context';
import { emitExpression } from './expression';
import { getTypeGuardStatements } from './type_guards';

function encodeIfString(exp: ASTTypes.ExpressionKind, ctx: Context): ASTTypes.ExpressionKind {
	return b.callExpression(ctx.encodeIfStringExpr, [ctx.ctxExpr, exp]);
}

function encodeString(exp: ASTTypes.ExpressionKind, ctx: Context): ASTTypes.ExpressionKind {
	return b.callExpression(b.memberExpression(ctx.ctxExpr, b.identifier('encode'), false), [exp]);
}

export function emitNodeListExpression(ast: TypedASTRoot, ctx: Context): ASTTypes.ExpressionKind {
	const exprs: Array<{
		type: 'string' | 'number';
		exp: ASTTypes.ExpressionKind;
		isConstant: boolean;
	}> = [];

	for (const node of ast.nodes) {
		const textNodeType = node.textNodeType;
		switch (node.textNodeType) {
			case 'literal':
				exprs.push({
					exp: b.literal(node.value),
					isConstant: true,
					type: 'string',
				});
				break;
			case 'variable': {
				const varExp = b.memberExpression(ctx.varsExpr, b.identifier(node.value), false);

				exprs.push({
					exp: varExp,
					isConstant: false,
					type: node.textType === 'number' ? 'number' : 'string',
				});
				break;
			}
			case 'expr': {
				const exp = (node.value as any) as ExprNode;
				const varExp = emitExpression(exp, ctx);

				exprs.push({
					exp: varExp,
					isConstant: false,
					type: exp.exprType === 'number' ? 'number' : 'string',
				});
				break;
			}
			default:
				throw new Error('Unknown node type: ' + textNodeType);
		}
	}

	const encodeGroup = (group: ASTTypes.ExpressionKind): ASTTypes.ExpressionKind => {
		return encodeString(group, ctx);
	};

	const encodedExprGroups: ASTTypes.ExpressionKind[] = [];
	let currentGroup: ASTTypes.ExpressionKind | null = null;
	for (const expr of exprs) {
		if (currentGroup == null) {
			if (expr.type === 'number') {
				currentGroup = b.binaryExpression('+', b.literal(''), expr.exp);
			} else if (expr.isConstant) {
				currentGroup = expr.exp;
			} else {
				encodedExprGroups.push(encodeIfString(expr.exp, ctx));
			}
			continue;
		}

		if (expr.isConstant || expr.type === 'number') {
			currentGroup = b.binaryExpression('+', currentGroup, expr.exp);
		} else {
			encodedExprGroups.push(encodeGroup(currentGroup));
			currentGroup = null;
			encodedExprGroups.push(encodeIfString(expr.exp, ctx));
		}
	}

	if (currentGroup != null) {
		encodedExprGroups.push(encodeGroup(currentGroup));
	}

	const init = b.literal('');

	return encodedExprGroups.reduce((acc, e) => {
		if (acc === init) {
			return e;
		}

		return b.binaryExpression('+', acc, e);
	}, init);
}

function getTypeGuards(ctx: Context, typeMap: TypeMap): ASTTypes.StatementKind[] {
	const usesTypeGuardScratchVariable = ctx.usesTypeGuardScratchVariable;
	ctx.usesTypeGuardScratchVariable = false;
	const statements: ASTTypes.StatementKind[] = getTypeGuardStatements(typeMap, ctx);

	if (ctx.usesTypeGuardScratchVariable) {
		statements.splice(
			0,
			0,
			b.variableDeclaration('var', [b.variableDeclarator(ctx.typeGuardScratchVarExpr, null)]),
		);
	}
	ctx.usesTypeGuardScratchVariable = usesTypeGuardScratchVariable;

	return statements;
}

export function emitConstrainedTranslations(
	translations: ConstraintTranslation,
	ctx: Context,
	typeMap: TypeMap,
): ASTTypes.ExpressionKind {
	if (translations.length === 0) {
		throw new Error('No constraints found');
	}

	const statements: ASTTypes.StatementKind[] = getTypeGuards(ctx, typeMap);

	let unconditionallyReturned = false;
	for (const translation of translations) {
		const expr = emitNodeListExpression(translation.translation, ctx);

		const stmt = emitConstrainedTranslation(translation.constraints, expr, ctx);

		if (stmt.type === 'ReturnStatement') {
			unconditionallyReturned = true;
		}

		statements.push(stmt);
	}

	if (!unconditionallyReturned) {
		statements.push(
			b.throwStatement(
				b.newExpression(b.identifier('Error'), [b.literal('No translation matched the parameters')]),
			),
		);
	}

	return b.functionExpression(null, [ctx.varsExpr, ctx.functionsExpr, ctx.ctxExpr], b.blockStatement(statements));
}

export function emitSimpleTranslation(ast: TypedASTRoot, ctx: Context, typeMap: TypeMap): ASTTypes.ExpressionKind {
	const first = ast.nodes[0];
	// Constant translations are just emitted as their Constant
	// translation
	if (ast.nodes.length === 1 && first.textNodeType === 'literal') {
		return b.literal(first.value);
	}

	const statements = getTypeGuards(ctx, typeMap);

	// Emit the body of the translation
	const expr = emitNodeListExpression(ast, ctx);

	statements.push(b.returnStatement(expr));

	return b.functionExpression(null, [ctx.varsExpr, ctx.functionsExpr, ctx.ctxExpr], b.blockStatement(statements));
}

export type SimpleTranslation = TypedASTRoot;
// $FlowFixMe: Flow cannot deal with this union
export type ConstraintTranslation = Array<{
	constraints: ConstraintAST;
	translation: TypedASTRoot;
}>;

export type Translation = SimpleTranslation | ConstraintTranslation;

export function emitTranslation(translation: Translation, ctx: Context, typeMap: TypeMap): ASTTypes.ExpressionKind {
	const simple = translation as SimpleTranslation;
	if (typeof simple.input === 'string') {
		return emitSimpleTranslation(simple, ctx, typeMap);
	} else {
		return emitConstrainedTranslations(translation as ConstraintTranslation, ctx, typeMap);
	}
}

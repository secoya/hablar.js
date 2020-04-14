import { builders as b } from 'ast-types';
import * as ASTTypes from 'ast-types/gen/kinds';
import Context from './context';

export function encodeIfStringFunction(ctx: Context): ASTTypes.FunctionDeclarationKind {
	const strVar = b.identifier('str');
	return b.functionDeclaration(
		ctx.encodeIfStringExpr,
		[ctx.ctxExpr, strVar],
		b.blockStatement([
			b.ifStatement(
				b.unaryExpression(
					'!',
					b.callExpression(b.memberExpression(ctx.ctxExpr, b.identifier('isSafeString'), false), [strVar]),
					true,
				),
				b.blockStatement([
					b.returnStatement(
						b.callExpression(b.memberExpression(ctx.ctxExpr, b.identifier('encode'), false), [
							b.binaryExpression('+', b.literal(''), strVar),
						]),
					),
				]),
			),
			b.returnStatement(
				b.callExpression(b.memberExpression(ctx.ctxExpr, b.identifier('convertSafeString'), false), [strVar]),
			),
		]),
	);
}

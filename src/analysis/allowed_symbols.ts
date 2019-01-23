import { walkTypedNode } from '../parsers/expression';
import { ASTRoot as ConstraintAST } from '../trees/constraint';
import { TypedNode as TypedExprNode } from '../trees/expression';
import { TypedASTRoot } from '../trees/text';

import UnknownFunctionError from '../errors/unknown_function_error';
import UnknownVariableError from '../errors/unknown_variable_error';

export function ensureAllVariablesAndFunctionsAreAllowed(
	ast: TypedASTRoot,
	constraintAST: ConstraintAST | null,
	allowedVariables: string[] | null,
	allowedFunctions: string[] | null,
): void {
	const allowedVars = allowedVariables != null ? new Set<string>(allowedVariables) : null;
	const allowedFuns = allowedFunctions != null ? new Set<string>(allowedFunctions) : null;
	for (const textNode of ast.nodes) {
		switch (textNode.textNodeType) {
			case 'variable':
				if (allowedVars != null && !allowedVars.has(textNode.value)) {
					throw new UnknownVariableError(textNode, Array.from(allowedVars.values()), ast, constraintAST);
				}
				break;
			case 'expr':
				{
					const expr: TypedExprNode = (textNode.value as any) as TypedExprNode;
					walkTypedNode(expr, node => {
						switch (node.exprNodeType) {
							case 'variable':
								if (allowedVars != null && !allowedVars.has(node.name)) {
									throw new UnknownVariableError(
										node,
										Array.from(allowedVars.values()),
										ast,
										constraintAST,
									);
								}
								break;
							case 'function_invocation':
								if (allowedFuns != null && !allowedFuns.has(node.name)) {
									throw new UnknownFunctionError(
										node,
										Array.from(allowedFuns.values()),
										ast,
										constraintAST,
									);
								}
								break;
							default: // We don't care about the remaining node types
						}
					});
				}
				break;
			default: // We don't care about the string literals, they cannot contain functions or variables
		}
	}
}

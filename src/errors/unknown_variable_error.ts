import {
	ASTRoot as ConstraintAST,
} from '../trees/constraint';
import {
	TypedVariableNode as ExprVarNode,
} from '../trees/expression';
import {
	TypedASTRoot,
	TypedVariableNode as TextVarNode,
} from '../trees/text';
import {
	showErrorLocation,
} from './util';

export default class UnknownVariableError extends Error {
	public variable: string;
	public allowedVariables: string[];
	public line: number;
	public column: number;
	public input: string;
	public constraints: string | null;

	public constructor(
		node: ExprVarNode | TextVarNode,
		allowedVariables: string[],
		ast: TypedASTRoot,
		constraints: ConstraintAST | null = null,
	) {
		let varName: string;
		if ((node as ExprVarNode).exprNodeType === 'variable') {
			varName = (node as ExprVarNode).name;
		} else {
			varName = (node as TextVarNode).value;
		}

		super(
			`Unknown variable \$${varName} used on line ${node.pos.firstLine}:\n` +
			showErrorLocation(
				ast.input,
				`Variable \$${varName} is not known to this translation. ` +
				`Known variables are: ${allowedVariables.map((e) => '$' + e).join(', ')}`,
				node.pos.firstLine,
				node.pos.firstColumn,
			)
		);

		this.variable = varName;
		this.allowedVariables = allowedVariables;
		this.line = node.pos.firstLine;
		this.column = node.pos.firstColumn;
		this.input = ast.input;
		this.constraints = constraints != null ? constraints.input : null;
	}
}
UnknownVariableError.prototype.name = 'UnknownVariableError';

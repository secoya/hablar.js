import {
	ASTRoot as ConstraintAST,
} from '../trees/constraint';
import {
	TypedFunctionInvocationNode,
} from '../trees/expression';
import {
	TypedASTRoot,
} from '../trees/text';
import {
	showErrorLocation,
} from './util';

export default class UnknownFunctionError extends Error {
	public functionName: string;
	public allowedFunctions: string[];
	public line: number;
	public column: number;
	public input: string;
	public constraints: string | null;

	public constructor(
		node: TypedFunctionInvocationNode,
		allowedFunctions: string[],
		ast: TypedASTRoot,
		constraints: ConstraintAST | null = null,
	) {
		const functionName = node.name;
		const errMessage = '' +
			`Unknown function ${functionName} used on line ${node.pos.firstLine}:\n` +
			showErrorLocation(
				ast.input,
				`Function ${functionName} is not known to this translation. ` +
				`Known functions are: ${allowedFunctions.join(', ')}`,
				node.pos.firstLine,
				node.pos.firstColumn - 1,
			);
		super(
			errMessage
		);
		this.message = errMessage;
		this.functionName = functionName;
		this.allowedFunctions = allowedFunctions;
		this.line = node.pos.firstLine;
		this.column = node.pos.firstColumn;
		this.input = ast.input;
		this.constraints = constraints != null ? constraints.input : null;
	}
}
UnknownFunctionError.prototype.name = 'UnknownFunctionError';

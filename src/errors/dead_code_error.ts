import { ASTRoot as ConstraintAST } from '../trees/constraint';
import { TypedASTRoot as TextAST } from '../trees/text';

export default class DeadCodeError extends Error {
	public message: string;
	public constructor(
		message: string,
		translations: Array<{
			constraints: ConstraintAST;
			translation: TextAST;
		}>,
		deadTranslation: {
			constraints: ConstraintAST;
			translation: TextAST;
		},
	) {
		super(message);
		Object.setPrototypeOf(this, DeadCodeError.prototype);
	}
}
DeadCodeError.prototype.name = 'DeadCodeError';

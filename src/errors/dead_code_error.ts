import {
	Node as ConstraintNode,
} from '../trees/constraint';
import {
	TypedNode as TextNode,
} from '../trees/text';

export default class DeadCodeError extends Error {
	public message: string;
	public constructor(
		message: string,
		translations: Array<{
			constraints: ConstraintNode[],
			translation: TextNode[],
		}>,
		deadTranslation: {
			constraints: ConstraintNode[],
			translation: TextNode[],
		}
	) {
		super(message);
	}
}
DeadCodeError.prototype.name = 'DeadCodeError';

/**
 * @flow
 */

import type {
	Node as ConstraintNode,
} from '../trees/constraint';

import type {
	TypedNode as TextNode,
} from '../trees/text';

export default function DeadCodeError(
	message: string,
	translations: Array<{
		constraints: ConstraintNode[],
		translation: TextNode[],
	}>,
	deadTranslation: {
		constraints: ConstraintNode[],
		translation: TextNode[],
	}
) : DeadCodeError {
	// $FlowFixMe I cannot get ES6 subclasses to work.
	Error.call(this, message);
	Error.captureStackTrace(this, DeadCodeError);
	this.message = message;
	return this;
}

DeadCodeError.prototype = Object.create(Error.prototype);
DeadCodeError.prototype.name = 'DeadCodeError'; // eslint-disable-line no-extend-native

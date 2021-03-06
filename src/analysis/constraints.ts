import { ASTRoot } from '../trees/constraint';
import { TypedASTRoot as TextTypedASTRoot } from '../trees/text';

import DeadCodeError from '../errors/dead_code_error';

function isDefiniteReturn(ast: ASTRoot) {
	for (const node of ast.nodes) {
		if (node.op !== '!') {
			return false;
		}
	}

	return true;
}

/**
 * For now, this just reports cases where some constraint nodes are dead.
 * Due to a previous constraint always being true.
 *
 * In the future, I would love for this to do more analysis and determine
 * cases like these as dead:
 *
 * n = 5: $n is 5
 * n != 5: $n is not 5
 * n = 3: This is dead
 *
 * But this is much more complicated with more values than one. However,
 * it is more than possible.
 */
export function analyzeConstraints(
	translations: Array<{
		constraints: ASTRoot;
		translation: TextTypedASTRoot;
	}>,
): void {
	let definiteReturn = false;
	for (const translation of translations) {
		if (isDefiniteReturn(translation.constraints)) {
			definiteReturn = true;
			continue;
		}

		if (definiteReturn) {
			throw new DeadCodeError('Dead code', translations, translation);
		}
	}
}

/**
 * @flow
 */

import type {Node} from '../trees/constraint';
import getParser from './get_parser';

const constraintParser = getParser('constraint');

export default function parse(input: string) : {
	constraints: Node[],
	variables: string[]
} {
	const parsed = constraintParser.parse(input);
	const variables = new Map();

	for (const constraint of parsed) {
		variables.set(constraint.lhs.name, true);
	}

	return {
		constraints: parsed,
		variables: Array.from(variables.keys()),
	};
}

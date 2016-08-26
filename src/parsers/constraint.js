/**
 * @flow
 */

import type {Node} from '../trees/constraint';
import getParser from './get_parser';

const constraintParser = getParser('constraint');

export default function parse(input: string) : Node[] {
	return constraintParser.parse(input);
}

import { Node } from '../trees/constraint';
import getParser from './get_parser';

const constraintParser = getParser('constraint');

export type ConstraintParserResult = {
	input: string;
	nodes: Node[];
};

export default function parse(input: string): ConstraintParserResult {
	return {
		input: input,
		nodes: constraintParser.parse(input),
	};
}

import {
	Node as ConstraintNode,
} from '../trees/constraint';
import {
	Node as ExprNode,
} from '../trees/expression';
import {
	Node as TextNode,
	Pos,
} from '../trees/text';

import {showErrorLocation} from './util';

import {default as TypeMap, InferredType} from '../type_map';

function printTypes(t: InferredType | InferredType[]): string {
	if (Array.isArray(t)) {
		return t.map(printType).join(', ');
	}

	return printType(t);
}

function printType(t: InferredType): string {
	return t;
}

function getLocation(node: ExprNode | ConstraintNode | TextNode): Pos {
	return node.pos;
}

function getErrorMessageForSimpleText(
	line: number,
	column: number,
	variable: string,
	expectedType: string,
	foundType: string,
	input: string,
): string {
	return (
		`Type error at line ${line}:\n` +
		showErrorLocation(
			input,
			`Variable \$${variable} was expected to have type: ${expectedType}, ` +
			`found: ${foundType}.`,
			line,
			column
		)
	);
}

function getErrorMessageForConstraintError(
	line: number,
	column: number,
	variable: string,
	expectedType: string,
	foundType: string,
	constraintInput: string,
	textInput: string,
): string {
	return (
		`Type error at line ${line}:\n` +
		showErrorLocation(
			constraintInput,
			`Variable \$${variable} was expected to have type: ${expectedType}, ` +
			`found: ${foundType}.`,
			line,
			column
		)
	);
}

function getErrorMessageConstraintTextError(
	line: number,
	column: number,
	variable: string,
	expectedType: string,
	foundType: string,
	constraintInput: string,
	textInput: string,
): string {
	return (
		`Type error at line ${line}:\n` +
		showErrorLocation(
			textInput,
			`Variable \$${variable} was expected to have type: ${expectedType}, ` +
			`found: ${foundType}.`,
			line,
			column
		)
	);
}

export default class TypeError extends Error {
	public expectedType: InferredType;
	public foundType: InferredType;
	public text: string;
	public constraintText: string | null;
	public node: ConstraintNode | TextNode | ExprNode | null;
	public position: Pos;
	public typeMap: TypeMap;
	public variable: string;

	public constructor(
		expectedType: InferredType,
		foundType: InferredType,
		typeMap: TypeMap,
		node: ConstraintNode | TextNode | ExprNode | null,
		text: string,
		constraintText: string | null,
		variable: string,
	) {
		const position = node != null ? getLocation(node) : {
			firstColumn: 0,
			firstLine: 0,
			lastColumn: 0,
			lastLine: 0,
		};
		const isConstraintError = (node as ConstraintNode).op != null;

		let errorMessage: string;
		if (isConstraintError) {
			errorMessage = getErrorMessageForConstraintError(
				position.firstLine,
				position.firstColumn,
				variable,
				printTypes(expectedType),
				printTypes(foundType),
				(constraintText as string),
				text
			);
		} else if (constraintText != null) {
			errorMessage = getErrorMessageConstraintTextError(
				position.firstLine,
				position.firstColumn,
				variable,
				printTypes(expectedType),
				printTypes(foundType),
				(constraintText as string),
				text
			);
		} else {
			errorMessage = getErrorMessageForSimpleText(
				position.firstLine,
				position.firstColumn,
				variable,
				printTypes(expectedType),
				printTypes(foundType),
				text
			);
		}
		super(errorMessage);
		this.message = errorMessage;
		this.foundType = foundType;
		this.typeMap = typeMap;
		this.expectedType = expectedType;
		this.node = this.node;
		this.position = position;
		this.variable = variable;
		this.text = text;
		this.constraintText = constraintText;
	}
}

TypeError.prototype.name = 'TypeError';

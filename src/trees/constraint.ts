export type Pos = {
	firstLine: number;
	firstColumn: number;
	lastLine: number;
	lastColumn: number;
};

export type IgnoreNode = {
	op: '!';
	operand: IdentifierNode;
	pos: Pos;
};

export type IdentifierNode = {
	type: 'identifier';
	name: string;
	pos: Pos;
};

export type GenderNode = {
	type: 'gender';
	value: 'F' | 'N' | 'M';
	pos: Pos;
};

export type EnumNode = {
	type: 'enum';
	value: string;
	pos: Pos;
};

export type NumberNode = {
	type: 'number';
	value: number;
	pos: Pos;
};

export type ValueNode = GenderNode | EnumNode | NumberNode;

export type EqualityNode = {
	op: '=' | '!=';
	lhs: IdentifierNode;
	rhs: ValueNode;
	pos: Pos;
};

export type IneqNode = {
	op: '<=' | '>=' | '<' | '>';
	lhs: IdentifierNode;
	rhs: NumberNode;
	pos: Pos;
};

export type Node = IgnoreNode | EqualityNode | IneqNode;

export type ASTRoot = {
	input: string;
	nodes: Node[];
};

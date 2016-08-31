declare namespace ASTTypes {
	interface Node {
		type: string,
	}

	interface Expression extends Node {

	}
	
	interface Statement extends Node {

	}

	interface Comment {
		loc: SourceLocation | null | undefined,
		value: string,
		leading: boolean,
		trailing: boolean,
	}

	interface SourceLocation {
		start: SourcePosition,
		end: SourcePosition,
		source: string | null | undefined,
	}

	interface SourcePosition {
		line: number,
		column: number,
	}

	interface File extends Node {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		program: Program,
	}

	interface Program extends Node {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		body: Statement[],
	}

	export type BinaryOperator = '=='
		| '!='
		| '==='
		| '!=='
		| '<'
		| '<='
		| '>'
		| '>='
		| '<<'
		| '>>'
		| '>>>'
		| '+'
		| '-'
		| '*'
		| '/'
		| '%'
		| '&' // TODO Missing from the Parser API.
		| '|'
		| '^'
		| 'in'
		| 'instanceof'
		| '..'
	;

	export type UnaryOperator = '-'
		| '+'
		| '!'
		| '~'
		| 'typeof'
		| 'void'
		| 'delete'
	;

	export type AssignmentOperator = '='
		| '+='
		| '-='
		| '*='
		| '/='
		| '%='
		| '<<='
		| '>>='
		| '>>>='
		| '|='
		| '^='
		| '&='
	;

	export type UpdateOperator = '++' | '--';

	export type LogicalOperator = '&&' | '||';

	interface EmptyStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
	}

	interface BlockStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		body: Statement[],
	}

	interface ExpressionStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		expression: Expression,
	}

	interface IfStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		test: Expression,
		consequent: Statement,
		alternate: Statement | null | undefined,
	}

	interface BreakStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		label: Identifier | null | undefined,
	}

	interface ContinueStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		label: Identifier | null | undefined,
	}

	interface ReturnStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		argument: Expression | null | undefined,
	}

	interface ThrowStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		argument: Expression | null | undefined,
	}

	interface WhileStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		test: Expression,
		body: Statement,
	}

	interface ForStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		init: VariableDeclaration | Expression | null | undefined,
		test: Expression | null | undefined,
		update: Expression | null | undefined,
		body: Statement,
	}

	interface ForInStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		left: VariableDeclaration | Expression,
		right: Expression,
		body: Statement,
	}

	interface TryStatement extends Statement {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		block: BlockStatement,
		handler: CatchClause | null | undefined,
		handlers: CatchClause[],
		finalizer: BlockStatement | null | undefined,
	}

	interface CatchClause extends Node {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		param: Expression,
		guard: Expression | null | undefined,
		body: BlockStatement,
	}

	interface Identifier extends Node {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		name: string,
	}

	interface Literal extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		value: string | boolean | number | RegExp | null | undefined,
		regex: { pattern: string, flags: string } | null | undefined,
	}

	interface ThisExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
	}

	interface ArrayExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		elements: Expression[],
	}

	interface ObjectExpreession extends Node {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		properties: Property[],
	}

	interface Property extends Node {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		kind: 'init' | 'get' | 'set',
		key: Literal | Identifier,
		value: Expression,
	}

	interface FunctionExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		id: Identifier | null | undefined,
		params: Expression[],
		body: BlockStatement,
	}

	interface BinaryExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		operator: BinaryOperator,
		left: Expression,
		right: Expression,
	}

	interface UnaryExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		operator: UnaryOperator,
		argument: Expression,
		prefix: boolean,
	}

	interface AssignmentExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		operator: AssignmentOperator,
		left: Expression,
		right: Expression,
	}

	interface UpdateExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		operator: UpdateOperator,
		argument: Expression,
		prefix: boolean,
	}

	interface LogicalExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		operator: LogicalOperator,
		left: Expression,
		right: Expression,
	}

	interface ConditionalExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		test: Expression,
		consequent: Expression,
		alternate: Expression,
	}

	interface NewExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		callee: Expression,
		arguments: Expression[],
	}

	interface CallExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		callee: Expression,
		arguments: Expression[],
	}

	interface MemberExpression extends Expression {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		object: Expression,
		property: Identifier | Expression,
		computed: boolean,
	}

	interface Declaration extends Statement {}

	interface VariableDeclaration extends Declaration {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		kind: 'var' | 'let' | 'const',
		declarations: VariableDeclarator[],
	}

	interface FunctionDeclaration extends Declaration {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		id: Identifier,
		body: BlockStatement,
		params: Expression[],
	}

	interface VariableDeclarator extends Node {
		source: string | null | undefined,
		start: SourcePosition,
		end: SourcePosition,
		comments: Comment[] | null | undefined,
		type: string,
		id: Expression,
		init: Expression | null | undefined,
	}

	export type builders = {
		emptyStatement() : EmptyStatement,
		blockStatement(
			body: Statement[]
		) : BlockStatement,
		expressionStatement(
			expression: Expression
		) : ExpressionStatement,
		ifStatement(
			test: Expression,
			consequent: Statement,
			alternate?: Statement
		) : IfStatement,
		breakStatement(
			label?: Identifier
		) : BreakStatement,
		continueStatement(
			label?: Identifier
		) : ContinueStatement,
		returnStatement(
			argument: Expression | null | undefined
		) : ReturnStatement,
		throwStatement(
			argument: Expression | null | undefined
		) : ThrowStatement,
		whileStatement(
			test: Expression,
			body: Statement
		) : WhileStatement,
		forStatement(
			init: VariableDeclaration | Expression | null | undefined,
			test: Expression | null | undefined,
			update: Expression | null | undefined,
			body: Statement
		) : ForStatement,
		forInStatement(
			left: VariableDeclaration | Expression,
			right: Expression,
			body: Statement
		) : ForInStatement,
		tryStatement(
			block: BlockStatement,
			handler: CatchClause | null | undefined,
			handlers: CatchClause[],
			finalizer?: BlockStatement
		) : TryStatement,
		catchClause(
			param: Expression,
			guard: Expression | null | undefined,
			body: BlockStatement
		) : CatchClause,
		identifier(
			name: string
		) : Identifier,
		literal(
			value: string | boolean | number | RegExp | null | undefined,
			regex?: { pattern: string, flags: string }
		) : Literal,
		thisExpression() : ThisExpression,
		arrayExpression(
			elements: Expression[]
		) : ArrayExpression,
		objectExpreession(
			properties: Property[]
		) : ObjectExpreession,
		property(
			kind: 'init' | 'get' | 'set',
			key: Literal | Identifier,
			value: Expression
		) : Property,
		functionExpression(
			id: Identifier | null | undefined,
			params: Expression[],
			body: BlockStatement
		) : FunctionExpression,
		binaryExpression(
			operator: BinaryOperator,
			left: Expression,
			right: Expression
		) : BinaryExpression,
		unaryExpression(
			operator: UnaryOperator,
			argument: Expression,
			prefix: boolean
		) : UnaryExpression,
		assignmentExpression(
			operator: AssignmentOperator,
			left: Expression,
			right: Expression
		) : AssignmentExpression,
		updateExpression(
			operator: UpdateOperator,
			argument: Expression,
			prefix: boolean
		) : UpdateExpression,
		logicalExpression(
			operator: LogicalOperator,
			left: Expression,
			right: Expression
		) : LogicalExpression,
		conditionalExpression(
			test: Expression,
			consequent: Expression,
			alternate: Expression
		) : ConditionalExpression,
		newExpression(
			callee: Expression,
			arguments: Expression[]
		) : NewExpression,
		callExpression(
			callee: Expression,
			arguments: Expression[]
		) : CallExpression,
		memberExpression(
			object: Expression,
			property: Identifier | Expression,
			computed: boolean
		) : MemberExpression,
		variableDeclaration(
			kind: 'var' | 'let' | 'const',
			declarations: VariableDeclarator[]
		) : VariableDeclaration,
		functionDeclaration(
			id: Identifier,
			body: BlockStatement,
			params: Expression[]
		) : FunctionDeclaration,
		variableDeclarator(
			id: Expression,
			init: Expression | null
		) : VariableDeclarator,
	}
}

declare module 'ast-types' {
	export var builders : ASTTypes.builders;
}
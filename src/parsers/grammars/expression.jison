/* description: Parses end executes a simple */

/* lexical grammar */
%lex
%%
\s+                       /* ignore spaces */
\"(\\.|[^\"])+\"          return 'STRING_LITERAL'
[a-zA-Z]([\da-zA-Z_]*)    return 'IDENTIFIER'
"$"[a-zA-Z]([\da-zA-Z_]*) return 'VARIABLE'
[0-9]+("."[0-9]+)?\b      return 'NUMBER'
"+"                       return 'PLUS'
"-"                       return 'MINUS'
"*"                       return 'MULTIPLY'
"/"                       return 'DIVIDE'
"{{"                      return 'OPEN_EXPR'
"}}"                      return 'CLOSE_EXPR'
"("                       return 'OPEN_PAREN'
")"                       return 'CLOSE_PAREN'
","                       return 'COMMA'
<<EOF>>                   return 'EOF'
.                         return 'INVALID'

/lex

/* operator precence */

%left PLUS MINUS
%left MULTIPLY DIVIDE
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : expr EOF
        {return $1;}
    ;

expr
    : func_invoc_expr
    | var_read_expr
    | expr PLUS expr { $$ = { "exprNodeType": "binary_op", "binaryOp": "plus", "lhs": $1, "rhs": $3, pos: { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $3.pos.lastLine, lastColumn: $3.pos.lastColumn } }; }
    | expr MINUS expr { $$ = { "exprNodeType": "binary_op", "binaryOp": "minus", "lhs": $1, "rhs": $3, pos: { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $3.pos.lastLine, lastColumn: $3.pos.lastColumn } }; }
    | expr DIVIDE expr { $$ = { "exprNodeType": "binary_op", "binaryOp": "divide", "lhs": $1, "rhs": $3, pos: { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $3.pos.lastLine, lastColumn: $3.pos.lastColumn } }; }
    | expr MULTIPLY expr { $$ = { "exprNodeType": "binary_op", "binaryOp": "multiply", "lhs": $1, "rhs": $3, pos: { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $3.pos.lastLine, lastColumn: $3.pos.lastColumn } }; }
    | MINUS expr %prec UMINUS { $$ = {"exprNodeType": "unary_minus", "op": $2, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @2.last_line, lastColumn: @2.last_column } }; }
    | NUMBER { $$ = { "exprNodeType": "number", "value": Number($1), pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    | STRING_LITERAL { $$ = { "exprNodeType": "string_literal", "value": $1, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    | OPEN_PAREN expr CLOSE_PAREN {{ $$ = $2; }}
    ;

var_read_expr
    : VARIABLE { $$ = { "exprNodeType": "variable", "name": $1.substring(1), pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    ;

func_invoc_expr
    : IDENTIFIER OPEN_PAREN expr_list CLOSE_PAREN
      { $$ = { "exprNodeType": "function_invocation", "name": $1, "parameters": $3, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @4.last_line, lastColumn: @4.last_column } }; }
    | IDENTIFIER OPEN_PAREN CLOSE_PAREN
      { $$ = { "exprNodeType": "function_invocation", "name": $1, "parameters": [], pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @3.last_line, lastColumn: @3.last_column } }; }
    ;

expr_list
    : expr { $$ = [$1]; }
    | expr COMMA expr_list { $$ = [$1].concat($3); }
    ;

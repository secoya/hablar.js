/* description: Parses end executes a simple */

/* lexical grammar */
%lex
%%

\s+                       /* ignore spaces */
"'F'"                     return 'GENDER_FEMINUM'
"'M'"                     return 'GENDER_MASKULINUM'
"'N'"                     return 'GENDER_NEUTRUM'
\"[\da-zA-Z_\-]{1,20}\"   return 'ENUM_STRING'
[a-zA-Z]([\da-zA-Z_]*)    return 'IDENTIFIER'
"-"?[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"="                       return 'EQ'
"!="                      return 'NE'
"<="                      return 'LTE'
"<"                       return 'LT'
">="                      return 'GTE'
">"                       return 'GT'
"~"                       return 'IGNORE'
","                       return 'COMMA'
<<EOF>>                   return 'EOF'
.                         return 'INVALID'

/lex

%start expressions

%% /* language grammar */

expressions
    : expr_list EOF
        {return $1;}
    ;

expr_list
    : expr { $$ = [$1]; }
    | expr COMMA expr_list { $$ = [$1].concat($3); }
    ;

eq_op
    : EQ
    | NE
    ;

ineq_op
    : LTE
    | GTE
    | LT
    | GT
    ;

gender_expr
    : GENDER_FEMINUM { $$ = {type: 'gender', value: 'F', pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    | GENDER_MASKULINUM { $$ = {type: 'gender', value: 'M', pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    | GENDER_NEUTRUM { $$ = {type: 'gender', value: 'N', pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    ;

id
    : IDENTIFIER { $$ = {type: 'identifier', name: $1, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    ;

enum
    : ENUM_STRING { $$ = {type: 'enum', value: $1.substr(1, $1.length-2), pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    ;

number
    : NUMBER { $$ = {type: 'number', value: Number($1), pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    ;

expr
    : IGNORE id { $$ = { "op": "!", "operand": $2, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: $2.pos.lastLine, lastColumn: $2.pos.lastColumn } }; }
    | id eq_op gender_expr { $$ = { "op": $2, "lhs": $1, "rhs": $3, pos: { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $3.pos.lastLine, lastColumn: $3.pos.lastColumn } }; }
    | id eq_op enum { $$ = { "op": $2, "lhs": $1, "rhs": $3, pos: { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $3.pos.lastLine, lastColumn: $3.pos.lastColumn } }; }
    | id eq_op number { $$ = { "op": $2, "lhs": $1, "rhs": $3, pos: { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $3.pos.lastLine, lastColumn: $3.pos.lastColumn } }; }
    | id ineq_op number { $$ = { "op": $2, "lhs": $1, "rhs": $3, pos: { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $3.pos.lastLine, lastColumn: $3.pos.lastColumn } }; }
    ;

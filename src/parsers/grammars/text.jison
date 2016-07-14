/*
 * description: Parses i18n text expressions.
 * Please note that when you want to do something like this:
 *   - My translation goes here, are you sure you want to delete "$title"?
 * That will result in a translation that prints that exact same text, verbatim.
 * That is, $title won't get recognised as a variable. Instead you have to write it like so:
 *   - My translation goes here, are you sure you want to delete \"$title\"?
 */

/* lexical grammar */
%lex
%%

(\\\"|[^\{\}\"$])+        return 'CHARS'
\"(\\.|[^\"])+\"          return 'STRING_LITERAL'
"{{"                      return 'OPEN_EXPR'
"}}"                      return 'CLOSE_EXPR'
"$"[a-zA-Z]([\da-zA-Z_]*) return 'VARIABLE'
<<EOF>>                   return 'EOF'
.                         return 'CHAR'

/lex

%start expressions

%% /* language grammar */

expressions
    : expr_list EOF
        { return $1; }
    | EOF
        { return [{"type": "literal", "value": "", pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }]; }
    ;

expr_list
    : expr { $$ = [$1]; }
    | expr expr_list { $$ = [$1].concat($2); }
    ;

text
    : CHAR { $$ = { "text": $1, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    | CHARS { $$ = { "text": $1.replace(/\\"/g, '"'), pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    | STRING_LITERAL { $$ = { "text": $1, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    ;

expr
    : text { $$ = {"type": "literal", "value": $1.text, pos: $1.pos }; }
    | VARIABLE { $$ = {"type": "variable", "value": $1.substring(1), pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    | OPEN_EXPR in_expr_combined CLOSE_EXPR { $$ = {"type": "expr", "value": $2.text, valuePos: $2.pos, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @3.last_line, lastColumn: @3.last_column }}; }
    ;

/*
 * in_expr and in_expr_combined should simply lex and return the string
 * that is (somewhat) valid inside the double curly bracket expressions.
 * It is being run against the expression parser afterwards that turns it into
 * an AST.
 */

in_expr
    : text
    | VARIABLE { $$ = {"text": $1, pos: { firstLine: @1.first_line, firstColumn: @1.first_column, lastLine: @1.last_line, lastColumn: @1.last_column } }; }
    ;

in_expr_combined
    : in_expr { $$ = { "text": $1.text, "pos": $1.pos }; }
    | in_expr in_expr_combined { $$ = {"text": $1.text + $2.text, "pos": { firstLine: $1.pos.firstLine, firstColumn: $1.pos.firstColumn, lastLine: $2.pos.lastLine, lastColumn: $2.pos.lastColumn } }; }
    ;

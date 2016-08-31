var jison = require("jison");
var recast = require('recast');
var types = require('ast-types');
var n = types.namedTypes;
var b = types.builders;

var ifToRemoveTest = recast.parse("typeof module !== 'undefined' && require.main === module").program.body[0].expression;

module.exports = function(input) {
	this.cacheable();

	var parser = new jison.Generator(input);
	var generated = parser.generate();
	var parsed = recast.parse(generated);
	types.visit(parsed, {
		visitFunctionExpression: function(path) {
			var node = path.node;
			this.traverse(path);

			// We're looking for a function named commonjsMain
			if (node.id == null || node.id.name !== 'commonjsMain') {
				// Ignore all other functions
				return;
			}
			// We do not want the process main code to be injected,
			// we need the module code for a regular parser
			path.get('body').replace(b.blockStatement([]));
		},
		visitIfStatement: function(path) {
			this.traverse(path);
			var test = path.node.test;
			if(types.astNodesAreEquivalent(ifToRemoveTest, test)) {
				// Remove this branch of code, it does some weird stuff with process
				// and forces webpack to pull in process as well. Also, it is not needed
				// this code attempts to resolve if the main require module to run
				// is the parser, which it is not. Alas, this is the CLI code.
				path.parent.value.body.pop();
			}
		},
	});

	var code = recast.print(parsed).code;
	return code;
};
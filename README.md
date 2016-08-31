# hablar.js
A JavaScript library useful for compiling i18n translations written in a DSL to JavaScript functions.

## This is very much still a work in progress
With an API that is to be considered unstable.

## DSL
The DSL is defined in JISON files (see src/parsers/grammars). But to illustrate the key parts of the language here is an example:

```
Hello $name, it has been {{formatDate($timeSinceLastVisit, "months"}} since your last visit.
```

This would roughly translate into the following javascript function:

```js
function(parameters, functions) {
	return 'Hello ' + parameters.name + ', it has been ' + functions['formatDate'](parameters.timeSinceLastVisit, 'months') + ' since your last visit.';
}
```

It is worth noting that the actual function generated includes various rules regarding escaping output, that complicates the actual function.


### Constraints
Sometimes we need to use a different translation string based on the input variables.
Think situations where a you need to show the number of items in a shopping basket.
If there are 0 items in the basket we might want to show something like `You have no items in your basket.`.
If there is 1 item we might want to show `You have one item in your basket.`, and otherwise `You have $n items in your basket`.

This is supported by adding constraints to the variables, basically allowing a series of if-statements to be generated inside the function.

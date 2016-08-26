/// <reference path="../node_modules/@types/mocha/index.d.ts" />
import {
	default as TypeMap,
	CustomTypeUsage,
	InferredType,
} from '../src/type_map';

import {assert} from 'chai';

describe('TypeMap', function() {
	it('Created unknown empty type info when accessing unknown variable', function() {
		const map = new TypeMap();

		const varName = 'myVar';

		const info = map.getVariableTypeInfo(varName);

		assert.isNotNull(info);
		assert.deepEqual({
			type: 'unknown',
			usages: [],
		}, info);
	});

	it('Can access known variable info after being frozen', function() {
		const map = new TypeMap();

		const varName = 'myVar';

		const info = map.getVariableTypeInfo(varName);
		map.freeze();

		const infoPostFreeze = map.getVariableTypeInfo(varName);
		assert.equal(info, infoPostFreeze);
	});

	it('Cannot access unknown variable info after being frozen', function() {
		const map = new TypeMap();

		const varName = 'myVar';
		map.freeze();

		assert.throws(() => map.getVariableTypeInfo(varName));
	});

	it('Can add type usage and retrieve it again', function() {
		const map = new TypeMap();

		const varName = 'myVar';

		const typeUsage: CustomTypeUsage = {
			nodeType: 'custom',
		};

		const type: InferredType = 'string';

		const resultType = map.addTypeUsage(varName, type, typeUsage);

		assert.equal(type, resultType);

		const typeInfo = map.getVariableTypeInfo(varName);

		assert.isNotNull(typeInfo);
		assert.equal(type, typeInfo.type);

		assert.equal(1, typeInfo.usages.length);
		assert.equal(typeUsage, typeInfo.usages[0]);
	});

	it('Cannot add variable type usage after being frozen', function() {
		const map = new TypeMap();

		const varName = 'myVar';
		map.freeze();

		assert.throws(() => map.addTypeUsage(varName, 'string', {
			nodeType: 'custom',
		}));
	});

	// Need some more tests here to verify type merging behavior
});

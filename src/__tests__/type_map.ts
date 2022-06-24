import { default as TypeMap, CustomTypeUsage, InferredType } from '../type_map';

describe('TypeMap', () => {
	it('Created unknown empty type info when accessing unknown variable', () => {
		const map = new TypeMap();

		const varName = 'myVar';

		const info = map.getVariableTypeInfo(varName);

		expect(info).not.toBeNull();
		expect({
			type: 'unknown',
			usages: [],
		}).toEqual(info);
	});

	it('Can access known variable info after being frozen', () => {
		const map = new TypeMap();

		const varName = 'myVar';

		const info = map.getVariableTypeInfo(varName);
		map.freeze();

		const infoPostFreeze = map.getVariableTypeInfo(varName);
		expect(info).toEqual(infoPostFreeze);
	});

	it('Cannot access unknown variable info after being frozen', () => {
		const map = new TypeMap();

		const varName = 'myVar';
		map.freeze();

		expect(() => map.getVariableTypeInfo(varName)).toThrowErrorMatchingInlineSnapshot(
			`"Trying to get type info for unknown type: myVar"`,
		);
	});

	it('Can add type usage and retrieve it again', () => {
		const map = new TypeMap();

		const varName = 'myVar';

		const typeUsage: CustomTypeUsage = {
			nodeType: 'custom',
		};

		const type: InferredType = 'string';

		const resultType = map.addTypeUsage(varName, type, typeUsage);

		expect(type).toEqual(resultType);

		const typeInfo = map.getVariableTypeInfo(varName);

		expect(typeInfo).not.toBeNull();
		expect(type).toEqual(typeInfo.type);

		expect(1).toEqual(typeInfo.usages.length);
		expect(typeUsage).toEqual(typeInfo.usages[0]);
	});

	it('Cannot add variable type usage after being frozen', () => {
		const map = new TypeMap();

		const varName = 'myVar';
		map.freeze();

		expect(() =>
			map.addTypeUsage(varName, 'string', {
				nodeType: 'custom',
			}),
		).toThrowErrorMatchingInlineSnapshot(`"Cannot add type usage for myVar when type map is frozen"`);
	});

	// Need some more tests here to verify type merging behavior
});

import { prettyPrint, types } from 'recast';

import Context from '../../src/emitting/context';
import { encodeIfStringFunction } from '../../src/emitting/helpers';

const b = types.builders;

describe('Emitting - Encode if string helper', () => {
	it('Should emit valid function', () => {
		const ctx = new Context();
		const stmt = encodeIfStringFunction(ctx);

		expect(prettyPrint(stmt).code).toMatchInlineSnapshot(`
"function encodeIfString(ctx, str) {
    if (!ctx.isSafeString(str)) {
        return ctx.encode(\\"\\" + str);
    }

    return ctx.convertSafeString(str);
}"
`);
	});
});

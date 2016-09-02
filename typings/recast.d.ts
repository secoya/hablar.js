/// <reference path="./ast-types.d.ts" />
declare module 'recast' {
	export interface SourceMap extends ASTTypes.Node {}

	export function prettyPrint(node: ASTTypes.Node, options?: {
		tabWidth?: number,
		useTabs?: boolean,
		reuseWhitespace?: boolean,
		lineTerminator?: string,
		wrapColumn?: number,
		sourceFileName?: string,
		sourceMapName?: string,
		sourceRoot?: string,
		inputSourceMap?: SourceMap,
		tolerant?: boolean,
		quote?: 'single' | 'double' | 'auto',
		trailingComma?: boolean,
		arrowParensAlways?: boolean,
		flowObjectCommas?: boolean,
	}): {
		code: string,
		map: SourceMap,
	};

	export function print(node: ASTTypes.Node, options?: {
		tabWidth?: number,
		useTabs?: boolean,
		reuseWhitespace?: boolean,
		lineTerminator?: string,
		wrapColumn?: number,
		sourceFileName?: string,
		sourceMapName?: string,
		sourceRoot?: string,
		inputSourceMap?: SourceMap,
		tolerant?: boolean,
		quote?: 'single' | 'double' | 'auto',
		trailingComma?: boolean,
		arrowParensAlways?: boolean,
		flowObjectCommas?: boolean,
	}): {
		code: string,
		map: SourceMap,
	};

	export var types : { builders: ASTTypes.builders };
}

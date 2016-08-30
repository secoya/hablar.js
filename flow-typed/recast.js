declare module 'recast' {
	declare var types: $Exports<'ast-types'>;

	declare interface SourceMap {}

	declare function prettyPrint(node: typeof types.$dummyNode, options?: {
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

	declare function print(node: typeof types.$dummyNode, options?: {
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
}

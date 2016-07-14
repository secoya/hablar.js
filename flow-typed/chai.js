declare module 'chai' {
	declare var assert: {
		equal<T>(expected: T, actual: T, errMsg?: string) : void;
		throws<T>(fn: () => T) : void;
		deepEqual<T>(expected: T, actual: T, errMsg?: string) : void;
		sameMembers<T>(expected: T[], actual: T[], errMsg?: string) : void;
		isTrue(actual: bool, errMsg?: string) : void;
		isFalse(actual: bool, errMsg?: string) : void;
		isNull<T>(actual: ?T, errMsg?: string) : void;
		isNotNull<T>(actual: ?T, errMsg?: string) : void;
	};
}

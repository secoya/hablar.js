type TranslationContext = {
	encode: (str: string) => string,
	isSafeString: (str: mixed) => boolean,
	convertSafeString: (str: mixed) => string,
	makeSafeString: (str: string) => mixed
};

type Translation = string | (
	vars: {[key: string]: mixed},
	fns: {[key: string]: mixed}, // mixed here is any function
	context: TranslationContext,
) => string;

type Translations = {[key: string]: Translation};

type HablarError = Error & { hablarError?: string, hablarKey?: string};

module.exports = function(
	translations: Translations,
	key: string,
	params: {[key: string]: mixed},
	functions: {[key: string]: mixed},
	context: TranslationContext
) : string {
	if (!translations.hasOwnProperty(key)) {
		const error : HablarError = new Error('Unknown translation: ' + key);

		error.hablarError = 'translation-not-found';
		error.hablarKey = key;

		throw error;
	}

	const tr = translations[key];

	if (typeof (tr) === 'string') {
		// Constant translations are just emittted as constant strings
		// however they are not encoded
		return context.encode(tr);
	}

	return tr(
		params,
		functions,
		context
	);
};

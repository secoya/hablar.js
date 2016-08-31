var webpack = require('webpack');
module.exports = {
	module: {
		loaders: [
			{
				test: /\.ts$/,
				loaders: ['babel-loader', 'ts-loader'],
			},
			{
				test: /\.jison$/,
				loaders: './loaders/jison',
			}
		],
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.WEBPACK': JSON.stringify('WEBPACK'),
		}),
	],
	entry: './src/index.ts',
	output: {
		filename: 'lib/index.js',
		libraryTarget: 'commonjs',
		target: 'node',
	},
	resolve: {
		extensions: ['', '.ts']
	},
	externals: {
		"ast-types": true,
	},
};
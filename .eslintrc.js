module.exports = {
	extends: "@404-software/eslint-config",
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ["./tsconfig.json"],
	},
	rules: {
		"@typescript-eslint/no-floating-promises": "off",
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/no-empty-object-type": "off",
		"@typescript-eslint/no-unsafe-argument": "off",
		"prettier/prettier": [
			"error",
			{
				bracketSameLine: false,
				arrowParens: "avoid",
				quoteProps: "as-needed",
				singleQuote: false,
				trailingComma: "all",
				useTabs: true,
				bracketSpacing: true,
				tabWidth: 2,
				semi: true,
				jsxSingleQuote: false,
				printWidth: 120,
				endOfLine: "auto",
			},
		],
		"no-console": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-empty-function": "off",
	},
};
// Parse amount + currency, case-insensitive
export function parseAmountCurrency(text: string) {
	const clean = text.replace(/^\/p\s*/i, "").trim();
	const match = clean.match(/([$€£])?([\d,.]+)\s*([a-zA-Z]{3})?/i);
	if (!match) return null;

	const [, symbol, num, code] = match;
	const amount = parseFloat(num.replace(",", ""));
	let currency = "USD";

	if (symbol === "€") currency = "EUR";
	else if (symbol === "£") currency = "GBP";
	else if (code) currency = code.toUpperCase();

	return { amount, currency };
}

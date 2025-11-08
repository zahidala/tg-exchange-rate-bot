import currencyFlags from "../constants/currencies.json";

export function formatFiatMessages(
	fiatTargets: string[],
	rates: Array<{ batchId: string; value: string }>,
	amount: number,
): Array<string | null> {
	return fiatTargets
		.map(target => {
			const rate = rates.find(r => r.batchId === target);
			if (!rate) return null;

			const convertedAmount = amount * parseFloat(rate.value);
			const formattedAmount = convertedAmount.toLocaleString("en-US", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
			const flag = (currencyFlags as Record<string, string>)[target] || "";
			return `${flag}${formattedAmount} ${target}`;
		})
		.filter(Boolean);
}

export function formatCryptoMessages(
	cryptoTargets: string[],
	rates: Array<{ batchId: string; value: string }>,
	amount: number,
	sourceInUSD: number,
): Array<string | null> {
	return cryptoTargets
		.map(crypto => {
			const cryptoRate = rates.find(r => r.batchId === crypto);
			if (!cryptoRate) return null;

			const cryptoPriceInUSD = parseFloat(cryptoRate.value);
			const sourceAmountInUSD = amount * sourceInUSD;
			const convertedAmount = sourceAmountInUSD / cryptoPriceInUSD;
			const formattedAmount = convertedAmount.toLocaleString("en-US", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 8,
			});
			return `${formattedAmount} ${crypto}`;
		})
		.filter(Boolean);
}

export function buildFinalMessage(
	currency: string,
	fiatMessages: Array<string | null>,
	cryptoMessages: Array<string | null>,
): string {
	const sourceCurrency =
		fiatMessages.find(msg => msg?.endsWith(` ${currency}`)) ||
		cryptoMessages.find(msg => msg?.endsWith(` ${currency}`));
	const otherFiats = fiatMessages.filter(msg => msg && !msg.endsWith(` ${currency}`));
	const otherCryptos = cryptoMessages.filter(msg => msg && !msg.endsWith(` ${currency}`));

	const messageParts = [sourceCurrency, "", ...otherFiats, "", ...otherCryptos].filter(part => part !== undefined);

	return `======\n${messageParts.join("\n")}`;
}

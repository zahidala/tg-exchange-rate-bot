import { BasePair, getExchangeRateBySymbolBatch, parseAmountCurrency } from "../utils";
import { Bot } from "grammy";
import { buildFinalMessage, formatCryptoMessages, formatFiatMessages } from "../utils/format-message";
import { MyContext } from "../types";

export function registerConversionHandler(bot: Bot<MyContext>) {
	bot.on("message:text", async (ctx: MyContext) => {
		const chatType = ctx.chat?.type;

		const text = ctx.message?.text || "";

		console.log(`Received message in ${chatType} chat: ${text}`);

		// In group, ensure message starts with /p
		if (chatType === "group" || chatType === "supergroup") {
			if (!text.toLowerCase().startsWith("/p")) return;
		}

		const parsed = parseAmountCurrency(text);
		if (!parsed) {
			return ctx.reply(
				chatType === "private"
					? "❌ Please provide amount with currency, e.g., `18000usd`"
					: "❌ Usage in group: `/p 18000usd`",
				{ parse_mode: "Markdown" },
			);
		}

		const { amount, currency } = parsed;

		try {
			// Get selected currencies from session (or use defaults)
			const fiatTargets = ctx.session.selectedFiats || ["USD", "GBP", "EUR", "BHD", "SEK"];
			const cryptoTargets = ctx.session.selectedCryptos || ["BTC", "ETH", "SOL"];

			// Build batch requests
			const fiatRequests = fiatTargets.map(target => ({
				batchId: target,
				basePair: target as BasePair,
				symbol: currency,
			}));

			const cryptoRequests = cryptoTargets.map(crypto => ({
				batchId: crypto,
				basePair: BasePair.USD,
				symbol: crypto,
			}));

			const sourceRequest =
				currency !== "USD"
					? [
							{
								batchId: "SOURCE_USD",
								basePair: BasePair.USD,
								symbol: currency,
							},
						]
					: [];

			const batchRequests = [...fiatRequests, ...cryptoRequests, ...sourceRequest];

			// Fetch exchange rates
			const rates = await getExchangeRateBySymbolBatch(batchRequests);

			// Check if rates is valid
			if (!rates || !Array.isArray(rates)) {
				throw new Error("Invalid response from exchange rate API");
			}

			// Get the source currency value in USD
			const sourceInUSD =
				currency === "USD" ? 1 : parseFloat(rates.find(r => r.batchId === "SOURCE_USD")?.value || "1");

			// Format messages
			const fiatMessages = formatFiatMessages(fiatTargets, rates, amount);
			const cryptoMessages = formatCryptoMessages(cryptoTargets, rates, amount, sourceInUSD);

			// Build final message
			const message = buildFinalMessage(currency, fiatMessages, cryptoMessages);

			await ctx.reply(message, {
				reply_parameters: { message_id: ctx.message?.message_id || 0 },
			});
		} catch (error) {
			console.error("Error fetching exchange rates:", error);
			await ctx.reply("❌ Failed to fetch exchange rates. Please try again later.");
		}
	});
}

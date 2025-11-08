import "dotenv/config";
import { BasePair, getExchangeRateBySymbolBatch, parseAmountCurrency } from "./utils";
import { Bot, Context, InlineKeyboard, session, SessionFlavor } from "grammy";
import currencyFlags from "./constants/currencies.json";

interface SessionData {
	selectedFiats?: string[];
	selectedCryptos?: string[];
	fiatPage?: number; // Current page for fiat selection
}

type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

bot.use(
	session({
		initial: (): SessionData => ({
			selectedFiats: ["USD", "GBP", "EUR", "BHD", "SEK"],
			selectedCryptos: ["BTC", "ETH", "SOL"],
		}),
	}),
);

const AVAILABLE_FIATS = Object.keys(currencyFlags);
const AVAILABLE_CRYPTOS = ["BTC", "ETH", "SOL", "BNB", "XRP", "AVAX"];

// Pagination settings (Telegram limit: 100 buttons, we use ~90 for currencies + navigation)
const FIATS_PER_PAGE = 90; // 30 rows x 3 columns = 90 buttons per page

bot.command("start", ctx => {
	ctx.reply("I am alive! Send me amounts like: 18000usd or 2 BTC\n\nUse /settings to customize currencies.");
});

// Settings command to customize currencies
bot.command("settings", ctx => {
	const keyboard = new InlineKeyboard()
		.text("📊 Fiat Currencies", "select_fiat")
		.text("💎 Crypto Currencies", "select_crypto");

	ctx.reply("Choose what to customize:", { reply_markup: keyboard });
});

// Handle fiat selection
bot.callbackQuery("select_fiat", async ctx => {
	await ctx.answerCallbackQuery();
	ctx.session.fiatPage = 0; // Reset to first page
	await showFiatPage(ctx, 0);
});

// Show a specific page of fiat currencies
async function showFiatPage(ctx: any, page: number) {
	const selectedFiats = ctx.session.selectedFiats || [];
	const keyboard = new InlineKeyboard();

	// Calculate pagination
	const totalPages = Math.ceil(AVAILABLE_FIATS.length / FIATS_PER_PAGE);
	const start = page * FIATS_PER_PAGE;
	const end = Math.min(start + FIATS_PER_PAGE, AVAILABLE_FIATS.length);
	const currentPageFiats = AVAILABLE_FIATS.slice(start, end);

	// Show selected count and page info
	const header = `*Selected: ${selectedFiats.length} currencies* (Page ${page + 1}/${totalPages})\n\nTap to toggle:`;

	// Create grid layout (3 columns)
	currentPageFiats.forEach((fiat, index) => {
		const isSelected = selectedFiats.includes(fiat);
		const prefix = isSelected ? "✅ " : "⬜ ";
		const flag = (currencyFlags as Record<string, string>)[fiat] || "";
		keyboard.text(`${prefix}${flag}${fiat}`, `toggle_fiat_${fiat}`);

		// Start new row after every 3 buttons
		if ((index + 1) % 3 === 0) {
			keyboard.row();
		}
	});

	// Ensure we're on a new row for navigation buttons
	if (currentPageFiats.length % 3 !== 0) {
		keyboard.row();
	}

	// Add navigation buttons
	keyboard.row();
	if (page > 0) {
		keyboard.text("« Prev", `fiat_page_${page - 1}`);
	}
	keyboard.text("« Back", "done_fiat");
	keyboard.text("✅ Done", "done_fiat");
	keyboard.text("🗑 Clear All", "clear_fiat");
	if (page < totalPages - 1) {
		keyboard.text("Next »", `fiat_page_${page + 1}`);
	}

	if (ctx.callbackQuery) {
		await ctx.editMessageText(header, { reply_markup: keyboard, parse_mode: "Markdown" });
	} else {
		await ctx.reply(header, { reply_markup: keyboard, parse_mode: "Markdown" });
	}
}

// Handle fiat page navigation
bot.callbackQuery(/^fiat_page_(\d+)$/, async ctx => {
	const page = parseInt(ctx.match[1]);
	ctx.session.fiatPage = page;
	await ctx.answerCallbackQuery();
	await showFiatPage(ctx, page);
});

// Handle crypto selection
bot.callbackQuery("select_crypto", async ctx => {
	await ctx.answerCallbackQuery();

	const selectedCryptos = ctx.session.selectedCryptos || [];
	const keyboard = new InlineKeyboard();

	// Show selected count
	const header = `*Selected: ${selectedCryptos.length} currencies*\n\nTap to toggle:`;

	// Create grid layout (3 columns)
	AVAILABLE_CRYPTOS.forEach((crypto, index) => {
		const isSelected = selectedCryptos.includes(crypto);
		const prefix = isSelected ? "✅ " : "⬜ ";
		keyboard.text(`${prefix}${crypto}`, `toggle_crypto_${crypto}`);

		// Start new row after every 3 buttons
		if ((index + 1) % 3 === 0) {
			keyboard.row();
		}
	});

	// Ensure we're on a new row for action buttons
	if (AVAILABLE_CRYPTOS.length % 3 !== 0) {
		keyboard.row();
	}

	// Add action buttons on final row
	keyboard.text("« Back", "done_crypto").text("✅ Done", "done_crypto").text("🗑 Clear All", "clear_crypto");

	ctx.editMessageText(header, { reply_markup: keyboard, parse_mode: "Markdown" });
});

bot.callbackQuery(/^toggle_fiat_(.+)$/, async ctx => {
	const fiat = ctx.match[1];
	const selectedFiats = ctx.session.selectedFiats || [];

	if (selectedFiats.includes(fiat)) {
		ctx.session.selectedFiats = selectedFiats.filter(f => f !== fiat);
	} else {
		ctx.session.selectedFiats = [...selectedFiats, fiat];
	}

	await ctx.answerCallbackQuery(`${selectedFiats.includes(fiat) ? "Removed" : "Added"} ${fiat}`);

	// Refresh the current page
	const currentPage = ctx.session.fiatPage || 0;
	await showFiatPage(ctx, currentPage);
});

bot.callbackQuery(/^toggle_crypto_(.+)$/, async ctx => {
	const crypto = ctx.match[1];
	const selectedCryptos = ctx.session.selectedCryptos || [];

	if (selectedCryptos.includes(crypto)) {
		ctx.session.selectedCryptos = selectedCryptos.filter(c => c !== crypto);
	} else {
		ctx.session.selectedCryptos = [...selectedCryptos, crypto];
	}

	await ctx.answerCallbackQuery(`${selectedCryptos.includes(crypto) ? "Removed" : "Added"} ${crypto}`);

	// Refresh the keyboard
	const updatedSelected = ctx.session.selectedCryptos || [];
	const header = `*Selected: ${updatedSelected.length} currencies*\n\nTap to toggle:`;
	const keyboard = new InlineKeyboard();

	// Create grid layout (3 columns)
	AVAILABLE_CRYPTOS.forEach((c, index) => {
		const isSelected = updatedSelected.includes(c);
		const prefix = isSelected ? "✅ " : "⬜ ";
		keyboard.text(`${prefix}${c}`, `toggle_crypto_${c}`);

		// Start new row after every 3 buttons
		if ((index + 1) % 3 === 0) {
			keyboard.row();
		}
	});

	// Ensure we're on a new row for action buttons
	if (AVAILABLE_CRYPTOS.length % 3 !== 0) {
		keyboard.row();
	}

	// Add action buttons on final row
	keyboard.text("« Back", "done_crypto").text("✅ Done", "done_crypto").text("🗑 Clear All", "clear_crypto");

	ctx.editMessageText(header, { reply_markup: keyboard, parse_mode: "Markdown" });
});

// Clear all fiat selections
bot.callbackQuery("clear_fiat", async ctx => {
	ctx.session.selectedFiats = [];
	await ctx.answerCallbackQuery("Cleared all fiat selections");

	// Refresh the current page
	const currentPage = ctx.session.fiatPage || 0;
	await showFiatPage(ctx, currentPage);
});

// Clear all crypto selections
bot.callbackQuery("clear_crypto", async ctx => {
	ctx.session.selectedCryptos = [];
	await ctx.answerCallbackQuery("Cleared all crypto selections");

	const header = "*Selected: 0 currencies*\n\nTap to toggle:";
	const keyboard = new InlineKeyboard();

	// Create grid layout (3 columns)
	AVAILABLE_CRYPTOS.forEach((c, index) => {
		keyboard.text(`⬜ ${c}`, `toggle_crypto_${c}`);

		// Start new row after every 3 buttons
		if ((index + 1) % 3 === 0) {
			keyboard.row();
		}
	});

	// Ensure we're on a new row for action buttons
	if (AVAILABLE_CRYPTOS.length % 3 !== 0) {
		keyboard.row();
	}

	// Add action buttons on final row
	keyboard.text("« Back", "done_crypto").text("✅ Done", "done_crypto").text("🗑 Clear All", "clear_crypto");

	ctx.editMessageText(header, { reply_markup: keyboard, parse_mode: "Markdown" });
});

// Done buttons - close the settings
bot.callbackQuery("done_fiat", async ctx => {
	await ctx.answerCallbackQuery("Settings saved!");
	await ctx.deleteMessage();
});

bot.callbackQuery("done_crypto", async ctx => {
	await ctx.answerCallbackQuery("Settings saved!");
	await ctx.deleteMessage();
});

// Back button
bot.callbackQuery("settings_back", async ctx => {
	await ctx.answerCallbackQuery();

	const keyboard = new InlineKeyboard()
		.text("📊 Fiat Currencies", "select_fiat")
		.text("💎 Crypto Currencies", "select_crypto");

	ctx.editMessageText("Choose what to customize:", { reply_markup: keyboard });
});

bot.on("message:text", async ctx => {
	const chatType = ctx.chat?.type;

	const text = ctx.message.text || "";

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
		const sourceInUSD = currency === "USD" ? 1 : parseFloat(rates.find(r => r.batchId === "SOURCE_USD")?.value || "1");

		// Format fiat conversions
		const fiatMessages = fiatTargets
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

		// Format crypto conversions (no flags/symbols)
		const cryptoMessages = cryptoTargets
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

		// Combine with proper spacing: source currency, blank line, other fiats, blank line, cryptos
		const sourceCurrency =
			fiatMessages.find(msg => msg?.endsWith(` ${currency}`)) ||
			cryptoMessages.find(msg => msg?.endsWith(` ${currency}`));
		const otherFiats = fiatMessages.filter(msg => msg && !msg.endsWith(` ${currency}`));
		const otherCryptos = cryptoMessages.filter(msg => msg && !msg.endsWith(` ${currency}`));

		const messageParts = [sourceCurrency, "", ...otherFiats, "", ...otherCryptos].filter(part => part !== undefined);

		const message = `======\n${messageParts.join("\n")}`;

		await ctx.reply(message, {
			reply_parameters: { message_id: ctx.message.message_id },
		});
	} catch (error) {
		console.error("Error fetching exchange rates:", error);
		await ctx.reply("❌ Failed to fetch exchange rates. Please try again later.");
	}
});

bot.catch(err => {
	console.error("Error in bot:", err);
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

bot.start().catch(err => {
	console.error("Failed to start bot:", err);
	process.exit(1);
});

console.log("Bot is running...");

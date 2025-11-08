import { Bot, InlineKeyboard } from "grammy";

import { AVAILABLE_FIATS, FIATS_PER_PAGE } from "../config/constants";
import { MyContext } from "../types";
import currencyFlags from "../constants/currencies.json";

// Show a specific page of fiat currencies
export async function showFiatPage(ctx: MyContext, page: number) {
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

export function registerFiatSelectionHandlers(bot: Bot<MyContext>) {
	// Handle fiat selection
	bot.callbackQuery("select_fiat", async ctx => {
		await ctx.answerCallbackQuery();
		ctx.session.fiatPage = 0; // Reset to first page
		await showFiatPage(ctx, 0);
	});

	// Handle fiat page navigation
	bot.callbackQuery(/^fiat_page_(\d+)$/, async ctx => {
		const page = parseInt(ctx.match![1]);
		ctx.session.fiatPage = page;
		await ctx.answerCallbackQuery();
		await showFiatPage(ctx, page);
	});

	// Handle fiat toggle
	bot.callbackQuery(/^toggle_fiat_(.+)$/, async ctx => {
		const fiat = ctx.match![1];
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

	// Clear all fiat selections
	bot.callbackQuery("clear_fiat", async ctx => {
		ctx.session.selectedFiats = [];
		await ctx.answerCallbackQuery("Cleared all fiat selections");

		// Refresh the current page
		const currentPage = ctx.session.fiatPage || 0;
		await showFiatPage(ctx, currentPage);
	});
}

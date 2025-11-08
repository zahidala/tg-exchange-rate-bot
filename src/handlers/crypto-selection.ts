import { AVAILABLE_CRYPTOS } from "../config/constants";
import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types";

export function registerCryptoSelectionHandlers(bot: Bot<MyContext>) {
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

	// Handle crypto toggle
	bot.callbackQuery(/^toggle_crypto_(.+)$/, async ctx => {
		const crypto = ctx.match![1];
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
}

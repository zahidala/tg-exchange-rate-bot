import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types";

export function registerCommandHandlers(bot: Bot<MyContext>) {
	bot.command("start", ctx => {
		ctx.reply("I am alive! Send me amounts like: 18000usd or 2 BTC\n\nUse /settings to customize currencies.");
	});

	bot.command("settings", ctx => {
		const keyboard = new InlineKeyboard()
			.text("📊 Fiat Currencies", "select_fiat")
			.text("💎 Crypto Currencies", "select_crypto");

		ctx.reply("Choose what to customize:", { reply_markup: keyboard });
	});

	bot.callbackQuery("settings_back", async ctx => {
		await ctx.answerCallbackQuery();

		const keyboard = new InlineKeyboard()
			.text("📊 Fiat Currencies", "select_fiat")
			.text("💎 Crypto Currencies", "select_crypto");

		ctx.editMessageText("Choose what to customize:", { reply_markup: keyboard });
	});

	bot.callbackQuery("done_fiat", async ctx => {
		await ctx.answerCallbackQuery("Settings saved!");
		await ctx.deleteMessage();
	});

	bot.callbackQuery("done_crypto", async ctx => {
		await ctx.answerCallbackQuery("Settings saved!");
		await ctx.deleteMessage();
	});
}

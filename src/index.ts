import "dotenv/config";

import { Bot, session } from "grammy";
import { MyContext, SessionData } from "./types";
import { registerCommandHandlers } from "./handlers/commands";
import { registerConversionHandler } from "./handlers/conversion";
import { registerCryptoSelectionHandlers } from "./handlers/crypto-selection";
import { registerFiatSelectionHandlers } from "./handlers/fiat-selection";

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

// Use session middleware
bot.use(
	session({
		initial: (): SessionData => ({
			selectedFiats: ["USD", "GBP", "EUR", "BHD", "SEK"],
			selectedCryptos: ["BTC", "ETH", "SOL"],
		}),
	}),
);

// Register all handlers
registerCommandHandlers(bot);
registerFiatSelectionHandlers(bot);
registerCryptoSelectionHandlers(bot);
registerConversionHandler(bot);

// Error handling
bot.catch(err => {
	console.error("Error in bot:", err);
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

// Start the bot
bot.start().catch(err => {
	console.error("Failed to start bot:", err);
	process.exit(1);
});

console.log("Bot is running...");

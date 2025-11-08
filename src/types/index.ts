import { Context, SessionFlavor } from "grammy";

export interface SessionData {
	selectedFiats?: string[];
	selectedCryptos?: string[];
	fiatPage?: number; // Current page for fiat selection
}

export type MyContext = Context & SessionFlavor<SessionData>;

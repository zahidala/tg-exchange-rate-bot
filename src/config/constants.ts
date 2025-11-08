import currencyFlags from "../constants/currencies.json";

export const AVAILABLE_FIATS = Object.keys(currencyFlags);
export const AVAILABLE_CRYPTOS = ["BTC", "ETH", "SOL", "BNB", "XRP", "AVAX"];

// Pagination settings (Telegram limit: 100 buttons, we use ~90 for currencies + navigation)
export const FIATS_PER_PAGE = 90; // 30 rows x 3 columns = 90 buttons per page

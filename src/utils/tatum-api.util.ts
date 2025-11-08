import axios, { AxiosRequestConfig } from "axios";

interface Args {
	method: "POST" | "GET" | "PUT" | "DELETE";
	endpoint: string;
	body?: any;
	params?: any;
}

export const tatumApi = async <T = any>(args: Args) => {
	const baseUrl = process.env.TATUM_BASE_URL;
	if (!baseUrl) throw new Error("TATUM_BASE_URL is not defined in environment variables");

	const apiKey = process.env.TATUM_API_KEY;
	if (!apiKey) throw new Error("TATUM_API_KEY is not defined in environment variables");

	const config: AxiosRequestConfig = {
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
		},
		method: args.method,
		params: args.params,
		data: args.body,
		url: `${baseUrl}/${args.endpoint}`,
	};

	try {
		const response = await axios.request<T>(config);
		return response.data;
	} catch (error) {
		console.error("Error occurred while making API request:", error);
		throw error;
	}
};

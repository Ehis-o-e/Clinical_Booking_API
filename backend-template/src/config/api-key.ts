export const getApiKey = (): string => {
    const apiKey = process.env.API_KEY?.trim();

    if (!apiKey) {
        throw new Error('API_KEY must be configured');
    }

    return apiKey;
};

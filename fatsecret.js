const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

class FatSecretService {
    constructor() {
        this.consumerKey = '44d959b3df9945c3a232cf037c133286';
        this.consumerSecret = '1603934b6ef744bbb4357376217e723f';
        this.baseUrl = 'https://platform.fatsecret.com/rest/server.api';
    }

    generateSignature(method, url, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        const signatureBaseString = [
            method.toUpperCase(),
            encodeURIComponent(url),
            encodeURIComponent(sortedParams)
        ].join('&');

        const signingKey = `${encodeURIComponent(this.consumerSecret)}&`;

        const signature = crypto
            .createHmac('sha1', signingKey)
            .update(signatureBaseString)
            .digest('base64');

        return signature;
    }

    generateOAuthParams() {
        return {
            oauth_consumer_key: this.consumerKey,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
            oauth_nonce: crypto.randomBytes(16).toString('hex'),
            oauth_version: '1.0'
        };
    }

    async makeRequest(params) {
        return new Promise((resolve, reject) => {
            const oauthParams = this.generateOAuthParams();
            const allParams = { ...params, ...oauthParams };

            const signature = this.generateSignature('POST', this.baseUrl, allParams);
            allParams.oauth_signature = signature;

            const postData = querystring.stringify(allParams);

            const options = {
                hostname: 'platform.fatsecret.com',
                path: '/rest/server.api',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error('Failed to parse response: ' + error.message));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    async searchFoods(query, maxResults = 10) {
        try {
            const params = {
                method: 'foods.search',
                search_expression: query,
                max_results: maxResults.toString(),
                format: 'json'
            };

            const response = await this.makeRequest(params);
            return response;
        } catch (error) {
            throw new Error(`Food search failed: ${error.message}`);
        }
    }

    async getFoodDetails(foodId) {
        try {
            const params = {
                method: 'food.get',
                food_id: foodId.toString(),
                format: 'json'
            };

            const response = await this.makeRequest(params);
            return response;
        } catch (error) {
            throw new Error(`Get food details failed: ${error.message}`);
        }
    }

    async searchFoodDetails(query, maxResults = 10) {
        try {
            const searchResults = await this.searchFoods(query, maxResults);
            
            if (!searchResults.foods || !searchResults.foods.food) {
                return {
                    query: query,
                    results: [],
                    message: 'No foods found for this query'
                };
            }

            const foods = Array.isArray(searchResults.foods.food) 
                ? searchResults.foods.food 
                : [searchResults.foods.food];

            const detailedResults = [];
            
            for (const food of foods.slice(0, 5)) {
                try {
                    const details = await this.getFoodDetails(food.food_id);
                    detailedResults.push({
                        id: food.food_id,
                        name: food.food_name,
                        description: food.food_description,
                        type: food.food_type,
                        url: food.food_url,
                        details: details.food
                    });

                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`Failed to get details for food ID ${food.food_id}:`, error.message);
                    detailedResults.push({
                        id: food.food_id,
                        name: food.food_name,
                        description: food.food_description,
                        type: food.food_type,
                        url: food.food_url,
                        details: null,
                        error: 'Failed to fetch detailed nutrition info'
                    });
                }
            }

            return {
                query: query,
                total_results: searchResults.foods.total_results || foods.length,
                results: detailedResults
            };

        } catch (error) {
            throw new Error(`Search food details failed: ${error.message}`);
        }
    }

    formatNutritionInfo(foodDetails) {
        if (!foodDetails || !foodDetails.servings) {
            return 'No nutrition information available';
        }

        const serving = Array.isArray(foodDetails.servings.serving) 
            ? foodDetails.servings.serving[0] 
            : foodDetails.servings.serving;

        return {
            serving_description: serving.serving_description,
            calories: serving.calories,
            carbohydrate: serving.carbohydrate,
            protein: serving.protein,
            fat: serving.fat,
            saturated_fat: serving.saturated_fat,
            polyunsaturated_fat: serving.polyunsaturated_fat,
            monounsaturated_fat: serving.monounsaturated_fat,
            cholesterol: serving.cholesterol,
            sodium: serving.sodium,
            potassium: serving.potassium,
            fiber: serving.fiber,
            sugar: serving.sugar,
            vitamin_a: serving.vitamin_a,
            vitamin_c: serving.vitamin_c,
            calcium: serving.calcium,
            iron: serving.iron
        };
    }
}

module.exports = FatSecretService;
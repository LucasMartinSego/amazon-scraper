import fs from 'fs/promises';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';

dotenv.config();

const APIKEY = process.env.API_KEY;
const URL = "https://www.amazon.com/s?k=laptops";

(async () => {
    try {
        const response = await fetch(`http://api.scraperapi.com/?api_key=${APIKEY}&url=${URL}&render=true`);

        if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.statusText}`);
        }

        const data = await response.text();

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(data);

        const results = await page.evaluate(() => {
            const products = document.querySelectorAll('*[class*="s-search-results sg-row"] > *[data-asin]:not([class*="AdHolder"]):not([class*="large"]):not([data-component-type=""])');
            const results = [];

            products.forEach(product => {
                results.push({
                    asin: product.getAttribute('data-asin'),
                    title: product.querySelector('h2 a span')?.textContent || 'Sin título',
                    price: product.querySelector('.a-price .a-offscreen')?.textContent || 'Sin precio',
                    rating: product.querySelector('.a-icon-alt')?.textContent || 'Sin calificación',
                });
            });

            return results;
        });

        try {
            await fs.writeFile('output.json', JSON.stringify(results, null, 2));
            console.log("Resultados extraídos correctamente");
        } catch (error) {
            console.error("Error al guardar el archivo:", error);
        }

        await browser.close();
    } catch (error) {
        console.error('Error:', error);
    }
})();

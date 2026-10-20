const { neon } = require('@neondatabase/serverless');

async function scanMarket() {
  try {
    // 1. Fetch Live Price from CoinGecko
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=worldcoin-wld&vs_currencies=usd');
    const data = await response.json();
    const currentPrice = data['worldcoin-wld'].usd;
    
    console.log(`[WLDguard Engine] Live Market Price: WLD = $${currentPrice.toFixed(3)}`);

    // 2. Connect to Neon Database
    if (!process.env.DATABASE_URL) {
        console.error("Missing DATABASE_URL. Engine cannot connect to Neon.");
        return;
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // 3. Scan for active intents
    const activeOrders = await sql`SELECT * FROM limit_orders`;
    
    if (activeOrders.length > 0) {
        console.log(`[WLDguard Engine] Monitoring ${activeOrders.length} active intents...`);
    }

  } catch (error) {
    console.error('[WLDguard Engine] Error:', error.message);
  }
}

console.log("Igniting WLDguard Alpha Engine...");
// Scan the market every 10 seconds (well under CoinGecko's rate limit)
setInterval(scanMarket, 10000);

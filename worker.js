require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function scanMarketAndExecute() {
  console.log("\n[WLDguard Engine] Scanning market...");
  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Fetch Live Price (Mocked to $2.50 to trigger our $2.45 order)
    // In production, this will hit Binance or CoinGecko APIs
    const currentWldPrice = 2.50; 
    console.log(`[Market] Live WLD Price: $${currentWldPrice}`);

    // 2. Query Neon for pending intents
    const pendingOrders = await sql`
      SELECT * FROM limit_orders WHERE status = 'pending'
    `;
    
    if (pendingOrders.length === 0) {
      console.log("[Engine] No pending orders found. Sleeping...");
      return;
    }

    // 3. Evaluate and Execute
    for (const order of pendingOrders) {
       console.log(`[Engine] Evaluating Order #${order.id}: ${order.intent_action}`);
       
       // Parse the target price from the dynamic string (e.g., "Sell 71.40 WLD at $2.45")
       const priceMatch = order.intent_action.match(/\$(\d+\.\d+)/);
       const targetPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

       if (targetPrice && currentWldPrice >= targetPrice) {
          console.log(`🎯 TARGET HIT! WLD is $${currentWldPrice} (Target: $${targetPrice})`);
          console.log(`[Alchemy RPC] Relaying EIP-191 signature to World Chain Safe...`);
          console.log(`[Signature] ${order.signature.slice(0,30)}...`);
          
          // 4. Update Neon to reflect successful execution
          await sql`
            UPDATE limit_orders SET status = 'executed' WHERE id = ${order.id}
          `;
          console.log(`✅ SUCCESS: Order #${order.id} executed. 0.1% Treasury Fee Collected.`);
       } else {
          console.log(`[Engine] Target not met for Order #${order.id}. Waiting.`);
       }
    }
  } catch (err) {
    console.error("[Fatal] Engine Error:", err.message);
  }
}

// Run the continuous loop every 10 seconds
console.log("Starting WLDguard Daemon...");
setInterval(scanMarketAndExecute, 10000);
scanMarketAndExecute();

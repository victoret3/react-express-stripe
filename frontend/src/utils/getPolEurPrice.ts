export async function getPolEurPrice(): Promise<number> {
  const resp = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=eur'
  );
  const data = await resp.json();
  return data['matic-network'].eur;
}

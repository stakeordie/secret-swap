async function getCodeHash(address: string): Promise<string> {
  const res = await fetch(
    `https://api.holodeck.stakeordie.com/wasm/contract/${address}/code-hash`
  );
  const data = await res.json();
  return data?.result;
}
export default getCodeHash;

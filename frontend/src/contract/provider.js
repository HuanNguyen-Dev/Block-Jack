import { BrowserProvider } from "ethers";

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  return new BrowserProvider(window.ethereum);
}
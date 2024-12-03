import { useState } from "react";
import { ethers } from "ethers";

const ConnectWalletButton = () => {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        alert("MetaMask no está instalada.");
        return;
      }

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      setConnected(true);
      alert(`Wallet conectada: ${address}`);
    } catch (error) {
      console.error("Error al conectar la wallet:", error);
      alert("Hubo un problema al conectar la wallet.");
    }
  };

  const handleDisconnectWallet = () => {
    setAccount(null);
    setConnected(false);
    alert("Wallet desconectada.");
  };

  return (
    <button onClick={connected ? handleDisconnectWallet : handleConnectWallet}>
      {connected ? `Desconectar Wallet (${account})` : "Conectar Wallet"}
    </button>
  );
};

export default ConnectWalletButton;

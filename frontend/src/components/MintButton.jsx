import React, { useState } from 'react';
import { ethers } from 'ethers';
import nftAbi from '../abis/NaniBoronatNFT.json';

const MintButton = ({ nft, onSuccess, onError }) => {
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  // Función para mintear el NFT
  const mintNFT = async () => {
    try {
      setIsMinting(true);
      setError('');
      
      // Comprobar que tenemos la información necesaria
      if (!nft || !nft.contractCid) {
        throw new Error('No se ha proporcionado la información del NFT a mintear');
      }
      
      console.log('Iniciando minteo de NFT:', nft);
      
      // Comprobar que el usuario tiene MetaMask instalado
      if (!window.ethereum) {
        throw new Error('Por favor, instala MetaMask para mintear NFTs');
      }
      
      // Solicitar conexión a MetaMask
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Crear un provider y un signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      console.log('Conectado con la wallet:', address);
      
      // Comprobar que estamos en la red correcta (Arbitrum Sepolia)
      const network = await provider.getNetwork();
      
      // Arbitrum Sepolia chainId es 421614
      if (network.chainId !== 421614) {
        // Solicitar cambio de red a Arbitrum Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x66EEE' }], // '0x66EEE' en hexadecimal es 421614 en decimal
          });
        } catch (switchError) {
          // Si no existe la red, solicitar añadirla
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x66EEE',
                  chainName: 'Arbitrum Sepolia',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
                  blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
        // Actualizar provider y signer después del cambio de red
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
      }
      
      // Conectar al contrato NFT
      const nftContract = new ethers.Contract(nft.contractAddress, nftAbi, signer);
      
      console.log('Contrato conectado:', nft.contractAddress);
      
      // Obtener el precio de minteo
      const mintPrice = await nftContract.mintPrice();
      console.log('Precio de minteo:', ethers.utils.formatEther(mintPrice), 'ETH');
      
      // El CID que pasaremos al contrato (sin prefijos)
      const cid = nft.contractCid;
      console.log('CID para contrato (sin prefijos):', cid);
      
      // Royalties (por defecto 5%)
      const royaltyBps = nft.royaltyBps || 500;
      
      // Estimar gas para la transacción
      const gasEstimated = await nftContract.estimateGas.mintNFT(
        cid,
        royaltyBps,
        { value: mintPrice }
      );
      
      console.log('Gas estimado:', gasEstimated.toString());
      
      // Enviar la transacción
      const tx = await nftContract.mintNFT(
        cid,
        royaltyBps,
        { 
          value: mintPrice,
          gasLimit: gasEstimated.mul(12).div(10) // 20% más por seguridad
        }
      );
      
      setTxHash(tx.hash);
      console.log('Transacción enviada:', tx.hash);
      
      // Esperar a que se confirme la transacción
      const receipt = await tx.wait();
      console.log('Transacción confirmada:', receipt);
      
      // Buscar el evento NFTMinted
      const nftMintedEvent = receipt.events.find(event => event.event === 'NFTMinted');
      
      if (nftMintedEvent) {
        const tokenId = nftMintedEvent.args.tokenId.toString();
        console.log('NFT minteado con éxito! Token ID:', tokenId);
        
        // URL de OpenSea para ver el NFT
        const openSeaUrl = `https://testnets.opensea.io/assets/arbitrumsepolia/${nft.contractAddress}/${tokenId}`;
        
        // Llamar al callback de éxito si existe
        if (onSuccess) {
          onSuccess({
            tokenId,
            transactionHash: tx.hash,
            openSeaUrl,
          });
        }
      }
      
      setIsMinting(false);
    } catch (err) {
      console.error('Error al mintear NFT:', err);
      setError(err.message || 'Error desconocido al mintear');
      
      // Llamar al callback de error si existe
      if (onError) {
        onError(err);
      }
      
      setIsMinting(false);
    }
  };

  return (
    <div className="mint-button-container">
      <button 
        className="mint-button" 
        onClick={mintNFT}
        disabled={isMinting}
      >
        {isMinting ? 'Minteando...' : 'Mintear NFT'}
      </button>
      
      {txHash && (
        <div className="tx-info">
          <p>Transacción enviada: </p>
          <a 
            href={`https://sepolia.arbiscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Ver en Arbiscan
          </a>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default MintButton; 
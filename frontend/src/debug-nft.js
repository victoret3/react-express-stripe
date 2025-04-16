// Script de diagnóstico para verificar NFTs en la colección
const ethers = require('ethers');

async function checkNFTs() {
  // Información del contrato
  const contractAddress = '0x645d6275f29e56670aedfcc6d00bd04be238e133';
  const manifoldTokenId = '4276724384';
  
  console.log('Iniciando diagnóstico de NFTs para contrato:', contractAddress);
  
  // Conectar a la blockchain
  const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
  
  // ABI mínimo
  const minABI = [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenURI(uint256 tokenId) view returns (string)'
  ];
  
  const contract = new ethers.Contract(contractAddress, minABI, provider);
  
  // 1. Verificar si podemos obtener eventos de transferencia recientes
  console.log('Buscando eventos Transfer recientes...');
  
  try {
    const filter = {
      address: contractAddress,
      topics: [ethers.utils.id("Transfer(address,address,uint256)")]
    };
    
    const events = await provider.getLogs({
      ...filter,
      fromBlock: -100000  // Últimos 100,000 bloques (aprox. 2 semanas en Polygon)
    });
    
    console.log(`Se encontraron ${events.length} eventos Transfer`);
    
    // Mostrar los últimos 5 eventos
    const lastEvents = events.slice(-5);
    
    for (const event of lastEvents) {
      const tokenId = ethers.BigNumber.from(event.topics[3]).toString();
      console.log(`Token transferido: ${tokenId}`);
      
      // Intentar obtener el dueño actual
      try {
        const owner = await contract.ownerOf(tokenId);
        console.log(`- Dueño actual: ${owner}`);
        
        // Intentar obtener URI
        try {
          const uri = await contract.tokenURI(tokenId);
          console.log(`- URI: ${uri}`);
        } catch (uriError) {
          console.log(`- No se pudo obtener URI para token ${tokenId}`);
        }
      } catch (ownerError) {
        console.log(`- No se pudo verificar dueño para token ${tokenId}`);
      }
    }
  } catch (eventsError) {
    console.error('Error obteniendo eventos:', eventsError);
  }
  
  // 2. Verificar algunos tokens alrededor del manifoldTokenId
  console.log('\nVerificando tokens cercanos al ID principal...');
  
  const baseId = ethers.BigNumber.from(manifoldTokenId);
  
  // Probar 20 IDs por encima y por debajo
  for (let i = -10; i <= 10; i++) {
    const tokenId = baseId.add(i).toString();
    
    try {
      const owner = await contract.ownerOf(tokenId);
      console.log(`Token ${tokenId} pertenece a: ${owner}`);
      
      try {
        const uri = await contract.tokenURI(tokenId);
        console.log(`- URI: ${uri}`);
        
        // Intentar obtener metadata
        try {
          const response = await fetch(uri);
          const metadata = await response.json();
          console.log(`- Nombre: ${metadata.name}`);
          console.log(`- Imagen: ${metadata.image}`);
        } catch (metadataError) {
          console.log(`- No se pudo obtener metadata`);
        }
      } catch (uriError) {
        console.log(`- No se pudo obtener URI`);
      }
    } catch (ownerError) {
      // Este token probablemente no existe
      continue;
    }
  }
  
  console.log('Diagnóstico completado.');
}

// Ejecutar la función
checkNFTs().catch(error => {
  console.error('Error en la verificación:', error);
});

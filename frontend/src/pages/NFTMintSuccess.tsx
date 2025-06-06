import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Heading, Text, Spinner, Link, Button, VStack } from '@chakra-ui/react';

const NFTMintSuccess: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  const [mintInfo, setMintInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionId) {
      fetch(`${process.env.REACT_APP_API_URL}/mint-status?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setMintInfo(data);
          }
          setLoading(false);
        })
        .catch(() => {
          setError('No se pudo obtener el estado del mint.');
          setLoading(false);
        });
    } else {
      setError('No se encontró el session_id en la URL.');
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) return <Spinner size="xl" mt={10} />;
  if (error) return <Text color="red.500" mt={10}>{error}</Text>;

  return (
    <Box maxW="lg" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg" bg="green.50">
      <VStack spacing={4}>
        <Heading size="lg" color="green.600">¡NFT minteado con éxito!</Heading>
        <Text><b>ID NFT:</b> {mintInfo.lazyId}</Text>
        <Text><b>Wallet destino:</b> {mintInfo.walletAddress}</Text>
        <Text><b>Contrato:</b> {mintInfo.contractAddress}</Text>
        <Text>
          <b>Hash de la transacción:</b>{' '}
          <Link href={`https://polygonscan.com/tx/${mintInfo.transactionHash}`} isExternal color="blue.500">
            {mintInfo.transactionHash?.slice(0, 10)}...{mintInfo.transactionHash?.slice(-6)}
          </Link>
        </Text>
        <Button as="a" href="/tienda-online" colorScheme="blue">Volver a la tienda</Button>
      </VStack>
    </Box>
  );
};

export default NFTMintSuccess;

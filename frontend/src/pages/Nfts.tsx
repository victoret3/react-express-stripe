import { useEffect } from "react";
import { Box, Heading } from "@chakra-ui/react";
import WalletConnectButton from "../components/ConnectWalletButton";

const Dashboard = () => {
  useEffect(() => {
    console.log("Dashboard montado correctamente.");
  }, []);

  return (
    <Box textAlign="center" py={10} px={6}>
      <Heading as="h1" size="xl" mb={6}>
        Bienvenido a mi colección
      </Heading>
      <WalletConnectButton />
    </Box>
  );
};

export default Dashboard;

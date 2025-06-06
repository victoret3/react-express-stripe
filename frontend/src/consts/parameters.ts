/** Change these values to configure the application for your own use. **/

// Your smart contract address (available on the thirdweb dashboard)
// For existing collections: import your existing contracts on the dashboard: https://thirdweb.com/dashboard
export const contractConst = "0x436492DBc2E30E56FaC8F2297BD1964833c0687d";

// The name of the chain your contract is deployed to.
export const chainConst = "Polygon Mainnet";

// It is IMPORTANT to provide your own API key to use the thirdweb SDK and infrastructure.
// Please ensure that you define the correct domain for your API key from the API settings page.
// You can get one for free at https://thirdweb.com/create-api-key
export const clientIdConst = process.env.REACT_APP_THIRDWEB_CLIENT_ID || "";

// Configure the primary color for buttons and other UI elements
export const primaryColorConst = "blue";

// Choose between "light" and "dark" mode
export const themeConst = "dark";

export const CHAIN = {
  chainId: 137,
  chainName: "Polygon Mainnet",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18
  },
  rpcUrls: [process.env.VITE_RPC_URL],
  blockExplorerUrls: ["https://polygonscan.com"]
};

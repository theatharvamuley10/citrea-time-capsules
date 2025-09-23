import "./App.css";
import Header from "./components/Header/Header";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { citreaTestnet } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "./index.css";
import CreateCapsule from "./components/CreateCapsule/CreateCapsule";
import Info from "./components/Info/Info";
import ScrollPrompt from "./components/ScrollPrompt/ScrollPrompt";

function App() {
  const config = getDefaultConfig({
    appName: "My RainbowKit App",
    projectId: "Your_Project_ID",
    chains: [citreaTestnet],
  });

  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#fc960d",
            accentColorForeground: "black",
          })}
        >
          <div className="container">
            <Header />
            <Info />
            <ScrollPrompt />
            <CreateCapsule />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

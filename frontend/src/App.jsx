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

import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import CreateCapsulePage from "./components/CreateCapsulePage";
import UnclockCapsuleCard from "./components/UnlockCapsuleCards/UnclockCapsuleCard";

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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create-capsule" element={<CreateCapsulePage />} />
              <Route path="/unlock-capsules" element={<UnclockCapsuleCard />} />
            </Routes>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

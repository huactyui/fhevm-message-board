import type { Metadata } from "next";
import "./globals.css";
import { MetaMaskProvider } from "../../hooks/metamask/useMetaMaskProvider";
import { MetaMaskEthersSignerProvider } from "../../hooks/metamask/useMetaMaskEthersSigner";

export const metadata: Metadata = {
  title: "FHEVM Message Board",
  description: "Decentralized message board with FHEVM privacy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MetaMaskProvider>
          <MetaMaskEthersSignerProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
            {children}
          </MetaMaskEthersSignerProvider>
        </MetaMaskProvider>
      </body>
    </html>
  );
}

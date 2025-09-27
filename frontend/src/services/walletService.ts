import { ethers } from 'ethers';
import { WalletConnection, Transaction } from '@/types';
import { NETWORKS, TIMING_CONFIG, ERROR_MESSAGES } from '@/utils/constants';
import { apiClient } from './api';

declare global {
  interface Window {
    ethereum?: any;
    midnight?: any;
  }
}

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connect(): Promise<WalletConnection> {
    try {
      // Check if Midnight wallet or Ethereum wallet is available
      if (!window.ethereum && !window.midnight) {
        throw new Error('No wallet extension detected. Please install a wallet.');
      }

      let provider: ethers.BrowserProvider;

      // Prefer Midnight wallet if available
      if (window.midnight) {
        provider = new ethers.BrowserProvider(window.midnight);
      } else if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        throw new Error('No compatible wallet found');
      }

      // Request account access
      await provider.send('eth_requestAccounts', []);

      this.provider = provider;
      this.signer = await provider.getSigner();

      const address = await this.signer.getAddress();
      const balance = await this.getBalance(address);
      const network = await provider.getNetwork();

      const connection: WalletConnection = {
        isConnected: true,
        address,
        balance,
        network: network.name,
        provider: this.provider,
      };

      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
        window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
        window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
      }

      return connection;
    } catch (error: any) {
      throw new Error(error.message || ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
      window.ethereum.removeAllListeners('disconnect');
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      if (!this.provider) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      const balance = await this.provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get balance');
    }
  }

  async sendTransaction(transactionData: {
    to: string;
    amount: number;
    data?: string;
  }): Promise<Transaction> {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      const tx = await this.signer.sendTransaction({
        to: transactionData.to,
        value: ethers.parseEther(transactionData.amount.toString()),
        data: transactionData.data || '0x',
      });

      const transaction: Transaction = {
        id: tx.hash,
        hash: tx.hash,
        type: 'payment',
        from: await this.signer.getAddress(),
        to: transactionData.to,
        amount: transactionData.amount,
        status: 'pending',
        timestamp: new Date().toISOString(),
        metadata: {
          nonce: tx.nonce,
          gasLimit: tx.gasLimit?.toString(),
          gasPrice: tx.gasPrice?.toString(),
        },
      };

      // Wait for transaction confirmation in background
      this.waitForTransactionConfirmation(tx.hash);

      return transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Transaction failed');
    }
  }

  async getTransactions(address: string): Promise<Transaction[]> {
    try {
      // In a real implementation, this would fetch from the blockchain
      // For now, we'll fetch from our backend API
      const response = await apiClient.get(`/api/blockchain/transactions?address=${address}`);
      return response.transactions || [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch transactions');
    }
  }

  async switchNetwork(networkId: string): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkId }],
      });
    } catch (error: any) {
      // If network doesn't exist, try to add it
      if (error.code === 4902) {
        await this.addNetwork(networkId);
      } else {
        throw new Error(error.message || 'Failed to switch network');
      }
    }
  }

  async addNetwork(networkId: string): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      // Get network config (this would come from NETWORKS constant)
      const networkConfig = Object.values(NETWORKS).find(n => n.chainId === networkId);

      if (!networkConfig) {
        throw new Error('Unsupported network');
      }

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: networkConfig.chainId,
            chainName: networkConfig.name,
            rpcUrls: [networkConfig.rpcUrl],
            blockExplorerUrls: [networkConfig.blockExplorer],
            nativeCurrency: networkConfig.nativeCurrency,
          },
        ],
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add network');
    }
  }

  async signMessage(message: string): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign message');
    }
  }

  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      // For ethers v6, we use signTypedData
      const signature = await this.signer.signTypedData(domain, types, value);
      return signature;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign typed data');
    }
  }

  async estimateGas(transactionData: {
    to: string;
    amount: number;
    data?: string;
  }): Promise<{
    gasLimit: string;
    gasPrice: string;
    estimatedFee: number;
  }> {
    try {
      if (!this.provider || !this.signer) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      const gasLimit = await this.provider.estimateGas({
        to: transactionData.to,
        value: ethers.parseEther(transactionData.amount.toString()),
        data: transactionData.data || '0x',
      });

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      const estimatedFee = parseFloat(ethers.formatEther(gasLimit * gasPrice));

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        estimatedFee,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to estimate gas');
    }
  }

  async waitForTransactionConfirmation(hash: string): Promise<void> {
    try {
      if (!this.provider) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      // Wait for transaction to be mined
      const receipt = await this.provider.waitForTransaction(hash, 1, TIMING_CONFIG.API_TIMEOUT);

      if (receipt) {
        // Transaction confirmed, update backend
        await apiClient.patch(`/api/blockchain/transactions/${hash}`, {
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        });
      }
    } catch (error: any) {
      // Transaction failed, update backend
      await apiClient.patch(`/api/blockchain/transactions/${hash}`, {
        status: 'failed',
      });
      console.error('Transaction confirmation failed:', error);
    }
  }

  // Event handlers
  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      // User disconnected
      this.disconnect();
      window.location.reload();
    } else {
      // User switched accounts
      window.location.reload();
    }
  }

  private handleChainChanged(chainId: string): void {
    // Reload the page when chain changes
    window.location.reload();
  }

  private handleDisconnect(): void {
    this.disconnect();
    window.location.reload();
  }

  // Utility methods
  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  async getCurrentAccount(): Promise<string | null> {
    try {
      if (!this.signer) {
        return null;
      }
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }

  async getCurrentNetwork(): Promise<{ chainId: string; name: string } | null> {
    try {
      if (!this.provider) {
        return null;
      }
      const network = await this.provider.getNetwork();
      return {
        chainId: '0x' + network.chainId.toString(16),
        name: network.name,
      };
    } catch {
      return null;
    }
  }
}

export const walletService = new WalletService();
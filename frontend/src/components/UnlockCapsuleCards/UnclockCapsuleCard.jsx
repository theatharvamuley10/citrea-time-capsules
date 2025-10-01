import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { TIME_CAPSULE_ABI, TIME_CAPSULE_ADDRESS } from "../../constants";
import "./UnlockCapsulePage.css";

const UnlockCapsuleCard = () => {
  const { address, isConnected } = useAccount();
  const [capsules, setCapsules] = useState([]);
  const [isUnlocking, setIsUnlocking] = useState({});
  const [txHashes, setTxHashes] = useState({});

  const { writeContractAsync } = useWriteContract();

  // Read all beneficiary capsules
  const {
    data: beneficiaryCapsules,
    isError,
    isLoading,
    refetch,
  } = useReadContract({
    address: TIME_CAPSULE_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: "getAllBeneficiaryCapsules",
    args: [address],
    enabled: !!address,
  });

  useEffect(() => {
    if (beneficiaryCapsules) {
      // Convert the capsules data and add tokenIds
      const capsulesWithIds = beneficiaryCapsules.map((capsule, index) => ({
        ...capsule,
        tokenId: index + 1, // This is a simplified approach - you might need to track actual tokenIds
        btcAmount: capsule.btcAmount,
        unlockTimestamp: Number(capsule.unlockTimestamp),
        beneficiary: capsule.beneficiary,
        depositor: capsule.depositor,
      }));
      setCapsules(capsulesWithIds);
    }
  }, [beneficiaryCapsules]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUnlockable = (timestamp) => {
    return Date.now() / 1000 >= timestamp;
  };

  const handleUnlock = async (tokenId, capsule) => {
    if (!isUnlockable(capsule.unlockTimestamp)) {
      alert("This capsule is not ready to be unlocked yet!");
      return;
    }
    console.log("Starting unlock");

    setIsUnlocking((prev) => ({ ...prev, [tokenId]: true }));

    try {
      const tx = await writeContractAsync({
        address: TIME_CAPSULE_ADDRESS,
        abi: TIME_CAPSULE_ABI,
        functionName: "unlock",
        args: [BigInt(tokenId)],
      });

      setTxHashes((prev) => ({ ...prev, [tokenId]: tx }));

      // Refetch data after successful unlock
      setTimeout(() => {
        refetch();
      }, 2000);

      alert(`Capsule unlocked successfully! Transaction: ${tx}`);
    } catch (error) {
      console.error("Unlock failed:", error);
      alert(
        "Failed to unlock capsule: " + (error.reason || error.message || error)
      );
    } finally {
      setIsUnlocking((prev) => ({ ...prev, [tokenId]: false }));
    }
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="unlock-container">
        <div className="connect-wallet-message">
          <h2>Please connect your wallet to view your capsules</h2>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="unlock-container">
        <div className="loading-message">
          <h2>Loading your capsules...</h2>
        </div>
      </div>
    );
  }

  if (isError || !capsules || capsules.length === 0) {
    return (
      <div className="unlock-container">
        <div className="no-capsules-message">
          <h2>No capsules found</h2>
          <p>You don't have any time-locked capsules as a beneficiary.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="unlock-container">
      <h1 className="unlock-title">Your Time Capsules</h1>
      <div className="capsules-grid">
        {capsules.map((capsule, index) => {
          const tokenId = index + 1; // Simplified tokenId - you might need actual tokenId tracking
          const unlockable = isUnlockable(capsule.unlockTimestamp);
          const currentlyUnlocking = isUnlocking[tokenId];
          const txHash = txHashes[tokenId];

          return (
            <div
              key={tokenId}
              className={`capsule-card ${unlockable ? "unlockable" : "locked"}`}
            >
              <div className="capsule-header">
                <h3 className="capsule-id">Capsule #{tokenId}</h3>
                <div
                  className={`status-badge ${unlockable ? "ready" : "locked"}`}
                >
                  {unlockable ? "🔓 Ready" : "🔒 Locked"}
                </div>
              </div>

              <div className="capsule-details">
                <div className="detail-item">
                  <span className="detail-label">BTC Amount:</span>
                  <span className="detail-value btc-amount">
                    {formatEther(capsule.btcAmount)} BTC
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Unlock Date:</span>
                  <span className="detail-value">
                    {formatTimestamp(capsule.unlockTimestamp)}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Beneficiary:</span>
                  <span className="detail-value">
                    {truncateAddress(capsule.beneficiary)}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Depositor:</span>
                  <span className="detail-value">
                    {truncateAddress(capsule.depositor)}
                  </span>
                </div>
              </div>

              <div className="capsule-actions">
                <button
                  className={`unlock-btn ${
                    unlockable ? "enabled" : "disabled"
                  }`}
                  disabled={!unlockable || currentlyUnlocking}
                  onClick={() => handleUnlock(tokenId, capsule)}
                >
                  {currentlyUnlocking
                    ? "Unlocking..."
                    : unlockable
                    ? "Unlock Capsule"
                    : `Locked until ${formatTimestamp(
                        capsule.unlockTimestamp
                      )}`}
                </button>
              </div>

              {txHash && (
                <div className="tx-success">
                  <p>✨ Unlock transaction sent!</p>
                  <a
                    href={`https://explorer.citreatestnet.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View Transaction
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnlockCapsuleCard;

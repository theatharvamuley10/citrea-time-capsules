import React, { useState } from "react";
import "./CreateCapsule.css";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { TIME_CAPSULE_ABI, TIME_CAPSULE_ADDRESS } from "../../constants";

const CreateCapsule = ({ onSubmit }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState(undefined);

  // Prepare the write hook
  const { writeContractAsync } = useWriteContract();

  // Get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  const minDate = getTodayDateString();

  // Helper function to check if selected date is valid
  const isValidUnlockDate = (selectedDate) => {
    const now = new Date();
    const selected = new Date(selectedDate);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes in milliseconds

    // If it's today, check if it's at least 5 minutes from now
    if (selected.toDateString() === now.toDateString()) {
      // For today's date, we'll use current time + 5 minutes as the unlock time
      return true; // We'll handle the time adjustment in handleSubmit
    }

    // For future dates, it's always valid
    return selected > now;
  };

  // Main handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidUnlockDate(unlockDate)) {
      alert("Please select a valid unlock date");
      return;
    }

    setIsPending(true);

    try {
      const now = new Date();
      const selectedDate = new Date(unlockDate);
      let unlockTimestamp;

      // If the selected date is today, set unlock time to current time + 5 minutes
      if (selectedDate.toDateString() === now.toDateString()) {
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        unlockTimestamp = Math.floor(fiveMinutesFromNow.getTime() / 1000);
      } else {
        // For future dates, use the start of that day (midnight UTC)
        unlockTimestamp = Math.floor(selectedDate.getTime() / 1000);
      }

      const value = parseEther(amount); // ASSUMES BTC is using 18 decimals like ETH!

      const tx = await writeContractAsync({
        address: TIME_CAPSULE_ADDRESS,
        abi: TIME_CAPSULE_ABI,
        functionName: "deposit",
        args: [recipient, unlockTimestamp],
        value,
      });

      setTxHash(tx.hash);
      setIsPending(false);
      if (onSubmit)
        onSubmit({ recipient, amount, unlockDate, txHash: tx.hash });
      else alert(`Transaction sent! Hash: ${tx.hash}`);
    } catch (err) {
      setIsPending(false);
      alert("Failed to send: " + (err.reason || err.message || err));
    }
  };

  return (
    <div className="capsule-box-main">
      <div className="capsule-box">
        <h3 className="capsule-title">Create New Capsule</h3>
        <form className="capsule-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="capsule-input"
            placeholder="Enter Recipient's Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            pattern="^0x[a-fA-F0-9]{40}$"
            title="Hex address (e.g. 0x...)"
            required
          />
          <input
            type="number"
            className="capsule-input"
            placeholder="Enter BTC Amount"
            value={amount}
            min="0.0001"
            step="0.00000001"
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            type="date"
            className="capsule-input"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            min={minDate}
            required
          />
          <button type="submit" className="capsule-btn" disabled={isPending}>
            {isPending ? "Processing..." : "Create Capsule"}
          </button>
        </form>
        {unlockDate === getTodayDateString() && (
          <p
            className="capsule-info"
            style={{ fontSize: "0.9em", color: "#666", marginTop: "10px" }}
          >
            📅 Selected today's date - unlock time will be set to 5 minutes from
            now
          </p>
        )}
        {txHash && (
          <p className="capsule-tx">
            ✨ Capsule creation tx sent! <br />{" "}
            <a
              href={`https://explorer.citreatestnet.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash}
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateCapsule;

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

  // Calculate tomorrow's date in YYYY-MM-DD format
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };
  const minDate = getTomorrowDateString();

  // Main handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const unixTimestamp = Math.floor(new Date(unlockDate).getTime() / 1000); // to seconds
      const value = parseEther(amount); // ASSUMES BTC is using 18 decimals like ETH!

      const tx = await writeContractAsync({
        address: TIME_CAPSULE_ADDRESS,
        abi: TIME_CAPSULE_ABI,
        functionName: "deposit",
        args: [recipient, unixTimestamp],
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
        <h2 className="capsule-title">Create new Capsule..</h2>
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
            min="0"
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

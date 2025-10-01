import React from "react";
import "./Info.css";
import { useNavigate } from "react-router-dom";

function Info() {
  const navigate = useNavigate();

  return (
    <div className="info">
      <h1 className="info-title">
        Bitcoin's Future,
        <br />
        Tokenized!
      </h1>
      <div className="usecases-list">
        <section className="usecase">
          <h2 className="usecase-title">Create a Digital Inheritance</h2>
          <p className="usecase-desc">
            Securely gift future Bitcoin to your family and loved ones,
            <br />
            unlocked on the exact date you choose.
          </p>
        </section>

        <section className="usecase">
          <h2 className="usecase-title">Cure Your Panic Selling</h2>
          <p className="usecase-desc">
            Commit to your long-term vision by locking your own BTC in a
            personal vault,
            <br />
            making it immune to panic selling.
          </p>
        </section>

        <section className="usecase">
          <h2 className="usecase-title">Access Instant Liquidity</h2>
          <p className="usecase-desc">
            Sell your time-locked position on any NFT marketplace
            <br />
            to get capital today for your future Bitcoin.
          </p>
        </section>
      </div>
      <div>
        <button
          className="navigation-btn create-capsule-btn"
          onClick={() => navigate("/create-capsule")}
        >
          Create Capsules →
        </button>
        <button
          className="navigation-btn unlock-capsule-btn"
          onClick={() => navigate("/unlock-capsules")}
        >
          Unclock Capsules →
        </button>
      </div>
    </div>
  );
}

export default Info;

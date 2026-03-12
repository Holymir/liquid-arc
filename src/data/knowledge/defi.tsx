import type { KnowledgeTopic } from "./index";

export const defiTopic: KnowledgeTopic = {
  slug: "defi",
  title: "DeFi",
  description:
    "Understand decentralized finance — from core principles and building blocks to the risks every participant should know.",
  categories: [
    {
      label: "Foundations",
      subtopics: [
        {
          slug: "decentralization-self-custody",
          title: "Decentralization & Self-Custody",
          summary:
            "Why removing intermediaries matters and what it means to truly own your assets.",
          content: () => (
            <>
              <h2>What Is Decentralization?</h2>
              <p>
                In traditional finance, banks and brokerages act as trusted middlemen. Decentralization
                replaces these intermediaries with open networks of computers that follow transparent
                rules enforced by code. No single entity can freeze your funds, censor transactions,
                or change the rules unilaterally.
              </p>

              <h2>Self-Custody Explained</h2>
              <p>
                Self-custody means <em>you</em> hold the private keys that control your assets — not
                an exchange or custodian. This is often summarized as{" "}
                <strong>&ldquo;not your keys, not your coins.&rdquo;</strong>
              </p>
              <ul>
                <li>You interact with the blockchain directly through a wallet (e.g., MetaMask, Rabby).</li>
                <li>You sign every transaction yourself — no one can move funds without your approval.</li>
                <li>If you lose your seed phrase, there is no customer-support hotline to call.</li>
              </ul>

              <div className="glass-card rounded-xl p-4 my-4">
                <p className="text-arc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Key Takeaway
                </p>
                <p className="text-slate-300 text-sm">
                  Decentralization gives you sovereignty over your assets, but that power comes with
                  full responsibility for security and key management.
                </p>
              </div>

              <h2>Why It Matters for DeFi</h2>
              <p>
                Every protocol in DeFi builds on this foundation. When you provide liquidity, take a
                loan, or swap tokens, you are interacting with smart contracts from a self-custodied
                wallet — no permission required, no bank hours, no geographic restrictions.
              </p>
            </>
          ),
        },
        {
          slug: "smart-contracts",
          title: "Smart Contracts",
          summary:
            "Self-executing code on the blockchain that powers every DeFi protocol.",
          content: () => (
            <>
              <h2>What Are Smart Contracts?</h2>
              <p>
                A smart contract is a program stored on a blockchain that automatically executes when
                predetermined conditions are met. Think of it as a vending machine: insert the right
                input, and the output is guaranteed — no human operator needed.
              </p>

              <h2>How They Work</h2>
              <ul>
                <li>Written in languages like Solidity (Ethereum) or Rust (Solana).</li>
                <li>Deployed to the blockchain where they become immutable — the code cannot be changed.</li>
                <li>Anyone can read the code and verify exactly what it does.</li>
                <li>Execution is deterministic: the same inputs always produce the same outputs.</li>
              </ul>

              <h2>Smart Contracts in DeFi</h2>
              <p>
                Every DeFi primitive — token swaps, lending pools, yield vaults — is a smart contract
                (or set of contracts) that holds assets and enforces rules without a central operator.
                Users interact by sending transactions that call specific functions on these contracts.
              </p>

              <div className="glass-card rounded-xl p-4 my-4">
                <p className="text-arc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Key Takeaway
                </p>
                <p className="text-slate-300 text-sm">
                  Smart contracts are the engine of DeFi — they replace human intermediaries with
                  transparent, auditable, self-enforcing code.
                </p>
              </div>
            </>
          ),
        },
        {
          slug: "permissionless-access",
          title: "Permissionless Access",
          summary:
            "Anyone with an internet connection can participate — no application or approval needed.",
          content: () => (
            <>
              <h2>Finance Without Gatekeepers</h2>
              <p>
                In traditional finance, opening an account requires identity documents, credit checks,
                and approval from an institution. DeFi protocols are <em>permissionless</em> — anyone
                with a crypto wallet can use them, regardless of nationality, credit history, or net
                worth.
              </p>

              <h2>What Permissionless Means in Practice</h2>
              <ul>
                <li>No sign-up forms, KYC, or minimum balances to start.</li>
                <li>Protocols run 24/7 — there are no business hours or holidays.</li>
                <li>Developers can build on top of existing protocols without asking permission.</li>
                <li>Anyone can audit the code and verify the rules.</li>
              </ul>

              <h2>The Trade-Off</h2>
              <p>
                Permissionless access is a double-edged sword. It democratizes finance, but it also
                means there is no compliance layer filtering out scams or protecting users from their
                own mistakes. Personal due diligence is essential.
              </p>
            </>
          ),
        },
        {
          slug: "interoperability",
          title: "Interoperability",
          summary:
            "How DeFi protocols compose together like building blocks across chains.",
          content: () => (
            <>
              <h2>Composability: DeFi&rsquo;s Super-Power</h2>
              <p>
                DeFi protocols are designed to plug into one another. A lending protocol can accept
                LP tokens from a DEX as collateral, which themselves represent a position in a
                liquidity pool. This &ldquo;money legos&rdquo; composability lets developers build
                increasingly sophisticated products from simple primitives.
              </p>

              <h2>Cross-Chain Bridges</h2>
              <p>
                Assets and data can move between blockchains via bridges. This lets users access
                liquidity and protocols on multiple chains without selling and re-buying tokens.
                However, bridges are complex and have been the target of some of DeFi&rsquo;s
                largest exploits.
              </p>

              <h2>Standards That Enable Interoperability</h2>
              <ul>
                <li><strong>ERC-20</strong> — the universal token standard on Ethereum and EVM chains.</li>
                <li><strong>ERC-721 / ERC-1155</strong> — NFT standards used for position receipts and more.</li>
                <li><strong>ABIs</strong> — public interfaces that let contracts call each other.</li>
              </ul>
            </>
          ),
        },
        {
          slug: "transparency",
          title: "Transparency",
          summary:
            "Every transaction, balance, and line of code is publicly verifiable on-chain.",
          content: () => (
            <>
              <h2>Radical Openness</h2>
              <p>
                Unlike traditional finance where books are private and audits happen behind closed
                doors, every DeFi transaction is recorded on a public ledger. Anyone can verify
                balances, trace fund flows, and audit smart contract code in real-time.
              </p>

              <h2>What You Can Verify</h2>
              <ul>
                <li>Total value locked (TVL) in any protocol — down to the exact token amounts.</li>
                <li>Every swap, deposit, withdrawal, and liquidation ever executed.</li>
                <li>The full source code of audited contracts on block explorers like Etherscan.</li>
                <li>Governance proposals, votes, and treasury movements.</li>
              </ul>

              <div className="glass-card rounded-xl p-4 my-4">
                <p className="text-arc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Key Takeaway
                </p>
                <p className="text-slate-300 text-sm">
                  Transparency doesn&rsquo;t guarantee safety, but it gives you the tools to verify
                  rather than trust — a fundamental shift from traditional finance.
                </p>
              </div>
            </>
          ),
        },
      ],
    },
    {
      label: "Components",
      subtopics: [
        {
          slug: "dexs",
          title: "Decentralized Exchanges (DEXs)",
          summary:
            "Swap tokens directly from your wallet using automated liquidity pools.",
          content: () => (
            <>
              <h2>What Is a DEX?</h2>
              <p>
                A decentralized exchange lets users trade tokens directly with each other — or more
                precisely, with a smart-contract liquidity pool — without depositing funds into a
                centralized platform. Popular examples include Uniswap, Aerodrome, and Curve.
              </p>

              <h2>Automated Market Makers (AMMs)</h2>
              <p>
                Most DEXs use an AMM model rather than an order book. Liquidity providers deposit
                token pairs into pools, and a mathematical formula (e.g., <em>x × y = k</em>)
                determines the price. Traders swap against the pool and pay a small fee that goes to
                LPs.
              </p>

              <h2>Key Concepts</h2>
              <ul>
                <li><strong>Liquidity pools</strong> — paired token reserves that enable trading.</li>
                <li><strong>Slippage</strong> — price impact when your trade is large relative to the pool.</li>
                <li><strong>LP tokens</strong> — receipts proving your share of a pool.</li>
                <li><strong>Concentrated liquidity</strong> — LPs choose a price range (Uniswap V3+).</li>
              </ul>

              <div className="glass-card rounded-xl p-4 my-4">
                <p className="text-arc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Key Takeaway
                </p>
                <p className="text-slate-300 text-sm">
                  DEXs replace centralized order books with algorithmic pricing, giving you
                  non-custodial trading with full transparency.
                </p>
              </div>
            </>
          ),
        },
        {
          slug: "lending-borrowing",
          title: "Lending & Borrowing",
          summary:
            "Earn interest by lending or access capital by using your crypto as collateral.",
          content: () => (
            <>
              <h2>How DeFi Lending Works</h2>
              <p>
                Protocols like Aave and Compound let users deposit assets into lending pools to earn
                interest. Borrowers can take loans by posting collateral worth more than the loan
                amount (over-collateralization).
              </p>

              <h2>Key Mechanics</h2>
              <ul>
                <li><strong>Supply APY</strong> — the interest rate earned by depositors.</li>
                <li><strong>Borrow APY</strong> — the interest rate paid by borrowers.</li>
                <li><strong>Collateral factor</strong> — how much you can borrow against your deposit.</li>
                <li><strong>Liquidation</strong> — if your collateral drops below a threshold, it gets sold to repay the loan.</li>
              </ul>

              <h2>Flash Loans</h2>
              <p>
                A DeFi-native innovation: borrow any amount with <em>zero collateral</em>, as long as
                you repay within the same transaction. Used for arbitrage, collateral swaps, and
                self-liquidation.
              </p>
            </>
          ),
        },
        {
          slug: "stablecoins",
          title: "Stablecoins",
          summary:
            "Crypto tokens pegged to stable assets like the US dollar — the backbone of DeFi liquidity.",
          content: () => (
            <>
              <h2>Why Stablecoins Matter</h2>
              <p>
                Volatility makes raw crypto impractical for everyday finance. Stablecoins solve this
                by maintaining a 1:1 peg to a fiat currency (usually USD), giving DeFi a stable unit
                of account for trading, lending, and payments.
              </p>

              <h2>Types of Stablecoins</h2>
              <ul>
                <li><strong>Fiat-backed</strong> (USDC, USDT) — each token is backed by real dollars in a bank account.</li>
                <li><strong>Crypto-backed</strong> (DAI) — over-collateralized by volatile crypto assets in smart contracts.</li>
                <li><strong>Algorithmic</strong> — use supply/demand algorithms to maintain the peg (higher risk).</li>
              </ul>

              <h2>Risks to Watch</h2>
              <p>
                Not all stablecoins are created equal. Fiat-backed coins carry counterparty risk,
                crypto-backed ones can de-peg during extreme volatility, and algorithmic stablecoins
                have a mixed track record (Terra/UST collapse in 2022).
              </p>
            </>
          ),
        },
        {
          slug: "yield-farming-staking",
          title: "Yield Farming & Staking",
          summary:
            "Put your crypto to work — earn rewards by providing liquidity or securing networks.",
          content: () => (
            <>
              <h2>Liquidity Providing (LP)</h2>
              <p>
                At the heart of yield farming is <strong>liquidity providing</strong> — depositing
                token pairs into DEX pools so traders can swap against them. In return, LPs earn a
                share of every trading fee the pool generates. This is the primary way most DeFi
                users put idle assets to work.
              </p>

              <h2>How LP Positions Work</h2>
              <ul>
                <li><strong>Classic LP</strong> — deposit equal value of two tokens (e.g., ETH + USDC) across the full price range.</li>
                <li><strong>Concentrated liquidity</strong> — choose a specific price range to maximize fee capture with less capital (Uniswap V3, Aerodrome).</li>
                <li><strong>LP receipt tokens / NFTs</strong> — proof of your position, used to withdraw or stake for additional rewards.</li>
                <li><strong>Fee tiers</strong> — pools offer different fee levels (e.g., 0.01%, 0.05%, 0.3%, 1%) depending on pair volatility.</li>
              </ul>
              <p>
                Tighter ranges earn more fees per dollar deployed but require active management —
                if the price moves outside your range, your position stops earning until it returns.
              </p>

              <h2>Yield Farming</h2>
              <p>
                Yield farming takes LP a step further: protocols incentivize specific pools with
                bonus token rewards on top of trading fees. Farmers deposit LP positions into
                reward contracts (gauges, farms, vaults) to capture these extra emissions. Some
                vaults auto-compound rewards back into the LP position for hands-off growth.
              </p>

              <h2>Staking</h2>
              <p>
                Staking is locking tokens to help secure a proof-of-stake blockchain (like Ethereum)
                or to participate in a protocol&rsquo;s governance. In return, stakers earn rewards
                funded by network inflation or protocol fees. Unlike LP, staking typically involves
                a single asset and does not carry impermanent loss risk.
              </p>

              <h2>Key Metrics</h2>
              <ul>
                <li><strong>APR</strong> — annualized return without compounding.</li>
                <li><strong>APY</strong> — annualized return <em>with</em> compounding.</li>
                <li><strong>TVL</strong> — total value locked, a measure of how much capital a protocol holds.</li>
                <li><strong>Fee APR vs Reward APR</strong> — separate the sustainable trading-fee yield from temporary token emissions.</li>
                <li><strong>Emission schedule</strong> — how reward tokens are distributed over time (emissions decline, so today&rsquo;s APR won&rsquo;t last forever).</li>
              </ul>

              <div className="glass-card rounded-xl p-4 my-4">
                <p className="text-arc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Key Takeaway
                </p>
                <p className="text-slate-300 text-sm">
                  Liquidity providing is the backbone of DeFi yield. High APYs compensate for real
                  risks — impermanent loss, smart-contract bugs, and declining emissions. Always
                  check where the yield comes from and whether it&rsquo;s sustainable before
                  depositing.
                </p>
              </div>
            </>
          ),
        },
        {
          slug: "oracles",
          title: "Oracles",
          summary:
            "The bridges that feed real-world data into smart contracts.",
          content: () => (
            <>
              <h2>The Oracle Problem</h2>
              <p>
                Blockchains are isolated systems — they cannot natively access off-chain data like
                asset prices, weather, or sports scores. Oracles solve this by securely delivering
                external data to smart contracts.
              </p>

              <h2>How Oracles Work</h2>
              <ul>
                <li>A network of independent nodes fetches data from multiple sources.</li>
                <li>Nodes reach consensus on the correct value and submit it on-chain.</li>
                <li>Smart contracts read this data to make decisions (e.g., liquidation thresholds).</li>
              </ul>

              <h2>Why Oracles Are Critical</h2>
              <p>
                Lending protocols use price oracles to determine when loans are under-collateralized.
                DEXs use them for TWAP (time-weighted average price) calculations. A compromised
                oracle can lead to cascading liquidations or drained pools — making oracle security
                one of DeFi&rsquo;s highest priorities.
              </p>
            </>
          ),
        },
      ],
    },
    {
      label: "Risks",
      subtopics: [
        {
          slug: "smart-contract-bugs",
          title: "Smart Contract Bugs",
          summary:
            "Code vulnerabilities that can lead to lost funds — the most common DeFi risk.",
          content: () => (
            <>
              <h2>Why Bugs Are So Dangerous</h2>
              <p>
                Smart contracts hold real value and are often immutable once deployed. A single bug
                can let an attacker drain millions in seconds — and there is no customer support to
                reverse the transaction.
              </p>

              <h2>Common Vulnerability Types</h2>
              <ul>
                <li><strong>Reentrancy</strong> — a contract is called back before finishing its first execution.</li>
                <li><strong>Integer overflow/underflow</strong> — math errors that create tokens from nothing.</li>
                <li><strong>Access control</strong> — admin functions left unprotected.</li>
                <li><strong>Oracle manipulation</strong> — exploiting price feeds to trigger favorable conditions.</li>
                <li><strong>Flash loan attacks</strong> — using uncollateralized loans to exploit logic in a single transaction.</li>
              </ul>

              <h2>Mitigations</h2>
              <p>
                Reputable protocols undergo multiple audits, run bug bounty programs, and use formal
                verification. As a user, check whether a protocol is audited, how long it has been
                live, and how much TVL it holds before depositing.
              </p>
            </>
          ),
        },
        {
          slug: "volatility",
          title: "Volatility",
          summary:
            "Crypto prices can swing 20%+ in hours — understand how this affects DeFi positions.",
          content: () => (
            <>
              <h2>The Nature of Crypto Volatility</h2>
              <p>
                Crypto markets are young, thin, and trade 24/7 globally. This creates price swings
                that would be extreme by traditional market standards. A 10–20% daily move is not
                unusual for altcoins, and even major assets like ETH can see significant
                intraday volatility.
              </p>

              <h2>How Volatility Affects DeFi</h2>
              <ul>
                <li><strong>Liquidations</strong> — collateral drops below threshold and gets sold at a loss.</li>
                <li><strong>Impermanent loss</strong> — LP positions lose relative value during price swings.</li>
                <li><strong>Slippage</strong> — fast-moving prices cause worse execution on swaps.</li>
                <li><strong>Cascading effects</strong> — one liquidation can trigger more, accelerating the crash.</li>
              </ul>

              <h2>Managing Volatility Risk</h2>
              <p>
                Use conservative collateral ratios, set alerts for liquidation thresholds, diversify
                across uncorrelated assets, and consider stablecoin-heavy strategies during uncertain
                markets.
              </p>
            </>
          ),
        },
        {
          slug: "regulation",
          title: "Regulation",
          summary:
            "The evolving legal landscape around DeFi — what users and builders need to know.",
          content: () => (
            <>
              <h2>An Uncertain Regulatory Environment</h2>
              <p>
                DeFi exists in a regulatory gray area in most jurisdictions. Governments are still
                figuring out how to classify tokens, tax yields, and regulate protocols that have
                no legal entity behind them.
              </p>

              <h2>Key Regulatory Concerns</h2>
              <ul>
                <li><strong>Securities classification</strong> — some tokens may be considered unregistered securities.</li>
                <li><strong>Tax obligations</strong> — DeFi yields, swaps, and LP positions may all be taxable events.</li>
                <li><strong>AML/KYC requirements</strong> — regulators may mandate identity verification for DeFi front-ends.</li>
                <li><strong>Sanctions compliance</strong> — OFAC sanctions can affect protocol access (e.g., Tornado Cash).</li>
              </ul>

              <h2>What This Means for Users</h2>
              <p>
                Stay informed about your local regulations, maintain records of DeFi transactions
                for tax purposes, and be aware that regulatory changes could restrict access to
                certain protocols or create new compliance obligations.
              </p>
            </>
          ),
        },
        {
          slug: "impermanent-loss",
          title: "Impermanent Loss",
          summary:
            "The hidden cost of providing liquidity when token prices diverge.",
          content: () => (
            <>
              <h2>What Is Impermanent Loss?</h2>
              <p>
                Impermanent loss (IL) occurs when the price ratio of tokens in a liquidity pool
                changes compared to when you deposited. The larger the divergence, the more value
                you &ldquo;lose&rdquo; relative to simply holding the tokens.
              </p>

              <h2>How It Works</h2>
              <p>
                When you provide liquidity, the AMM rebalances your position to maintain the pricing
                formula. If one token&rsquo;s price rises sharply, the pool sells it and buys more
                of the cheaper token — meaning you end up with less of the appreciating asset than
                if you had just held.
              </p>

              <h2>The Numbers</h2>
              <ul>
                <li>1.25× price change → ~0.6% IL</li>
                <li>1.50× price change → ~2.0% IL</li>
                <li>2× price change → ~5.7% IL</li>
                <li>5× price change → ~25.5% IL</li>
              </ul>

              <div className="glass-card rounded-xl p-4 my-4">
                <p className="text-arc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Key Takeaway
                </p>
                <p className="text-slate-300 text-sm">
                  Impermanent loss is &ldquo;impermanent&rdquo; only if prices return to their
                  original ratio. If you withdraw while prices are diverged, the loss is realized.
                  Trading fees must outpace IL for an LP position to be profitable.
                </p>
              </div>
            </>
          ),
        },
        {
          slug: "decentralization-illusion",
          title: "Decentralization Illusion",
          summary:
            "Not all 'decentralized' protocols are truly decentralized — learn to spot the difference.",
          content: () => (
            <>
              <h2>The Spectrum of Decentralization</h2>
              <p>
                Many protocols market themselves as decentralized but retain significant centralized
                control. True decentralization is a spectrum, and understanding where a protocol
                falls on it is critical for assessing risk.
              </p>

              <h2>Red Flags to Watch</h2>
              <ul>
                <li><strong>Admin keys</strong> — can a multisig or single address upgrade contracts or drain funds?</li>
                <li><strong>Token concentration</strong> — is governance power held by a few wallets?</li>
                <li><strong>Centralized front-ends</strong> — the UI can be censored even if the contracts cannot.</li>
                <li><strong>Opaque governance</strong> — decisions made behind closed doors despite &ldquo;DAO&rdquo; branding.</li>
                <li><strong>Single points of failure</strong> — reliance on one oracle, one bridge, or one server.</li>
              </ul>

              <h2>How to Evaluate</h2>
              <p>
                Check whether contracts are upgradeable and by whom, review token distribution,
                read governance forum discussions, and look for time-locks on admin actions. The
                most trustworthy protocols minimize the trust required.
              </p>
            </>
          ),
        },
      ],
    },
  ],
};

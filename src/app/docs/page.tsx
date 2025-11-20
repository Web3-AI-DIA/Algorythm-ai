
export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:py-24">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">
          Algorythm AI Documentation
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Welcome to the official documentation for Algorythm AI. This guide provides everything you need to know to build, manage, and deploy your decentralized projects using the power of artificial intelligence.
        </p>

        <h2 className="font-headline" id="getting-started">Getting Started</h2>
        <p>Your journey begins by creating an account and understanding the credit system.</p>
        <h3 className="font-headline">1. Signing Up</h3>
        <p>You can create an account using your Email and Password, or by using a one-click sign-in with your Google or GitHub account. Upon successful registration, you are automatically granted <strong>5 free credits</strong> and <strong>5 free smart contract audits</strong> to get you started.</p>
        <h3 className="font-headline">2. The Credit System</h3>
        <p>Algorythm AI operates on a credit-based system. Actions that require significant AI computation consume credits. Here is the breakdown:</p>
        <ul>
          <li><strong>dApp & Crypto Builders:</strong> 3 credits to generate the initial plan, and 1 credit to generate the final code.</li>
          <li><strong>NFT Collection Builder:</strong> 5 credits for the first NFT in a collection, plus 1 credit for each additional NFT.</li>
          <li><strong>Smart Contract Audits:</strong> 2 credits per analysis (your first 5 are free).</li>
        </ul>
        <p>You can purchase more credits at any time via the "Pricing" page using Stripe or cryptocurrency through NOWPayments.</p>

        <hr className="my-12 border-border" />

        <h2 className="font-headline" id="builders">The AI Builders</h2>
        <p>The core of Algorythm AI is its suite of AI-powered project builders. Each builder follows a simple two-step process: describe your idea to get an AI-generated plan, and then approve the plan to have the AI generate the final assets.</p>
        <h3 className="font-headline">dApp Builder</h3>
        <p>This tool generates a complete, functional React component for a decentralized application. Simply describe the dApp you want to build. The AI can create components for various blockchains, including Ethereum-based chains (using ethers.js) and Tron (using tronweb). The builder features a live interactive preview of your component and a code editor to view the source.</p>
        <h3 className="font-headline">NFT Collection Builder</h3>
        <p>Generate unique NFT collections, including both metadata and artwork. Describe your collection's theme and style, and the powerful "Nano Banana" AI model will create unique images and attributes for each NFT. Your generated images are automatically saved to your account's secure storage.</p>
        <h3 className="font-headline">Cryptocurrency Builder</h3>
        <p>Design your own cryptocurrency. The AI first generates a detailed plan covering tokenomics and smart contract features. Upon your approval, it generates a complete and secure Solidity smart contract for your new token, which you can then take to deploy on a blockchain.</p>
        
        <hr className="my-12 border-border" />

        <h2 className="font-headline" id="dashboard">Project Dashboard</h2>
        <p>All of your generated projects—dApps, NFT collections, and cryptocurrencies—are automatically saved to your personal dashboard. You can access the dashboard from your user menu to view, manage, and copy the code for any project you've created.</p>

        <h2 className="font-headline" id="testing">Smart Contract Testing</h2>
        <p>The Smart Contract Testing Framework is an advanced tool for developers. Paste your Solidity code into the analyzer, and the AI will perform a comprehensive audit. It provides a simulated test report, a detailed gas usage estimate for deployment and function calls, and a list of actionable recommendations to improve security and optimize gas costs.</p>

      </div>
    </div>
  );
}

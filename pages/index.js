import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/utilities.module.css'
import Link from 'next/link'
import Footer from './components/footer.js'
import { motion } from 'framer-motion'

import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import Web3Modal from "web3modal"

import { nftaddress, AVALANCHE_TESTNET_PARAMS, AVALANCHE_MAINNET_PARAMS } from '../config'
import NFT from '../abi.json';

export default function Home() {
  const [metamaskState, setMetamaskState] = useState('not-set');
  const [accountAddress, setAccountAddress] = useState("not-set");
  const [userBalance, setUserBalance] = useState('-');
  const [tokenId, setTokenId] = useState('0');
  const [userRewards, setUserRewards] = useState("0");
  const [mintAmount, setMintAmount] = useState(1);
  const [showburger, setShowBurger] = useState(false);
  // setLoadingState(

  useEffect(() => {
    checkWeb3();
    addAvalancheNetwork();
  });

  useEffect(() => {
    getUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  useEffect(() => {
    console.log(metamaskState);
  }, [metamaskState]);

  useEffect(() => {
    getCurrentTokenId();
  }, [tokenId]);

  useEffect(() => {
    getUserRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMintAmount(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function showBurgerMenu() {
    setShowBurger(!showburger);
  }

  async function checkWeb3() {
    // Check if Web3 has been injected by the browser (Mist/MetaMask).
    if (typeof web3 !== 'undefined') {
      console.log("metamask found");
    } else {
      setMetamaskState('not-set');
      console.log("metamask not found");
      window.alert("Please install Metamask Wallet to use this site.");
    }
  }

  function updateMintAmount(event) {
    setMintAmount(event.target.value);
  }

  async function addAvalancheNetwork() {
    if (typeof web3 === 'undefined') {
      console.log("web3 is undefined dog")
      return;
    }
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [AVALANCHE_MAINNET_PARAMS],
      });
      setMetamaskState('set');
    } catch (switchErr) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [AVALANCHE_MAINNET_PARAMS],
        });
        setMetamaskState('set');
      } catch (addErr) {
        setMetamaskState('not-set');
        window.alert("Metamask is already waiting for your approval to switch Avalanche. Please check your Metamask extension in the browser.");
        console.log(addErr)
      }
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    provider.on("network", (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        window.location.reload();
      }
    });
  };

  async function getUserInfo() {

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    if (accounts[0] !== undefined) {
      setAccountAddress(account);
      getUserBalance(account);
    } else {
      setMetamaskState('not-set');
    }
    console.log("user info fetched!");
    window.ethereum.on('accountsChanged', async function (accounts) {
      // Time to reload your interface with accounts[0]!
      setAccountAddress(accounts[0]);
      getUserBalance(accounts[0]);
      getUserRewards();
    })
  }

  async function getUserBalance(account) {
    const balance = await window.ethereum.request({ method: 'eth_getBalance', params: [account] });
    let formatBalance = await ethers.utils.formatEther(balance);
    if (formatBalance.includes('.')) {
      const parts = formatBalance.split('.');
      formatBalance = parts[0] + '.' + parts[1].slice(0, 2);
    }
    setUserBalance(formatBalance.toString() + " AVAX");
  }

  async function mintNFT() {

    const web3Modal = new Web3Modal({
      network: "fuji",
      cacheProvider: true
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftaddress, NFT.abi, signer);

    const currentTokenId = await contract.getCurrentTokenId();
    if (currentTokenId < 7000) {
      let price;
      try {
        price = await contract.mintPrice();
      } catch (e) {
        console.log(e);
      }

      let mintFee_format = await ethers.utils.formatEther(price);
      mintFee_format *= mintAmount;
      let mintFee = await ethers.utils.parseEther(mintFee_format.toString());

      try {
        const transaction = await contract.summonVampire(mintAmount, { value: mintFee });
        await transaction.wait();
        console.log("minting is complete!");
      } catch (e) {
        if (e.data.message.toString().includes("insufficient funds")) {
          window.alert("Insufficent funds in your wallet! You need: " + mintFee_format.toString() + " AVAX!");
        }
        window.alert(e.data.message.toString());
      }

    } else {
      window.alert("All vampires have been minted!");
      return 0;
    }
    // const currentTokenId = await contract.getCurrentTokenId();
    setTokenId(currentTokenId.toString());
    getUserRewards();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    getUserBalance(account);

  }

  async function claimReward() {
    const web3Modal = new Web3Modal({
      network: "fuji",
      cacheProvider: true
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftaddress, NFT.abi, signer);

    const transaction = await contract.claimRewardAll();
    await transaction.wait();

    getUserRewards();
  }

  async function getCurrentTokenId() {
    const web3Modal = new Web3Modal({
      network: "fuji",
      cacheProvider: true
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftaddress, NFT.abi, signer);
    const currentTokenId = await contract.getCurrentTokenId();
    setTokenId(currentTokenId.toString());
    console.log("Current minted amount:" + currentTokenId.toString());

    // return currentTokenId.toString();
  }

  async function getUserRewards() {

    const web3Modal = new Web3Modal({
      network: "fuji",
      cacheProvider: true
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftaddress, NFT.abi, signer);
    const reward = await contract.getEarnedAmountAll();

    let formatReward = await ethers.utils.formatEther(reward);
    if (formatReward.includes('.')) {
      const parts = formatReward.split('.');
      formatReward = parts[0] + '.' + parts[1].slice(0, 2);
    }

    setUserRewards(formatReward.toString() + " AVAX");

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    getUserBalance(account)
  }

  return (
    <>
      <Head>
        <title>Chained Vampires | Home</title>
        <link rel="shortcut icon" href="/logo.png" sizes="250x250" />
        <meta httpEquiv='Content-Type' content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
        <meta name="description" content="Chained Vampires NFT collection on Avalanche blockchain. 20% minting fee reflection to all holders, marketplace reflections, bite mechanics and many more. Enter the vampire legion of the metaverse!" />
        <link
          rel="preload"
          href="/fonts/Cinzel/Cinzel-Black.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Cinzel/Cinzel-Bold.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Cinzel/Cinzel-ExtraBold.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Cinzel/Cinzel-Medium.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Cinzel/Cinzel-Regular.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Cinzel/Cinzel-SemiBold.ttf"
          as="font"
          crossOrigin=""
        />
      </Head>

      <main>
        <section className={styles.headerclass} id="home">
          <nav>
            <div className={styles.logosection}>
              <Link href="#home">
                <a>
                  <Image src="/logo2.png" alt="site logo" width={400} height={200} />
                </a>
              </Link>
            </div>

            <div className={styles.navlinks}>
              <i className="fas fa-bars"></i>
              <ul className={styles.navlinksul}>
                <li className={styles.navlinksulli}>
                  <Link href="#home">
                    <a className={styles.navlinksullia}>
                      Home
                    </a>
                  </Link>
                </li>
                <li className={styles.navlinksulli}>
                  <Link href="/inventory">
                    <a className={styles.navlinksullia}>
                      Inventory
                    </a>
                  </Link>
                </li>
                <li className={styles.navlinksulli}>
                  <div className={styles.navlinksulliaDisabled}>Marketplace</div>
                </li>

                <span className={styles.claim}>
                  Rewards :
                  {userRewards}
                  {/* <button className={styles.claimb} onClick={() => { claimReward() }}> */}
                  <button disabled className={styles.claimbdis} onClick={() => { claimReward() }}>
                    CLAIM
                  </button>
                </span>
              </ul>
            </div>

            <div className={styles.hamburgerMenu} onClick={() => showBurgerMenu()}>
              <Image src="/menuicon.png" alt="menuicon" width={45} height={30} />
              {
                showburger &&
                <div className={styles.dropdownContent}>
                  <Link href="#home">
                    <a className={styles.dropdownContentA}>
                      Home
                    </a>
                  </Link>
                  <Link href="/inventory">
                    <a className={styles.dropdownContentA}>
                      Inventory
                    </a>
                  </Link>
                </div>
              }

            </div>
          </nav>

          <div className={styles.textbox}>
            <motion.div initial="hidden" animate="visible" variants={{
              hidden: {
                scale: .8,
                opacity: 0
              },
              visible: {
                scale: 1,
                opacity: 1,
                transition: {
                  delay: .4
                }
              }
            }}>
              <h1 className={styles.textboxh1}> THE TIME HAS COME FOR </h1>
              <h1 className={styles.textbox2h1}> VAMPIRES </h1>
              <h2> ON AVALANCHE COMMUNITY </h2>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={{
              hidden: {
                scale: .8,
                opacity: 0
              },
              visible: {
                scale: 1,
                opacity: 1,
                transition: {
                  delay: .6
                }
              }
            }}>
              <div>{(metamaskState === "not-set" || accountAddress === "not-set") ?
                <button className={styles.herobtn} onClick={() => addAvalancheNetwork()} > Switch to Avalanche </button> :
                <div>
                  <h2 className={styles.pclass5}>Connected Address:
                    <p className={styles.pclass6}>{accountAddress}</p>
                  </h2>

                  <h2 className={styles.pclass5}>Balance:
                    <p className={styles.pclass6}>{userBalance}</p>
                    <Image src="/avax.png" alt="avax" width={30} height={30} />
                  </h2>

                </div>
              }
              </div>
              <h1 className={styles.mintOpenDate}> MINTING IS AVAILABLE ON: </h1>
              <h1 className={styles.mintOpenDate2}> 11/11/21 </h1>
            </motion.div>

          </div>

        </section>


        <section className={styles.mintitems} id="mint">

          <div className={styles.mintitemsimgdiv}>
            <Image className={styles.mintitemsimg} objectFit="contain" src="/giphy.gif" alt="vamp gif" width={450}
              height={450} />
          </div>

          <div className={styles.mttext}>
            <h1> {tokenId} / 7000 <br /> VAMPIRES MINTED</h1>
          </div>

          <div className={styles.mtbox}>
            <div className={styles.mtboxA}>
              <input onKeyDown={(e) => { e.preventDefault() }} id="mintBar" className={styles.inputclass} type="number" min="1" max="20" value={mintAmount} onChange={(event) => updateMintAmount(event)} />
            </div>

            <div >{metamaskState == 'set' ?
              <button disabled className={styles.vampbuttondisabled} onClick={() => mintNFT()}>SUMMON</button> :
              ""}
            </div>

          </div>

          <h1 className={styles.mttext}> 1 AVAX / Vampire <br />
            <Image src='/promo.png' alt="promo" width={350} height={120} />
          </h1>


        </section>

        <section className={styles.about} id="about">

          <h1 className={styles.h1class}>  About  </h1>

          <h1 className={styles.pclass3}>
            7000 algorithmically generated vampires <br />are chained on Avalanche network
          </h1>

          <div className={styles.row}>
            <div className={styles.aboutcol}>
              <h3>TOKENOMICS</h3>
              <p className={styles.pclass}>
                Reflectionary minting system distributes<span className={styles.pclassWhite}>20%</span>of each minting fee to all existing vampires.
              </p>
              <p className={styles.pclass}>
                Vampires care a lot about their original minters. Minter gains<span className={styles.pclassWhite}>%5</span>life-time royalty.
              </p>
              <p className={styles.pclass}>
                Each sale in the Market Place reflects<span className={styles.pclassWhite}>%4</span>distributed to all owners.
              </p>
              <p className={styles.pclassWhite}>
                Earlier you mint and more Vampires you have, more AVAX reflections you get.
              </p>
            </div>

            <div className={styles.aboutcol}>
              <h3>MECHANICS</h3>
              <p className={styles.pclass}>Each vampire has born with an unique DNA, unalterable in anyway.</p>
              <p className={styles.pclass}>This means that your vampire may turn humans (or apes) into rarest vampires in near future.</p>
              <p className={styles.pclass}>This also means that your vampire may win toughest encounters in the cold metaverse.</p>
              <p className={styles.pclassWhite}>Rarest vampires also have rarest DNAs! </p>
            </div>

            <div className={styles.aboutcol}>
              <h3>WHY ?</h3>
              <p className={styles.pclass}>
                Low minting fee:<span className={styles.pclassWhite}>1 AVAX</span></p>
              <p className={styles.pclass}>
                High reflection rates.</p>
              <p className={styles.pclass}>
                Long term vision to be the most respected Vampire legion of the metaverse.</p>
              <p className={styles.pclass}>
                Verified contract code is publicly available and can be viewed through C-Chain Explorer</p>
              <p className={styles.pclassWhite}>Safely pinned on IPFS. <br /> No human can take them away!</p>
            </div>
          </div>
        </section>

        <section className={styles.races}>
          <h1 className={styles.racesh1}> RARITIES </h1>
          <p className={styles.pclass4}>All vampires benefit from same Tokenomics.</p>
          <p className={styles.pclass4}>Still, some races have extremely rare attributes and DNA!</p>
          <div className={styles.racesTable}>
            <Image src="/racestrim.png" alt="raceRarity" width={720} height={300} />
          </div>
        </section>

        <section className={styles.roadmap}>
          <h1 className={styles.racesh1}> Roadmap</h1>
          <h2 className={styles.pclass4}> ACT-1</h2>
          <Image src="/roadmap.png" alt="roadmap" width={3983} height={1125} />
        </section>

        <section className={styles.familyTree}>
          <h1 className={styles.familyh1}> RACES</h1>
          <p className={styles.pclass4}>Each vampire is unique. Some attributes are only available to certain races.</p>
          <p className={styles.pclass4}>Over 200 different attributes available for both male and female vampires.</p>
          {/* <Image src="/racetree.png" alt="raceTree" width={2000} height={2300} /> */}
          <div className={styles.familyImages}>

            <div className={styles.nftimageDiv} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/sc-m.png" alt="loading" width={300} height={300} objectFit="cover" />
                <p className={styles.nftLabel}>Scavenger Male</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDiv} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/sc-f.png" alt="loading" width={300} height={300} objectFit="cover" />
                <p className={styles.nftLabel}>Scavenger Female</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDiv} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/pre-m.png" alt="loading" width={300} height={300} objectFit="cover" />
                <p className={styles.nftLabel}>Predator Male</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDiv} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/pre-f.png" alt="loading" width={300} height={300} objectFit="cover" />
                <p className={styles.nftLabel}>Predator Female</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDiv} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/nos-m.png" alt="loading" width={300} height={300} objectFit="cover" />
                <p className={styles.nftLabel}>Nosferatu Male</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDiv} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/nos-f.png" alt="loading" width={300} height={300} objectFit="cover" />
                <p className={styles.nftLabel}>Nosferatu Female</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDiv} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/eld-m.png" alt="loading" width={300} height={300} objectFit="cover" />
                <p className={styles.nftLabel}>Elder Male</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDiv} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/eld-f.png" alt="loading" width={300} height={300} objectFit="cover" />
                <p className={styles.nftLabel}>Elder Female</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDivDrx} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/drx-m.png" alt="loading" width={350} height={350} objectFit="cover" />
                <p className={styles.nftLabel}>Draxo Male</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDivDrx} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/drx-f.png" alt="loading" width={350} height={350} objectFit="cover" />
                <p className={styles.nftLabel}>Draxo Female</p>
              </motion.div>
            </div>

            <div className={styles.nftimageDivDrx} >
              <motion.div whileHover={{
                scale: 1.1,
                transition: { duration: .5 },
              }}
                whileTap={{ scale: 1.12 }}>
                <Image className={styles.nftImages2} src="/DRACULA.png" alt="loading" width={400} height={400} objectFit="cover" />
                <p className={styles.nftLabel}>LORD DRACULA</p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className={styles.team}>
          <h1 className={styles.racesh1}>
            FAQ!
          </h1>

          <div className={styles.teamDiv}>
            <div className={styles.teamPicsDiv} >
              <Image className={styles.teamPics} src="/onat.png" alt="candost" width={200} height={200} />
            </div>
            <p className={styles.faqp1}> Where can I see my Vampires?
              <p className={styles.teamP}> Your NFT will be minted on Avalanche C-Chain.<br />
                You can see it on any platform that is connected to Avalanche.<br />
                Such as: Metamask Wallet, C-Chain explorer, <br />
                NFT marketplaces and Inventory.<br />
              </p>
            </p>
          </div>

          <div className={styles.teamDiv}>
            <div className={styles.teamPicsDiv} >
              <Image className={styles.teamPics} src="/ozi2.png" alt="onat" width={200} height={200} />
            </div>
            <p className={styles.faqp1}> How can I claim my rewards?
              <p className={styles.teamP}> You can claim your rewards anytime from the home page.<br />
                Reflections will be instantly added to your Rewards balance. <br />
                Claimed rewards will be transferred into your connected wallet.
              </p>
            </p>
          </div>

          <div className={styles.teamDiv}>
            <div className={styles.teamPicsDiv} >
              <Image className={styles.teamPics} src="/cang.png" alt="ozan" width={200} height={200} />
            </div>
            <p className={styles.faqp1}> What can I do with my Vampires?
              <p className={styles.teamP}> You have the full ownership of your Vampires. <br />
                Gain passive income, generate new vampires (soon), <br />
                Sell it on marketplace, keep it for act-2... Up to you!
              </p>
            </p>
          </div>

          <div className={styles.teamDiv}>
            <div className={styles.teamPicsDiv} >
              <Image className={styles.teamPics} src="/faq4.png" alt="faq4" width={200} height={200} />
            </div>
            <p className={styles.faqp1}> Is it safe?
              <p className={styles.teamP}>
                <Link href="https://cchain.explorer.avax.network/address/0x3E97E567A8d91eB4e888aEFbadaC1a7dC90Fcdac/contracts">
                  <a className={styles.teamP}>
                    Check our verified contract here!
                  </a> 
                </Link>
                <br />
                We are not audited yet but most of the code inherited from 
                <br />audited libraries.

              </p>
            </p>
          </div>

        </section>

        {/* <section className={styles.team}>
          <h1 className={styles.racesh1}>
            Team
          </h1>

          <div className={styles.teamDiv}>
            <div className={styles.teamPicsDiv} >
              <Image className={styles.teamPics} src="/onat.png" alt="candost" width={200} height={200} />
              <p className={styles.pclass}>Can</p>
            </div>
            <p className={styles.teamP}>Can is web3 developer and systems engineer. <br />
              He builds our tech infrastructure.<br />
              He is obessed with decentralized web and believes that <br />the future of web3 will be on Avalanche. <br />
              <Link href="https://twitter.com/metalarm_">
                <a>
                  <Image src="/twitter.png" width={30} height={30} alt="twt" />
                </a>
              </Link>
            </p>
          </div>

          <div className={styles.teamDiv}>
            <div className={styles.teamPicsDiv} >
              <Image className={styles.teamPics} src="/ozi2.png" alt="onat" width={200} height={200} />
              <p className={styles.pclass}>Onat</p>
            </div>
            <p className={styles.teamP}>Onat is digital artist and NFT creator.<br />
              Our vampires came to life within his hands. <br />
              He is the Picasso of dark fantasy art. <br />
              <Link href="https://www.instagram.com/onatzeber/">
                <a>
                  <Image src="/ig-ico.png" width={30} height={30} alt="ig" />
                </a>
              </Link>
            </p>
          </div>

          <div className={styles.teamDiv}>
            <div className={styles.teamPicsDiv} >
              <Image className={styles.teamPics} src="/cang.png" alt="ozan" width={200} height={200} />
              <p className={styles.pclass}>Ozan</p>
            </div>
            <p className={styles.teamP}>Ozan is a pianist, but better at creating awesome UIs. <br />
              He also manages community events and makes sure that<br /> everyone is well-fed in this clan. <br />
              <Link href="https://twitter.com/AkifOzancan">
                <a>
                  <Image src="/twitter.png" width={30} height={30} alt="twt" />
                </a>
              </Link>
            </p>

          </div>
        </section> */}

        <Footer />
      </main>
    </>

  )
}

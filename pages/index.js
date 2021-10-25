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
  // setLoadingState(

  useEffect(() => {
    checkWeb3();
    addAvalancheNetwork();
  }, []);

  useEffect(() => {
    getUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(metamaskState);
  }, [metamaskState]);

  useEffect(() => {
    getCurrentTokenId();
  }, []);

  useEffect(() => {
    getUserRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMintAmount(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    if (typeof web3 === 'undefined') {  // For browsers that has no metamask installed (for example: safari)
      return;
    }
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [AVALANCHE_TESTNET_PARAMS],
      });
      setMetamaskState('set');
    } catch (switchErr) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [AVALANCHE_TESTNET_PARAMS],
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

    let price;
    try {
      price = await contract.mintPrice();
    } catch (e) {
      console.log(e);
    }

    let mintFee = await ethers.utils.formatEther(price);
    mintFee *= mintAmount;
    mintFee = await ethers.utils.parseEther(mintFee.toString());

    const transaction = await contract.summonVampire(mintAmount, { value: mintFee });
    await transaction.wait();
    console.log("minting is complete!");

    const currentTokenId = await contract.getCurrentTokenId();
    console.log(currentTokenId.toString());
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
        <meta name="keywords" content="vampires" />
      </Head>

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
              {/* <li className={styles.navlinksulli}>
                <Link href="#mint">
                  <a className={styles.navlinksullia}>
                    Mint
                  </a>
                </Link>
              </li>
              <li className={styles.navlinksulli}>
                <Link href="#about">
                  <a className={styles.navlinksullia}>
                    About
                  </a>
                </Link>
              </li> */}
              <li className={styles.navlinksulli}>
                <Link href="/inventory">
                  <a className={styles.navlinksullia}>
                    Inventory
                  </a>
                </Link>
              </li>
              <li className={styles.navlinksulli}>
                {/* <Link href="/marketplace" >
                  <a className={styles.navlinksullia}> */}
                <div className={styles.navlinksulliaDisabled}>Marketplace</div>
                {/* </a>
                </Link> */}
              </li>

              <span className={styles.claim}>
                Rewards :
                {userRewards}
                <button className={styles.claimb} onClick={() => { claimReward() }}>
                  CLAIM
                </button>
              </span>
            </ul>
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
            <input onKeyDown={(e) => {e.preventDefault()}} id="mintBar" className={styles.inputclass} type="number" min="1" max="20" value={mintAmount} onChange={(event) => updateMintAmount(event)} />
          </div>

          <div >{metamaskState == 'set' ?
            <button className={styles.vampbutton} onClick={() => mintNFT()}>SUMMON</button> :
            ""}</div>


        </div>

        <h1 className={styles.mttext}> 1.5 AVAX / Vampire </h1>
        <p className={styles.mttext2}> Summon 5 at once: receive 1 more </p>
        <p className={styles.mttext2}> Summon 10 at once: receive 2 more</p>
        <p className={styles.mttext2}> Summon 15 at once: receive 4 more</p>
        <p className={styles.mttext2}> Summon 20 at once: receive 6 more</p>

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
              Reflectionary minting system distributes<span className={styles.pclassWhite}>12%</span>of each minting fee to all existing vampires.
            </p>
            <p className={styles.pclass}>
              Vampires care a lot about their original minters. Minter gains <span className={styles.pclassWhite}>%2</span>life-time royalty.
            </p>
            <p className={styles.pclass}>
              Each sale in the Market Place reflects<span className={styles.pclassWhite}>%4</span>distributed to all owners.
            </p>
            <p className={styles.pclassWhite}>
              Earlier you mint and more Vampire you have, more AVAX reflections you get.
            </p>
          </div>

          <div className={styles.aboutcol}>
            <h3>MECHANICS</h3>
            <p className={styles.pclass}>Each vampire has born with an unique DNA, unalterable in anyway.</p>
            <p className={styles.pclass}>This means that your vampire may turn humans (or apes) into rarest vampires in near future.</p>
            <p className={styles.pclass}>This also means that your vampire may win thoughest encounters in the cold metaverse.</p>
            <p className={styles.pclassWhite}>Rarest vampires also have rarest DNAs! </p>
          </div>

          <div className={styles.aboutcol}>
            <h3>WHY ?</h3>
            <p className={styles.pclass}>
              Low minting fee:<span className={styles.pclassWhite}>1.5 AVAX</span></p>
            <p className={styles.pclass}>
              High reflection rates.</p>
            <p className={styles.pclass}>
              Fair token distribution.<span className={styles.pclassWhite}>No whitelists, no pre-minting!</span></p>
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
        <h2 className={styles.pclass4}> act-1</h2>
        <Image src="/roadmap.png" alt="roadmap" width={3983} height={1125} />
      </section>

      <section className={styles.familyTree}>
        <h1 className={styles.familyh1}> RACES</h1>
        <p className={styles.pclass4}>Each vampire is unique. Some attributes are only available to certain races.</p>
        <p className={styles.pclass4}>Over 200 different attributes available for both male and female vampires.</p>
        <Image src="/racetree.png" alt="raceTree" width={2000} height={2300} />
      </section>

      <Footer />

    </>

  )
}

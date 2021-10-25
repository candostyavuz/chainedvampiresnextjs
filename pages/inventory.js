import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/utilities.module.css'
import Link from 'next/link'
import Modal from 'react-modal'
import { motion } from 'framer-motion'
import Footer from './components/footer.js'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import { nftaddress, AVALANCHE_TESTNET_PARAMS, AVALANCHE_MAINNET_PARAMS } from '../config'
import NFT from '../abi.json';
import { useRouter } from 'next/router'

Modal.setAppElement("#__next");

export default function Inventory() {

    const router = useRouter();

    const [nfts, setNfts] = useState([]);
    const [currNftImg, setCurrNftImg] = useState('not-set');
    const [currNftName, setCurrNftName] = useState('not-set');
    const [currNftRarity, setCurrNftRarity] = useState('not-set');
    const [earnedNftReward, setEarnedNftReward] = useState('0');
    const [currNftDNA, setCurrNftDNA] = useState('not-set');


    useEffect(() => {
        getUserNFTs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setCurrNftImg("/public/coffin.jpg")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    async function getUserNFTs() {
        const web3Modal = new Web3Modal({
            network: "fuji",
            cacheProvider: true
        });
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        const signerAddr = await signer.getAddress();
        const data = await contract.walletOfOwner(signerAddr);

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await contract.tokenURI(i)
            let uri = organizeURI(tokenUri);
            try{
                const meta = await axios.get(uri)
                let item = {
                    name: meta.data.name,
                    edition: meta.data.edition,
                    image: organizeURI(meta.data.image),
                    dna: meta.data.attributes[15].value
                }
                return item
            } catch(e) {
                window.alert("Freshly minted metadata is currently being loaded!");
            }
           
        }))
        setNfts(items)
    }

    async function getNFTImg(_edition) {
        var foundValue = nfts.find(obj => obj.edition === _edition.toString());
        setCurrNftImg(foundValue.image);
        setCurrNftName(foundValue.name);
        getRarity(foundValue.name);
        // DNA
        let str = stringToArr(foundValue.dna);
        // let str = (foundValue.dna);

        setCurrNftDNA(str);
        await getEarnedRewards(_edition);
        
    }

    const stringToArr = (str) => {
        return str.split(",");
      };

    async function getEarnedRewards(_edition) {
        const web3Modal = new Web3Modal({
            network: "fuji",
            cacheProvider: true
        });
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(nftaddress, NFT.abi, signer);

        const tokenReward = await contract.getEarnedAmount(ethers.BigNumber.from(_edition.toString()));
        let formatBalance = await ethers.utils.formatEther(tokenReward);
        if (formatBalance.includes('.')) {
            const parts = formatBalance.split('.');
            formatBalance = parts[0] + '.' + parts[1].slice(0, 5);
          }
        setEarnedNftReward(formatBalance.toString());
    }

    function organizeURI(_uri) {
        const gateWay = "https://gateway.pinata.cloud/ipfs/";
        let uri = _uri.toString().substring(7);
        uri = gateWay + uri;
        return uri;
    }

    function getRarity(nameStr) {
        if (nameStr.includes("Scavenger")) {
            setCurrNftRarity("Tier-3");
        } else if (nameStr.includes("Predator")) {
            setCurrNftRarity("Tier-2");
        } else if (nameStr.includes("Nosferatu")) {
            setCurrNftRarity("Tier-1");
        } else if (nameStr.includes("Elder")) {
            setCurrNftRarity("Tier-0");
        } else if (nameStr.includes("Draxo")) {
            setCurrNftRarity("God-Tier");
        } else if (nameStr.includes("Dracula")) {
            setCurrNftRarity("The One");
        } else {
            setCurrNftRarity("Forgotten One");
        }
    }

    return (
        <>
            <Head>
                <title>Chained Vampires | Home</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
                <meta name="keywords" content="vampires" />
            </Head>

            <section className={styles.inventoryclass}>
                <nav>
                    <div className={styles.logosection}>
                        <Link href="/">
                            <a>
                                <Image src="/logo2.png" alt="site logo" width={400} height={200} />
                            </a>
                        </Link>
                    </div>

                    <div className={styles.navlinks}>
                        <i className="fas fa-bars"></i>
                        <ul className={styles.navlinksul}>
                            <li className={styles.navlinksulli}>
                                <Link href="/">
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
                                <Link href="/marketplace">
                                    <a className={styles.navlinksullia}>
                                        Marketplace
                                    </a>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>
                <div className={styles.inventoryImages}>
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className={styles.inventoryImages2} >
                                <motion.div whileHover={{
                                    scale: 1.1,
                                    transition: { duration: .5 },
                                }}
                                    whileTap={{ scale: 1.12 }}>
                                    <Link href={`/inventory/?edition=${nft.edition}`} as={`/inventory/${nft.edition}`} key={nft.edition}>
                                        <a className={styles.nftLabel} onClick={() => getNFTImg(nft.edition)}>
                                            <Image className={styles.nftImages} src={nft.image} alt="loading" width={350} height={350} objectFit="cover" placeholder="blur" blurDataURL={nft.image}/>
                                            <p className={styles.nftLabel}>{nft.name}</p>
                                        </a>
                                    </Link>
                                </motion.div>
                            </div>
                        ))
                    }
                </div>

                <div className={styles.warningBox}>
                    <h3 className={styles.inventoryh1}>We do not use any centralized server to store NFTs.</h3>
                    <h4 className={styles.inventoryh1}>So please be patient while your data is being fetched from Decentralized networks.</h4>
                </div>

                <Modal className={styles.inventoryModal} isOpen={!!router.query.edition} onRequestClose={() => router.push("/inventory")}>
                    {
                        <div className={styles.infoBox}>
                            <Image className={styles.nftImagesModal} src={currNftImg} alt="loading" width={550} height={550} objectFit="cover" quality={100} placeholder="blur" blurDataURL={currNftImg} />
                            <div className={styles.nftInfoModal}>
                                <h2 className={styles.pclassModal}>{currNftName}</h2>
                                <p className={styles.pclassModal}>Claimable Rewards: {earnedNftReward} AVAX</p>
                                <p className={styles.pclassModal}>Rarity: {currNftRarity} </p>
                                <p className={styles.pclassModal}>On Market: No</p>
                                <p className={styles.pclassModal}>DNA: {currNftDNA}</p>
                            </div>
                        </div>
                    }
                </Modal>

            </section>

        </>
    )
}

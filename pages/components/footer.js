import Image from 'next/image'
import { useEffect } from 'react';


const Footer = () => {

    return (
        <div className="footer"> 
            <a href="https://twitter.com/chainedvampires">
                <Image src="/twitter.png" alt="twitterlogo" width={60} height={60} />
            </a>  
            <a href="https://medium.com/@chainedvampires/chained-vampires-reflectionary-nfts-on-avalanche-blockchain-f7167c37b452">
                <Image src="/mediumicon.png" alt="twitterlogo" width={60} height={60} />
            </a>  
            <style jsx>{`
                .footer{
                    background: linear-gradient(rgba(21, 4, 3, 0.747), rgba(63, 0, 0, 0.87));
                    text-align:center;
                    display:flex;
                    justify-content:center;
                }
                a{
                    margin-right:2%;
                }
            `}</style>
        </div>
    );
}

export default Footer;
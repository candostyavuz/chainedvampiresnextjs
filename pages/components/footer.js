import Image from 'next/image'
import { useEffect } from 'react';


const Footer = () => {

    return (
        <div className="footer">
                 
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
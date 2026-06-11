import React from "react";
import { motion } from "framer-motion";

const StatCard = ({ name, icon: Icon, value, background, value1, value2, value3, backgroundImage }) => {
    return (
        <motion.div
            whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgb(255, 255, 255)" }}
            className={`${background} backdrop-blur-md overflow-hidden shadow-lg rounded-xl border border-[#38b6ff] relative`}
            style={{
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className="absolute inset-0 bg-black/40 rounded-xl"></div>

            <div className="px-3 py-5 sm:px-10 sm:py-10 relative z-10 flex flex-col h-full">
                <div className="flex-1 flex flex-col justify-between mt-10 sm:mt-20">
                    <p className="text-lg sm:text-2xl font-bold text-white pt-16 sm:pt-20 w-full">{name}</p>

                    <div className="flex justify-between items-end">
                        <p className="text-3xl sm:text-6xl font-bold text-white">{value}</p>

                        <div className="text-right space-y-1">
                            <p className="text-xs sm:text-sm font-medium text-white">
                                Tersedia : {value1}
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-white">
                                Terpesan : {value3}
                            </p>
                            <p className="text-sm sm:text-xl font-medium text-white">
                                Terisi : {value2}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
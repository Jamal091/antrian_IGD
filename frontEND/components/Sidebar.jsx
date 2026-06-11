"use client";
import { Bell, DollarSign, House, Info, Mail, Menu, Settings, User } from "lucide-react";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ICONS = {
    "0": House,
    "1": DollarSign,
    "2": Settings,
    "3": Mail,
    "4": User,
    "5": Bell,
    "6": Info
};

const Sidebar = () => {

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarItems, setSidebarItems] = useState([]);
    const pathname = usePathname();

    useEffect(() => {
        fetch("/data/data.json")
            .then((res) => res.json())
            .then((data) => {
                console.log(data.data);
                setSidebarItems(data.data);
            });

    }, []);

    return (
        <div className={`relative z-10 transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarOpen ? "w-64" : "w-16"}`}>
            <div className="h-full bg-[#37494d] backdrop-blur-md p-4 flex-col flex border-r  border-[rgb(161, 134, 134)]">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-full hover:bg-[#37494d] transition-colors max-w-fit crsor-pointer"
                >
                    <Menu size={20} style={{ minWidth: "20px" }} />
                </button>
                <nav className="mt-8 flex-grow">
                    {sidebarItems.map((item) => {
                        const IconComponent = ICONS[item.icon];
                        return (
                            <Link key={item.name} href={item.href}>
                                <div className={`flex items-center p-2 rounded-md hover:bg-[rgb(1, 0, 0)] ${pathname === item.href ? "bg-[#2f2f2f]" : ""
                                    }`}
                                >
                                    <IconComponent size={20} style={{ minWidth: "20px" }} />
                                    {isSidebarOpen && <span className="ml-4 whitespace-nowrap">{item.name}</span>}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;